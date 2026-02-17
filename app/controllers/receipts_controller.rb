class ReceiptsController < ApplicationController
  before_action :authorize_request
  
  ALLOWED_IMAGE_TYPES = %w[image/jpeg image/jpg image/png image/gif image/webp].freeze
  MAX_FILE_SIZE = 10.megabytes

  def create
    receipt = current_user.receipts.new(receipt_params)
    receipt.processing_status = "pending"

    # Validate image is attached
    unless receipt.image.attached?
      render json: { error: "Image must be attached" }, status: :unprocessable_entity
      return
    end

    # Validate file type
    unless ALLOWED_IMAGE_TYPES.include?(receipt.image.content_type)
      render json: { error: "Invalid file type. Allowed types: JPEG, PNG, GIF, WebP" }, status: :unprocessable_entity
      return
    end

    # Validate file size
    if receipt.image.byte_size > MAX_FILE_SIZE
      render json: { error: "File size must be less than 10MB" }, status: :unprocessable_entity
      return
    end

    if receipt.save
      # Only enqueue job if image is attached and valid
      ProcessReceiptJob.perform_later(receipt.id)

      render json: {
        message: "Receipt uploaded successfully",
        receipt_id: receipt.id,
        status: receipt.processing_status
      }, status: :accepted
    else
      render json: { errors: receipt.errors.full_messages }, status: :unprocessable_entity
    end
  rescue StandardError => e
    Rails.logger.error("Error uploading receipt: #{e.message}")
    render json: { error: "An error occurred while uploading the receipt" }, status: :internal_server_error
  end

  private

  def receipt_params
    params.require(:receipt).permit(:image)
  end
end

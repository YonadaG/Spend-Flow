class Api::V1::Ocr::OcrController < ApplicationController
  before_action :authorize_request

  # POST /api/v1/ocr/preview
  def preview
    unless params[:image].present?
      render json: { error: "No image provided" }, status: :bad_request
      return
    end

    image = params[:image]

    # Basic validation
    unless image.content_type.start_with?('image/')
      render json: { error: "Invalid image format" }, status: :bad_request
      return
    end

    # Create a temp file to process the image
    temp_file = Tempfile.new(['receipt', File.extname(image.original_filename)])
    begin
      temp_file.binmode
      temp_file.write(image.read)
      temp_file.rewind

      # Use OcrService to extract text
      extracted_text = OcrService.extract_text(temp_file.path)
      
      if extracted_text.present?
        # Parse the receipt using ReceiptParserService
        parsed_data = ReceiptParserService.parse(extracted_text, @current_user)
        
        # Return structured data
        render json: {
          merchant_name: parsed_data[:merchant_name],
          payment_reason: parsed_data[:payment_reason],
          amount: parsed_data[:amount],
          currency: parsed_data[:currency],
          payment_date: parsed_data[:payment_date],
          payer_name: parsed_data[:payer_name],
          status: parsed_data[:status],
          payment_channel: parsed_data[:payment_channel],
          invoice_no: parsed_data[:invoice_no],
          source: parsed_data[:source],
          category_name: parsed_data[:category_name],
          raw_text: parsed_data[:raw_text],
          message: "Receipt parsed successfully"
        }
      else
        render json: {
          raw_text: nil,
          message: "No text could be extracted from the image. Please try a clearer image."
        }
      end
    ensure
      temp_file.close
      temp_file.unlink # Delete the temp file
    end
  rescue StandardError => e
    Rails.logger.error("Error in OCR preview: #{e.message}")
    Rails.logger.error(e.backtrace.join("\n"))
    render json: { error: "Failed to process image" }, status: :internal_server_error
  end
end

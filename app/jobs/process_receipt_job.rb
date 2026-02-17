class ProcessReceiptJob < ApplicationJob
  queue_as :default

  def perform(receipt_id)
    receipt = Receipt.find(receipt_id)

    return unless receipt.image.attached?

    receipt.update!(processing_status: "processing")

    receipt.image.blob.open do |file|
      text = OcrService.extract_text(file.path)

      # Check if OCR succeeded
      if text.nil? || text.strip.empty?
        receipt.update!(
          processing_status: "failed",
          ocr_text: "OCR extraction failed or returned empty text"
        )
        return
      end

      receipt.update!(ocr_text: text)

      parsed = TextParserService.parse(text)
      
      # Validate parsed amount
      unless parsed[:amount].present? && parsed[:amount] > 0
        receipt.update!(processing_status: "failed")
        Rails.logger.error("Receipt processing failed: Invalid amount parsed")
        return
      end

      category_name = ClassificationService.classify(text)
      category = Category.find_or_create_by(name: category_name, user: receipt.user)

      ExpenseTransaction.create!(
        user: receipt.user,
        amount: parsed[:amount],
        merchant_name: parsed[:receiver],
        raw_text: text,
        category: category,
        direction: "debit"
      )

      receipt.update!(processing_status: "processed")
    end
  rescue ActiveRecord::RecordInvalid => e
    receipt.update!(processing_status: "failed")
    Rails.logger.error("Receipt processing failed - validation error: #{e.message}")
  rescue StandardError => e
    receipt.update!(processing_status: "failed")
    Rails.logger.error("Receipt processing failed: #{e.message}\n#{e.backtrace.join("\n")}")
  end
end

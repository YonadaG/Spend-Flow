class OcrService
  def self.extract_text(image_path)
    # Validate image path exists
    unless File.exist?(image_path)
      Rails.logger.error "OCR failed: Image file not found at #{image_path}"
      return nil
    end

    image = RTesseract.new(
      image_path,
      command: "C:/Program Files/Tesseract-OCR/tesseract.exe"
    )
    text = image.to_s
    
    # Return nil if OCR returned empty or whitespace-only text
    text.present? && text.strip.present? ? text : nil
  rescue Errno::ENOENT => e
    Rails.logger.error "OCR failed: Tesseract executable not found - #{e.message}"
    nil
  rescue RTesseract::Error => e
    Rails.logger.error "OCR failed: RTesseract error - #{e.message}"
    nil
  rescue StandardError => e
    Rails.logger.error "OCR failed: #{e.class} - #{e.message}\n#{e.backtrace.first(5).join("\n")}"
    nil
  end
end

class OcrService
  def self.extract_text(image_path)
    # Validate image path exists
    unless File.exist?(image_path)
      Rails.logger.error "OCR failed: Image file not found at #{image_path}"
      return nil
    end

    # Preprocess image for better OCR accuracy
    processed_path = preprocess_image(image_path)
    target_path = processed_path || image_path

    # Try multiple Tesseract strategies and pick the best result
    results = []

    # Strategy 1: PSM 6 (Uniform block of text) - good for structured receipts
    results << run_tesseract(target_path, psm: 6)

    # Strategy 2: PSM 4 (Single column of variable sizes) - good for receipts with tables
    results << run_tesseract(target_path, psm: 4)

    # Strategy 3: PSM 3 (Fully automatic) - fallback
    results << run_tesseract(target_path, psm: 3)

    # Pick the result with the most meaningful text
    best_result = results.compact.max_by { |text| score_ocr_result(text) }

    Rails.logger.info "OCR extracted #{best_result&.length || 0} characters (best of #{results.compact.size} strategies)"

    best_result
  ensure
    # Clean up preprocessed image
    if processed_path && processed_path != image_path && File.exist?(processed_path)
      File.delete(processed_path) rescue nil
    end
  end

  private

  # Preprocess image using MiniMagick for better OCR accuracy
  # - Convert to grayscale (removes colored watermarks/stamps)
  # - Increase contrast
  # - Sharpen text edges
  # - Upscale small images
  # - Apply adaptive threshold for clean black/white text
  def self.preprocess_image(image_path)
    require 'mini_magick'

    ext = File.extname(image_path)
    processed_path = image_path.sub(ext, "_processed#{ext}")

    image = MiniMagick::Image.open(image_path)

    # Get image dimensions to decide on upscaling
    width = image.width
    height = image.height

    image.combine_options do |c|
      # Convert to grayscale - removes blue/colored stamps and watermarks
      c.colorspace "Gray"

      # Upscale small images for better OCR (Tesseract works best at 300+ DPI)
      if width < 1500
        scale_factor = (1500.0 / width * 100).round
        c.resize "#{scale_factor}%"
      end

      # Increase contrast to make text stand out
      c.contrast
      c.contrast  # Apply twice for stronger effect

      # Sharpen text edges
      c.sharpen "0x2"

      # Normalize brightness levels
      c.normalize

      # Set DPI hint for Tesseract
      c.density "300"
    end

    image.write(processed_path)
    Rails.logger.info "OCR: Preprocessed image saved to #{processed_path}"
    processed_path
  rescue StandardError => e
    Rails.logger.warn "OCR: Image preprocessing failed (#{e.message}), using original image"
    nil
  end

  # Run Tesseract with specific Page Segmentation Mode
  def self.run_tesseract(image_path, psm: 6)
    image = RTesseract.new(
      image_path,
      command: "C:/Program Files/Tesseract-OCR/tesseract.exe",
      psm: psm,
      oem: 3  # Use LSTM + Legacy engine for best results
    )
    text = image.to_s

    # Return nil if OCR returned empty or whitespace-only text
    text.present? && text.strip.present? ? text : nil
  rescue Errno::ENOENT => e
    Rails.logger.error "OCR failed: Tesseract executable not found - #{e.message}"
    nil
  rescue RTesseract::Error => e
    Rails.logger.error "OCR failed: RTesseract error (PSM #{psm}) - #{e.message}"
    nil
  rescue StandardError => e
    Rails.logger.error "OCR failed: #{e.class} - #{e.message}"
    nil
  end

  # Score OCR result quality - higher is better
  def self.score_ocr_result(text)
    return 0 if text.blank?

    score = 0

    # More text is generally better (up to a point)
    score += [text.length, 2000].min

    # Bonus for recognizable words/patterns common in receipts
    receipt_keywords = %w[
      total amount date payment transfer account bank
      received payer invoice receipt reference commission
      ETB USD service charge merchant
    ]
    receipt_keywords.each do |keyword|
      score += 50 if text.downcase.include?(keyword)
    end

    # Bonus for numbers (amounts, dates, account numbers)
    score += text.scan(/\d+/).length * 10

    # Penalty for excessive garbage characters
    garbage_ratio = text.count('^a-zA-Z0-9\s.,/:;-').to_f / text.length
    score -= (garbage_ratio * 500).to_i

    # Bonus for structured lines (key: value patterns)
    score += text.scan(/\w+\s*[:]\s*\S+/).length * 30

    score
  end
end

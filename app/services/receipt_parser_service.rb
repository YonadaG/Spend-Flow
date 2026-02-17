class ReceiptParserService
  # Parse raw OCR text into structured receipt data
  def self.parse(raw_text, user = nil)
    return {} if raw_text.blank?

    parser = new(raw_text, user)
    parser.parse
  end

  def initialize(raw_text, user = nil)
    @raw_text = raw_text
    @user = user
    @lines = raw_text.lines.map(&:strip).reject(&:empty?)
  end

  def parse
    {
      merchant_name: extract_merchant_name,
      payment_reason: extract_payment_reason,
      amount: extract_amount,
      currency: extract_currency,
      payment_date: extract_date,
      payer_name: extract_payer_name,
      status: extract_status,
      payment_channel: extract_payment_channel,
      invoice_no: extract_invoice_number,
      source: extract_source,
      category_name: auto_categorize,
      raw_text: @raw_text
    }
  end

  private

  def extract_merchant_name
    # Look for common merchant indicators
    merchant_patterns = [
      /(?:merchant|vendor|store|shop|payee|paid\s+to)[:\s]+([^\n]+)/i,
      /(?:from|to)[:\s]+([^\n]+)/i,
      /^([A-Za-z\s&,\.']+(?:L\.L\.C|LLC|Inc|Ltd|Corporation|Corp|Co\.)?)/i # First line business name
    ]

    merchant_patterns.each do |pattern|
      match = @raw_text.match(pattern)
      return clean_text(match[1]) if match
    end

    # If no pattern matches, try first non-empty line (common for receipts)
    # Skip lines that look like totals or dates
    candidate = @lines.find do |line| 
      !line.match?(/^\d+[\/-]\d+/) && # Not a date
      !line.match?(/^\$?\d+\.?\d*$/) && # Not a plain amount
      !line.match?(/^total/i) && # Not "total"
      line.length > 3 # Reasonable length
    end
    
    candidate ? clean_text(candidate) : nil
  end

  def extract_payment_reason
    # Look for description, memo, or reason fields
    reason_patterns = [
      /(?:description|memo|note|reason|purpose|for)[:\s]+([^\n]+)/i,
      /(?:payment\s+for|paid\s+for)[:\s]+([^\n]+)/i
    ]

    reason_patterns.each do |pattern|
      match = @raw_text.match(pattern)
      return clean_text(match[1]) if match
    end

    # Check for common payment types in text
    payment_types = {
      /fuel|gas|petrol/i => "Fuel Payment",
      /food|restaurant|dining|meal/i => "Food & Dining",
      /transport|taxi|uber|lyft|ride/i => "Transportation",
      /grocery|supermarket|store/i => "Groceries",
      /hotel|accommodation|lodging/i => "Accommodation",
      /office|supplies|equipment/i => "Office Supplies"
    }

    payment_types.each do |pattern, description|
      return description if @raw_text.match?(pattern)
    end

    nil
  end

  def extract_amount
    # Look for explicit amount fields first
    amount_patterns = [
      /(?:total|amount|price|paid|sum|balance|charge)[:\s]*\$?\s*([\d,]+\.?\d{0,2})/i,
      /(?:ETB|USD|EUR|GBP)\s*([\d,]+\.?\d{0,2})/i,
      /\$\s*([\d,]+\.?\d{0,2})/,
      /([\d,]+\.?\d{2})\s*(?:ETB|USD|EUR|GBP)/i
    ]

    amount_patterns.each do |pattern|
      match = @raw_text.match(pattern)
      if match
        amount_str = match[1].gsub(',', '')
        return amount_str.to_f if amount_str.to_f > 0
      end
    end

    # Find any number that looks like a monetary amount
    amounts = @raw_text.scan(/(?:\$|ETB|USD)?\s*([\d,]+\.\d{2})/).flatten
    amounts.map { |a| a.gsub(',', '').to_f }.max # Return the largest amount found
  end

  def extract_currency
    # Look for currency codes or symbols
    currency_patterns = [
      /\b(ETB|USD|EUR|GBP|Birr)\b/i,
      /currency[:\s]+(ETB|USD|EUR|GBP)/i
    ]

    currency_patterns.each do |pattern|
      match = @raw_text.match(pattern)
      if match
        currency = match[1].upcase
        return 'ETB' if currency == 'BIRR'
        return currency
      end
    end

    # Default to ETB for Ethiopian context
    'ETB'
  end

  def extract_date
    # Look for explicit date fields
    date_patterns = [
      # Pattern from user example: (05-01-2026 19:46:30
      /\(\s*(\d{2}-\d{2}-\d{4}\s+\d{2}:\d{2}:\d{2})/,
      /(?:date|on|dated|transaction\s+date)[:\s]+(\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4})/i,
      /(?:date|on|dated|transaction\s+date)[:\s]+(\d{4}[\/-]\d{1,2}[\/-]\d{1,2})/i,
      /(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})/, # ISO format
      /(\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{2,4})/i
    ]

    date_patterns.each do |pattern|
      match = @raw_text.match(pattern)
      if match
        begin
          # Handle the specific format DD-MM-YYYY HH:mm:ss
          if match[1].match?(/^\d{2}-\d{2}-\d{4}/)
            return DateTime.strptime(match[1], '%d-%m-%Y %H:%M:%S').iso8601
          end
          
          parsed_date = parse_date_string(match[1])
          return parsed_date.iso8601 if parsed_date
        rescue
          next
        end
      end
    end

    # Look for any date-like pattern with time
    general_date_time = @raw_text.scan(/\b(\d{2}-\d{2}-\d{4}\s+\d{2}:\d{2}:\d{2})\b/).flatten.first
    if general_date_time
      begin
        return DateTime.strptime(general_date_time, '%d-%m-%Y %H:%M:%S').iso8601
      rescue
        # Continue
      end
    end

    # Look for any date-like pattern
    general_date = @raw_text.match(/(\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4})/)
    if general_date
      begin
        parsed_date = parse_date_string(general_date[1])
        return parsed_date.iso8601 if parsed_date
      rescue
        # Continue to default
      end
    end

    Time.current.iso8601 # Default to now
  end

  def extract_payer_name
    # Look for payer/sender information
    payer_patterns = [
      /(?:payer|from|sender|paid\s+by)[:\s]+([^\n]+)/i,
      /(?:customer|client)[:\s]+([^\n]+)/i
    ]

    payer_patterns.each do |pattern|
      match = @raw_text.match(pattern)
      return clean_text(match[1]) if match
    end

    # Use current user if available
    @user ? "#{@user.first_name} #{@user.last_name}".strip : nil
  end

  def extract_status
    # Look for status indicators
    status_patterns = [
      /status[:\s]+(completed|pending|failed|success|approved|declined)/i,
      /\b(completed|pending|failed|success|approved|declined)\b/i
    ]

    status_patterns.each do |pattern|
      match = @raw_text.match(pattern)
      return match[1].capitalize if match
    end

    # If we found an invoice number, likely completed
    extract_invoice_number.present? ? "Completed" : "Pending"
  end

  def extract_payment_channel
    # Look for payment method/channel
    channel_patterns = [
      /(?:payment\s+(?:method|channel|via|through)|paid\s+(?:via|through|by))[:\s]+([^\n]+)/i,
      /\b(API|App|Mobile|Web|POS|Terminal|Card|Cash|Bank\s+Transfer)\b/i
    ]

    channel_patterns.each do |pattern|
      match = @raw_text.match(pattern)
      return clean_text(match[1]) if match
    end

    # Check for specific payment systems
    return "Mobile/App" if @raw_text.match?(/telebirr|m-pesa|mpesa/i)
    return "Card" if @raw_text.match?(/visa|mastercard|amex|card/i)
    return "Cash" if @raw_text.match?(/\bcash\b/i)
    
    "Unknown"
  end

  def extract_invoice_number
    # Look for invoice, receipt, transaction, or reference numbers
    invoice_patterns = [
      /(?:invoice|receipt|transaction|ref(?:erence)?|order|confirmation)(?:\s+(?:no|number|#))?[:\s#]*([A-Z0-9]{6,})/i,
      /\b([A-Z]{2}\d{2}[A-Z0-9]{6,})\b/, # Pattern like DA55KQDW7R
      /#\s*([A-Z0-9]{6,})/i
    ]

    invoice_patterns.each do |pattern|
      match = @raw_text.match(pattern)
      return match[1].upcase if match
    end

    nil
  end

  def extract_source
    # Look for payment source/platform
    source_patterns = [
      /(?:source|platform|via|through)[:\s]+([^\n]+)/i,
      /\b(Telebirr|M-Pesa|PayPal|Stripe|Square|Bank\s+Transfer)\b/i
    ]

    source_patterns.each do |pattern|
      match = @raw_text.match(pattern)
      return clean_text(match[1]) if match
    end

    # Check for known payment platforms
    return "Telebirr" if @raw_text.match?(/telebirr/i)
    return "M-Pesa" if @raw_text.match?(/m-pesa|mpesa/i)
    return "PayPal" if @raw_text.match?(/paypal/i)
    
    nil
  end

  def auto_categorize
    # Smart categorization based on keywords
    # Returns exact default category names: Food, Hospital, Transfer, Utilities, Fuel, Other
    
    # 1. Food
    if @raw_text.match?(/food|restaurant|grocery|dining|meal|snack|cafe|coffee|lunch|dinner|breakfast|burger|pizza|kitchen|bakery|supermarket|market/i)
      return "Food"
    end

    # 2. Hospital
    if @raw_text.match?(/hospital|medical|clinic|pharmacy|doctor|health|medicine|drug|healthcare|patient|treatment/i)
      return "Hospital"
    end

    # 3. Transfer
    if @raw_text.match?(/transfer|send|receive|payment|remittance|wire|deposit|withdrawal/i)
      return "Transfer"
    end

    # 4. Utilities
    if @raw_text.match?(/electric|water|utility|bill|power|energy|telecom|internet|wifi|phone|airtime|bundle|package/i)
      return "Utilities"
    end

    # 5. Fuel
    if @raw_text.match?(/fuel|gas|petrol|diesel|benzene|station|shell|exxon|bp|total|oil/i)
      return "Fuel"
    end

    # Default fallback
    "Other"
  end

  def parse_date_string(date_str)
    # Try various date formats
    formats = [
      '%d-%m-%Y',
      '%d/%m/%Y',
      '%Y-%m-%d',
      '%Y/%m/%d',
      '%m-%d-%Y',
      '%m/%d/%Y',
      '%d %b %Y',
      '%d %B %Y'
    ]

    formats.each do |format|
      begin
        return Date.strptime(date_str, format)
      rescue ArgumentError
        next
      end
    end

    # Try ISO8601 format
    begin
      return DateTime.parse(date_str)
    rescue ArgumentError
      nil
    end
  end

  def clean_text(text)
    return nil if text.blank?
    
    # Remove extra whitespace and common OCR artifacts
    text.strip
        .gsub(/\s+/, ' ')
        .gsub(/[^\x00-\x7F]+/, '') # Remove non-ASCII characters
        .strip
  end
end

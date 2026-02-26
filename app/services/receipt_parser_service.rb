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

  # ──────────────────────────────────────────────
  # Merchant / Receiver Name
  # ──────────────────────────────────────────────
  def extract_merchant_name
    # CBE-specific: Receiver line
    cbe_receiver = find_field_value(%w[receiver payee beneficiary])
    return clean_text(cbe_receiver) if cbe_receiver.present?

    # Generic merchant patterns
    merchant_patterns = [
      /(?:merchant|vendor|store|shop|payee|paid\s+to)[:\s]+([^\n]+)/i,
      /(?:receiver)[:\s]+([^\n]+)/i,
    ]

    merchant_patterns.each do |pattern|
      match = @raw_text.match(pattern)
      return clean_text(match[1]) if match
    end

    # If no pattern matches, try first non-empty line that looks like a business name
    candidate = @lines.find do |line|
      !line.match?(/^\d+[\/-]\d+/) &&       # Not a date
      !line.match?(/^\$?\d+\.?\d*$/) &&      # Not a plain amount
      !line.match?(/^total/i) &&             # Not "total"
      !line.match?(/^(payment|account|payer|date|reference|reason|commission|amount)/i) && # Not a label
      line.length > 3                         # Reasonable length
    end

    candidate ? clean_text(candidate) : nil
  end

  # ──────────────────────────────────────────────
  # Payment Reason
  # ──────────────────────────────────────────────
  def extract_payment_reason
    # CBE-specific: Reason / Type of service
    reason_value = find_field_value(%w[reason purpose], match_partial: true)
    return clean_text(reason_value) if reason_value.present?

    # Look for description, memo, or reason fields
    reason_patterns = [
      /(?:reason\s*\/?\s*type\s+of\s+service)[:\s]+([^\n]+)/i,
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
      /office|supplies|equipment/i => "Office Supplies",
      /payment\s+done\s+via\s+mobile/i => "Mobile Payment",
      /mobile\s+banking/i => "Mobile Banking Transfer"
    }

    payment_types.each do |pattern, description|
      return description if @raw_text.match?(pattern)
    end

    nil
  end

  # ──────────────────────────────────────────────
  # Amount
  # ──────────────────────────────────────────────
  def extract_amount
    # CBE-specific: "Transferred Amount" field
    transferred = find_field_value(["transferred amount", "transfer amount", "amount transferred"])
    if transferred
      amount = parse_amount_string(transferred)
      return amount if amount && amount > 0
    end

    # CBE-specific: "Total amount debited" field
    total_debited = find_field_value(["total amount debited", "total amount"])
    if total_debited
      amount = parse_amount_string(total_debited)
      return amount if amount && amount > 0
    end

    # Look for explicit amount fields
    amount_patterns = [
      /(?:transferred\s+amount)[:\s]*([0-9,]+\.?\d{0,2})\s*(?:ETB|Birr)?/i,
      /(?:total\s+amount\s+debited)[:\s]*([0-9,]+\.?\d{0,2})\s*(?:ETB|Birr)?/i,
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

  # ──────────────────────────────────────────────
  # Currency
  # ──────────────────────────────────────────────
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

    # CBE-specific: if we see "Commercial Bank of Ethiopia" or "CBE", default to ETB
    return 'ETB' if @raw_text.match?(/commercial\s+bank\s+of\s+ethiopia|cbe/i)

    # Default to ETB for Ethiopian context
    'ETB'
  end

  # ──────────────────────────────────────────────
  # Date
  # ──────────────────────────────────────────────
  def extract_date
    # CBE-specific: "Payment Date & Time" field
    date_value = find_field_value(["payment date", "transaction date", "date & time", "date and time"])
    if date_value
      parsed = try_parse_date(date_value)
      return parsed.iso8601 if parsed
    end

    # Look for explicit date fields
    date_patterns = [
      # CBE format: 2/12/2026, 3:31:00 PM
      /(\d{1,2}\/\d{1,2}\/\d{4}),?\s*(\d{1,2}:\d{2}:\d{2}\s*(?:AM|PM)?)/i,
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
          date_str = match.captures.compact.join(' ').strip
          parsed = try_parse_date(date_str)
          return parsed.iso8601 if parsed
        rescue
          next
        end
      end
    end

    # Look for any date-like pattern with time
    general_date_time = @raw_text.scan(/\b(\d{2}-\d{2}-\d{4}\s+\d{2}:\d{2}:\d{2})\b/).flatten.first
    if general_date_time
      parsed = try_parse_date(general_date_time)
      return parsed.iso8601 if parsed
    end

    # Look for any date-like pattern
    general_date = @raw_text.match(/(\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4})/)
    if general_date
      parsed = try_parse_date(general_date[1])
      return parsed.iso8601 if parsed
    end

    Time.current.iso8601 # Default to now
  end

  # ──────────────────────────────────────────────
  # Payer Name
  # ──────────────────────────────────────────────
  def extract_payer_name
    # CBE-specific: Payer field
    payer_value = find_field_value(%w[payer sender])
    return clean_text(payer_value) if payer_value.present?

    # CBE-specific: Customer Name field
    customer_value = find_field_value(["customer name"])
    return clean_text(customer_value) if customer_value.present?

    # Generic patterns
    payer_patterns = [
      /(?:payer|from|sender|paid\s+by)[:\s]+([^\n]+)/i,
      /(?:customer|client)[:\s]+([^\n]+)/i,
      /(?:customer\s+name)[:\s]+([^\n]+)/i
    ]

    payer_patterns.each do |pattern|
      match = @raw_text.match(pattern)
      return clean_text(match[1]) if match
    end

    # Use current user if available
    @user ? "#{@user.first_name} #{@user.last_name}".strip : nil
  end

  # ──────────────────────────────────────────────
  # Status
  # ──────────────────────────────────────────────
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

    # CBE receipts with reference numbers are completed
    if extract_invoice_number.present?
      return "Completed"
    end

    # If it's a bank receipt (CBE, etc.), assume completed
    return "Completed" if @raw_text.match?(/commercial\s+bank|cbe|vat\s+invoice/i)

    "Pending"
  end

  # ──────────────────────────────────────────────
  # Payment Channel
  # ──────────────────────────────────────────────
  def extract_payment_channel
    # CBE-specific: "Reason / Type of service" often contains "payment done via Mobile"
    if @raw_text.match?(/via\s+mobile|mobile\s+banking/i)
      return "Mobile Banking"
    end

    # Look for payment method/channel
    channel_patterns = [
      /(?:payment\s+(?:method|channel|via|through)|paid\s+(?:via|through|by))[:\s]+([^\n]+)/i,
      /\b(API|Mobile\s+Banking|App|Mobile|Web|POS|Terminal|Card|Cash|Bank\s+Transfer)\b/i
    ]

    channel_patterns.each do |pattern|
      match = @raw_text.match(pattern)
      return clean_text(match[1]) if match
    end

    # Check for specific payment systems
    return "Mobile/App" if @raw_text.match?(/telebirr|m-pesa|mpesa/i)
    return "Card" if @raw_text.match?(/visa|mastercard|amex|card/i)
    return "Cash" if @raw_text.match?(/\bcash\b/i)
    return "Bank Transfer" if @raw_text.match?(/bank|commercial|cbe/i)

    "Unknown"
  end

  # ──────────────────────────────────────────────
  # Invoice / Reference Number
  # ──────────────────────────────────────────────
  def extract_invoice_number
    # CBE-specific: Reference No. / VAT Invoice No
    ref_value = find_field_value(["reference no", "ref no", "vat invoice", "invoice no"])
    return ref_value.strip.upcase if ref_value.present? && ref_value.strip.length >= 5

    # Look for FT-prefixed transaction codes (CBE format: FT26043ZZDBJ)
    ft_match = @raw_text.match(/\b(FT[A-Z0-9]{8,})\b/i)
    return ft_match[1].upcase if ft_match

    # Generic invoice/receipt/transaction patterns
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

  # ──────────────────────────────────────────────
  # Source
  # ──────────────────────────────────────────────
  def extract_source
    # CBE-specific
    if @raw_text.match?(/commercial\s+bank\s+of\s+ethiopia/i)
      return "Commercial Bank of Ethiopia (CBE)"
    end

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
    return "Awash Bank" if @raw_text.match?(/awash/i)
    return "Dashen Bank" if @raw_text.match?(/dashen/i)
    return "Abyssinia Bank" if @raw_text.match?(/abyssinia/i)

    nil
  end

  # ──────────────────────────────────────────────
  # Auto Categorize
  # ──────────────────────────────────────────────
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

    # 3. Transfer (CBE, bank receipts, mobile payments)
    if @raw_text.match?(/transfer|send|receive|remittance|wire|deposit|withdrawal|payer|receiver|commercial\s+bank|cbe|payment\s+done\s+via/i)
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

  # ──────────────────────────────────────────────
  # Helper: Find field value from OCR text
  # Searches for lines like "Field Name    Value" or "Field Name: Value"
  # ──────────────────────────────────────────────
  def find_field_value(field_names, match_partial: false)
    field_names.each do |field_name|
      @lines.each do |line|
        # Match "Field Name   Value" (with spaces/tabs) or "Field Name: Value"
        pattern = if match_partial
          /#{Regexp.escape(field_name)}/i
        else
          /\b#{Regexp.escape(field_name)}\b/i
        end

        if line.match?(pattern)
          # Try to extract value after the field name
          # Handle "Field Name: Value" format
          colon_match = line.match(/#{Regexp.escape(field_name)}[:\s]+(.+)/i)
          if colon_match
            value = colon_match[1].strip
            return value if value.present? && value.length > 1
          end

          # Handle tabular format where value is after many spaces
          parts = line.split(/\s{2,}|\t+/)
          if parts.length >= 2
            value = parts.last.strip
            return value if value.present? && value.length > 1
          end
        end
      end
    end
    nil
  end

  # ──────────────────────────────────────────────
  # Helper: Try to parse a date string in various formats
  # ──────────────────────────────────────────────
  def try_parse_date(date_str)
    return nil if date_str.blank?

    # CBE format: "2/12/2026, 3:31:00 PM"
    begin
      return DateTime.strptime(date_str.strip, '%m/%d/%Y, %l:%M:%S %p')
    rescue ArgumentError; end

    begin
      return DateTime.strptime(date_str.strip, '%m/%d/%Y %l:%M:%S %p')
    rescue ArgumentError; end

    # Standard formats
    formats = [
      '%d-%m-%Y %H:%M:%S',
      '%d/%m/%Y %H:%M:%S',
      '%m/%d/%Y %H:%M:%S',
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
        return Date.strptime(date_str.strip, format)
      rescue ArgumentError
        next
      end
    end

    # Try ISO8601 format
    begin
      return DateTime.parse(date_str.strip)
    rescue ArgumentError
      nil
    end
  end

  # ──────────────────────────────────────────────
  # Helper: Parse amount string to float
  # ──────────────────────────────────────────────
  def parse_amount_string(str)
    return nil if str.blank?
    # Remove currency labels and whitespace, keep numbers
    cleaned = str.gsub(/[ETB|USD|EUR|GBP|Birr\s]/i, '').gsub(',', '').strip
    amount_match = cleaned.match(/([\d]+\.?\d*)/)
    amount_match ? amount_match[1].to_f : nil
  end

  def clean_text(text)
    return nil if text.blank?

    # Remove extra whitespace and common OCR artifacts
    text.strip
        .gsub(/\s+/, ' ')
        .gsub(/[^\x20-\x7E\u1200-\u137F]+/, '') # Keep ASCII + Amharic characters
        .strip
  end
end

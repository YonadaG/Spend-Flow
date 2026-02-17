class TextParserService
  def self.parse(text)
    # Handle nil or empty text
    return { amount: nil, receiver: nil } if text.nil? || text.strip.empty?

    amount = extract_amount(text)
    receiver = extract_receiver(text)

    {
      amount: amount,
      receiver: receiver
    }
  end

  private

  def self.extract_amount(text)
    match = text.match(/ETB\s?[\d,]+\.\d{2}/)
    return nil unless match
    
    amount = match[0].gsub("ETB", "").gsub(",", "").to_f
    
    # Validate amount is reasonable (not 0 and not excessively large)
    amount > 0 && amount < 1_000_000_000 ? amount : nil
  end

  def self.extract_receiver(text)
    # Example rule: look for lines with "Payment Reason"
    match = text.match(/Payment Reason:\s*(.+)/i)
    match ? match[1].strip : "Unknown"
  end
end

class ClassificationService
  RULES = {
    /fuel/i => "Transport",
    /electric/i => "Utilities",
    /water/i => "Utilities",
    /transfer/i => "Transfer",
    /supermarket|grocery/i => "Food"
  }

  def self.classify(text)
    # Handle nil or empty text
    return "Uncategorized" if text.nil? || text.strip.empty?

    RULES.each do |pattern, category_name|
      return category_name if text.match?(pattern)
    end

    Rails.logger.info("Classification: No category matched for text snippet: #{text[0..50]}")
    "Uncategorized"
  end
end

require_relative '../../config/environment'

puts "Testing ReceiptParserService..."

# Test Case 1: Telebirr Date Format
raw_text_1 = <<~TEXT
  INST @#NC/InvoIce No. FTnéAw> gom/Settled Amount
  —_DASSKQDW7R | (05-01-2026 19:46:30 [4581.00 Birr
  Some other text
TEXT

result_1 = ReceiptParserService.parse(raw_text_1)
puts "\nTest Case 1 (Telebirr Date):"
puts "Raw: #{raw_text_1.strip}"
puts "Extracted Date: #{result_1[:payment_date]}"
puts "Extracted Invoice: #{result_1[:invoice_no]}"
puts "Extracted Amount: #{result_1[:amount]}"

if result_1[:payment_date] == "2026-01-05T19:46:30+03:00" || result_1[:payment_date] == "2026-01-05T19:46:30Z"
  puts "✅ Date parsed correctly!"
else
  puts "❌ Date parsing failed. Got: #{result_1[:payment_date]}"
end

# Test Case 2: Categories
puts "\nTest Case 2 (Categorization):"
category_tests = {
  "Fuel Payment" => "Fuel",
  "Electric Bill" => "Utilities",
  "Dinner at Restaurant" => "Food",
  "Supermarket Shopping" => "Food",
  "Unknown Service" => "Other" # or specific default
}

category_tests.each do |text, expected|
  res = ReceiptParserService.parse(text)
  got = res[:category_name]
  puts "Input: '#{text}' -> Expected: '#{expected}', Got: '#{got}'"
end

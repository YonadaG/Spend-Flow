puts "Running Debug OCR Parser..."

raw_text = <<~TEXT
  INST @#NC/InvoIce No. FTnéAw> gom/Settled Amount
  —_DASSKQDW7R | (05-01-2026 19:46:30 [4581.00 Birr
  Fuel Payment
TEXT

puts "Raw Text:"
puts raw_text
puts "---"

begin
  result = ReceiptParserService.parse(raw_text)
  puts "Result:"
  puts result.inspect
  puts "Extracted Date: #{result[:payment_date]}"
  puts "Extracted Category: #{result[:category_name]}"
rescue => e
  puts "Error parsing: #{e.message}"
  puts e.backtrace
end

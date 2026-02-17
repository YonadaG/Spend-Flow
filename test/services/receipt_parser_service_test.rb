require 'test_helper'

class ReceiptParserServiceTest < ActiveSupport::TestCase
  test "should parse telebirr receipt text" do
    raw_text = <<~TEXT
      Nile, Lemma Abebaw Teshome
      Fuel Payment Without Subsidy
      Amount: 4581.00 ETB
      Date: 2026-01-05T19:46:30
      Payer: Yonada Gebremedhen Hadush
      Status: Completed
      Channel: API/App
      Invoice: DA55KQDW7R
      Source: Telebirr
    TEXT

    result = ReceiptParserService.parse(raw_text)

    assert_equal "Nile, Lemma Abebaw Teshome", result[:merchant_name]
    assert_equal "Fuel Payment Without Subsidy", result[:payment_reason]
    assert_equal 4581.00, result[:amount]
    assert_equal "ETB", result[:currency]
    assert_not_nil result[:payment_date]
    assert_equal "Yonada Gebremedhen Hadush", result[:payer_name]
    assert_equal "Completed", result[:status]
    assert_equal "API/App", result[:payment_channel]
    assert_equal "DA55KQDW7R", result[:invoice_no]
    assert_equal "Telebirr", result[:source]
    assert_equal "Transportation & Fuel", result[:category_name]
    assert_equal raw_text, result[:raw_text]
  end

  test "should auto-categorize fuel expenses" do
    raw_text = "Shell Gas Station\nFuel: $45.50\nDate: 01/05/2026"
    result = ReceiptParserService.parse(raw_text)
    
    assert_equal "Transportation & Fuel", result[:category_name]
  end

  test "should auto-categorize food expenses" do
    raw_text = "Starbucks Coffee\nLatte: $4.50\nDate: 01/05/2026"
    result = ReceiptParserService.parse(raw_text)
    
    assert_equal "Food & Dining", result[:category_name]
  end

  test "should handle missing data gracefully" do
    raw_text = "Some random text"
    result = ReceiptParserService.parse(raw_text)
    
    assert_equal "Some random text", result[:merchant_name] # First line
    assert_equal "Uncategorized", result[:category_name]
    assert_equal raw_text, result[:raw_text]
  end
end

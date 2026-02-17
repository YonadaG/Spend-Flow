require 'test_helper'

class OcrDateTest < ActiveSupport::TestCase
  test "should extract date from Telebirr messy format" do
    raw_text = <<~TEXT
      INST @#NC/InvoIce No. FTnéAw> gom/Settled Amount
      —_DASSKQDW7R | (05-01-2026 19:46:30 [4581.00 Birr
      Other stuff
    TEXT

    result = ReceiptParserService.parse(raw_text)
    
    # Expected: 2026-01-05
    assert_equal "2026-01-05T19:46:30+03:00", result[:payment_date]
  end

  test "should auto-categorize requested categories" do
    assert_equal "Fuel", ReceiptParserService.parse("Fuel Payment")[:category_name]
    assert_equal "Utilities", ReceiptParserService.parse("Electric Bill")[:category_name]
    assert_equal "Food", ReceiptParserService.parse("Restaurant Dinner")[:category_name]
    assert_equal "Other", ReceiptParserService.parse("Unknown Thing")[:category_name]
  end
end

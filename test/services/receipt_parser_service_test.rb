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
    assert_equal "Fuel", result[:category_name]
    assert_equal raw_text, result[:raw_text]
  end

  test "should auto-categorize fuel expenses" do
    raw_text = "Shell Gas Station\nFuel: $45.50\nDate: 01/05/2026"
    result = ReceiptParserService.parse(raw_text)

    assert_equal "Fuel", result[:category_name]
  end

  test "should auto-categorize food expenses" do
    raw_text = "Starbucks Coffee\nLatte: $4.50\nDate: 01/05/2026"
    result = ReceiptParserService.parse(raw_text)

    assert_equal "Food", result[:category_name]
  end

  test "should handle missing data gracefully" do
    raw_text = "Some random text"
    result = ReceiptParserService.parse(raw_text)

    assert_equal "Some random text", result[:merchant_name] # First line
    assert_equal "Other", result[:category_name]
    assert_equal raw_text, result[:raw_text]
  end

  # ── Vendor Extraction Tests ──

  test "should extract vendor from Credited Party name format" do
    raw_text = <<~TEXT
      Credited Party name   NILE, LEMMA ABRIRAW TESHOME
      Fuel Payment Without Subsidy
      Amount: 4568.00 Birr
    TEXT

    result = ReceiptParserService.parse(raw_text)
    assert_match /NILE, LEMMA ABRIRAW TESHOME/i, result[:merchant_name]
  end

  test "should extract vendor from debited from X for Y format" do
    raw_text = "ETB 750.00 debited from HERMELA G/MEDHIN HADUSH for EL-OUZEIR HEALTH & SAFETY PLC-ETB-6028 on 30-Jan-2026"

    result = ReceiptParserService.parse(raw_text)
    assert_match /EL-OUZEIR HEALTH & SAFETY PLC/i, result[:merchant_name]
  end

  test "should extract vendor from CBE receipt Receiver field" do
    raw_text = <<~TEXT
      Payment / Transaction Information
      Payer   YONADA G/MEDHIN HADUSH
      Account   1****9241
      Receiver   LEUL GETU HAILU
      Payment Date & Time   2/12/2026, 3:31:00 PM
      Transferred Amount   1,000.00 ETB
    TEXT

    result = ReceiptParserService.parse(raw_text)
    assert_equal "LEUL GETU HAILU", result[:merchant_name]
  end

  # ── Date Extraction Tests ──

  test "should extract date from DD-Mon-YYYY format in CBE SMS" do
    raw_text = "ETB 750.00 debited from HERMELA G/MEDHIN HADUSH for EL-OUZEIR on 30-Jan-2026 with transaction ID: FT26030JRKBX"

    result = ReceiptParserService.parse(raw_text)
    assert_equal "2026-01-30", result[:payment_date][0..9]
  end

  test "should extract date from standalone DD-MM-YYYY format" do
    raw_text = <<~TEXT
      Invoice DA55KQDW7R
      05-12-2025 19:46:30
      Amount: 4581.00 Birr
    TEXT

    result = ReceiptParserService.parse(raw_text)
    assert_equal "2025-12-05", result[:payment_date][0..9]
  end

  test "should extract date from CBE receipt Payment Date field" do
    raw_text = <<~TEXT
      Payment Date & Time   2/12/2026, 3:31:00 PM
      Transferred Amount   1,000.00 ETB
    TEXT

    result = ReceiptParserService.parse(raw_text)
    assert_not_nil result[:payment_date]
    # Should parse as February 12, 2026
    assert_match /2026-02-12/, result[:payment_date]
  end

  # ── Category Tests ──

  test "should not categorize as Fuel when only 'total' keyword appears" do
    raw_text = <<~TEXT
      Some Shop Name
      Item: Widget
      Total Amount: 500.00 ETB
      Date: 01/05/2026
    TEXT

    result = ReceiptParserService.parse(raw_text)
    assert_not_equal "Fuel", result[:category_name]
  end

  test "should categorize CBE transfer receipts as Transfer" do
    raw_text = <<~TEXT
      Commercial Bank of Ethiopia
      Transferred Amount: 1000.00 ETB
      Payment Date: 2/12/2026
    TEXT

    result = ReceiptParserService.parse(raw_text)
    assert_equal "Transfer", result[:category_name]
  end

  test "should categorize debited from text as Transfer" do
    raw_text = "ETB 750.00 debited from HERMELA G/MEDHIN HADUSH for SOMEONE on 30-Jan-2026"

    result = ReceiptParserService.parse(raw_text)
    assert_equal "Transfer", result[:category_name]
  end

  test "should categorize telebirr fuel payment correctly" do
    raw_text = "Fuel Payment Without Subsidy\nAmount: 4568.00 Birr"

    result = ReceiptParserService.parse(raw_text)
    assert_equal "Fuel", result[:category_name]
  end

  test "should categorize utilities correctly" do
    raw_text = "Ethio Telecom Bill\nElectric Payment: 500.00 ETB"

    result = ReceiptParserService.parse(raw_text)
    assert_equal "Utilities", result[:category_name]
  end
end

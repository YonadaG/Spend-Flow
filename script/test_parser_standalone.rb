#!/usr/bin/env ruby
# Standalone test for ReceiptParserService - no Rails/DB needed

# Minimal stubs for Rails dependencies
module Rails
  def self.logger; Logger.new(STDOUT); end
end

class Time
  def self.current; Time.now; end
  def iso8601; strftime('%Y-%m-%dT%H:%M:%S%:z'); end
end

# ActiveSupport-like extensions
class String
  def blank?; strip.empty?; end
  def present?; !blank?; end
end

class NilClass
  def blank?; true; end
  def present?; false; end
end

class Date
  def iso8601; strftime('%Y-%m-%d'); end
end

require 'date'
require 'logger'


# Load the service
load File.join(__dir__, '..', 'app', 'services', 'receipt_parser_service.rb')

passed = 0
failed = 0

def assert_equal(expected, actual, msg)
  if expected == actual
    puts "  ✓ #{msg}"
    return true
  else
    puts "  ✗ #{msg}"
    puts "    Expected: #{expected.inspect}"
    puts "    Actual:   #{actual.inspect}"
    return false
  end
end

def assert_match(pattern, actual, msg)
  if actual && actual.match?(pattern)
    puts "  ✓ #{msg}"
    return true
  else
    puts "  ✗ #{msg}"
    puts "    Expected pattern: #{pattern.inspect}"
    puts "    Actual:   #{actual.inspect}"
    return false
  end
end

def assert_not_equal(not_expected, actual, msg)
  if not_expected != actual
    puts "  ✓ #{msg}"
    return true
  else
    puts "  ✗ #{msg}"
    puts "    Should NOT be: #{not_expected.inspect}"
    return false
  end
end

# ── Test: Credited Party vendor extraction ──
puts "\n== Credited Party vendor extraction =="
raw_text = <<~TEXT
  Credited Party name   NILE, LEMMA ABRIRAW TESHOME
  Fuel Payment Without Subsidy
  Amount: 4568.00 Birr
TEXT
result = ReceiptParserService.parse(raw_text)
assert_match(/NILE, LEMMA ABRIRAW TESHOME/i, result[:merchant_name], "Should extract Credited Party name") ? passed += 1 : failed += 1

# ── Test: debited from X for Y ──
puts "\n== Debited from X for Y vendor extraction =="
raw_text = "ETB 750.00 debited from HERMELA G/MEDHIN HADUSH for EL-OUZEIR HEALTH & SAFETY PLC-ETB-6028 on 30-Jan-2026"
result = ReceiptParserService.parse(raw_text)
assert_match(/EL-OUZEIR HEALTH & SAFETY PLC/i, result[:merchant_name], "Should extract 'for Y' as merchant") ? passed += 1 : failed += 1

# ── Test: CBE Receiver ──
puts "\n== CBE Receiver vendor extraction =="
raw_text = <<~TEXT
  Payment / Transaction Information
  Payer   YONADA G/MEDHIN HADUSH
  Account   1****9241
  Receiver   LEUL GETU HAILU
  Payment Date & Time   2/12/2026, 3:31:00 PM
  Transferred Amount   1,000.00 ETB
TEXT
result = ReceiptParserService.parse(raw_text)
assert_equal("LEUL GETU HAILU", result[:merchant_name], "Should extract Receiver as merchant") ? passed += 1 : failed += 1

# ── Test: DD-Mon-YYYY date from CBE SMS ──
puts "\n== DD-Mon-YYYY date extraction =="
raw_text = "ETB 750.00 debited from HERMELA G/MEDHIN HADUSH for EL-OUZEIR on 30-Jan-2026 with transaction ID: FT26030JRKBX"
result = ReceiptParserService.parse(raw_text)
assert_match(/2026-01-30/, result[:payment_date], "Should parse 30-Jan-2026 correctly") ? passed += 1 : failed += 1

# ── Test: DD-MM-YYYY date with time ──
puts "\n== DD-MM-YYYY date with time extraction =="
raw_text = <<~TEXT
  Invoice DA55KQDW7R
  05-12-2025 19:46:30
  Amount: 4581.00 Birr
TEXT
result = ReceiptParserService.parse(raw_text)
assert_match(/2025-12-05/, result[:payment_date], "Should parse 05-12-2025 as Dec 5, 2025") ? passed += 1 : failed += 1

# ── Test: CBE Payment Date field ──
puts "\n== CBE Payment Date & Time field =="
raw_text = <<~TEXT
  Payment Date & Time   2/12/2026, 3:31:00 PM
  Transferred Amount   1,000.00 ETB
TEXT
result = ReceiptParserService.parse(raw_text)
assert_match(/2026/, result[:payment_date], "Should parse CBE date field") ? passed += 1 : failed += 1

# ── Test: 'total' should NOT trigger Fuel ──
puts "\n== Category: 'total' should not trigger Fuel =="
raw_text = <<~TEXT
  Some Shop Name
  Item: Widget
  Total Amount: 500.00 ETB
  Date: 01/05/2026
TEXT
result = ReceiptParserService.parse(raw_text)
assert_not_equal("Fuel", result[:category_name], "'Total Amount' should not categorize as Fuel") ? passed += 1 : failed += 1

# ── Test: CBE transfer ──
puts "\n== Category: CBE Transfer =="
raw_text = <<~TEXT
  Commercial Bank of Ethiopia
  Transferred Amount: 1000.00 ETB
  Payment Date: 2/12/2026
TEXT
result = ReceiptParserService.parse(raw_text)
assert_equal("Transfer", result[:category_name], "CBE receipt should be Transfer") ? passed += 1 : failed += 1

# ── Test: debited from => Transfer ──
puts "\n== Category: debited from => Transfer =="
raw_text = "ETB 750.00 debited from HERMELA G/MEDHIN HADUSH for SOMEONE on 30-Jan-2026"
result = ReceiptParserService.parse(raw_text)
assert_equal("Transfer", result[:category_name], "'debited from' text should be Transfer") ? passed += 1 : failed += 1

# ── Test: Fuel Payment ──
puts "\n== Category: Fuel Payment =="
raw_text = "Fuel Payment Without Subsidy\nAmount: 4568.00 Birr"
result = ReceiptParserService.parse(raw_text)
assert_equal("Fuel", result[:category_name], "Fuel Payment text should be Fuel") ? passed += 1 : failed += 1

# ── Test: Utilities ──
puts "\n== Category: Utilities =="
raw_text = "Ethio Telecom Bill\nElectric Payment: 500.00 ETB"
result = ReceiptParserService.parse(raw_text)
assert_equal("Utilities", result[:category_name], "Electric / Telecom should be Utilities") ? passed += 1 : failed += 1

# ── Test: Food ──
puts "\n== Category: Food =="
raw_text = "Starbucks Coffee\nLatte: $4.50\nDate: 01/05/2026"
result = ReceiptParserService.parse(raw_text)
assert_equal("Food", result[:category_name], "Coffee shop should be Food") ? passed += 1 : failed += 1

# ── Test: Other / Default ──
puts "\n== Category: Other (default) =="
raw_text = "Some random text"
result = ReceiptParserService.parse(raw_text)
assert_equal("Other", result[:category_name], "Unknown text should be Other") ? passed += 1 : failed += 1

# ── Summary ──
puts "\n#{'='*40}"
puts "Results: #{passed} passed, #{failed} failed out of #{passed + failed} tests"
puts "#{'='*40}"
exit(failed > 0 ? 1 : 0)

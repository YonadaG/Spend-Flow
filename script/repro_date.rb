texts = [
  "Date: 17-02-2026 10:00:00",
  "Transaction Time: 17/02/2026",
  "(17-02-2026 10:30:45)", # Telebirr format
  "Date: 2026-02-17",
  "17 Feb 2026 12:00",
  "Paid on 17-02-2026"
]

File.open('script/output_utf8.txt', 'w:UTF-8') do |f|
  f.puts "Current Time: #{Time.current}"

  texts.each do |text|
    f.puts "Testing: '#{text}'"
    parser = ReceiptParserService.new(text)
    # parsing is done via .parse method or private extract_date
    # We'll use .prevate helpers via send to isolate
    date = parser.send(:extract_date)
    f.puts "Result: #{date}"
    f.puts "---"
  end
end

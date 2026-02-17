# Sample Receipt Text for Testing

## Example 1: Telebirr Fuel Payment Receipt

```
Nile, Lemma Abebaw Teshome
Fuel Payment Without Subsidy
Amount: 4581.00 ETB
Date: 2026-01-05T19:46:30
Payer: Yonada Gebremedhen Hadush
Status: Completed
Channel: API/App
Invoice: DA55KQDW7R
Source: Telebirr
```

**Expected Parsed Output:**
```json
{
  "merchant_name": "Nile, Lemma Abebaw Teshome",
  "payment_reason": "Fuel Payment Without Subsidy",
  "amount": 4581.00,
  "currency": "ETB",
  "payment_date": "2026-01-05T19:46:30",
  "payer_name": "Yonada Gebremedhen Hadush",
  "status": "Completed",
  "payment_channel": "API/App",
  "invoice_no": "DA55KQDW7R",
  "source": "Telebirr",
  "category_name": "Transportation & Fuel",
  "raw_text": "..."
}
```

## Example 2: Restaurant Receipt

```
STARBUCKS COFFEE
123 Main Street
Addis Ababa, Ethiopia

Date: 01/05/2026 14:30
Receipt #: SB123456

Items:
- Caffe Latte (Grande)     45.00 ETB
- Chocolate Croissant      35.00 ETB
- Water                    15.00 ETB

Subtotal:                  95.00 ETB
Tax:                        5.00 ETB
Total:                    100.00 ETB

Payment: Telebirr Mobile
Status: Paid
Thank you for your visit!
```

**Expected Parsed Output:**
```json
{
  "merchant_name": "STARBUCKS COFFEE",
  "payment_reason": "Food & Dining",
  "amount": 100.00,
  "currency": "ETB",
  "payment_date": "2026-01-05T14:30:00",
  "payer_name": null,
  "status": "Paid",
  "payment_channel": "Mobile",
  "invoice_no": "SB123456",
  "source": "Telebirr",
  "category_name": "Food & Dining",
  "raw_text": "..."
}
```

## Example 3: Gas Station Receipt

```
SHELL GAS STATION
Bole Road, AA

Transaction Date: 2026-01-10 08:15
Pump #: 3
Product: Premium Diesel

Liters: 45.5 L
Price per Liter: 78.50 ETB/L
Total Amount: 3571.75 ETB

Payment Method: Card
Card Type: Visa
Invoice Number: INV-2026-001234
Status: Approved
```

**Expected Parsed Output:**
```json
{
  "merchant_name": "SHELL GAS STATION",
  "payment_reason": "Fuel Payment",
  "amount": 3571.75,
  "currency": "ETB",
  "payment_date": "2026-01-10T08:15:00",
  "payer_name": null,
  "status": "Approved",
  "payment_channel": "Card",
  "invoice_no": "INV-2026-001234",
  "source": null,
  "category_name": "Transportation & Fuel",
  "raw_text": "..."
}
```

## Example 4: Grocery Store Receipt

```
SHOA SUPERMARKET
Merkato Area

Receipt #: 789456123
Date: 15/01/2026 16:45

Items Purchased:
Rice 5kg            250.00 ETB
Cooking Oil 2L      180.00 ETB
Tomatoes 2kg         60.00 ETB
Onions 1kg           40.00 ETB
Bread 2 loaves       30.00 ETB

Subtotal:           560.00 ETB
Total:              560.00 ETB

Payment: Cash
Change: 40.00 ETB

Thank You!
```

**Expected Parsed Output:**
```json
{
  "merchant_name": "SHOA SUPERMARKET",
  "payment_reason": "Groceries",
  "amount": 560.00,
  "currency": "ETB",
  "payment_date": "2026-01-15T16:45:00",
  "payer_name": null,
  "status": "Completed",
  "payment_channel": "Cash",
  "invoice_no": "789456123",
  "source": null,
  "category_name": "Groceries & Shopping",
  "raw_text": "..."
}
```

## Testing Instructions

1. **Via Rails Console:**
   ```ruby
   # Load the service
   raw_text = "Your receipt text here..."
   result = ReceiptParserService.parse(raw_text)
   puts result.to_json
   ```

2. **Via API (using curl or Postman):**
   - Create a text file with receipt content
   - Use an image-to-text tool to create a sample image
   - Upload via `/api/v1/ocr/preview` endpoint
   - Check the response JSON

3. **Via Frontend:**
   - Navigate to Upload page
   - Upload a receipt image
   - Watch the form auto-fill with extracted data
   - Verify the category is auto-selected

## Notes

- The parser is designed to handle various receipt formats
- It uses multiple fallback strategies when exact patterns aren't matched
- Currency defaults to ETB if not explicitly found
- Dates are parsed into ISO8601 format
- Categories are intelligently assigned based on keywords

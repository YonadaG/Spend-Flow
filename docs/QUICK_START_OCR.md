# Quick Start Guide: OCR Structured Data Feature

## 🚀 How to Use

### Step 1: Upload a Receipt
1. Navigate to the **Upload** page in your expense tracker
2. Click "Browse Files" or drag and drop a receipt image
3. Supported formats: PNG, JPG, PDF

### Step 2: OCR Processing
- The system automatically extracts text using Tesseract OCR
- Text is parsed into structured data
- A loading spinner shows "Processing with OCR..."

### Step 3: Review Auto-Filled Data
The form will automatically populate with:
- ✅ **Vendor/Merchant**: Extracted merchant name
- ✅ **Amount**: Transaction amount
- ✅ **Date**: Payment date
- ✅ **Category**: Auto-selected based on keywords
- ✅ **Notes**: Payment reason/description
- ✅ **Currency**: Detected from receipt (defaults to ETB)

### Step 4: Edit if Needed
- Review all auto-filled fields
- Make any corrections if the OCR made mistakes
- Change category if auto-categorization is incorrect

### Step 5: Save Transaction
- Click "Confirm & Save"
- Transaction is created with all structured data
- Category is automatically created if it doesn't exist
- You're redirected to the Transactions page

## 📋 What Gets Stored

Every transaction stores:
```
✓ merchant_name       - Who you paid
✓ payment_reason      - Why you paid
✓ amount             - How much
✓ currency           - ETB, USD, EUR, etc.
✓ payment_date       - When
✓ payer_name         - Who paid (if detected)
✓ status             - Completed, Pending, etc.
✓ payment_channel    - App, Card, Cash, etc.
✓ invoice_no         - Receipt/invoice number
✓ source             - Telebirr, M-Pesa, etc.
✓ category           - Auto-categorized
✓ raw_text           - Original OCR text
```

## 🎯 Auto-Categorization

Categories are automatically assigned based on keywords:

| Category | Keywords |
|----------|----------|
| **Transportation & Fuel** | fuel, gas, petrol, diesel, taxi, uber, lyft |
| **Food & Dining** | restaurant, cafe, coffee, food, pizza, burger |
| **Groceries & Shopping** | grocery, supermarket, market, store |
| **Utilities & Bills** | electric, water, utility, internet, phone |
| **Entertainment** | movie, cinema, theater, concert, game |
| **Healthcare** | hospital, clinic, pharmacy, medical, doctor |
| **Office & Supplies** | office, supplies, equipment, stationery |
| **Accommodation** | hotel, motel, lodging, airbnb |

## 🔍 Viewing Transactions

On the Transactions page, you'll see:
- **Merchant name** (from OCR)
- **Payment reason** (as subtitle)
- **Invoice number** (if available)
- **Category badge** (auto-assigned)
- **Amount** with currency
- **Status indicator**

## 🔎 Searching Transactions

The search bar now searches across all OCR fields:
- Merchant name
- Payment reason
- Invoice number
- Category
- Description

## 🧪 Testing the Feature

### Test with Sample Text:
```ruby
# In Rails console
rails console

# Parse sample receipt
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
puts JSON.pretty_generate(result)
```

### Test via API:
```bash
# Using curl (with a real image file)
curl -X POST http://localhost:3000/api/v1/ocr/preview \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "image=@path/to/receipt.jpg"
```

## 📊 API Response Format

When you upload a receipt, you get:
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
  "raw_text": "<full OCR text>",
  "message": "Receipt parsed successfully"
}
```

## ⚙️ Configuration

### Tesseract OCR Path
If OCR isn't working, check the Tesseract path in:
`app/services/ocr_service.rb`
```ruby
command: "C:/Program Files/Tesseract-OCR/tesseract.exe"
```

### Default Currency
Default currency is **ETB** (Ethiopian Birr). To change:
- Edit `ReceiptParserService.extract_currency` method
- Update frontend default in `UploadTransfer.jsx`

## 🐛 Troubleshooting

### OCR Returns Empty Text
- Check image quality (must be clear and readable)
- Verify Tesseract is installed
- Check Tesseract path in `ocr_service.rb`

### Wrong Auto-Categorization
- Edit the transaction after saving
- Or add more keywords to `ReceiptParserService.auto_categorize`

### Fields Not Auto-Filling
- Check browser console for errors
- Verify API response format
- Check frontend state updates in React DevTools

## 📚 Documentation Files

- `docs/OCR_STRUCTURED_DATA.md` - Complete technical documentation
- `docs/SAMPLE_RECEIPTS.md` - Sample receipt examples
- `IMPLEMENTATION_SUMMARY.md` - What was implemented

## 🔜 Future Enhancements

1. **Machine Learning**: Train a model for better accuracy
2. **Multi-language OCR**: Support Amharic and other languages
3. **Confidence Scores**: Show how confident the parser is
4. **Custom Rules**: Let users define parsing patterns
5. **Receipt Templates**: Pre-defined templates for common merchants
6. **Bulk Upload**: Process multiple receipts at once
7. **Export OCR Data**: Download all structured receipt data

---

**Need Help?** Check the documentation files or test with the sample receipts provided!

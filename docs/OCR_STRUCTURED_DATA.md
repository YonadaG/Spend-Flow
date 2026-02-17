# OCR Receipt Processing with Structured Data Extraction

## Overview
This feature implements intelligent OCR (Optical Character Recognition) processing that extracts raw text from receipt images and transforms it into structured JSON data for automatic transaction categorization and form filling.

## How It Works

### 1. **Upload Receipt Image**
Users upload a receipt image (PNG, JPG, or PDF) through the Upload page.

### 2. **OCR Text Extraction**
The backend uses Tesseract OCR to extract raw text from the image.

### 3. **Intelligent Parsing**
The `ReceiptParserService` analyzes the extracted text and intelligently parses it into structured fields:

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
  "raw_text": "<full OCR text here>"
}
```

### 4. **Auto-Categorization**
The service automatically categorizes transactions based on keywords found in the receipt:

- **Transportation & Fuel**: fuel, gas, petrol, diesel, taxi, uber, etc.
- **Food & Dining**: restaurant, cafe, coffee, food, dining, etc.
- **Groceries & Shopping**: grocery, supermarket, market, store, etc.
- **Utilities & Bills**: electric, water, utility, bill, internet, phone, etc.
- **Entertainment**: movie, cinema, theater, concert, game, etc.
- **Healthcare**: hospital, clinic, pharmacy, medical, doctor, etc.
- **Office & Supplies**: office, supplies, equipment, stationery, etc.
- **Accommodation**: hotel, motel, lodging, airbnb, etc.
- And more...

### 5. **Auto-Form Filling**
The frontend automatically fills in the transaction form with extracted data:
- **Merchant Name** → Vendor field
- **Amount** → Amount field
- **Payment Date** → Date field
- **Payment Reason** → Notes field
- **Category** → Auto-selected based on categorization

### 6. **Auto-Category Creation**
If a category doesn't exist, the backend automatically creates it when the transaction is saved.

## Backend Architecture

### Services
- **`OcrService`**: Handles Tesseract OCR integration for text extraction
- **`ReceiptParserService`**: Parses raw OCR text into structured data

### Controllers
- **`Api::V1::Ocr::OcrController`**: 
  - `POST /api/v1/ocr/preview` - Extracts and parses receipt data
  
### Database Schema
The `expense_transactions` table stores all parsed fields:
- `merchant_name` - Merchant/vendor name
- `payment_reason` - Description/purpose of payment
- `amount` - Transaction amount
- `currency` - Currency code (ETB, USD, EUR, etc.)
- `occurred_at` - Payment date/time
- `payer_name` - Name of payer
- `status` - Transaction status (Completed, Pending, etc.)
- `payment_channel` - Payment method (API/App, Card, Cash, etc.)
- `invoice_no` - Invoice/receipt number
- `source` - Payment platform (Telebirr, M-Pesa, etc.)
- `raw_text` - Original OCR text
- `user_category` - User-defined category
- `category_id` - Foreign key to categories table

## Frontend Implementation

### Components
- **`UploadTransfer.jsx`**: Main upload page with OCR integration

### Flow
1. User uploads image
2. Frontend calls `/api/v1/ocr/preview` with image file
3. Backend returns structured data
4. Frontend auto-fills form fields
5. User reviews/edits data
6. User saves transaction
7. Backend auto-creates category if needed
8. Transaction is stored with all structured data

## API Endpoints

### OCR Preview
```
POST /api/v1/ocr/preview
Content-Type: multipart/form-data

Body:
  image: <file>

Response:
{
  "merchant_name": "...",
  "payment_reason": "...",
  "amount": 123.45,
  "currency": "ETB",
  "payment_date": "2026-01-05T19:46:30",
  "payer_name": "...",
  "status": "Completed",
  "payment_channel": "API/App",
  "invoice_no": "...",
  "source": "...",
  "category_name": "...",
  "raw_text": "...",
  "message": "Receipt parsed successfully"
}
```

### Create Transaction
```
POST /api/v1/transactions
Content-Type: multipart/form-data

Body:
  transaction[receipt_image]: <file>
  transaction[amount]: 123.45
  transaction[merchant_name]: "..."
  transaction[occurred_at]: "2026-01-05"
  transaction[currency]: "ETB"
  transaction[user_category]: "Transportation & Fuel"
  transaction[payment_reason]: "..."
  transaction[raw_text]: "..."
  transaction[invoice_no]: "..."
  transaction[source]: "..."
  transaction[payer_name]: "..."
  transaction[payment_channel]: "..."
  transaction[status]: "..."

Response:
{
  "message": "Transaction created successfully",
  "transaction": {
    "id": 1,
    "amount": 123.45,
    "merchant_name": "...",
    "user_category": "Transportation & Fuel",
    "category": {
      "id": 5,
      "name": "Transportation & Fuel"
    },
    ...
  }
}
```

## Parsing Logic

The `ReceiptParserService` uses multiple strategies to extract data:

1. **Pattern Matching**: Regular expressions to find specific fields
2. **Keyword Detection**: Identifies payment types and categories
3. **Context Analysis**: Uses surrounding text to improve accuracy
4. **Fallback Logic**: Provides sensible defaults when data is missing

### Example Patterns

**Amount Extraction**:
- `Total: $123.45`
- `Amount: 4581.00 ETB`
- `USD 99.99`

**Date Extraction**:
- `01/05/2026`
- `2026-01-05T19:46:30`
- `5 Jan 2026`

**Invoice Number**:
- `Invoice: DA55KQDW7R`
- `Receipt #ABC123`
- `Ref: XYZ789`

## Testing

Run the test suite:
```bash
rails test test/services/receipt_parser_service_test.rb
```

## Future Improvements

1. **Machine Learning Integration**: Train a model on receipt patterns for better accuracy
2. **Multi-language Support**: Support receipts in multiple languages
3. **Confidence Scores**: Return confidence levels for each extracted field
4. **Custom Parsing Rules**: Allow users to define custom parsing patterns
5. **Receipt Templates**: Pre-defined templates for popular merchants/platforms

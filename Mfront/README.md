# MoneyTrackr Frontend

A React-based expense tracking application frontend that consumes a Rails API backend for receipt processing and transaction management.

## Features

- **JWT Authentication**: Secure login/register with token-based authentication
- **Receipt Upload**: Upload receipt images with multipart/form-data
- **Transaction Management**: View, filter, and manage expense transactions
- **OCR Processing**: Automatic receipt text extraction and categorization
- **Mobile-Friendly**: Responsive design optimized for mobile and desktop
- **Real-time Status**: Track processing status from pending to completed

## Project Structure

```
src/
├── components/
│   ├── auth/                 # Authentication components
│   │   ├── LoginForm.jsx
│   │   ├── RegisterForm.jsx
│   │   └── AuthForms.css
│   ├── common/               # Shared components
│   │   ├── Header.jsx
│   │   ├── Header.css
│   │   ├── LoadingSpinner.jsx
│   │   └── LoadingSpinner.css
│   └── transactions/         # Transaction-related components
│       ├── ReceiptUpload.jsx
│       ├── ReceiptUpload.css
│       ├── TransactionList.jsx
│       ├── TransactionList.css
│       ├── TransactionDetail.jsx
│       └── TransactionDetail.css
├── contexts/
│   └── AuthContext.jsx       # Authentication state management
├── pages/
│   ├── AuthPage.jsx          # Authentication page
│   ├── AuthPage.css
│   ├── Dashboard.jsx         # Main dashboard
│   └── Dashboard.css
├── services/
│   └── api.js               # API service with JWT handling
├── App.jsx                  # Main app component with routing
├── App.css                  # Global styles
└── main.jsx                 # App entry point
```

## Getting Started

### Prerequisites

- Node.js 18+ 
- Rails API backend running on port 3000

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Create environment file:
   ```bash
   cp .env.example .env
   ```

4. Configure your API URL in `.env`:
   ```
   VITE_API_BASE_URL=http://localhost:3000/api
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

## API Integration

The frontend expects the following API endpoints:

### Authentication
- `POST /auth/login` - User login
- `POST /auth/register` - User registration  
- `GET /auth/profile` - Get user profile

### Transactions
- `GET /transactions` - List all transactions
- `GET /transactions/:id` - Get transaction details
- `POST /transactions` - Create transaction with receipt upload
- `PUT /transactions/:id` - Update transaction
- `DELETE /transactions/:id` - Delete transaction

## Authentication Flow

1. JWT tokens are stored in `localStorage`
2. All API requests include the token in `Authorization: Bearer {token}` header
3. Automatic token refresh and logout on 401 responses
4. Protected routes redirect to login if not authenticated

## File Upload

Receipt images are uploaded using `multipart/form-data` with the following fields:
- `transaction[amount]` - Transaction amount
- `transaction[transaction_type]` - "expense" or "income"
- `transaction[vendor]` - Vendor name (optional)
- `transaction[receipt]` - Image file

## Mobile-Friendly Design

- Responsive layouts that adapt to screen size
- Touch-friendly buttons and form elements
- Optimized for React Native migration
- Component-based architecture for reusability

## Environment Variables

- `VITE_API_BASE_URL` - Base URL for API requests

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Technologies Used

- React 19
- React Router DOM
- Axios for API requests
- Vite for build tooling
- CSS3 for styling (no external CSS frameworks)

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

## Contributing

1. Follow the existing code style and patterns
2. Ensure mobile responsiveness for new components
3. Test authentication flows thoroughly
4. Maintain component reusability for potential React Native migration

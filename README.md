# Penthouse Protocol

A blockchain-based property marketplace platform that allows users to rent properties or invest in property tokens.

## Features

### 🏠 Property Marketplace
- Browse available properties in a beautiful grid layout
- Filter properties by city
- View property details including images, descriptions, and pricing

### 💰 Dual Investment Options
- **Rent**: Monthly rental with flexible duration (1, 3, 6, or 12 months)
- **Invest**: Purchase property tokens for fractional ownership

### 🎨 Interstellar Theme
- Dark, space-inspired UI with gradient backgrounds
- Purple and teal color scheme
- Modern, futuristic design elements

### 🔐 Authentication
- Firebase Authentication integration
- Secure login/signup flow
- User session management

## Tech Stack

### Frontend
- **Flutter** - Cross-platform mobile/web development
- **Firebase Auth** - User authentication
- **HTTP** - API communication
- **Cached Network Image** - Optimized image loading

### Backend
- **Node.js** - Server runtime
- **Express.js** - Web framework
- **Firebase Firestore** - Database
- **Hedera Hashgraph** - Blockchain integration
- **USDC** - Payment processing

## Project Structure

```
PenthouseProtocol/
├── frontend/           # Flutter application
│   ├── lib/
│   │   └── main.dart   # Main application code
│   └── pubspec.yaml    # Dependencies
├── backend/            # Node.js server
│   ├── routes/
│   │   └── properties.js  # Property API endpoints
│   ├── services/
│   │   ├── firebaseService.js
│   │   └── hederaService.js
│   └── server.js       # Server entry point
└── README.md
```

## Getting Started

### Prerequisites
- Flutter SDK
- Node.js
- Firebase project setup
- Hedera testnet account

### Backend Setup
1. Navigate to backend directory
2. Install dependencies: `npm install`
3. Set up environment variables for Firebase and Hedera
4. Start server: `npm start`

### Frontend Setup
1. Navigate to frontend directory
2. Install dependencies: `flutter pub get`
3. Run the app: `flutter run`

## API Endpoints

### Properties
- `GET /api/properties` - Fetch all properties
- `POST /api/properties` - Create new property
- `POST /api/properties/:id/rent` - Rent a property
- `POST /api/properties/:id/invest` - Invest in property tokens

## Property Data Model

```json
{
  "id": "property_id",
  "name": "Property Name",
  "description": "Property description",
  "imageUrl": "https://example.com/image.jpg",
  "rentalPrice": 2500.00,
  "pricePerToken": 100.00,
  "totalTokenSupply": 1000,
  "status": "available",
  "symbol": "PROP"
}
```

## Features in Detail

### Home Screen
- Welcome message with user's email
- City filter dropdown
- Property grid with cards showing:
  - Property image
  - Name and description
  - Rent and Invest buttons

### Rent Modal
- Shows monthly rental price
- Duration selection (1, 3, 6, 12 months)
- Calculates total price
- Proceed to rent functionality

### Investment Modal
- Shows price per token
- Displays available tokens
- Token quantity input
- Calculates total investment
- Proceed to invest functionality

## UI/UX Design

The app features an interstellar theme with:
- Deep space background colors (#0F0F23, #1A1A2E)
- Purple (#6C5CE7) and teal (#00CEC9) accent colors
- Gradient backgrounds and shadows
- Modern card-based layout
- Smooth animations and transitions

## Future Enhancements

- Real-time property updates
- Advanced filtering options
- Property search functionality
- User portfolio tracking
- Payment integration
- Property management tools
- Mobile app optimization

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

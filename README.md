# SmartBus Server

Backend service for the SmartBus application, providing real-time bus tracking, user management, and route optimization.

## Features

- Real-time bus location tracking using Socket.IO
- Multi-role authentication (Parent, Driver, School Admin, Super Admin)
- Route management and optimization
- Student tracking and attendance
- Real-time notifications
- Secure JWT-based authentication
- PostgreSQL database with Drizzle ORM

## Tech Stack

- Node.js & Express.js
- Socket.IO for real-time communication
- PostgreSQL with Drizzle ORM
- JWT for authentication
- Geolib for location calculations
- Nodemailer for email notifications

## Project Structure

```
SmartBusServer/
├── config/             # Configuration files
├── controllers/        # Route controllers
├── database/          # Database models and schema
├── drizzle/           # Database migrations
├── errors/            # Custom error classes
├── middleware/        # Express middleware
├── routes/            # API routes
├── services/          # Business logic
├── tests/             # Test files
└── utils/             # Utility functions
```

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy `.env.example` to `.env` and update the values:
   ```bash
   cp env.example .env
   ```
4. Run database migrations:
   ```bash
   npm run db:migrate
   ```
5. Start the development server:
   ```bash
   npm run dev
   ```

## Environment Variables

```env
# Server
PORT=3001
NODE_ENV=development

# Database
DATABASE_URL=postgres://user:pass@localhost:5432/smartbus

# JWT
ACCESS_TOKEN_SECRET=your_access_token_secret
REFRESH_TOKEN_SECRET=your_refresh_token_secret
ACCESS_TOKEN_EXPIRY=15m
REFRESH_TOKEN_EXPIRY=7d

# Email
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your_email
SMTP_PASS=your_password
```

## API Documentation

### Authentication

- `POST /auth/login` - Login for all user types
- `POST /auth/refresh` - Refresh access token
- `POST /auth/change-password` - Change user password

### Bus Tracking

- `GET /tracking/bus/:busId` - Get real-time bus location
- `GET /tracking/child/:childId` - Get bus location for a child
- `GET /tracking/parent` - Get all bus locations for parent's children
- `POST /tracking/bus/:busId/location` - Update bus location (Driver only)

### WebSocket Events

- `subscribeToBus` - Subscribe to real-time bus updates
- `unsubscribeFromBus` - Unsubscribe from bus updates
- `updateBusLocation` - Update bus location (Driver only)
- `busLocationUpdate` - Receive bus location updates

## Testing

Run the test suite:

```bash
npm test
```

Run tests with coverage:

```bash
npm run test:coverage
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.




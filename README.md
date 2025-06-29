# SmartBus API Server

Independent backend service for the SmartBus school bus management system.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL database
- Environment variables configured

### Installation
```bash
npm install
```

### Development
```bash
npm run dev
```

### Production
```bash
npm run deploy:prod
```

## 📋 Environment Variables

Create a `.env` file in the root directory:

```env
# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/smartbus_db

# JWT Configuration
ACCESS_TOKEN_SECRET=your_access_token_secret_here
ACCESS_TOKEN_EXPIRY=4d
REFRESH_TOKEN_SECRET=your_refresh_token_secret_here
REFRESH_TOKEN_EXPIRY=30d

# Server Configuration
PORT=3001
NODE_ENV=production

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# CORS Origins (comma-separated)
ALLOWED_ORIGINS=https://your-admin-domain.com,https://your-mobile-app.com
```

## 🗄️ Database Setup

### Generate Migrations
```bash
npm run db:generate
```

### Run Migrations
```bash
npm run db:migrate
```

### Push Schema Changes
```bash
npm run db:push
```

## 🐳 Docker Deployment

### Build Image
```bash
docker build -t smartbus-server .
```

### Run Container
```bash
docker run -p 3001:3001 --env-file .env smartbus-server
```

### Docker Compose
```bash
docker-compose up -d
```

## 🌐 API Endpoints

### Authentication
- `POST /super-admin/register` - Register super admin
- `POST /super-admin/login` - Super admin login
- `POST /auth/login` - User login
- `POST /auth/register` - User registration

### Super Admin
- `GET /super-admin/schools` - Get all schools
- `POST /super-admin/create-school` - Create school
- `GET /super-admin/stats` - Get system stats
- `POST /super-admin/create-school-admin` - Create school admin

### WebSocket Events
- `driver_location_update` - Real-time driver location
- `ride_request` - New ride requests
- `ride_status_update` - Ride status changes

## 🔧 Development

### Code Quality
```bash
npm run lint
npm run lint:fix
```

### Database Studio
```bash
npm run db:studio
```

## 📦 Deployment

### Railway/Render/Vercel
1. Connect your repository
2. Set environment variables
3. Deploy automatically

### AWS/GCP/Azure
1. Build Docker image
2. Push to container registry
3. Deploy to container service

### Manual Server
1. Clone repository
2. Install dependencies: `npm install`
3. Set environment variables
4. Run migrations: `npm run db:migrate`
5. Start server: `npm start`

## 🔒 Security

- JWT authentication
- CORS protection
- Input validation
- Rate limiting (recommended)
- HTTPS only in production

## 📊 Monitoring

- Health check endpoint: `GET /health`
- Logging with structured format
- Error tracking (recommended: Sentry)

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Make changes
4. Run tests and linting
5. Submit pull request

## 📄 License

MIT License




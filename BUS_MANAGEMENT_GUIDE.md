# Bus Management System Guide

## Overview

The SmartBus system provides comprehensive bus management functionality for school administrators, including bus tracking, driver management, route planning, and real-time monitoring.

## System Architecture

### Database Schema

The system uses the following main entities:

1. **Bus** - Vehicle information and capacity
2. **Driver** - Driver details and license information
3. **Route** - Bus routes with stops and timing
4. **Child** - Student information with pickup/drop locations
5. **Parent** - Parent contact information
6. **School Admin** - School administrator accounts

### Relationships

- **School Admin** → **Bus** (One-to-Many)
- **School Admin** → **Driver** (One-to-Many)
- **Bus** → **Driver** (One-to-One)
- **Bus** → **Route** (One-to-Many)
- **Route** → **Child** (One-to-Many)
- **Child** → **Parent** (Many-to-One)
- **Child** → **Bus** (Many-to-One)

## API Endpoints

### Bus Management

#### Create Bus
```
POST /bus
Authorization: Bearer <token>
Content-Type: application/json

{
  "busNumber": "BUS001",
  "capacity": 50,
  "model": "Tata Starbus",
  "plateNumber": "KA01AB1234",
  "driverId": "driver-uuid" // optional
}
```

#### Get All Buses
```
GET /bus
Authorization: Bearer <token>
```

#### Get Bus by ID
```
GET /bus/:id
Authorization: Bearer <token>
```

#### Update Bus
```
PUT /bus/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "busNumber": "BUS001",
  "capacity": 50,
  "model": "Tata Starbus",
  "plateNumber": "KA01AB1234",
  "driverId": "driver-uuid",
  "isActive": true
}
```

#### Delete Bus
```
DELETE /bus/:id
Authorization: Bearer <token>
```

#### Get Bus Statistics
```
GET /bus/stats
Authorization: Bearer <token>
```

### Driver Management

#### Create Driver
```
POST /driver
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john.doe@school.com",
  "phone": "+919876543210",
  "licenseNumber": "DL123456789",
  "address": "123 Main St, City"
}
```

#### Get All Drivers
```
GET /driver
Authorization: Bearer <token>
```

#### Get Driver by ID
```
GET /driver/:id
Authorization: Bearer <token>
```

#### Update Driver
```
PUT /driver/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john.doe@school.com",
  "phone": "+919876543210",
  "licenseNumber": "DL123456789",
  "address": "123 Main St, City",
  "isActive": true
}
```

#### Delete Driver
```
DELETE /driver/:id
Authorization: Bearer <token>
```

#### Get Driver Statistics
```
GET /driver/stats
Authorization: Bearer <token>
```

### Route Management

#### Create Route
```
POST /route
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Route A",
  "description": "Morning pickup route",
  "startStop": "Central Station",
  "endStop": "School Gate",
  "stops": ["Stop 1", "Stop 2", "Stop 3"],
  "estimatedDuration": 45,
  "distance": 12,
  "busId": "bus-uuid" // optional
}
```

#### Get All Routes
```
GET /route
Authorization: Bearer <token>
```

#### Get Route by ID
```
GET /route/:id
Authorization: Bearer <token>
```

#### Update Route
```
PUT /route/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Route A",
  "description": "Morning pickup route",
  "startStop": "Central Station",
  "endStop": "School Gate",
  "stops": ["Stop 1", "Stop 2", "Stop 3"],
  "estimatedDuration": 45,
  "distance": 12,
  "busId": "bus-uuid",
  "isActive": true
}
```

#### Delete Route
```
DELETE /route/:id
Authorization: Bearer <token>
```

#### Get Route Statistics
```
GET /route/stats
Authorization: Bearer <token>
```

### Tracking System

#### Get Bus Location for Child
```
GET /tracking/child/:childId
```

#### Get Bus Location for Parent
```
GET /tracking/parent/:parentId
```

#### Update Bus Location (Driver App)
```
PUT /tracking/bus/:busId/location
Content-Type: application/json

{
  "latitude": 12.9716,
  "longitude": 77.5946,
  "speed": 25,
  "heading": 180,
  "status": "in_transit"
}
```

#### Get All Bus Locations (Admin)
```
GET /tracking/admin/all
Authorization: Bearer <token>
```

#### Get Tracking Statistics (Admin)
```
GET /tracking/admin/stats
Authorization: Bearer <token>
```

## Real-time Tracking

### WebSocket Events

The system uses WebSocket connections for real-time updates:

#### Bus Location Updates
```javascript
// Listen for bus location updates
socket.on(`bus_location_update_${busId}`, (data) => {
  console.log('Bus location updated:', data);
  // Update map marker
});
```

#### Event Types
- `bus_location_update_${busId}` - Real-time bus location
- `driver_status_update_${driverId}` - Driver status changes
- `route_progress_update_${routeId}` - Route progress updates

## Mobile App Integration

### Parent App Features
- View child's bus location in real-time
- Track multiple children if they're on different buses
- Receive notifications for pickup/drop times
- Contact driver directly

### Driver App Features
- Update bus location automatically
- Mark stops and route progress
- Emergency alerts and notifications
- Route navigation assistance

## Security Features

### Authentication
- JWT-based authentication for all admin endpoints
- Role-based access control (School Admin, Super Admin)
- Session management with refresh tokens

### Data Validation
- Input validation for all API endpoints
- Duplicate prevention (bus numbers, license numbers, etc.)
- SQL injection protection through parameterized queries

### Rate Limiting
- API rate limiting to prevent abuse
- WebSocket connection limits
- Request throttling for location updates

## Setup Instructions

### 1. Environment Variables
```env
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/smartbus_db

# JWT
ACCESS_TOKEN_SECRET=your_access_token_secret
REFRESH_TOKEN_SECRET=your_refresh_token_secret

# Server
PORT=3001
NODE_ENV=production

# CORS
ALLOWED_ORIGINS=https://your-domain.com,http://localhost:3000
```

### 2. Database Setup
```bash
# Generate migrations
npm run db:generate

# Run migrations
npm run db:migrate

# Push schema changes
npm run db:push
```

### 3. Start Server
```bash
# Development
npm run dev

# Production
npm start
```

## Usage Workflow

### 1. School Setup
1. Super Admin creates school
2. Super Admin creates School Admin account
3. School Admin logs in to the system

### 2. Bus Management
1. School Admin creates drivers
2. School Admin creates buses
3. School Admin assigns drivers to buses
4. School Admin creates routes
5. School Admin assigns buses to routes

### 3. Student Management
1. School Admin creates parent accounts
2. School Admin creates child records
3. School Admin assigns children to buses and routes
4. Parents receive tracking credentials

### 4. Real-time Tracking
1. Driver app updates bus location
2. WebSocket broadcasts location to connected clients
3. Parent app displays real-time location
4. School Admin monitors all buses

## Troubleshooting

### Common Issues

1. **Database Connection Errors**
   - Check DATABASE_URL in environment variables
   - Ensure PostgreSQL is running
   - Verify database permissions

2. **Authentication Errors**
   - Check JWT token expiration
   - Verify token format
   - Ensure proper role permissions

3. **WebSocket Connection Issues**
   - Check CORS configuration
   - Verify WebSocket server is running
   - Check client connection logic

4. **Location Tracking Issues**
   - Verify GPS permissions on mobile devices
   - Check network connectivity
   - Ensure location update frequency

### Debug Mode
```bash
# Enable debug logging
LOG_LEVEL=debug npm run dev
```

## API Response Format

All API responses follow a consistent format:

```json
{
  "success": true,
  "data": {
    // Response data
  },
  "message": "Operation completed successfully"
}
```

Error responses:
```json
{
  "success": false,
  "message": "Error description"
}
```

## Performance Considerations

1. **Database Optimization**
   - Use indexes on frequently queried fields
   - Implement pagination for large datasets
   - Use efficient joins for related data

2. **Real-time Updates**
   - Implement WebSocket connection pooling
   - Use Redis for caching location data
   - Optimize location update frequency

3. **Mobile App**
   - Implement offline caching
   - Use efficient map rendering
   - Optimize battery usage for GPS tracking

## Future Enhancements

1. **Advanced Analytics**
   - Route optimization algorithms
   - Fuel consumption tracking
   - Maintenance scheduling

2. **Enhanced Security**
   - Biometric driver authentication
   - Video surveillance integration
   - Emergency response system

3. **Parent Features**
   - Push notifications for delays
   - Chat system with drivers
   - Payment integration for fees

4. **School Features**
   - Attendance tracking
   - Performance analytics
   - Integration with school management systems 
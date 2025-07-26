# Location Tracking Enhancement

## Overview
This enhancement implements persistent location storage and immediate location display for parent tracking, addressing the requirement that parents can immediately see the driver's location when they start tracking, even if the driver is not currently active.

## Changes Made

### 1. Database Schema
- **New Table**: `bus_location_history`
  - Stores all bus location updates with timestamps
  - Includes latitude, longitude, speed, heading, accuracy, and status
  - Indexed for optimal query performance on bus_id and timestamp

### 2. Backend Enhancements

#### TrackingService Updates (`services/tracking.service.js`)
- `saveLocationHistory()`: Saves location data to database
- `getLastKnownLocation()`: Retrieves the most recent location from database
- `getLocationHistory()`: Gets historical location data with pagination
- Modified `updateBusLocation()` to automatically save to database
- Modified `getBusLocationForChild()` to check database when no active location

#### New Controller Endpoints (`controllers/tracking.controller.js`)
- `GET /tracking/bus/:busId/last-location`: Get last known location
- `GET /tracking/bus/:busId/history`: Get location history with access control

#### WebSocket Enhancements (`controllers/sockets.js`)
- Modified `subscribeToBus` handler to immediately send last known location to new subscribers
- Maintains real-time updates while providing immediate historical context

### 3. Frontend Enhancements

#### Parent Service (`SmartbusApp/src/service/parent/index.ts`)
- `getLastKnownBusLocation()`: Fetches last known location via API
- `getBusLocationHistory()`: Retrieves location history
- Type definitions for location data

#### Parent Tracking Hook (`SmartbusApp/src/hooks/parent/useParentTracking.ts`)
- Modified `startTracking()` to immediately fetch and display last known location
- Shows historical location as "stale" until real-time update received
- Provides immediate visual feedback to parents

## Key Features

### 1. Immediate Location Display
- When parents start tracking, they immediately see the bus's last known location
- Historical data is marked as "stale" to indicate it's not current
- Real-time updates override stale data when driver comes online

### 2. Historical Data Storage
- All location updates are automatically saved to database
- Enables historical analysis and reporting
- Provides backup when real-time tracking is unavailable

### 3. Performance Optimization
- Database indexes ensure fast queries for location history
- Memory-based real-time tracking maintains performance
- Graceful fallback to database when memory cache is empty

### 4. Access Control
- Parents can only access location data for their children's buses
- Drivers can access their assigned bus data
- School admins can access all buses in their school

## API Endpoints

### Get Last Known Location
```
GET /api/tracking/bus/:busId/last-location
Authorization: Bearer {token}
```

### Get Location History
```
GET /api/tracking/bus/:busId/history?limit=100
Authorization: Bearer {token}
```

## Database Migration
The `bus_location_history` table has been created with the following structure:
- `id`: UUID primary key
- `bus_id`: Foreign key to bus table
- `latitude`, `longitude`: Location coordinates (text for precision)
- `speed`, `heading`, `accuracy`: Optional location metadata
- `status`: Bus status (online/offline)
- `timestamp`: When location was recorded
- `created_at`: Record creation time

## Testing

### Manual Testing Steps
1. **Parent App**: Open parent app and navigate to child tracking
2. **Immediate Display**: Verify last known location appears immediately
3. **Driver Connection**: Start driver app and begin location sharing
4. **Real-time Updates**: Verify location updates in real-time
5. **Historical Data**: Check that location history accumulates in database

### Database Verification
```sql
-- Check location history
SELECT * FROM bus_location_history WHERE bus_id = 'your-bus-id' ORDER BY timestamp DESC LIMIT 10;

-- Verify indexes
\d+ bus_location_history
```

## Benefits
1. **Improved UX**: Parents see immediate location feedback
2. **Historical Analysis**: All location data preserved for analytics
3. **Reliability**: System works even when drivers temporarily disconnect
4. **Performance**: Optimal balance between real-time and persistent storage 
# Deja Brew Backend API

Backend API for Deja Brew - a study places matching app for students to find cafés and connect with study partners.

## Features

- **Authentication**: JWT-based user authentication with bcrypt password hashing
- **User Management**: User profiles, search, preferences, and stats
- **Friends System**: Friend requests, acceptance, and management
- **Places**: Café listings with filtering, sorting, ratings, and reviews
- **Promos**: Promotional deals with like/save functionality
- **Reviews**: User reviews with rating aggregation
- **Study Sessions**: Create and join study sessions with capacity management
- **Notifications**: Real-time notifications for various events
- **Likes & Saves**: Save and like places, promos, reviews, and sessions
- **Blocks & Reports**: User moderation features

## Tech Stack

- **Node.js** with **Express.js**
- **MongoDB** with native driver
- **JWT** for authentication
- **bcrypt** for password hashing
- **express-validator** for input validation
- **CORS** and **Helmet** for security

## Project Structure

```
backend-study-places-1/
├── config/
│   └── database.js          # MongoDB connection
├── models/                  # Data models (13 collections)
│   ├── User.js
│   ├── Place.js
│   ├── Promo.js
│   ├── Review.js
│   ├── StudySession.js
│   ├── SessionParticipant.js
│   ├── Like.js
│   ├── Saved.js
│   ├── FriendRequest.js
│   ├── Friend.js
│   ├── Notification.js
│   ├── Block.js
│   └── Report.js
├── routes/                  # API route definitions
├── controllers/             # Request handlers
├── middleware/              # Auth, validation, error handling
├── utils/                   # JWT, password, helpers
├── scripts/
│   └── seed.js             # Database seeding
└── index.js                # App entry point
```

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Variables

Create a `.env` file in the root directory:

```env
mongodb_key=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
PORT=3000
```

### 3. Seed Database (Optional)

Populate the database with sample places and promos:

```bash
npm run seed
```

### 4. Start Server

```bash
# Production
npm start

# Development (with nodemon)
npm run dev
```

The API will be available at `http://localhost:3000`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (protected)
- `PATCH /api/auth/me` - Update user profile (protected)
- `POST /api/auth/me/push-token` - Update push notification token (protected)

### Users
- `GET /api/users/search?q=query` - Search users (protected)
- `GET /api/users/:id` - Get user profile (protected)

### Friends
- `POST /api/friends/request/:toUserId` - Send friend request (protected)
- `POST /api/friends/accept/:requestId` - Accept friend request (protected)
- `POST /api/friends/decline/:requestId` - Decline friend request (protected)
- `DELETE /api/friends/remove/:friendId` - Remove friend (protected)
- `GET /api/friends` - List friends (protected)
- `GET /api/friends/requests` - List incoming requests (protected)

### Places
- `GET /api/places` - List places (filters: q, district, tag, wifi, outlets, sort, page, limit)
- `GET /api/places/:placeId` - Get place details
- `POST /api/places/:placeId/like` - Like place (protected)
- `DELETE /api/places/:placeId/like` - Unlike place (protected)
- `POST /api/places/:placeId/save` - Save place (protected)
- `DELETE /api/places/:placeId/save` - Unsave place (protected)

### Promos
- `GET /api/promos` - List promos (filters: placeId, active, tag, sort, page, limit)
- `POST /api/promos/:promoId/like` - Like promo (protected)
- `DELETE /api/promos/:promoId/like` - Unlike promo (protected)
- `POST /api/promos/:promoId/save` - Save promo (protected)
- `DELETE /api/promos/:promoId/save` - Unsave promo (protected)

### Reviews
- `GET /api/reviews/places/:placeId/reviews` - Get place reviews
- `POST /api/reviews/places/:placeId/reviews` - Create review (protected)
- `PATCH /api/reviews/:reviewId` - Update review (protected, owner only)
- `DELETE /api/reviews/:reviewId` - Delete review (protected, owner only)
- `POST /api/reviews/:reviewId/like` - Like review (protected)
- `DELETE /api/reviews/:reviewId/like` - Unlike review (protected)

### Study Sessions
- `POST /api/sessions` - Create session (protected)
- `GET /api/sessions` - List sessions (filters: public, course, placeId, district, sort, page, limit)
- `GET /api/sessions/:sessionId` - Get session details (protected)
- `POST /api/sessions/:sessionId/join` - Join session (protected)
- `POST /api/sessions/:sessionId/participants/:userId/accept` - Accept participant (protected, creator only)
- `POST /api/sessions/:sessionId/participants/:userId/decline` - Decline participant (protected, creator only)
- `POST /api/sessions/:sessionId/leave` - Leave session (protected)
- `POST /api/sessions/:sessionId/cancel` - Cancel session (protected, creator only)
- `POST /api/sessions/:sessionId/save` - Save session (protected)
- `DELETE /api/sessions/:sessionId/save` - Unsave session (protected)
- `POST /api/sessions/:sessionId/invite/:friendId` - Invite friend (protected, creator only)

### Notifications
- `GET /api/notifications` - List notifications (protected)
- `POST /api/notifications/:id/read` - Mark as read (protected)
- `POST /api/notifications/read-all` - Mark all as read (protected)

### Saved Content
- `GET /api/saved?type=place|promo|session` - Get saved content (protected)

### Blocks & Reports
- `POST /api/block/:userId` - Block user (protected)
- `DELETE /api/block/:userId` - Unblock user (protected)
- `POST /api/block/reports` - Report content (protected)

## Authentication

Protected routes require a JWT token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

Get the token from the `/api/auth/register` or `/api/auth/login` endpoints.

## Database Collections

The API uses 13 MongoDB collections:
1. **users** - User accounts and profiles
2. **places** - Café locations and details
3. **promos** - Promotional deals
4. **reviews** - Place reviews and ratings
5. **studySessions** - Study session listings
6. **sessionParticipants** - Session join requests and participants
7. **likes** - Like records for various content types
8. **saved** - Saved content records
9. **friendRequests** - Friend request records
10. **friends** - Bidirectional friendships
11. **notifications** - User notifications
12. **blocks** - Blocked users
13. **reports** - Content reports

## Business Logic

### Rating Recalculation
- When a review is created/updated/deleted, the place's rating summary is automatically recalculated using MongoDB aggregation

### Session Capacity
- Sessions have a max capacity (2-10 people)
- When accepted participants reach max, status becomes "full"
- When a participant leaves, status may return to "open"

### Like/Save Counts
- When content is liked/saved, the count is incremented on the target
- When unliked/unsaved, the count is decremented

### Notifications
- Automatic notifications for friend requests, session invites, acceptances, cancellations, etc.

### Unique Constraints
- One review per user per place
- One pending friend request per pair
- One participant record per session per user
- One like/save per user per content item

## Error Handling

All errors return JSON in the format:

```json
{
  "error": {
    "message": "Error description",
    "code": "ERROR_CODE"
  }
}
```

Common error codes:
- `UNAUTHORIZED` - Missing or invalid authentication
- `FORBIDDEN` - Access denied
- `VALIDATION_ERROR` - Invalid input
- `NOT_FOUND` - Resource not found
- `DUPLICATE_KEY` - Unique constraint violation

## Development

### Running Tests
```bash
npm test
```

### Database Indexes
All indexes are created automatically on server startup (see `config/database.js`)

### Adding New Endpoints
1. Create controller in `controllers/`
2. Define routes in `routes/`
3. Add validation rules in `middleware/validation.js`
4. Mount routes in `index.js`

## License

ISC

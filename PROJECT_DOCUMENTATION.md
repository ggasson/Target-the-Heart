# Target The Heart - Complete Project Documentation

## Table of Contents
1. [Project Overview](#project-overview)
2. [Technology Stack](#technology-stack)
3. [Architecture](#architecture)
4. [Database Schema](#database-schema)
5. [API Documentation](#api-documentation)
6. [Frontend Structure](#frontend-structure)
7. [Authentication System](#authentication-system)
8. [Key Features](#key-features)
9. [Environment Configuration](#environment-configuration)
10. [Development Workflow](#development-workflow)
11. [File Structure](#file-structure)
12. [External Integrations](#external-integrations)

## Project Overview

**Target The Heart** is a mobile-first web application designed to connect people in prayer communities. The application facilitates spiritual connections through prayer groups, shared prayer requests, group chats, and real-time community interactions.

### Mission Statement
"Unite in faith, pray in community" - Building spiritual connections through technology while maintaining the sanctity and intimacy of prayer communities.

### Core Objectives
- Create and join prayer groups based on location and interests
- Share and respond to prayer requests within communities
- Facilitate real-time group communication
- Schedule and manage group meetings
- Build meaningful spiritual relationships

## Technology Stack

### Frontend
- **Framework**: React 18.3.1 with TypeScript
- **Build Tool**: Vite 5.4.19
- **Routing**: Wouter 3.3.5 (lightweight client-side routing)
- **State Management**: TanStack React Query 5.60.5 (server state)
- **UI Library**: Radix UI primitives with shadcn/ui patterns
- **Styling**: Tailwind CSS 3.4.17 with custom design tokens
- **Forms**: React Hook Form 7.55.0 with Zod validation
- **Maps**: Google Maps (@vis.gl/react-google-maps 1.5.5)
- **Icons**: Lucide React 0.453.0 + React Icons 5.4.0

### Backend
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js 4.21.2
- **Database**: PostgreSQL with Neon serverless hosting
- **ORM**: Drizzle ORM 0.39.1 with Drizzle Kit 0.30.4
- **Authentication**: Firebase Auth 12.3.0
- **Session Management**: PostgreSQL-backed sessions
- **Validation**: Zod 3.24.2 schema validation

### Development Tools
- **TypeScript**: 5.6.3 for type safety
- **Build**: esbuild 0.25.0 for production builds
- **Development**: tsx 4.19.1 for hot reloading
- **Database**: Drizzle Kit for schema management
- **Package Manager**: npm with lock file

## Architecture

### High-Level Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Client  │    │  Express API    │    │   PostgreSQL    │
│                 │    │                 │    │                 │
│ • React Query   │◄──►│ • REST Routes   │◄──►│ • Drizzle ORM   │
│ • Wouter Router │    │ • Firebase Auth │    │ • Neon Hosting  │
│ • Tailwind CSS  │    │ • Session Mgmt  │    │ • ACID Compliant│
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Application Layers
1. **Presentation Layer** (React Client)
   - Component-based UI with Radix primitives
   - Mobile-first responsive design
   - Real-time updates via React Query

2. **API Layer** (Express Server)
   - RESTful endpoints with proper HTTP semantics
   - Firebase ID token validation
   - Zod schema validation for all inputs

3. **Data Layer** (PostgreSQL + Drizzle)
   - Strongly typed database schema
   - Relational data with proper foreign keys
   - Automatic timestamp tracking

4. **External Services**
   - Firebase Authentication
   - Google Maps API
   - Bible API (KJV + ESV fallback)
   - Neon PostgreSQL hosting

## Database Schema

### Core Entities

#### Users Table
```sql
CREATE TABLE users (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR UNIQUE,
    first_name VARCHAR,
    last_name VARCHAR,
    profile_image_url VARCHAR,
    phone_number VARCHAR,
    birthday DATE,
    is_verified BOOLEAN DEFAULT false,
    verification_code VARCHAR,
    verification_expiry TIMESTAMP,
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    location VARCHAR,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

#### Groups Table
```sql
CREATE TABLE groups (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR NOT NULL,
    description TEXT,
    admin_id VARCHAR REFERENCES users(id) NOT NULL,
    meeting_day VARCHAR,
    meeting_time VARCHAR,
    meeting_location VARCHAR,
    is_recurring_meeting BOOLEAN DEFAULT true,
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    is_public BOOLEAN DEFAULT true,
    audience group_audience DEFAULT 'coed',
    purpose group_purpose DEFAULT 'prayer',
    purpose_tagline TEXT,
    require_approval_to_join BOOLEAN DEFAULT true,
    require_approval_to_post BOOLEAN DEFAULT false,
    allow_members_to_invite BOOLEAN DEFAULT false,
    require_birthday_to_join BOOLEAN DEFAULT false,
    max_members VARCHAR DEFAULT '50',
    group_rules TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

#### Group Memberships Table
```sql
CREATE TABLE group_memberships (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id VARCHAR REFERENCES groups(id) NOT NULL,
    user_id VARCHAR REFERENCES users(id) NOT NULL,
    status membership_status DEFAULT 'pending',
    role member_role DEFAULT 'member',
    message TEXT,
    share_birthday BOOLEAN DEFAULT false,
    joined_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);
```

#### Prayer Requests Table
```sql
CREATE TABLE prayer_requests (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR NOT NULL,
    description TEXT NOT NULL,
    category prayer_category DEFAULT 'other',
    status prayer_status DEFAULT 'active',
    author_id VARCHAR REFERENCES users(id) NOT NULL,
    group_id VARCHAR REFERENCES groups(id) NOT NULL,
    is_urgent BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

#### Prayer Responses Table
```sql
CREATE TABLE prayer_responses (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    prayer_request_id VARCHAR REFERENCES prayer_requests(id) NOT NULL,
    user_id VARCHAR REFERENCES users(id) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);
```

#### Chat Messages Table
```sql
CREATE TABLE chat_messages (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id VARCHAR REFERENCES groups(id) NOT NULL,
    user_id VARCHAR REFERENCES users(id) NOT NULL,
    content TEXT NOT NULL,
    message_type VARCHAR DEFAULT 'text',
    status message_status DEFAULT 'approved',
    prayer_request_id VARCHAR REFERENCES prayer_requests(id),
    created_at TIMESTAMP DEFAULT NOW()
);
```

#### Meetings Table
```sql
CREATE TABLE meetings (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id VARCHAR REFERENCES groups(id) NOT NULL,
    title VARCHAR NOT NULL,
    description TEXT,
    topic VARCHAR,
    meeting_date TIMESTAMP NOT NULL,
    venue VARCHAR,
    venue_address TEXT,
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    status meeting_status DEFAULT 'scheduled',
    max_attendees VARCHAR,
    is_recurring BOOLEAN DEFAULT false,
    recurring_pattern VARCHAR,
    recurring_day_of_week VARCHAR,
    recurring_time VARCHAR,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

#### Meeting RSVPs Table
```sql
CREATE TABLE meeting_rsvps (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    meeting_id VARCHAR REFERENCES meetings(id) NOT NULL,
    user_id VARCHAR REFERENCES users(id) NOT NULL,
    status rsvp_status NOT NULL,
    notes TEXT,
    guest_count VARCHAR DEFAULT '0',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(meeting_id, user_id)
);
```

### Enums and Types
- **group_audience**: `men_only`, `women_only`, `coed`
- **group_purpose**: `prayer`, `bible_study`, `fellowship`, `youth`, `marriage_couples`, `recovery_healing`, `outreach_service`, `other`
- **membership_status**: `pending`, `approved`, `rejected`
- **member_role**: `member`, `admin`, `moderator`
- **prayer_status**: `active`, `answered`, `closed`
- **prayer_category**: `health_healing`, `family_relationships`, `work_career`, `spiritual_growth`, `financial_provision`, `other`
- **message_status**: `pending`, `approved`, `rejected`
- **meeting_status**: `scheduled`, `cancelled`, `completed`
- **rsvp_status**: `attending`, `not_attending`, `maybe`

## API Documentation

### Authentication Endpoints

#### `GET /api/auth/user`
Get current authenticated user profile.
- **Auth**: Required (Firebase ID token)
- **Response**: User object with profile data

#### `PATCH /api/users/me`
Update user profile information.
- **Auth**: Required
- **Body**: `{ birthday?: string }` (YYYY-MM-DD format)
- **Response**: Success message

#### `POST /api/auth/location`
Update user location information.
- **Auth**: Required
- **Body**: `{ latitude: number, longitude: number, location: string }`
- **Response**: Updated user object

### Group Endpoints

#### `GET /api/groups`
Get all available groups for discovery.
- **Auth**: Required
- **Response**: Array of Group objects

#### `GET /api/groups/my`
Get groups where user is a member.
- **Auth**: Required
- **Response**: Array of Group objects

#### `GET /api/groups/public`
Get all public groups with location data.
- **Auth**: Optional
- **Response**: Array of public Group objects

#### `POST /api/groups`
Create a new prayer group.
- **Auth**: Required
- **Body**: InsertGroup schema (name, description, location, etc.)
- **Response**: Created Group object

#### `PUT /api/groups/:id`
Update group information (admin only).
- **Auth**: Required (must be group admin)
- **Body**: Partial Group data
- **Response**: Updated Group object

#### `DELETE /api/groups/:id`
Delete a group (admin only).
- **Auth**: Required (must be group admin)
- **Response**: Success message

#### `GET /api/groups/:id/members`
Get all members of a specific group.
- **Auth**: Required (must be group member)
- **Response**: Array of membership objects with user data

#### `POST /api/groups/:id/join`
Request to join a group.
- **Auth**: Required
- **Body**: `{ message: string, birthday?: string, shareBirthday?: boolean }`
- **Response**: Success message

#### `GET /api/groups/:groupId/birthdays/today`
Get members with birthdays today.
- **Auth**: Required (must be group member)
- **Response**: Array of users with birthdays today

### Prayer Request Endpoints

#### `GET /api/prayers`
Get all prayer requests for user's groups.
- **Auth**: Required
- **Response**: Array of PrayerRequest objects

#### `GET /api/prayers/my`
Get prayer requests created by the current user.
- **Auth**: Required
- **Response**: Array of user's PrayerRequest objects

#### `POST /api/prayers`
Create a new prayer request.
- **Auth**: Required
- **Body**: InsertPrayerRequest schema
- **Response**: Created PrayerRequest object

#### `POST /api/prayers/:id/pray`
Mark that you're praying for a request.
- **Auth**: Required
- **Response**: Success message

#### `PATCH /api/prayers/:id/status`
Update prayer request status.
- **Auth**: Required (must be author)
- **Body**: `{ status: prayer_status }`
- **Response**: Updated PrayerRequest object

#### `DELETE /api/prayers/:id`
Delete a prayer request.
- **Auth**: Required (must be author)
- **Response**: Success message

### Meeting Endpoints

#### `GET /api/groups/:groupId/meetings`
Get all meetings for a group.
- **Auth**: Required (must be group member)
- **Response**: Array of Meeting objects

#### `POST /api/groups/:groupId/meetings`
Create a new meeting.
- **Auth**: Required (must be group admin/moderator)
- **Body**: InsertMeeting schema
- **Response**: Created Meeting object

#### `GET /api/meetings/next`
Get next upcoming meeting for user's groups.
- **Auth**: Required
- **Response**: Next Meeting object or null

#### `GET /api/meetings/all`
Get all upcoming meetings for user's groups.
- **Auth**: Required
- **Response**: Array of upcoming Meeting objects

#### `POST /api/meetings/:id/rsvp`
RSVP to a meeting.
- **Auth**: Required
- **Body**: `{ status: rsvp_status, notes?: string, guestCount?: string }`
- **Response**: Created/Updated RSVP object

### Chat Endpoints

#### `GET /api/groups/:groupId/messages`
Get chat messages for a group.
- **Auth**: Required (must be group member)
- **Query**: `?limit=50&offset=0`
- **Response**: Array of ChatMessage objects

#### `POST /api/groups/:groupId/messages`
Send a message to group chat.
- **Auth**: Required (must be group member)
- **Body**: `{ content: string, messageType?: string }`
- **Response**: Created ChatMessage object

### Utility Endpoints

#### `GET /api/daily-verse`
Get daily Bible verse.
- **Auth**: Optional
- **Query**: `?q=verse_reference`
- **Response**: `{ reference: string, text: string, translation_id: string, translation_name: string }`

## Frontend Structure

### Page Components

#### Landing Page (`/pages/landing.tsx`)
- Firebase authentication (Google OAuth + Email/Password)
- Mobile-responsive login/signup forms
- Onboarding flow for new users

#### Home Page (`/pages/home.tsx`)
- Daily Bible verse display (KJV translation priority)
- Today's birthdays from user's groups
- Upcoming meetings widget
- Quick navigation to main features

#### Groups Page (`/pages/groups.tsx`)
- Group discovery with filters (audience, purpose, location)
- List and Map views of available groups
- Join request functionality
- My Groups management

#### Prayers Page (`/pages/prayers.tsx`)
- Prayer request feed from user's groups
- Create new prayer requests
- Mark prayers as answered/closed
- "I'm praying" response system

#### Chat Page (`/pages/chat.tsx`)
- Group selection for messaging
- Real-time chat interface
- Message history with pagination

#### Profile Page (`/pages/profile.tsx`)
- User profile management
- Location setting with Google Maps
- Privacy settings
- Account information

### Component Library

#### UI Components (`/components/ui/`)
- Complete shadcn/ui component library
- Radix UI primitives with Tailwind styling
- Consistent design system across application
- Accessible form controls and interactions

#### Custom Components
- **BottomNavigation**: Mobile tab navigation
- **DailyVerse**: Bible verse display with API integration
- **GroupCard**: Group information display with actions
- **GroupsMap**: Google Maps integration for group discovery
- **LocationPickerGoogle**: Location selection with maps and geocoding
- **PrayerCard**: Prayer request display with response options
- **ThemeSwitcher**: Dark/light mode toggle

### Hooks and State Management

#### Custom Hooks
- **useAuth**: Firebase authentication state management
- **useDailyVerse**: Daily Bible verse fetching with rotation
- **useTodaysBirthdays**: Birthday notifications for groups
- **useFirebaseAuth**: Firebase-specific authentication logic

#### State Management Pattern
- **Server State**: TanStack React Query for API data
- **Client State**: React useState/useReducer for UI state
- **Authentication State**: Firebase Auth + React Context
- **Theme State**: React Context with localStorage persistence

## Authentication System

### Firebase Authentication
- **Google OAuth**: Primary authentication method
- **Email/Password**: Alternative authentication
- **Token Validation**: Server-side Firebase ID token verification
- **Session Management**: PostgreSQL-backed sessions for server state

### Authorization Patterns
- **Route Protection**: `isAuthenticated` middleware on protected endpoints
- **Role-Based Access**: Group admin/member/moderator roles
- **Resource Ownership**: Users can only modify their own data
- **Group Membership**: Access to group resources requires membership

### Security Features
- HTTPS enforcement for production
- CORS configuration for cross-origin requests
- Input validation with Zod schemas
- SQL injection prevention via Drizzle ORM
- XSS protection through React's built-in escaping

## Key Features

### Prayer Community Management
- **Group Creation**: Location-based prayer groups with customizable settings
- **Membership Management**: Approval workflows and role assignments
- **Group Discovery**: Filter by location, purpose, and audience
- **Invitation System**: Shareable group invitation links

### Prayer Request System
- **Request Creation**: Categorized prayer requests with urgency levels
- **Community Response**: "I'm praying" responses with tracking
- **Status Updates**: Mark prayers as answered or closed
- **Group Integration**: Requests tied to specific prayer groups

### Meeting Coordination
- **Event Scheduling**: Create recurring or one-time meetings
- **RSVP Management**: Track attendance with guest counts
- **Location Integration**: Google Maps integration for venues
- **Notification System**: Upcoming meeting reminders

### Real-time Communication
- **Group Chat**: Real-time messaging within prayer groups
- **Message Moderation**: Optional approval workflow for messages
- **Prayer Integration**: Share prayer requests directly in chat

### Location Services
- **Google Maps Integration**: Group discovery and meeting locations
- **GPS Location**: Current location detection for nearby groups
- **Address Geocoding**: Convert addresses to coordinates
- **Proximity Search**: Find groups within specified distance

### Spiritual Content
- **Daily Bible Verse**: Rotating selection with KJV/ESV translations
- **Birthday Celebrations**: Today's birthdays within groups
- **Prayer Tracking**: Monitor prayer request responses

## Environment Configuration

### Required Environment Variables

#### Frontend (Vite)
```env
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
VITE_FIREBASE_APP_ID=your_firebase_app_id
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

#### Backend (Node.js)
```env
DATABASE_URL=postgresql://user:pass@host:port/database
FIREBASE_PROJECT_ID=your_firebase_project_id
ESV_API_KEY=your_esv_api_key_optional
SENDGRID_API_KEY=your_sendgrid_key_optional
GEMINI_API_KEY=your_gemini_api_key_optional
```

### External Service Setup

#### Firebase Console
1. Create Firebase project
2. Enable Authentication with Google OAuth
3. Add authorized domains for your Replit app
4. Download service account key (not needed for client-side auth)

#### Google Cloud Console
1. Enable Maps JavaScript API
2. Enable Places API
3. Enable Geocoding API
4. Restrict API key to your domains

#### ESV API (Optional)
1. Register at api.esv.org
2. Obtain API key for Bible verse access
3. Configure rate limits as needed

## Development Workflow

### Local Development
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Database operations
npm run db:push        # Sync schema to database
npm run db:push --force # Force sync (use carefully)

# Type checking
npm run check

# Build for production
npm run build
```

### Database Migrations
- **Schema Changes**: Modify `shared/schema.ts`
- **Sync Database**: Run `npm run db:push`
- **Force Sync**: Use `--force` flag for schema conflicts
- **No Manual SQL**: Drizzle Kit handles all migrations

### Code Organization
- **Shared Types**: All TypeScript types in `shared/schema.ts`
- **API Routes**: RESTful endpoints in `server/routes.ts`
- **Data Access**: Database operations in `server/storage.ts`
- **Frontend Pages**: Route components in `client/src/pages/`
- **Reusable Components**: UI components in `client/src/components/`

### Testing Strategy
- **API Testing**: Manual testing with Postman/curl
- **Frontend Testing**: Browser-based manual testing
- **Database Testing**: Direct SQL queries for verification
- **Authentication Testing**: Firebase console + application flow

## File Structure

```
target-the-heart/
├── client/                          # React frontend application
│   ├── public/                      # Static assets
│   │   └── target-the-heart-logo.png
│   ├── src/
│   │   ├── assets/                  # Frontend assets
│   │   ├── components/              # React components
│   │   │   ├── modals/             # Modal components
│   │   │   ├── ui/                 # shadcn/ui component library
│   │   │   ├── bottom-navigation.tsx
│   │   │   ├── DailyVerse.tsx
│   │   │   ├── group-card.tsx
│   │   │   ├── groups-map.tsx      # Google Maps integration
│   │   │   ├── location-picker-google.tsx
│   │   │   ├── prayer-card.tsx
│   │   │   └── theme-switcher.tsx
│   │   ├── contexts/               # React contexts
│   │   │   └── theme-context.tsx
│   │   ├── hooks/                  # Custom React hooks
│   │   │   ├── useAuth.ts
│   │   │   ├── useDailyVerse.ts
│   │   │   ├── useFirebaseAuth.ts
│   │   │   └── useTodaysBirthdays.ts
│   │   ├── lib/                    # Utility libraries
│   │   │   ├── firebase.ts         # Firebase configuration
│   │   │   ├── queryClient.ts      # React Query setup
│   │   │   └── utils.ts
│   │   ├── pages/                  # Page components
│   │   │   ├── calendar.tsx
│   │   │   ├── chat.tsx
│   │   │   ├── groups.tsx
│   │   │   ├── home.tsx
│   │   │   ├── landing.tsx
│   │   │   ├── prayers.tsx
│   │   │   └── profile.tsx
│   │   ├── App.tsx                 # Main application component
│   │   ├── index.css               # Global styles with Tailwind
│   │   └── main.tsx                # Application entry point
│   └── index.html                  # HTML template
├── server/                         # Node.js backend
│   ├── db.ts                       # Database connection
│   ├── firebaseAuth.ts             # Firebase authentication middleware
│   ├── index.ts                    # Server entry point
│   ├── routes.ts                   # API route definitions
│   ├── storage.ts                  # Data access layer
│   └── vite.ts                     # Vite middleware setup
├── shared/                         # Shared TypeScript definitions
│   └── schema.ts                   # Database schema and types
├── components.json                 # shadcn/ui configuration
├── drizzle.config.ts              # Drizzle ORM configuration
├── package.json                    # Dependencies and scripts
├── postcss.config.js              # PostCSS configuration
├── replit.md                       # Project documentation
├── tailwind.config.ts             # Tailwind CSS configuration
├── tsconfig.json                   # TypeScript configuration
└── vite.config.ts                 # Vite build configuration
```

## External Integrations

### Firebase Authentication
- **Purpose**: User authentication and identity management
- **Features**: Google OAuth, email/password, session management
- **Integration**: Client-side auth with server-side token verification

### Google Maps Platform
- **APIs Used**: Maps JavaScript API, Places API, Geocoding API
- **Features**: Group location display, address search, GPS location
- **Components**: GroupsMap, LocationPickerGoogle

### Bible APIs
- **Primary**: bible-api.com (KJV translation)
- **Fallback**: ESV API (English Standard Version)
- **Features**: Daily verse rotation, multiple translations

### Neon Database
- **Purpose**: PostgreSQL hosting with serverless scaling
- **Features**: Connection pooling, automatic backups, real-time data
- **Integration**: Drizzle ORM with connection string

### SendGrid (Optional)
- **Purpose**: Transactional email delivery
- **Features**: Meeting reminders, prayer notifications
- **Status**: Configured but not actively used

### Google Gemini AI (Optional)
- **Purpose**: AI-powered features for prayer and spiritual guidance
- **Features**: Prayer suggestion, spiritual content generation
- **Status**: Integrated but not actively implemented

---

## Development Notes

### Performance Considerations
- **Mobile-First**: Optimized for mobile devices with responsive design
- **Lazy Loading**: Components and routes loaded on demand
- **Caching**: React Query for aggressive API response caching
- **Image Optimization**: Optimized logos and assets

### Security Best Practices
- **Authentication**: Firebase ID tokens with server validation
- **Authorization**: Role-based access control for group resources
- **Input Validation**: Zod schemas for all API inputs
- **SQL Safety**: Drizzle ORM prevents SQL injection attacks

### Accessibility Features
- **Semantic HTML**: Proper heading structure and ARIA labels
- **Keyboard Navigation**: Full keyboard accessibility
- **Screen Readers**: Compatible with assistive technologies
- **Color Contrast**: WCAG-compliant color combinations

### Browser Compatibility
- **Modern Browsers**: Chrome, Firefox, Safari, Edge (latest versions)
- **Mobile Browsers**: iOS Safari, Chrome Mobile, Samsung Internet
- **PWA Ready**: Service worker configuration for offline capability

---

*This documentation was generated on December 21, 2024. For the most up-to-date information, refer to the source code and Git commit history.*
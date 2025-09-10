# Overview

Target The Heart is a mobile-first web application that connects people in prayer communities. The application allows users to create and join prayer groups, share prayer requests, participate in group chats, and build spiritual connections within their local communities. Built as a React-based single-page application with a Node.js/Express backend, it uses location-based features to help users find nearby prayer groups and facilitates meaningful spiritual interactions through a clean, intuitive mobile interface.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture

The application uses a **React-based architecture** with TypeScript, built using Vite as the build tool. The frontend follows a component-driven design with:

- **Routing**: Wouter for client-side routing
- **State Management**: React Query (@tanstack/react-query) for server state management and caching
- **UI Framework**: Custom component library built on Radix UI primitives with shadcn/ui styling patterns
- **Styling**: Tailwind CSS with CSS custom properties for theming
- **Mobile-First Design**: Responsive layout optimized for mobile devices with a bottom navigation pattern

The architecture separates concerns between pages (route handlers), components (reusable UI elements), and hooks (business logic). The application uses a tab-based navigation system with dedicated sections for Home, Groups, Prayers, and Chat.

## Backend Architecture

The server uses **Express.js with TypeScript** and follows a REST API pattern:

- **Database Layer**: Drizzle ORM with PostgreSQL, using Neon serverless for database hosting
- **Authentication**: Replit's OpenID Connect authentication system with session-based auth using connect-pg-simple for session storage
- **API Structure**: RESTful endpoints organized by feature (groups, prayers, chat, auth)
- **Data Access**: Repository pattern implemented through a storage interface for clean data layer abstraction
- **Development**: Hot module replacement in development with Vite middleware integration

The backend provides comprehensive CRUD operations for prayer groups, prayer requests, group memberships, chat messages, and user management.

## Data Storage Solutions

**PostgreSQL Database** managed through Drizzle ORM with the following schema design:

- **Users Table**: Stores user profiles with location data (latitude/longitude) for proximity-based features
- **Groups Table**: Prayer group information with visibility settings (public/private) and location data
- **Group Memberships**: Junction table managing user-group relationships with approval status
- **Prayer Requests**: Central feature storing prayer requests with categories, status tracking, and group associations
- **Prayer Responses**: Tracks who has prayed for specific requests
- **Chat Messages**: Group messaging functionality with message types and timestamps
- **Sessions Table**: Server-side session storage for authentication

The schema uses UUID primary keys and includes proper foreign key relationships with cascading deletes where appropriate.

## Authentication and Authorization

**Replit OpenID Connect Integration** provides:

- **Single Sign-On**: Seamless authentication through Replit's identity provider
- **Session Management**: Server-side session storage in PostgreSQL with configurable TTL
- **User Profile Management**: Automatic user creation/updates from OIDC claims
- **Protected Routes**: Middleware-based route protection for authenticated endpoints
- **Location Services**: Optional location sharing for proximity-based group discovery

The authentication system handles user registration, login, logout, and profile management automatically through the OIDC flow.

# External Dependencies

## Database Services
- **Neon Database**: Serverless PostgreSQL hosting with WebSocket support for real-time features
- **Drizzle Kit**: Database schema management and migrations

## Authentication Services
- **Replit Authentication**: OpenID Connect provider for user authentication and identity management

## Frontend Libraries
- **React Query**: Server state management, caching, and synchronization
- **Radix UI**: Headless component primitives for accessible UI components
- **Wouter**: Lightweight client-side routing
- **Tailwind CSS**: Utility-first CSS framework with custom design tokens

## Development Tools
- **Vite**: Build tool and development server with HMR support
- **TypeScript**: Type safety across the full stack
- **ESLint/Prettier**: Code quality and formatting tools

## Runtime Dependencies
- **Express.js**: Web application framework
- **WebSocket Support**: Real-time communication capabilities through Neon's WebSocket constructor
- **Session Management**: PostgreSQL-backed session storage for scalable authentication
# Replit.md

## Overview

This is a modern weather application built with React and Express.js that provides current weather data and 5-day forecasts. The application integrates with the OpenWeatherMap API to fetch real-time weather information for any location worldwide. Users can search for cities, view detailed weather conditions, and see upcoming forecasts with an intuitive and responsive interface.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The client is built using React with TypeScript and utilizes a modern component-based architecture. The application uses Vite as the build tool and development server, providing fast hot module replacement and efficient bundling. The UI is built with shadcn/ui components, which are based on Radix UI primitives and styled with Tailwind CSS.

**Key Frontend Decisions:**
- **React with TypeScript**: Provides type safety and better developer experience
- **Wouter for routing**: Lightweight alternative to React Router for client-side navigation
- **TanStack Query**: Handles server state management, caching, and data fetching with automatic retries and background updates
- **Tailwind CSS**: Utility-first CSS framework for rapid UI development
- **shadcn/ui**: Pre-built accessible component library for consistent design

### Backend Architecture
The server is built with Express.js and serves both API endpoints and static assets. It uses a middleware-based architecture for request handling and includes development-specific tooling for hot reloading.

**Key Backend Decisions:**
- **Express.js**: Proven framework for building REST APIs with good middleware ecosystem
- **TypeScript**: Ensures type safety across the entire application
- **Modular route structure**: API routes are organized separately for maintainability
- **Development middleware**: Vite integration for seamless development experience

### Data Management
The application uses a schema-first approach with Zod for runtime type validation and TypeScript interface generation. Weather data is validated against predefined schemas to ensure data integrity.

**Key Data Decisions:**
- **Zod schemas**: Runtime validation and type inference for API responses
- **Shared schema**: Common type definitions between client and server
- **Drizzle ORM**: Type-safe database query builder (configured for PostgreSQL)
- **In-memory storage**: Simple storage implementation for user data

### API Design
RESTful API endpoints follow conventional patterns with proper error handling and response formatting. The API serves as a proxy to the OpenWeatherMap service, adding validation and caching capabilities.

**API Endpoints:**
- `GET /api/cities/search`: Search for cities by name
- `GET /api/weather/current`: Get current weather by coordinates
- `GET /api/weather/forecast`: Get 5-day forecast by coordinates

### State Management
Client-side state is managed through a combination of React's built-in state management and TanStack Query for server state. Local component state handles UI interactions while server state is cached and synchronized automatically.

**State Management Decisions:**
- **TanStack Query**: Handles all server state with automatic caching, background updates, and error handling
- **React useState**: Local component state for UI interactions
- **No global state library**: Avoided complexity by using React's context only where necessary

## External Dependencies

### Core Runtime Dependencies
- **@neondatabase/serverless**: PostgreSQL database driver optimized for serverless environments
- **drizzle-orm**: TypeScript-first ORM for type-safe database operations
- **express**: Web framework for building the REST API server
- **@tanstack/react-query**: Data fetching and caching library for React
- **zod**: Schema validation library for runtime type checking

### UI and Styling
- **@radix-ui/**: Collection of accessible UI primitives (accordion, dialog, dropdown, etc.)
- **tailwindcss**: Utility-first CSS framework for styling
- **class-variance-authority**: Utility for creating variant-based component APIs
- **lucide-react**: Icon library with React components

### Development Tools
- **vite**: Build tool and development server with hot module replacement
- **typescript**: Type checking and compile-time error detection
- **tsx**: TypeScript execution environment for development
- **@replit/vite-plugin-runtime-error-modal**: Development error overlay for Replit

### Third-Party Services
- **OpenWeatherMap API**: Weather data provider requiring API key configuration
- **Geolocation API**: Browser API for getting user's current location
- **Google Fonts**: Web fonts (Inter, Architects Daughter, DM Sans, Fira Code, Geist Mono)

### Build and Deployment
- **esbuild**: Fast JavaScript bundler for server-side code
- **postcss**: CSS processing with autoprefixer for vendor prefixes
- **vite build**: Client-side bundling and optimization
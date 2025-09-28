# Bot Management Dashboard

## Overview

This is a web-based dashboard for managing Minecraft bots that can connect to servers and perform automated tasks. The application allows users to spawn, control, and monitor multiple bots through a real-time interface. Bots can follow players, attack targets, perform anti-AFK actions, and respond to chat commands using OpenAI integration.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **React with TypeScript**: Modern React application using functional components and hooks
- **UI Framework**: shadcn/ui components built on Radix UI primitives with Tailwind CSS for styling
- **State Management**: TanStack Query for server state management and caching
- **Routing**: Wouter for lightweight client-side routing
- **Real-time Updates**: WebSocket connection for live bot status and log updates
- **Build Tool**: Vite for fast development and optimized production builds

### Backend Architecture
- **Node.js with Express**: RESTful API server handling bot management operations
- **WebSocket Server**: Real-time communication for bot status updates and logs
- **Bot Management**: Centralized BotManager service using EventEmitter pattern for coordinating multiple Minecraft bot instances
- **Minecraft Integration**: Mineflayer library for creating and controlling Minecraft bots
- **AI Integration**: OpenAI GPT-5 for processing chat commands and generating intelligent responses

### Data Storage
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Connection**: Neon serverless PostgreSQL for cloud database hosting
- **Schema Management**: Drizzle migrations for database schema versioning
- **In-Memory Storage**: Fallback MemStorage implementation for development/testing

### Key Design Patterns
- **Event-Driven Architecture**: Bot state changes propagated through EventEmitter to WebSocket clients
- **Service Layer**: Separation of concerns with dedicated services for bot management and AI integration
- **Type Safety**: Shared TypeScript schemas between frontend and backend using Zod validation
- **Real-time Communication**: WebSocket broadcasting for immediate UI updates when bot status changes

## External Dependencies

### Third-Party Services
- **OpenAI API**: GPT-5 integration for intelligent chat command processing
- **Neon Database**: Serverless PostgreSQL hosting for production data storage
- **Minecraft Server**: External game server (tbcraft.cbu.net:25569) for bot connections

### Key Libraries
- **Mineflayer**: Minecraft bot creation and control library
- **Drizzle ORM**: Type-safe database operations and migrations
- **TanStack Query**: Server state management and caching
- **Radix UI**: Accessible UI component primitives
- **WebSocket (ws)**: Real-time bidirectional communication
- **Zod**: Runtime type validation and schema definition

### Development Tools
- **Vite**: Frontend build tool with HMR and optimization
- **ESBuild**: Fast backend bundling for production
- **TypeScript**: Type safety across the entire application stack
- **Tailwind CSS**: Utility-first styling framework
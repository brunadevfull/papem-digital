# Navy Display System

## Overview

The Navy Display System (Sistema de Visualização da Marinha do Brasil) is a comprehensive document visualization platform designed for the Brazilian Navy. The system displays PLASA (Plano de Serviço Semanal) documents, service scales (Escalas de Serviço), important notices, and provides automatic sunset time updates for Rio de Janeiro. The application features responsive design with automatic scroll functionality and real-time data updates.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript for type-safe component development
- **Build Tool**: Vite for fast development and optimized production builds
- **UI Framework**: Tailwind CSS with shadcn/ui component library for consistent styling
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: React Context API with custom DisplayContext for application state
- **HTTP Client**: TanStack React Query for server state management and caching

### Backend Architecture
- **Runtime**: Node.js with Express.js server framework
- **Language**: TypeScript for type safety across the entire stack
- **Database**: PostgreSQL with Drizzle ORM for data persistence
- **File Upload**: Multer middleware for handling PDF document uploads
- **Storage**: Hybrid storage - PostgreSQL for structured data, file system for uploaded documents
- **API Design**: RESTful endpoints with structured JSON responses

### PDF Processing
- **PDF.js Integration**: Client-side PDF rendering and processing
- **Automatic Scrolling**: Custom continuous auto-scroller implementation
- **Multi-page Support**: Automatic page splitting and rendering for optimal display

## Key Components

### Core Pages
- **Index Page**: Main display interface with split-screen layout for PLASA and scales
- **Admin Panel**: Complete administrative interface for document and notice management
- **PDF Viewer Component**: Advanced PDF rendering with auto-scroll capabilities
- **Notice Display**: Real-time notice rotation system with priority-based filtering

### Display Features
- **Responsive Layout**: Adaptive design for desktop (60/40 split), tablet, and mobile devices
- **Auto-restart System**: Automatic content refresh after scroll completion
- **Real-time Clock**: Dynamic date/time display with daily sunset time updates
- **Document Rotation**: 30-second interval switching between active scale documents

### Administrative Features
- **Document Management**: Upload, categorize, and manage PDF documents
- **Notice System**: Create and manage notices with priority levels and date ranges
- **Configuration Panel**: Adjust scroll speeds, intervals, and system settings
- **File Operations**: Secure file upload, deletion, and organization

## Data Flow

### Document Processing Flow
1. Admin uploads PDF documents through the admin panel
2. Files are stored in the `/uploads` directory with unique identifiers
3. Document metadata is stored in memory with references to file paths
4. Frontend fetches document lists and displays active documents
5. PDF.js processes documents for client-side rendering

### Notice Management Flow
1. Notices are created with title, content, priority, and date ranges
2. System filters notices based on current date and active status
3. Frontend rotates through active notices with priority-based ordering
4. Real-time updates ensure notices appear and disappear based on schedules

### Sunset Time Integration
1. External API call to sunrise-sunset.org for Rio de Janeiro coordinates
2. UTC time conversion to local Brazil timezone (UTC-3)
3. Daily cache refresh with automatic midnight updates
4. Fallback to manual time setting if API is unavailable

## External Dependencies

### Core Dependencies
- **React Ecosystem**: react, react-dom, @types/react
- **UI Components**: @radix-ui/* components, lucide-react icons
- **State Management**: @tanstack/react-query, react-hook-form
- **Styling**: tailwindcss, class-variance-authority, clsx
- **Backend**: express, multer, drizzle-orm, typescript

### Build and Development Tools
- **Vite**: Frontend build tool and development server
- **TypeScript**: Type checking and compilation
- **ESBuild**: Fast JavaScript bundling for production
- **TSX**: TypeScript execution for development

### Database Integration
- **Drizzle ORM**: Type-safe database operations
- **PostgreSQL Support**: Configured for future database integration
- **Schema Definitions**: Shared TypeScript schemas for type safety

## Deployment Strategy

### Development Environment
- **Concurrent Servers**: Vite dev server (port 5173) with Express API (port 5000)
- **Hot Reload**: Automatic code updates during development
- **Proxy Configuration**: Vite proxies `/api` requests to Express server

### Production Build
- **Static Assets**: Vite builds optimized frontend bundle
- **Server Bundle**: ESBuild compiles Express server for production
- **File Structure**: Organized output with `dist/public` for frontend assets

### Network Configuration
- **Permissive CORS**: Configured for cross-origin access in network environments
- **Multiple Interface Support**: Binds to 0.0.0.0 for network accessibility
- **Firewall Compatibility**: Designed for Oracle Linux and enterprise environments

### Offline Deployment Support
- **Package Scripts**: Automated offline package creation for air-gapped environments
- **Dependency Bundling**: Complete npm dependency packaging
- **System Requirements**: Node.js 20+ LTS with system-specific dependencies

## Changelog

Changelog:
- June 29, 2025. Initial setup
- June 29, 2025. Migration completed from Replit Agent to Replit environment
  - Fixed BONO document management (edit/delete options working properly)  
  - Removed duplicate CARDÁPIO section from DEBUG tab
  - Added officer information to main header (Oficial do Dia and Contramestre de Pernoite)
  - Added temperature display in header with fallback to estimated temperature
  - Enhanced header layout for better responsiveness
  - All core functionality tested and working properly
- June 29, 2025. Military personnel management system implemented
  - **PostgreSQL database configured** for data persistence
  - **Server-side storage confirmed** - both notices and duty officers saved on server
  - Added military rank badges with professional styling (1TEN Silva, 1SG Santos)
  - Created new "Militares" tab in admin panel with rank selection and name editing
  - Implemented full CRUD API for duty officers (/api/duty-officers)
  - Default officers created automatically: Oficial do Dia (1TEN Silva) and Contramestre (1SG Santos)
  - Functional save buttons that update server data in real-time
  - Complete military rank hierarchy implemented (AMI to MN)
- June 29, 2025. **File-based storage system implemented**
  - **Switched from PostgreSQL to JSON file storage** for simplified deployment
  - Data persisted in `/data` directory with JSON files (notices.json, duty-officers.json, etc.)
  - **Server-side persistence confirmed** - changes saved permanently to JSON files
  - Tested: Officer changed from "1TEN Silva" to "CC Costa" and saved in duty-officers.json
  - All CRUD operations working with file storage for simpler installation
- June 29, 2025. **Main page integration completed**
  - **Fixed main page not updating** with new military personnel data
  - Main page now loads duty officers from `/api/duty-officers` instead of hardcoded values
  - **Real-time updates**: Page refreshes military data every 5 minutes automatically
  - **Admin panel integration**: Changes in admin panel now reflect on main page
  - Tested: Changed "CC Costa" to "1TEN Silva" and confirmed main page updated

## User Preferences

Preferred communication style: Simple, everyday language.
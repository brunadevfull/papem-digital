# Navy Display System - Replit Configuration

## Overview

The Navy Display System is a sophisticated PDF document display platform designed for the Brazilian Navy (Marinha do Brasil). The system provides automated display of PLASA (Weekly Service Plan) and Escala (Service Schedule) documents with intelligent scrolling, notice management, and a responsive design optimized for various screen sizes.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized production builds
- **UI Library**: Radix UI components with shadcn/ui design system
- **Styling**: Tailwind CSS with custom theming and responsive design
- **State Management**: React Context API with custom DisplayContext
- **PDF Rendering**: PDF.js integration for browser-based PDF display
- **Routing**: Wouter for lightweight client-side routing

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **API Design**: RESTful endpoints with structured error handling
- **Middleware**: Multer for file uploads, CORS configuration for cross-origin requests
- **Development Server**: Hot reload with Vite integration

### Data Storage Solutions
- **Database ORM**: Drizzle ORM configured for PostgreSQL
- **In-Memory Storage**: MemStorage class for development/demo purposes
- **File Storage**: Local filesystem for PDF document uploads
- **Session Management**: Connect-pg-simple for PostgreSQL session storage
- **Cache Management**: File system cache for PDF page processing

## Key Components

### Core Display Components
1. **PDFViewer Component**
   - Continuous auto-scrolling with configurable speed
   - Auto-restart functionality after scroll completion
   - Error handling and fallback rendering
   - Mobile-responsive viewport adjustments

2. **NoticeDisplay Component**
   - Rotating priority-based notice system
   - Date range validation for active notices
   - High/medium/low priority visual indicators

3. **DisplayContext**
   - Centralized state management for documents and notices
   - Real-time data synchronization
   - Configuration management for display settings

### Administrative Interface
- Document upload and management system
- Notice creation with priority levels and date ranges
- System configuration controls
- Real-time preview capabilities

### PDF Processing System
- Server-side PDF page extraction
- Image conversion and caching
- Automatic scaling and optimization
- Error recovery and fallback mechanisms

## Data Flow

### Document Processing Pipeline
1. **Upload**: PDF files uploaded via admin interface
2. **Processing**: Server extracts pages and converts to images
3. **Caching**: Processed images stored in filesystem cache
4. **Display**: Frontend renders cached images with smooth scrolling
5. **Rotation**: Documents rotate based on configured intervals

### Notice Management Flow
1. **Creation**: Notices created with title, content, priority, and date range
2. **Validation**: Server validates date ranges and priority levels
3. **Storage**: Notices stored in database with active status
4. **Display**: Active notices displayed based on current date/time
5. **Rotation**: Multiple notices rotate automatically

### Real-time Updates
- Polling mechanism for document and notice updates
- Automatic refresh on configuration changes
- Error handling with graceful degradation

## External Dependencies

### Core Dependencies
- **React Ecosystem**: react, react-dom, @types/react
- **UI Framework**: @radix-ui components, lucide-react icons
- **Styling**: tailwindcss, autoprefixer, postcss
- **Build Tools**: vite, @vitejs/plugin-react, typescript
- **Backend**: express, multer, drizzle-orm
- **Database**: @neondatabase/serverless, connect-pg-simple
- **Utilities**: date-fns, clsx, class-variance-authority

### Development Dependencies
- **TypeScript**: Full type safety across frontend and backend
- **ESLint/Prettier**: Code quality and formatting
- **Testing**: Selenium WebDriver for UI testing
- **Hot Reload**: Vite development server integration

### External APIs
- **Sunrise-Sunset API**: Fetches daily sunset times for Rio de Janeiro
- **PDF.js CDN**: Browser-based PDF rendering capabilities

## Deployment Strategy

### Development Environment
- **Development Server**: Vite dev server on port 5173
- **API Server**: Express server on port 5000
- **Hot Reload**: Automatic refresh on code changes
- **Proxy Configuration**: API requests proxied from frontend to backend

### Production Build
- **Frontend**: Static files built to `dist/public`
- **Backend**: Compiled TypeScript to `dist/index.js`
- **Asset Optimization**: Minified CSS, JS, and image assets
- **Environment Variables**: Database URL and configuration settings

### Offline Deployment
- **Package Creation**: Scripts for creating offline installation packages
- **Oracle Linux Support**: Specific configuration for Oracle Linux servers
- **Network Configuration**: CORS headers for network access
- **Service Installation**: Systemd service configuration

### System Requirements
- **Node.js**: Version 20+ LTS
- **Operating System**: Oracle Linux 8+, Ubuntu 20.04+, RHEL 8+
- **Database**: PostgreSQL (optional, uses in-memory storage by default)
- **Browser**: Modern browsers with PDF.js support

## Changelog
- July 2, 2025. Added emoji indicator (🍽️) for cardápio documents; Fixed military rank duplication; Completed weather translation system; Enhanced document categorization system
- July 1, 2025. Sistema BONO automático removido por problemas de renderização; Correção da duplicação de graduação dos militares
- July 1, 2025. Weather alerts system added for Rio de Janeiro monitoring and improved admin interface organization with moved maintenance tools to proper Sistema sub-tab
- July 1, 2025. Enhanced admin interface with reorganized configuration tabs and daily motivational quotes system
- June 30, 2025. Complete BONO automation system implemented with Puppeteer
- June 27, 2025. Initial setup

## Recent Updates (July 1, 2025)

### Active Weather Alerts System Implementation
- Created WeatherAlertsActive component displaying real-time weather conditions for Rio de Janeiro
- Implemented intelligent alert generation based on actual weather data (temperature, humidity, wind, precipitation)
- Alerts now appear on main screen showing current conditions: "23°C, nublado, Condições Normais"
- System generates contextual alerts for high humidity, strong winds, extreme temperatures, and severe weather
- Enhanced visual presentation with proper color coding and Portuguese localization

### BONO Automation Configuration
- Successfully configured BONO automation to start disabled by default as requested
- Backend correctly shows `"isEnabled": false` in API status endpoint
- System prevents unwanted automatic BONO downloads on startup
- Manual activation available through admin panel when needed
- Fixed default state to align with user operational requirements

### Officer Management System Enhancement
- Maintained combobox selection interface for duty officers as requested by user
- Preserved pre-registered military personnel lists (OFFICERS_DATA and MASTERS_DATA)
- Enhanced saveDutyOfficers function to construct complete names with rank and title
- System continues to save full military titles (e.g., "1º Tenente KARINE", "1º Sargento RAFAELA")
- PostgreSQL database persistence maintained for reliable data storage

### Database Storage Reliability
- Resolved TypeScript compilation errors in db-storage.ts for better code stability
- Enhanced data integrity with proper null-safe operations
- Improved error handling for database interactions
- Maintained backward compatibility while strengthening system reliability
- Optimized storage interface for consistent data access patterns

### Document Processing Improvements
- Addressed PDF character encoding issues for documents with special characters (cardápio, etc.)
- Enhanced PDF-to-image conversion system for better text rendering
- Improved cache management for processed documents
- Optimized document loading performance with proper error handling
- Maintained support for both PDF and direct image uploads

### System Administration Tools Implementation
- Added comprehensive cache clearing functionality with API endpoint `/api/clear-cache`
- Implemented system information display with browser and environment details
- Created maintenance tools section in Sistema tab with organized administrative functions
- Enhanced error handling for cache operations with detailed success/failure reporting

### Weather Data Integration
- Resolved weather data discrepancy issue reported by user
- Implemented intelligent fallback system for weather APIs
- Added wttr.in as backup weather source when OpenWeatherMap fails
- System now provides real-time accurate weather data (23°C confirmed)
- Enhanced error handling with detailed API status logging

### User Interface Localization
- Completed Portuguese translation for all weather-related text
- Fixed "overcast" translation to "nublado" in temperature display
- Enhanced weather condition translations with comprehensive dictionary
- Simplified weather alerts interface for end users
- Improved user experience with cleaner, more intuitive interface

### Admin Interface Organization
- Successfully reorganized admin panel tabs for logical workflow:
  - Documentos (primary document management)
  - Avisos (communications)
  - Militares (personnel information)
  - Sistema (technical tools and weather monitoring)
- Moved maintenance tools from Militares to Sistema tab
- Relocated weather alerts to appropriate Sistema section
- Streamlined interface by removing duplicate maintenance sections

## User Preferences

Preferred communication style: Simple, everyday language.
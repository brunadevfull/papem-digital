# Navy Display System (Sistema de Visualização da Marinha)

A comprehensive digital display system for the Brazilian Navy (Marinha do Brasil) featuring real-time document viewing, notice management, and automated PDF processing.

## 🚀 Features

- **Real-time Document Display**: Automatic cycling between PLASA and Escala documents
- **Notice Management**: Create, update, and manage operational notices
- **PDF Processing**: Automatic conversion of PDF documents to optimized images
- **Auto-scroll System**: Configurable scrolling speeds for document viewing
- **Admin Panel**: Complete administrative interface for content management
- **Responsive Design**: Works on various screen sizes and devices
- **Naval Theme**: Professional styling with Brazilian Navy branding

## 📋 System Requirements

- Node.js 20 or higher
- Modern web browser with JavaScript enabled
- PDF.js library for document processing
- 2GB+ RAM recommended for PDF processing

## 🛠️ Installation & Setup

### Quick Start

1. **Clone and Install Dependencies**
   ```bash
   git clone <repository-url>
   cd navy-display-system
   npm install
   ```

2. **Start the Application**
   ```bash
   npm run dev
   ```

3. **Access the System**
   - Main Display: http://localhost:5000
   - Admin Panel: http://localhost:5000/admin

### Environment Variables

Create a `.env` file in the root directory:

```env
# Backend Configuration
VITE_BACKEND_HOST=localhost
VITE_BACKEND_PORT=5000

# Development Settings
NODE_ENV=development
```

## 🏗️ Architecture

### Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Backend**: Express.js, Node.js
- **Routing**: Wouter (lightweight React router)
- **Data Fetching**: TanStack Query (React Query)
- **UI Components**: Radix UI + shadcn/ui
- **PDF Processing**: PDF.js
- **Storage**: In-memory storage (easily replaceable with database)

### Project Structure

```
navy-display-system/
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Main application pages
│   │   ├── context/        # React context providers
│   │   ├── hooks/          # Custom React hooks
│   │   └── utils/          # Utility functions
├── server/                 # Backend Express application
│   ├── routes.ts           # API route definitions
│   ├── storage.ts          # Data storage interface
│   └── index.ts            # Server entry point
├── shared/                 # Shared TypeScript types
│   └── schema.ts           # Data schemas and validation
├── test.js                 # Automated test suite
└── README.md              # This documentation
```

## 📚 API Documentation

### Health Check
```
GET /api/health
```
Returns system status and timestamp.

### Notices Management

#### Get All Notices
```
GET /api/notices
```
Returns array of all notices.

#### Create Notice
```
POST /api/notices
Content-Type: application/json

{
  "title": "Notice Title",
  "content": "Notice content text",
  "priority": "high|medium|low",
  "startDate": "2025-01-01T00:00:00.000Z",
  "endDate": "2025-01-02T00:00:00.000Z",
  "active": true
}
```

#### Update Notice
```
PUT /api/notices/:id
Content-Type: application/json

{
  "title": "Updated Title",
  "active": false
}
```

#### Delete Notice
```
DELETE /api/notices/:id
```

### Documents Management

#### Get All Documents
```
GET /api/documents
```
Returns array of all documents.

#### Create Document
```
POST /api/documents
Content-Type: application/json

{
  "title": "Document Title",
  "url": "/path/to/document.pdf",
  "type": "plasa|bono|escala|cardapio",
  "category": "oficial|praca", // Optional, for escala type
  "active": true
}
```

#### Update Document
```
PUT /api/documents/:id
```

#### Delete Document
```
DELETE /api/documents/:id
```

## 🧪 Testing

### Automated Test Suite

Run the comprehensive test suite:

```bash
node test.js
```

The test suite includes:

- **Health Check Tests**: Verify server connectivity
- **CRUD Operations**: Test all Create, Read, Update, Delete operations
- **Data Validation**: Verify input validation and error handling
- **Frontend Accessibility**: Check page loading and navigation
- **Error Handling**: Test 404 responses and invalid requests

### Test Coverage

- ✅ API endpoint functionality
- ✅ Data validation and schema compliance
- ✅ Error handling and status codes
- ✅ Frontend page accessibility
- ✅ CRUD operations for notices and documents

### Manual Testing

1. **Display System**:
   - Visit main page and verify document cycling
   - Check auto-scroll functionality
   - Verify notice display rotation

2. **Admin Panel**:
   - Access `/admin` and test notice creation
   - Upload test documents
   - Verify document management functions

## 🎮 Usage Guide

### Main Display Page

The main display automatically:
- Cycles between active PLASA and Escala documents
- Shows current notices in rotation
- Auto-scrolls through multi-page documents
- Displays current time and date

### Admin Panel Features

#### Notice Management
1. Navigate to `/admin`
2. Use the "Avisos" tab
3. Create new notices with title, content, priority
4. Set start/end dates for automatic scheduling
5. Toggle active status to show/hide notices

#### Document Management
1. Use the "Documentos" tab
2. Upload PDF files or provide URLs
3. Set document type (PLASA, Escala, etc.)
4. Configure document category if applicable
5. Activate/deactivate documents for display

#### Display Settings
- **Document Interval**: Time between document switches
- **Scroll Speed**: Slow, Normal, or Fast scrolling
- **Auto-restart Delay**: Pause time before restarting scroll

## 🔧 Configuration

### Display Settings

Modify these settings in the admin panel:

- **Document Alternate Interval**: 10-60 seconds
- **Scroll Speed**: 
  - Slow: 0.5x speed
  - Normal: 1x speed  
  - Fast: 2x speed
- **Auto Restart Delay**: 1-10 seconds

### PDF Processing

The system automatically:
- Converts PDF pages to optimized JPEG images
- Scales images to fit display dimensions
- Caches converted images for performance
- Handles multi-page documents with auto-scroll

## 🛡️ Security Features

- **Input Validation**: All API inputs validated with Zod schemas
- **Type Safety**: Full TypeScript implementation
- **Error Handling**: Comprehensive error catching and logging
- **Client/Server Separation**: Clear separation of concerns
- **CORS Protection**: Configured for secure cross-origin requests

## 🔍 Troubleshooting

### Common Issues

1. **Server Won't Start**
   ```bash
   # Check if port 5000 is available
   lsof -i :5000
   
   # Kill any conflicting processes
   kill -9 <PID>
   ```

2. **PDF Not Loading**
   - Verify PDF file is accessible
   - Check browser console for PDF.js errors
   - Ensure file size is under 50MB

3. **Notice Not Appearing**
   - Check notice is marked as active
   - Verify start/end dates are current
   - Check browser console for API errors

### Debug Mode

Enable detailed logging by setting:
```javascript
localStorage.setItem('debug', 'true');
```

### Log Files

Check browser console for:
- PDF processing status
- API request/response logs
- Component rendering information
- Error messages and stack traces

## 📈 Performance Optimization

### PDF Processing
- Images cached in browser localStorage
- Progressive loading for large documents
- Optimized JPEG compression (85% quality)
- Maximum image dimensions: 1024px width

### Memory Management
- Automatic cleanup of blob URLs
- Canvas memory recycling
- Efficient image caching strategy

## 🔄 Deployment

### Production Build

1. **Build the application**:
   ```bash
   npm run build
   ```

2. **Start production server**:
   ```bash
   NODE_ENV=production npm start
   ```

3. **Configure reverse proxy** (nginx example):
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       
       location / {
           proxy_pass http://localhost:5000;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
       }
   }
   ```

### Environment Configuration

Production environment variables:
```env
NODE_ENV=production
PORT=5000
VITE_BACKEND_HOST=your-domain.com
VITE_BACKEND_PORT=80
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature-name`
3. Run tests: `node test.js`
4. Commit changes: `git commit -am 'Add feature'`
5. Push branch: `git push origin feature-name`
6. Submit pull request

### Code Standards

- Use TypeScript for all new code
- Follow existing naming conventions
- Add JSDoc comments for public functions
- Ensure all tests pass before submitting
- Follow Prettier formatting rules

## 📞 Support

For technical support or questions:

1. Check this documentation first
2. Run the automated test suite
3. Check browser console for errors
4. Review server logs for API issues

## 📄 License

This project is developed for the Brazilian Navy (Marinha do Brasil) internal use.

---

**Marinha do Brasil - Sistema de Visualização Operacional**
*Professional digital display solution for naval operations*
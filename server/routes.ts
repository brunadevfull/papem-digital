import express, { type Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertNoticeSchema, insertDocumentSchema } from "@shared/schema";
import { z } from "zod";
import multer from "multer";
import path from "path";
import fs from "fs";

export async function registerRoutes(app: Express): Promise<Server> {
  // Create uploads directory if it doesn't exist
  const uploadsDir = path.join(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  // Multer configuration for file uploads
  const storage_config = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, 'document-' + uniqueSuffix + '-' + file.originalname);
    }
  });

  const upload = multer({
    storage: storage_config,
    limits: {
      fileSize: 50 * 1024 * 1024, // 50MB limit
    },
    fileFilter: (req, file, cb) => {
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
      if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('INVALID_FILE: Only PDF and image files are allowed'));
      }
    }
  });

  // File upload route
  app.post('/api/upload-pdf', upload.single('pdf'), (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ 
          success: false, 
          error: 'MISSING_FILE: No file uploaded' 
        });
      }

      const { title, type, category } = req.body;
      
      if (!title || !type) {
        return res.status(400).json({ 
          success: false, 
          error: 'MISSING_FIELDS: Title and type are required' 
        });
      }

      const fileUrl = `/uploads/${req.file.filename}`;
      
      res.json({
        success: true,
        data: {
          filename: req.file.filename,
          originalname: req.file.originalname,
          size: req.file.size,
          url: fileUrl,
          title: title,
          type: type,
          category: category || undefined
        }
      });
    } catch (error) {
      console.error('Upload error:', error);
      res.status(500).json({ 
        success: false, 
        error: 'SERVER_ERROR: Failed to process upload' 
      });
    }
  });

  // Serve uploaded files with comprehensive CORS headers
// Serve uploaded files with comprehensive CORS headers
  app.use('/uploads', (req, res, next) => {
    console.log(`📁 Serving file: ${req.path} to ${req.get('Origin') || 'direct'}`);
    
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control, Pragma, Expires, If-Modified-Since, If-None-Match, Range');
    res.header('Access-Control-Expose-Headers', 'Content-Length, Content-Range, Accept-Ranges, Content-Type, Cache-Control, Last-Modified, ETag, Accept-Ranges');
    res.header('Cache-Control', 'public, max-age=31536000');
    res.header('Access-Control-Max-Age', '86400');
    
    if (req.method === 'OPTIONS') {
      console.log(`✅ CORS Preflight for file: ${req.path}`);
      res.sendStatus(200);
    } else {
      next();
    }
  });
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads'), {
    setHeaders: (res, filePath) => {
      console.log(`📄 Setting headers for: ${path.basename(filePath)}`);
      res.set('Cross-Origin-Resource-Policy', 'cross-origin');
      res.set('Cross-Origin-Embedder-Policy', 'unsafe-none');
    }
  }));
  // Notice routes
  app.get('/api/notices', async (req, res) => {
    try {
      const notices = await storage.getNotices();
      res.json({ success: true, notices });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to fetch notices' });
    }
  });

  app.post('/api/notices', async (req, res) => {
    try {
      const validatedData = insertNoticeSchema.parse(req.body);
      const notice = await storage.createNotice(validatedData);
      res.json({ success: true, notice });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ success: false, error: 'Invalid data', details: error.errors });
      } else {
        res.status(500).json({ success: false, error: 'Failed to create notice' });
      }
    }
  });

  app.put('/api/notices/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const existingNotice = await storage.getNotice(id);
      
      if (!existingNotice) {
        return res.status(404).json({ error: 'Notice not found' });
      }

      const updatedNotice = await storage.updateNotice({ ...existingNotice, ...req.body });
      res.json(updatedNotice);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update notice' });
    }
  });

  app.delete('/api/notices/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteNotice(id);
      
      if (!deleted) {
        return res.status(404).json({ error: 'Notice not found' });
      }

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete notice' });
    }
  });

  // Document routes
  app.get('/api/documents', async (req, res) => {
    try {
      const documents = await storage.getDocuments();
      res.json(documents);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch documents' });
    }
  });

  app.post('/api/documents', async (req, res) => {
    try {
      const validatedData = insertDocumentSchema.parse(req.body);
      const document = await storage.createDocument(validatedData);
      res.json(document);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: 'Invalid data', details: error.errors });
      } else {
        res.status(500).json({ error: 'Failed to create document' });
      }
    }
  });

  app.put('/api/documents/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const existingDoc = await storage.getDocument(id);
      
      if (!existingDoc) {
        return res.status(404).json({ error: 'Document not found' });
      }

      const updatedDoc = await storage.updateDocument({ ...existingDoc, ...req.body });
      res.json(updatedDoc);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update document' });
    }
  });

  app.delete('/api/documents/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteDocument(id);
      
      if (!deleted) {
        return res.status(404).json({ error: 'Document not found' });
      }

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete document' });
    }
  });

  // List uploaded PDFs route
  app.get('/api/list-pdfs', (req, res) => {
    try {
      const uploadsDir = path.join(process.cwd(), 'uploads');
      
      if (!fs.existsSync(uploadsDir)) {
        return res.json({ documents: [] });
      }

      const files = fs.readdirSync(uploadsDir);
      const documents = files
        .filter(file => file.endsWith('.pdf') || file.endsWith('.jpg') || file.endsWith('.png'))
        .map(file => {
          const filePath = path.join(uploadsDir, file);
          const stats = fs.statSync(filePath);
          
          return {
            filename: file,
            url: `/uploads/${file}`,
            created: stats.birthtime,
            size: stats.size,
            type: file.toLowerCase().includes('plasa') ? 'plasa' : 'escala'
          };
        })
        .sort((a, b) => b.created.getTime() - a.created.getTime());

      res.json({ documents });
    } catch (error) {
      console.error('Error listing PDFs:', error);
      res.status(500).json({ error: 'Failed to list documents' });
    }
  });

  // Check escala image cache route
  app.get('/api/check-escala-image/:id', (req, res) => {
    try {
      const { id } = req.params;
      // For now, just return that cache doesn't exist
      // This can be enhanced later with actual cache checking
      res.json({ exists: false, id });
    } catch (error) {
      res.status(500).json({ error: 'Failed to check cache' });
    }
  });

  // Delete uploaded file route
  app.delete('/api/delete-pdf/:filename', (req, res) => {
    try {
      const { filename } = req.params;
      const filePath = path.join(process.cwd(), 'uploads', filename);
      
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`🗑️ Arquivo deletado: ${filename}`);
        res.json({ success: true, message: 'File deleted successfully' });
      } else {
        res.status(404).json({ success: false, error: 'File not found' });
      }
    } catch (error) {
      console.error('Delete error:', error);
      res.status(500).json({ success: false, error: 'Failed to delete file' });
    }
  });

  // Health check
// PDF Proxy route to handle CORS issues
  app.get('/api/proxy-pdf', async (req, res) => {
    try {
      const { url } = req.query;
      
      if (!url || typeof url !== 'string') {
        return res.status(400).json({ error: 'URL parameter is required' });
      }
      
      console.log(`🔄 Proxying PDF request: ${url}`);
      
      if (url.includes('/uploads/')) {
        const filename = url.split('/uploads/')[1];
        const filePath = path.join(process.cwd(), 'uploads', filename);
        
        if (fs.existsSync(filePath)) {
          console.log(`📁 Serving local file via proxy: ${filename}`);
          
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Content-Type', 'application/pdf');
          res.setHeader('Cache-Control', 'public, max-age=31536000');
          
          return res.sendFile(filePath);
        }
      }
      
      res.status(404).json({ error: 'File not found' });
      
    } catch (error) {
      console.error('Proxy error:', error);
      res.status(500).json({ error: 'Proxy request failed' });
    }
  });

  // Network status and system info
  app.get('/api/status', (req, res) => {
    const clientIP = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'];
    res.json({ 
      status: 'online', 
      timestamp: new Date().toISOString(),
      version: '2.0',
      clientIP: clientIP,
      serverHost: req.get('host'),
      origin: req.get('origin') || 'direct',
      userAgent: req.get('user-agent'),
      method: req.method,
      cors: 'enabled',
      environment: process.env.NODE_ENV || 'development'
    });
  });

  app.get('/api/health', (req, res) => {
    res.json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      message: 'Marinha do Brasil - Sistema funcionando corretamente'
    });
  });

  const httpServer = createServer(app);

  return httpServer;
}

import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertNoticeSchema, insertDocumentSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Notice routes
  app.get('/api/notices', async (req, res) => {
    try {
      const notices = await storage.getNotices();
      res.json(notices);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch notices' });
    }
  });

  app.post('/api/notices', async (req, res) => {
    try {
      const validatedData = insertNoticeSchema.parse(req.body);
      const notice = await storage.createNotice(validatedData);
      res.json(notice);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: 'Invalid data', details: error.errors });
      } else {
        res.status(500).json({ error: 'Failed to create notice' });
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

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  const httpServer = createServer(app);

  return httpServer;
}

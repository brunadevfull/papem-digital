import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertNoticeSchema, insertDocumentSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Notice routes
  app.get("/api/notices", async (req, res) => {
    try {
      const notices = await storage.getNotices();
      const activeNotices = notices.filter(notice => notice.active);
      res.json({
        success: true,
        notices,
        total: notices.length,
        active: activeNotices.length
      });
    } catch (error) {
      console.error("Error fetching notices:", error);
      res.status(500).json({ error: "Failed to fetch notices" });
    }
  });

  app.post("/api/notices", async (req, res) => {
    try {
      const validatedData = insertNoticeSchema.parse(req.body);
      const notice = await storage.createNotice(validatedData);
      res.json({ success: true, notice });
    } catch (error) {
      console.error("Error creating notice:", error);
      res.status(400).json({ error: "Failed to create notice" });
    }
  });

  app.put("/api/notices/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const existingNotice = await storage.getNotice(id);
      if (!existingNotice) {
        return res.status(404).json({ error: "Notice not found" });
      }
      
      const updatedNotice = { ...existingNotice, ...req.body };
      const result = await storage.updateNotice(updatedNotice);
      res.json({ success: true, notice: result });
    } catch (error) {
      console.error("Error updating notice:", error);
      res.status(400).json({ error: "Failed to update notice" });
    }
  });

  app.delete("/api/notices/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteNotice(id);
      if (!success) {
        return res.status(404).json({ error: "Notice not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting notice:", error);
      res.status(500).json({ error: "Failed to delete notice" });
    }
  });

  // Document routes
  app.get("/api/documents", async (req, res) => {
    try {
      const documents = await storage.getDocuments();
      res.json({ success: true, documents });
    } catch (error) {
      console.error("Error fetching documents:", error);
      res.status(500).json({ error: "Failed to fetch documents" });
    }
  });

  app.post("/api/documents", async (req, res) => {
    try {
      const validatedData = insertDocumentSchema.parse(req.body);
      const document = await storage.createDocument(validatedData);
      res.json({ success: true, document });
    } catch (error) {
      console.error("Error creating document:", error);
      res.status(400).json({ error: "Failed to create document" });
    }
  });

  app.put("/api/documents/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const existingDocument = await storage.getDocument(id);
      if (!existingDocument) {
        return res.status(404).json({ error: "Document not found" });
      }
      
      const updatedDocument = { ...existingDocument, ...req.body };
      const result = await storage.updateDocument(updatedDocument);
      res.json({ success: true, document: result });
    } catch (error) {
      console.error("Error updating document:", error);
      res.status(400).json({ error: "Failed to update document" });
    }
  });

  app.delete("/api/documents/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteDocument(id);
      if (!success) {
        return res.status(404).json({ error: "Document not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting document:", error);
      res.status(500).json({ error: "Failed to delete document" });
    }
  });

  // Health check route
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  const httpServer = createServer(app);
  return httpServer;
}

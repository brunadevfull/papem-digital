import { users, notices, documents, type User, type InsertUser, type Notice, type InsertNotice, type PDFDocument, type InsertDocument } from "@shared/schema";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Notice methods
  getNotices(): Promise<Notice[]>;
  getNotice(id: number): Promise<Notice | undefined>;
  createNotice(notice: InsertNotice): Promise<Notice>;
  updateNotice(notice: Notice): Promise<Notice>;
  deleteNotice(id: number): Promise<boolean>;
  
  // Document methods
  getDocuments(): Promise<PDFDocument[]>;
  getDocument(id: number): Promise<PDFDocument | undefined>;
  createDocument(document: InsertDocument): Promise<PDFDocument>;
  updateDocument(document: PDFDocument): Promise<PDFDocument>;
  deleteDocument(id: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private notices: Map<number, Notice>;
  private documents: Map<number, PDFDocument>;
  private currentUserId: number;
  private currentNoticeId: number;
  private currentDocumentId: number;

  constructor() {
    this.users = new Map();
    this.notices = new Map();
    this.documents = new Map();
    this.currentUserId = 1;
    this.currentNoticeId = 1;
    this.currentDocumentId = 1;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Notice methods
  async getNotices(): Promise<Notice[]> {
    return Array.from(this.notices.values());
  }

  async getNotice(id: number): Promise<Notice | undefined> {
    return this.notices.get(id);
  }

  async createNotice(insertNotice: InsertNotice): Promise<Notice> {
    const id = this.currentNoticeId++;
    const now = new Date();
    const notice: Notice = { 
      id,
      title: insertNotice.title,
      content: insertNotice.content,
      priority: insertNotice.priority as "high" | "medium" | "low",
      startDate: insertNotice.startDate,
      endDate: insertNotice.endDate,
      active: insertNotice.active ?? true,
      createdAt: now, 
      updatedAt: now
    };
    this.notices.set(id, notice);
    return notice;
  }

  async updateNotice(notice: Notice): Promise<Notice> {
    const updatedNotice = { ...notice, updatedAt: new Date() };
    this.notices.set(notice.id, updatedNotice);
    return updatedNotice;
  }

  async deleteNotice(id: number): Promise<boolean> {
    return this.notices.delete(id);
  }

  // Document methods
  async getDocuments(): Promise<PDFDocument[]> {
    return Array.from(this.documents.values());
  }

  async getDocument(id: number): Promise<PDFDocument | undefined> {
    return this.documents.get(id);
  }

  async createDocument(insertDocument: InsertDocument): Promise<PDFDocument> {
    const id = this.currentDocumentId++;
    const document: PDFDocument = { 
      id,
      title: insertDocument.title,
      url: insertDocument.url,
      type: insertDocument.type as "plasa" | "bono" | "escala" | "cardapio",
      category: insertDocument.category as "oficial" | "praca" | null,
      active: insertDocument.active ?? true,
      uploadDate: new Date()
    };
    this.documents.set(id, document);
    return document;
  }

  async updateDocument(document: PDFDocument): Promise<PDFDocument> {
    this.documents.set(document.id, document);
    return document;
  }

  async deleteDocument(id: number): Promise<boolean> {
    return this.documents.delete(id);
  }
}

export const storage = new MemStorage();

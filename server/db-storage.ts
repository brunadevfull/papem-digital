import { eq } from "drizzle-orm";
import { db } from "./db";
import { 
  users, notices, documents, dutyOfficers, 
  type User, type InsertUser, 
  type Notice, type InsertNotice,
  type PDFDocument, type InsertDocument,
  type DutyOfficers, type InsertDutyOfficers
} from "@shared/schema";
import { IStorage } from "./storage";

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  // Notice methods
  async getNotices(): Promise<Notice[]> {
    return await db.select().from(notices);
  }

  async getNotice(id: number): Promise<Notice | undefined> {
    const [notice] = await db.select().from(notices).where(eq(notices.id, id));
    return notice || undefined;
  }

  async createNotice(insertNotice: InsertNotice): Promise<Notice> {
    const [notice] = await db
      .insert(notices)
      .values(insertNotice)
      .returning();
    return notice;
  }

  async updateNotice(notice: Notice): Promise<Notice> {
    const [updated] = await db
      .update(notices)
      .set({
        title: notice.title,
        content: notice.content,
        priority: notice.priority,
        startDate: notice.startDate,
        endDate: notice.endDate,
        active: notice.active,
        updatedAt: new Date()
      })
      .where(eq(notices.id, notice.id))
      .returning();
    return updated;
  }

  async deleteNotice(id: number): Promise<boolean> {
    const result = await db.delete(notices).where(eq(notices.id, id));
    return result.rowCount > 0;
  }

  // Document methods
  async getDocuments(): Promise<PDFDocument[]> {
    return await db.select().from(documents);
  }

  async getDocument(id: number): Promise<PDFDocument | undefined> {
    const [document] = await db.select().from(documents).where(eq(documents.id, id));
    return document || undefined;
  }

  async createDocument(insertDocument: InsertDocument): Promise<PDFDocument> {
    const [document] = await db
      .insert(documents)
      .values(insertDocument)
      .returning();
    return document;
  }

  async updateDocument(document: PDFDocument): Promise<PDFDocument> {
    const [updated] = await db
      .update(documents)
      .set({
        title: document.title,
        url: document.url,
        type: document.type,
        category: document.category,
        active: document.active
      })
      .where(eq(documents.id, document.id))
      .returning();
    return updated;
  }

  async deleteDocument(id: number): Promise<boolean> {
    const result = await db.delete(documents).where(eq(documents.id, id));
    return result.rowCount > 0;
  }

  // Duty Officers methods - Estrutura simplificada
  async getDutyOfficers(): Promise<DutyOfficers | null> {
    const [officers] = await db.select().from(dutyOfficers).limit(1);
    return officers || null;
  }

  async updateDutyOfficers(officers: InsertDutyOfficers): Promise<DutyOfficers> {
    // Primeiro, tentar atualizar se existe
    const existing = await this.getDutyOfficers();
    
    if (existing) {
      const [updated] = await db
        .update(dutyOfficers)
        .set({
          officerName: officers.officerName,
          masterName: officers.masterName,
          updatedAt: new Date()
        })
        .where(eq(dutyOfficers.id, existing.id))
        .returning();
      return updated;
    } else {
      // Se não existe, criar novo
      const [created] = await db
        .insert(dutyOfficers)
        .values({
          officerName: officers.officerName,
          masterName: officers.masterName,
          updatedAt: new Date()
        })
        .returning();
      return created;
    }
  }
}
import fs from 'fs/promises';
import path from 'path';
import { type User, type InsertUser, type Notice, type InsertNotice, type PDFDocument, type InsertDocument, type DutyOfficer, type InsertDutyOfficer } from '@shared/schema';
import { IStorage } from './storage';

const DATA_DIR = 'data';

export class SimpleFileStorage implements IStorage {
  private async ensureDirectory() {
    try {
      await fs.mkdir(DATA_DIR, { recursive: true });
    } catch (error) {
      // Directory already exists
    }
  }

  private async readJsonFile(filename: string): Promise<any> {
    try {
      await this.ensureDirectory();
      const filePath = path.join(DATA_DIR, filename);
      const data = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      return null;
    }
  }

  private async writeJsonFile(filename: string, data: any): Promise<void> {
    try {
      await this.ensureDirectory();
      const filePath = path.join(DATA_DIR, filename);
      await fs.writeFile(filePath, JSON.stringify(data, null, 2));
      console.log(`📄 Arquivo salvo: ${filename}`);
    } catch (error) {
      console.error(`❌ Erro ao salvar ${filename}:`, error);
    }
  }

  // Users methods
  async getUser(id: number): Promise<User | undefined> {
    const data = await this.readJsonFile('users.json') || { items: [], currentId: 1 };
    return data.items.find((user: any) => user.id === id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const data = await this.readJsonFile('users.json') || { items: [], currentId: 1 };
    return data.items.find((user: any) => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const data = await this.readJsonFile('users.json') || { items: [], currentId: 1 };
    const user = { ...insertUser, id: data.currentId };
    data.items.push(user);
    data.currentId++;
    await this.writeJsonFile('users.json', data);
    return user as User;
  }

  // Notices methods
  async getNotices(): Promise<Notice[]> {
    const data = await this.readJsonFile('notices.json') || { items: [], currentId: 1 };
    return data.items.map((notice: any) => ({
      ...notice,
      startDate: new Date(notice.startDate),
      endDate: new Date(notice.endDate),
      createdAt: notice.createdAt ? new Date(notice.createdAt) : null,
      updatedAt: notice.updatedAt ? new Date(notice.updatedAt) : null
    }));
  }

  async getNotice(id: number): Promise<Notice | undefined> {
    const notices = await this.getNotices();
    return notices.find(notice => notice.id === id);
  }

  async createNotice(insertNotice: InsertNotice): Promise<Notice> {
    const data = await this.readJsonFile('notices.json') || { items: [], currentId: 1 };
    const notice = {
      ...insertNotice,
      id: data.currentId,
      active: insertNotice.active ?? true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    data.items.push(notice);
    data.currentId++;
    await this.writeJsonFile('notices.json', data);
    
    // Return with proper Date objects
    return {
      ...notice,
      startDate: new Date(notice.startDate),
      endDate: new Date(notice.endDate),
      createdAt: new Date(notice.createdAt),
      updatedAt: new Date(notice.updatedAt)
    } as Notice;
  }

  async updateNotice(notice: Notice): Promise<Notice> {
    const data = await this.readJsonFile('notices.json') || { items: [], currentId: 1 };
    const index = data.items.findIndex((n: any) => n.id === notice.id);
    
    if (index === -1) throw new Error('Notice not found');
    
    const updatedNotice = {
      ...notice,
      startDate: notice.startDate.toISOString(),
      endDate: notice.endDate.toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    data.items[index] = updatedNotice;
    await this.writeJsonFile('notices.json', data);
    
    return {
      ...updatedNotice,
      startDate: new Date(updatedNotice.startDate),
      endDate: new Date(updatedNotice.endDate),
      createdAt: notice.createdAt,
      updatedAt: new Date(updatedNotice.updatedAt)
    } as Notice;
  }

  async deleteNotice(id: number): Promise<boolean> {
    const data = await this.readJsonFile('notices.json') || { items: [], currentId: 1 };
    const initialLength = data.items.length;
    data.items = data.items.filter((n: any) => n.id !== id);
    
    if (data.items.length < initialLength) {
      await this.writeJsonFile('notices.json', data);
      return true;
    }
    return false;
  }

  // Documents methods
  async getDocuments(): Promise<PDFDocument[]> {
    const data = await this.readJsonFile('documents.json') || { items: [], currentId: 1 };
    return data.items.map((doc: any) => ({
      ...doc,
      uploadDate: doc.uploadDate ? new Date(doc.uploadDate) : null
    }));
  }

  async getDocument(id: number): Promise<PDFDocument | undefined> {
    const documents = await this.getDocuments();
    return documents.find(doc => doc.id === id);
  }

  async createDocument(insertDocument: InsertDocument): Promise<PDFDocument> {
    const data = await this.readJsonFile('documents.json') || { items: [], currentId: 1 };
    const document = {
      ...insertDocument,
      id: data.currentId,
      active: insertDocument.active ?? true,
      uploadDate: new Date().toISOString()
    };
    data.items.push(document);
    data.currentId++;
    await this.writeJsonFile('documents.json', data);
    
    return {
      ...document,
      uploadDate: new Date(document.uploadDate)
    } as PDFDocument;
  }

  async updateDocument(document: PDFDocument): Promise<PDFDocument> {
    const data = await this.readJsonFile('documents.json') || { items: [], currentId: 1 };
    const index = data.items.findIndex((d: any) => d.id === document.id);
    
    if (index === -1) throw new Error('Document not found');
    
    const updatedDocument = {
      ...document,
      uploadDate: document.uploadDate ? document.uploadDate.toISOString() : null
    };
    
    data.items[index] = updatedDocument;
    await this.writeJsonFile('documents.json', data);
    
    return {
      ...updatedDocument,
      uploadDate: updatedDocument.uploadDate ? new Date(updatedDocument.uploadDate) : null
    } as PDFDocument;
  }

  async deleteDocument(id: number): Promise<boolean> {
    const data = await this.readJsonFile('documents.json') || { items: [], currentId: 1 };
    const initialLength = data.items.length;
    data.items = data.items.filter((d: any) => d.id !== id);
    
    if (data.items.length < initialLength) {
      await this.writeJsonFile('documents.json', data);
      return true;
    }
    return false;
  }

  // Duty Officers methods
  async getDutyOfficers(): Promise<DutyOfficer[]> {
    let data = await this.readJsonFile('duty-officers.json');
    
    // Initialize with default officers if file doesn't exist
    if (!data) {
      data = {
        items: [
          {
            id: 1,
            name: "Silva",
            role: "oficial_dia",
            rank: "1TEN",
            active: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          {
            id: 2,
            name: "Santos",
            role: "contramestre_pernoite", 
            rank: "1SG",
            active: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        ],
        currentId: 3
      };
      await this.writeJsonFile('duty-officers.json', data);
    }
    
    return data.items.map((officer: any) => ({
      ...officer,
      createdAt: officer.createdAt ? new Date(officer.createdAt) : null,
      updatedAt: officer.updatedAt ? new Date(officer.updatedAt) : null
    }));
  }

  async getDutyOfficer(id: number): Promise<DutyOfficer | undefined> {
    const officers = await this.getDutyOfficers();
    return officers.find(officer => officer.id === id);
  }

  async createDutyOfficer(insertOfficer: InsertDutyOfficer): Promise<DutyOfficer> {
    const data = await this.readJsonFile('duty-officers.json') || { items: [], currentId: 1 };
    const officer = {
      ...insertOfficer,
      id: data.currentId,
      active: insertOfficer.active ?? true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    data.items.push(officer);
    data.currentId++;
    await this.writeJsonFile('duty-officers.json', data);
    
    return {
      ...officer,
      createdAt: new Date(officer.createdAt),
      updatedAt: new Date(officer.updatedAt)
    } as DutyOfficer;
  }

  async updateDutyOfficer(officer: DutyOfficer): Promise<DutyOfficer> {
    const data = await this.readJsonFile('duty-officers.json') || { items: [], currentId: 1 };
    const index = data.items.findIndex((o: any) => o.id === officer.id);
    
    if (index === -1) throw new Error('Duty officer not found');
    
    const updatedOfficer = {
      ...officer,
      updatedAt: new Date().toISOString(),
      createdAt: officer.createdAt ? officer.createdAt.toISOString() : null
    };
    
    data.items[index] = updatedOfficer;
    await this.writeJsonFile('duty-officers.json', data);
    
    return {
      ...updatedOfficer,
      createdAt: updatedOfficer.createdAt ? new Date(updatedOfficer.createdAt) : null,
      updatedAt: new Date(updatedOfficer.updatedAt)
    } as DutyOfficer;
  }

  async deleteDutyOfficer(id: number): Promise<boolean> {
    const data = await this.readJsonFile('duty-officers.json') || { items: [], currentId: 1 };
    const initialLength = data.items.length;
    data.items = data.items.filter((o: any) => o.id !== id);
    
    if (data.items.length < initialLength) {
      await this.writeJsonFile('duty-officers.json', data);
      return true;
    }
    return false;
  }
}
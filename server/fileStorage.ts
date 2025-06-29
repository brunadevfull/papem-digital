import fs from 'fs/promises';
import path from 'path';
import { type User, type InsertUser, type Notice, type InsertNotice, type PDFDocument, type InsertDocument, type DutyOfficer, type InsertDutyOfficer } from '@shared/schema';

const DATA_DIR = 'data';
const NOTICES_FILE = path.join(DATA_DIR, 'notices.json');
const DUTY_OFFICERS_FILE = path.join(DATA_DIR, 'duty-officers.json');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const DOCUMENTS_FILE = path.join(DATA_DIR, 'documents.json');

interface FileData<T> {
  items: T[];
  currentId: number;
}

export class FileStorage {
  constructor() {
    this.initializeFiles();
  }

  private async initializeFiles() {
    try {
      // Criar diretório data se não existir
      await fs.mkdir(DATA_DIR, { recursive: true });
      
      // Verificar e criar arquivos se não existirem
      await this.ensureFileExists(NOTICES_FILE, { items: [], currentId: 1 });
      await this.ensureFileExists(USERS_FILE, { items: [], currentId: 1 });
      await this.ensureFileExists(DOCUMENTS_FILE, { items: [], currentId: 1 });
      
      // Inicializar militares padrão se arquivo não existir
      const defaultOfficers: DutyOfficer[] = [
        {
          id: 1,
          name: "Silva",
          role: "oficial_dia",
          rank: "1TEN",
          active: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 2,
          name: "Santos", 
          role: "contramestre_pernoite",
          rank: "1SG",
          active: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];
      
      await this.ensureFileExists(DUTY_OFFICERS_FILE, { 
        items: defaultOfficers, 
        currentId: 3 
      });
      
      console.log('📁 FileStorage inicializado com sucesso');
    } catch (error) {
      console.error('❌ Erro ao inicializar FileStorage:', error);
    }
  }

  private async ensureFileExists<T>(filePath: string, defaultData: FileData<T>) {
    try {
      await fs.access(filePath);
    } catch {
      await fs.writeFile(filePath, JSON.stringify(defaultData, null, 2));
      console.log(`📄 Arquivo criado: ${filePath}`);
    }
  }

  private async readFile<T>(filePath: string): Promise<FileData<T>> {
    try {
      const data = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      console.error(`❌ Erro ao ler arquivo ${filePath}:`, error);
      return { items: [], currentId: 1 };
    }
  }

  private async writeFile<T>(filePath: string, data: FileData<T>) {
    try {
      await fs.writeFile(filePath, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error(`❌ Erro ao escrever arquivo ${filePath}:`, error);
    }
  }

  // Users methods
  async getUser(id: number): Promise<User | undefined> {
    const data = await this.readFile<User>(USERS_FILE);
    return data.items.find(user => user.id === id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const data = await this.readFile<User>(USERS_FILE);
    return data.items.find(user => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const data = await this.readFile<User>(USERS_FILE);
    const user: User = { ...insertUser, id: data.currentId };
    data.items.push(user);
    data.currentId++;
    await this.writeFile(USERS_FILE, data);
    return user;
  }

  // Notices methods
  async getNotices(): Promise<Notice[]> {
    const data = await this.readFile<Notice>(NOTICES_FILE);
    return data.items.map(notice => ({
      ...notice,
      startDate: new Date(notice.startDate),
      endDate: new Date(notice.endDate),
      priority: notice.priority as "high" | "medium" | "low",
      createdAt: notice.createdAt ? new Date(notice.createdAt) : null,
      updatedAt: notice.updatedAt ? new Date(notice.updatedAt) : null
    }));
  }

  async getNotice(id: number): Promise<Notice | undefined> {
    const data = await this.readFile<Notice>(NOTICES_FILE);
    const notice = data.items.find(n => n.id === id);
    if (!notice) return undefined;
    
    return {
      ...notice,
      startDate: new Date(notice.startDate),
      endDate: new Date(notice.endDate),
      priority: notice.priority as "high" | "medium" | "low",
      createdAt: notice.createdAt ? new Date(notice.createdAt) : null,
      updatedAt: notice.updatedAt ? new Date(notice.updatedAt) : null
    };
  }

  async createNotice(insertNotice: InsertNotice): Promise<Notice> {
    const data = await this.readFile<Notice>(NOTICES_FILE);
    const notice: Notice = {
      ...insertNotice,
      id: data.currentId,
      active: insertNotice.active ?? true,
      priority: insertNotice.priority as "high" | "medium" | "low",
      createdAt: new Date(),
      updatedAt: new Date()
    };
    data.items.push(notice);
    data.currentId++;
    await this.writeFile(NOTICES_FILE, data);
    return notice;
  }

  async updateNotice(notice: Notice): Promise<Notice> {
    const data = await this.readFile<Notice>(NOTICES_FILE);
    const index = data.items.findIndex(n => n.id === notice.id);
    if (index === -1) throw new Error('Notice not found');
    
    const updatedNotice = { ...notice, updatedAt: new Date() };
    data.items[index] = updatedNotice;
    await this.writeFile(NOTICES_FILE, data);
    return updatedNotice;
  }

  async deleteNotice(id: number): Promise<boolean> {
    const data = await this.readFile<Notice>(NOTICES_FILE);
    const initialLength = data.items.length;
    data.items = data.items.filter(n => n.id !== id);
    
    if (data.items.length < initialLength) {
      await this.writeFile(NOTICES_FILE, data);
      return true;
    }
    return false;
  }

  // Documents methods
  async getDocuments(): Promise<PDFDocument[]> {
    const data = await this.readFile<PDFDocument>(DOCUMENTS_FILE);
    return data.items.map(doc => ({
      ...doc,
      type: doc.type as "plasa" | "bono" | "escala" | "cardapio",
      uploadDate: doc.uploadDate ? new Date(doc.uploadDate) : null
    }));
  }

  async getDocument(id: number): Promise<PDFDocument | undefined> {
    const data = await this.readFile<PDFDocument>(DOCUMENTS_FILE);
    const doc = data.items.find(d => d.id === id);
    if (!doc) return undefined;
    
    return {
      ...doc,
      type: doc.type as "plasa" | "bono" | "escala" | "cardapio",
      uploadDate: doc.uploadDate ? new Date(doc.uploadDate) : null
    };
  }

  async createDocument(insertDocument: InsertDocument): Promise<PDFDocument> {
    const data = await this.readFile<PDFDocument>(DOCUMENTS_FILE);
    const document: PDFDocument = {
      ...insertDocument,
      id: data.currentId,
      active: insertDocument.active ?? true,
      type: insertDocument.type as "plasa" | "bono" | "escala" | "cardapio",
      uploadDate: new Date()
    };
    data.items.push(document);
    data.currentId++;
    await this.writeFile(DOCUMENTS_FILE, data);
    return document;
  }

  async updateDocument(document: PDFDocument): Promise<PDFDocument> {
    const data = await this.readFile<PDFDocument>(DOCUMENTS_FILE);
    const index = data.items.findIndex(d => d.id === document.id);
    if (index === -1) throw new Error('Document not found');
    
    data.items[index] = document;
    await this.writeFile(DOCUMENTS_FILE, data);
    return document;
  }

  async deleteDocument(id: number): Promise<boolean> {
    const data = await this.readFile<PDFDocument>(DOCUMENTS_FILE);
    const initialLength = data.items.length;
    data.items = data.items.filter(d => d.id !== id);
    
    if (data.items.length < initialLength) {
      await this.writeFile(DOCUMENTS_FILE, data);
      return true;
    }
    return false;
  }

  // Duty Officers methods
  async getDutyOfficers(): Promise<DutyOfficer[]> {
    const data = await this.readFile<DutyOfficer>(DUTY_OFFICERS_FILE);
    return data.items.map(officer => ({
      ...officer,
      createdAt: officer.createdAt ? new Date(officer.createdAt) : null,
      updatedAt: officer.updatedAt ? new Date(officer.updatedAt) : null
    }));
  }

  async getDutyOfficer(id: number): Promise<DutyOfficer | undefined> {
    const data = await this.readFile<DutyOfficer>(DUTY_OFFICERS_FILE);
    const officer = data.items.find(o => o.id === id);
    if (!officer) return undefined;
    
    return {
      ...officer,
      createdAt: officer.createdAt ? new Date(officer.createdAt) : null,
      updatedAt: officer.updatedAt ? new Date(officer.updatedAt) : null
    };
  }

  async createDutyOfficer(insertOfficer: InsertDutyOfficer): Promise<DutyOfficer> {
    const data = await this.readFile<DutyOfficer>(DUTY_OFFICERS_FILE);
    const officer: DutyOfficer = {
      ...insertOfficer,
      id: data.currentId,
      active: insertOfficer.active ?? true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    data.items.push(officer);
    data.currentId++;
    await this.writeFile(DUTY_OFFICERS_FILE, data);
    return officer;
  }

  async updateDutyOfficer(officer: DutyOfficer): Promise<DutyOfficer> {
    const data = await this.readFile<DutyOfficer>(DUTY_OFFICERS_FILE);
    const index = data.items.findIndex(o => o.id === officer.id);
    if (index === -1) throw new Error('Duty officer not found');
    
    const updatedOfficer = { ...officer, updatedAt: new Date() };
    data.items[index] = updatedOfficer;
    await this.writeFile(DUTY_OFFICERS_FILE, data);
    return updatedOfficer;
  }

  async deleteDutyOfficer(id: number): Promise<boolean> {
    const data = await this.readFile<DutyOfficer>(DUTY_OFFICERS_FILE);
    const initialLength = data.items.length;
    data.items = data.items.filter(o => o.id !== id);
    
    if (data.items.length < initialLength) {
      await this.writeFile(DUTY_OFFICERS_FILE, data);
      return true;
    }
    return false;
  }
}
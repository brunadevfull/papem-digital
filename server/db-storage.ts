// server/db-storage.ts - VERSÃO CORRIGIDA PARA TIPOS
import { Pool } from 'pg';
import { IStorage } from "./storage";
import { 
  type User, type InsertUser, 
  type Notice, type InsertNotice,
  type PDFDocument, type InsertDocument,
  type DutyOfficers, type InsertDutyOfficers,
  type MilitaryPersonnel, type InsertMilitaryPersonnel
} from "@shared/schema";

export class DatabaseStorage implements IStorage {
  private pool: Pool;

  constructor() {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL must be set in environment variables');
    }

    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: false, // Para desenvolvimento local
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    console.log('🔗 PostgreSQL DatabaseStorage initialized');
    console.log('📊 Connected to:', process.env.DATABASE_URL.replace(/:[^:]*@/, ':***@'));
  }

  // ===== USERS =====
  async getUser(id: number): Promise<User | undefined> {
    const result = await this.pool.query('SELECT * FROM users WHERE id = $1', [id]);
    const row = result.rows[0];
    return row ? {
      id: row.id,
      username: row.username,
      password: row.password
    } : undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await this.pool.query('SELECT * FROM users WHERE username = $1', [username]);
    const row = result.rows[0];
    return row ? {
      id: row.id,
      username: row.username,
      password: row.password
    } : undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await this.pool.query(
      'INSERT INTO users (username, password) VALUES ($1, $2) RETURNING *',
      [insertUser.username, insertUser.password]
    );
    const row = result.rows[0];
    return {
      id: row.id,
      username: row.username,
      password: row.password
    };
  }

  // ===== NOTICES =====
  async getNotices(): Promise<Notice[]> {
    console.log('📢 PostgreSQL: Buscando avisos...');
    
    try {
      const result = await this.pool.query('SELECT * FROM notices ORDER BY created_at DESC');
      
      const notices: Notice[] = result.rows.map(row => ({
        id: row.id,
        title: row.title,
        content: row.content,
        priority: row.priority as "high" | "medium" | "low",
        startDate: new Date(row.start_date),
        endDate: new Date(row.end_date),
        active: row.active,
        createdAt: row.created_at ? new Date(row.created_at) : null,
        updatedAt: row.updated_at ? new Date(row.updated_at) : null
      }));

      console.log(`📢 PostgreSQL: ${notices.length} avisos encontrados`);
      return notices;
      
    } catch (error) {
      console.error('❌ PostgreSQL: Erro ao buscar avisos:', error);
      throw error;
    }
  }

  async getNotice(id: number): Promise<Notice | undefined> {
    try {
      const result = await this.pool.query('SELECT * FROM notices WHERE id = $1', [id]);
      const row = result.rows[0];
      
      return row ? {
        id: row.id,
        title: row.title,
        content: row.content,
        priority: row.priority as "high" | "medium" | "low",
        startDate: new Date(row.start_date),
        endDate: new Date(row.end_date),
        active: row.active,
        createdAt: row.created_at ? new Date(row.created_at) : null,
        updatedAt: row.updated_at ? new Date(row.updated_at) : null
      } : undefined;
      
    } catch (error) {
      console.error(`❌ PostgreSQL: Erro ao buscar aviso ${id}:`, error);
      return undefined;
    }
  }

  async createNotice(insertNotice: InsertNotice): Promise<Notice> {
    console.log('📢 PostgreSQL: Criando aviso:', insertNotice.title);
    
    try {
      const result = await this.pool.query(
        `INSERT INTO notices (title, content, priority, start_date, end_date, active) 
         VALUES ($1, $2, $3, $4, $5, $6) 
         RETURNING *`,
        [
          insertNotice.title,
          insertNotice.content,
          insertNotice.priority,
          insertNotice.startDate,
          insertNotice.endDate,
          insertNotice.active
        ]
      );

      const row = result.rows[0];
      const notice: Notice = {
        id: row.id,
        title: row.title,
        content: row.content,
        priority: row.priority as "high" | "medium" | "low",
        startDate: new Date(row.start_date),
        endDate: new Date(row.end_date),
        active: row.active,
        createdAt: row.created_at ? new Date(row.created_at) : null,
        updatedAt: row.updated_at ? new Date(row.updated_at) : null
      };

      console.log(`✅ PostgreSQL: Aviso ${notice.id} criado com sucesso`);
      return notice;
      
    } catch (error) {
      console.error('❌ PostgreSQL: Erro ao criar aviso:', error);
      throw error;
    }
  }

  async updateNotice(notice: Notice): Promise<Notice> {
    console.log(`📝 PostgreSQL: Atualizando aviso ${notice.id}`);
    
    try {
      const result = await this.pool.query(
        `UPDATE notices 
         SET title = $1, content = $2, priority = $3, start_date = $4, end_date = $5, active = $6, updated_at = NOW()
         WHERE id = $7 
         RETURNING *`,
        [
          notice.title,
          notice.content,
          notice.priority,
          notice.startDate,
          notice.endDate,
          notice.active,
          notice.id
        ]
      );

      if (result.rows.length === 0) {
        throw new Error(`Notice with id ${notice.id} not found`);
      }

      const row = result.rows[0];
      const updated: Notice = {
        id: row.id,
        title: row.title,
        content: row.content,
        priority: row.priority as "high" | "medium" | "low",
        startDate: new Date(row.start_date),
        endDate: new Date(row.end_date),
        active: row.active,
        createdAt: row.created_at ? new Date(row.created_at) : null,
        updatedAt: row.updated_at ? new Date(row.updated_at) : null
      };

      console.log(`✅ PostgreSQL: Aviso ${notice.id} atualizado`);
      return updated;
      
    } catch (error) {
      console.error(`❌ PostgreSQL: Erro ao atualizar aviso ${notice.id}:`, error);
      throw error;
    }
  }

  async deleteNotice(id: number): Promise<boolean> {
    console.log(`🗑️ PostgreSQL: Deletando aviso ${id}`);
    
    try {
      const result = await this.pool.query('DELETE FROM notices WHERE id = $1', [id]);
      const deleted = (result.rowCount || 0) > 0;
      
      if (deleted) {
        console.log(`✅ PostgreSQL: Aviso ${id} deletado`);
      } else {
        console.log(`⚠️ PostgreSQL: Aviso ${id} não encontrado`);
      }
      
      return deleted;
      
    } catch (error) {
      console.error(`❌ PostgreSQL: Erro ao deletar aviso ${id}:`, error);
      return false;
    }
  }

  // ===== DOCUMENTS =====
  async getDocuments(): Promise<PDFDocument[]> {
    try {
      const result = await this.pool.query('SELECT * FROM documents ORDER BY upload_date DESC');
      
      return result.rows.map(row => ({
        id: row.id,
        title: row.title,
        url: row.url,
        type: row.type as "plasa" | "bono" | "escala" | "cardapio",
        category: row.category as "oficial" | "praca" | null,
        active: row.active,
        uploadDate: new Date(row.upload_date)
      }));
    } catch (error) {
      console.error('❌ PostgreSQL: Erro ao buscar documentos:', error);
      return [];
    }
  }

  async getDocument(id: number): Promise<PDFDocument | undefined> {
    try {
      const result = await this.pool.query('SELECT * FROM documents WHERE id = $1', [id]);
      const row = result.rows[0];
      
      return row ? {
        id: row.id,
        title: row.title,
        url: row.url,
        type: row.type as "plasa" | "bono" | "escala" | "cardapio",
        category: row.category as "oficial" | "praca" | null,
        active: row.active,
        uploadDate: new Date(row.upload_date)
      } : undefined;
    } catch (error) {
      console.error(`❌ PostgreSQL: Erro ao buscar documento ${id}:`, error);
      return undefined;
    }
  }

  async createDocument(insertDocument: InsertDocument): Promise<PDFDocument> {
    try {
      const result = await this.pool.query(
        `INSERT INTO documents (title, url, type, category, active) 
         VALUES ($1, $2, $3, $4, $5) 
         RETURNING *`,
        [
          insertDocument.title,
          insertDocument.url,
          insertDocument.type,
          insertDocument.category,
          insertDocument.active
        ]
      );

      const row = result.rows[0];
      return {
        id: row.id,
        title: row.title,
        url: row.url,
        type: row.type as "plasa" | "bono" | "escala" | "cardapio",
        category: row.category as "oficial" | "praca" | null,
        active: row.active,
        uploadDate: new Date(row.upload_date)
      };
    } catch (error) {
      console.error('❌ PostgreSQL: Erro ao criar documento:', error);
      throw error;
    }
  }

  async updateDocument(document: PDFDocument): Promise<PDFDocument> {
    try {
      const result = await this.pool.query(
        `UPDATE documents 
         SET title = $1, url = $2, type = $3, category = $4, active = $5
         WHERE id = $6 
         RETURNING *`,
        [
          document.title,
          document.url,
          document.type,
          document.category,
          document.active,
          document.id
        ]
      );

      const row = result.rows[0];
      return {
        id: row.id,
        title: row.title,
        url: row.url,
        type: row.type as "plasa" | "bono" | "escala" | "cardapio",
        category: row.category as "oficial" | "praca" | null,
        active: row.active,
        uploadDate: new Date(row.upload_date)
      };
    } catch (error) {
      console.error(`❌ PostgreSQL: Erro ao atualizar documento ${document.id}:`, error);
      throw error;
    }
  }

  async deleteDocument(id: number): Promise<boolean> {
    try {
      const result = await this.pool.query('DELETE FROM documents WHERE id = $1', [id]);
      return (result.rowCount || 0) > 0;
    } catch (error) {
      console.error(`❌ PostgreSQL: Erro ao deletar documento ${id}:`, error);
      return false;
    }
  }

  // ===== DUTY OFFICERS =====
  async getDutyOfficers(): Promise<DutyOfficers | null> {
    try {
      const result = await this.pool.query('SELECT * FROM duty_officers ORDER BY id DESC LIMIT 1');
      const row = result.rows[0];
      
      return row ? {
        id: row.id,
        officerName: row.officer_name,
        masterName: row.master_name,
        updatedAt: row.updated_at ? new Date(row.updated_at) : new Date()
      } : null;
    } catch (error) {
      console.error('❌ PostgreSQL: Erro ao buscar oficiais de serviço:', error);
      return null;
    }
  }

  async updateDutyOfficers(officers: InsertDutyOfficers): Promise<DutyOfficers> {
    try {
      // Verificar se já existe um registro
      const existing = await this.getDutyOfficers();
      
      if (existing) {
        // Atualizar existente
        const result = await this.pool.query(
          `UPDATE duty_officers 
           SET officer_name = $1, master_name = $2, updated_at = NOW()
           WHERE id = $3 
           RETURNING *`,
          [officers.officerName, officers.masterName, existing.id]
        );
        
        const row = result.rows[0];
        return {
          id: row.id,
          officerName: row.officer_name,
          masterName: row.master_name,
          updatedAt: new Date(row.updated_at)
        };
      } else {
        // Criar novo
        const result = await this.pool.query(
          `INSERT INTO duty_officers (officer_name, master_name) 
           VALUES ($1, $2) 
           RETURNING *`,
          [officers.officerName, officers.masterName]
        );
        
        const row = result.rows[0];
        return {
          id: row.id,
          officerName: row.officer_name,
          masterName: row.master_name,
          updatedAt: new Date(row.updated_at)
        };
      }
    } catch (error) {
      console.error('❌ PostgreSQL: Erro ao atualizar oficiais de serviço:', error);
      throw error;
    }
  }

  // ===== MILITARY PERSONNEL (implementação básica) =====
async getMilitaryPersonnel(): Promise<MilitaryPersonnel[]> {
    try {
      console.log('🎖️ PostgreSQL: Buscando pessoal militar...');
      const result = await this.pool.query('SELECT * FROM military_personnel WHERE active = true ORDER BY type, rank, name');
      
      const personnel = result.rows.map(row => ({
        id: row.id,
        name: row.name,
        type: row.type as "officer" | "master",
        rank: row.rank as "1t" | "2t" | "ct" | "cc" | "cf" | "1sg" | "2sg" | "3sg",
        specialty: row.specialty || null,
        fullRankName: row.full_rank_name,
        active: row.active,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at)
      }));

      console.log(`🎖️ PostgreSQL: ${personnel.length} militares encontrados`);
      return personnel;
    } catch (error) {
      console.error('❌ PostgreSQL: Erro ao buscar militares:', error);
      return [];
    }
  }


 
  async getMilitaryPersonnelByType(type: "officer" | "master"): Promise<MilitaryPersonnel[]> {
    try {
      console.log(`🎖️ PostgreSQL: Buscando ${type}s...`);
      const result = await this.pool.query(
        'SELECT * FROM military_personnel WHERE type = $1 AND active = true ORDER BY rank, name',
        [type]
      );
      
      const personnel = result.rows.map(row => ({
        id: row.id,
        name: row.name,
        type: row.type as "officer" | "master",
        rank: row.rank as "1t" | "2t" | "ct" | "cc" | "cf" | "1sg" | "2sg" | "3sg",
        specialty: row.specialty || null,
        fullRankName: row.full_rank_name,
        active: row.active,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at)
      }));

      console.log(`🎖️ PostgreSQL: ${personnel.length} ${type}s encontrados`);
      return personnel;
    } catch (error) {
      console.error(`❌ PostgreSQL: Erro ao buscar ${type}s:`, error);
      return [];
    }
  }

 async createMilitaryPersonnel(personnel: InsertMilitaryPersonnel): Promise<MilitaryPersonnel> {
    try {
      console.log(`🎖️ PostgreSQL: Criando ${personnel.type}:`, personnel.name);
      
      const result = await this.pool.query(
        `INSERT INTO military_personnel (name, type, rank, specialty, full_rank_name, active) 
         VALUES ($1, $2, $3, $4, $5, $6) 
         RETURNING *`,
        [
          personnel.name,
          personnel.type,
          personnel.rank,
          personnel.specialty,
          personnel.fullRankName,
          personnel.active !== false
        ]
      );

      const row = result.rows[0];
      const created = {
        id: row.id,
        name: row.name,
        type: row.type as "officer" | "master",
        rank: row.rank as "1t" | "2t" | "ct" | "cc" | "cf" | "1sg" | "2sg" | "3sg",
        specialty: row.specialty || null,
        fullRankName: row.full_rank_name,
        active: row.active,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at)
      };

      console.log(`✅ PostgreSQL: ${personnel.type} ${created.id} criado`);
      return created;
    } catch (error) {
      console.error('❌ PostgreSQL: Erro ao criar militar:', error);
      throw error;
    }
  }

 async updateMilitaryPersonnel(personnel: MilitaryPersonnel): Promise<MilitaryPersonnel> {
    try {
      console.log(`🎖️ PostgreSQL: Atualizando ${personnel.type} ${personnel.id}`);
      
      const result = await this.pool.query(
        `UPDATE military_personnel 
         SET name = $1, type = $2, rank = $3, specialty = $4, full_rank_name = $5, active = $6, updated_at = NOW()
         WHERE id = $7 
         RETURNING *`,
        [
          personnel.name,
          personnel.type,
          personnel.rank,
          personnel.specialty,
          personnel.fullRankName,
          personnel.active,
          personnel.id
        ]
      );

      if (result.rows.length === 0) {
        throw new Error(`Military personnel with id ${personnel.id} not found`);
      }

      const row = result.rows[0];
      const updated = {
        id: row.id,
        name: row.name,
        type: row.type as "officer" | "master",
        rank: row.rank as "1t" | "2t" | "ct" | "cc" | "cf" | "1sg" | "2sg" | "3sg",
        specialty: row.specialty || null,
        fullRankName: row.full_rank_name,
        active: row.active,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at)
      };

      console.log(`✅ PostgreSQL: ${personnel.type} ${personnel.id} atualizado`);
      return updated;
    } catch (error) {
      console.error(`❌ PostgreSQL: Erro ao atualizar militar ${personnel.id}:`, error);
      throw error;
    }
  }

   async deleteMilitaryPersonnel(id: number): Promise<boolean> {
    try {
      console.log(`🎖️ PostgreSQL: Removendo militar ${id}`);
      
      // Soft delete - marcar como inativo em vez de deletar
      const result = await this.pool.query(
        'UPDATE military_personnel SET active = false, updated_at = NOW() WHERE id = $1',
        [id]
      );
      
      const deleted = (result.rowCount || 0) > 0;
      
      if (deleted) {
        console.log(`✅ PostgreSQL: Militar ${id} removido (soft delete)`);
      } else {
        console.log(`⚠️ PostgreSQL: Militar ${id} não encontrado`);
      }
      
      return deleted;
    } catch (error) {
      console.error(`❌ PostgreSQL: Erro ao remover militar ${id}:`, error);
      return false;
    }
  }
}
import express, { type Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertNoticeSchema, insertDocumentSchema, insertDutyOfficerSchema } from "@shared/schema";
import { z } from "zod";
import multer from "multer";
import path from "path";
import fs from "fs";
import { promisify } from "util";
import { exec } from "child_process";

// Promisify fs functions for async/await
const writeFile = promisify(fs.writeFile);
const readFile = promisify(fs.readFile);
const mkdir = promisify(fs.mkdir);
const readdir = promisify(fs.readdir);
const unlink = promisify(fs.unlink);
const access = promisify(fs.access);
const execPromise = promisify(exec);

export async function registerRoutes(app: Express): Promise<Server> {
  // Create uploads directory if it doesn't exist
  app.delete('/api/delete-pdf/:filename', (req, res) => {
  console.log(`🗑️ DELETE recebido: ${req.params.filename}`);
  
  const filename = req.params.filename;
  const decodedFilename = decodeURIComponent(filename);
  const filePath = path.join(process.cwd(), 'uploads', decodedFilename);
  const exists = fs.existsSync(filePath);
  
  console.log(`📁 Decoded: ${decodedFilename}`);
  console.log(`📁 Existe: ${exists}`);
  
  if (exists) {
    try {
      fs.unlinkSync(filePath);
      console.log(`✅ DELETADO: ${decodedFilename}`);
      
      res.json({ 
        success: true, 
        message: 'Arquivo deletado com sucesso!', 
        filename: decodedFilename
      });
    } catch (error) {
      console.log(`❌ ERRO ao deletar: ${error}`);
      
      res.status(500).json({ 
        success: false, 
        error: 'Erro ao deletar arquivo'
      });
    }
  } else {
    console.log(`❌ Arquivo não encontrado: ${decodedFilename}`);
    
    res.status(404).json({ 
      success: false, 
      error: 'Arquivo não encontrado'
    });
  }
});


  const uploadsDir = path.join(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  // 🔥 NOVO: Criar diretórios de cache
  const plasaPagesDir = path.join(uploadsDir, 'plasa-pages');
  const escalaCacheDir = path.join(uploadsDir, 'escala-cache');
  
  [plasaPagesDir, escalaCacheDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`📁 Diretório criado: ${dir}`);
    }
  });

  // ================================================================
// 🛠️ FUNÇÃO para sanitizar nomes de arquivo
// ================================================================

const sanitizeFilename = (filename: string): string => {
  return filename
    // Remover acentos e caracteres especiais
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    // Substituir espaços por underscores
    .replace(/\s+/g, '_')
    // Substituir caracteres problemáticos
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    // Remover underscores múltiplos
    .replace(/_+/g, '_')
    // Remover underscores no início e fim
    .replace(/^_+|_+$/g, '')
    // Garantir que não fica vazio
    || 'document';
};

 const storage_config = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    
    // ✅ SANITIZAR o nome original
    const originalName = file.originalname;
    const sanitizedName = sanitizeFilename(originalName);
    
    const finalFilename = 'document-' + uniqueSuffix + '-' + sanitizedName;
    
    console.log(`📁 Upload filename transformation:`);
    console.log(`   Original: "${originalName}"`);
    console.log(`   Sanitized: "${sanitizedName}"`);
    console.log(`   Final: "${finalFilename}"`);
    
    cb(null, finalFilename);
  }
});

// TESTE SIMPLES - ADICIONE NO INÍCIO DO ROUTES.TS


const upload = multer({
  storage: storage_config,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    console.log(`📄 File upload attempt: "${file.originalname}" (${file.mimetype})`);
    
    const allowedTypes = [
      'application/pdf', 
      'image/jpeg', 
      'image/png', 
      'image/jpg',
      'image/gif',
      'image/webp'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      console.log(`✅ File type accepted: ${file.mimetype}`);
      cb(null, true);
    } else {
      console.log(`❌ File type rejected: ${file.mimetype}`);
      cb(new Error('INVALID_FILE: Only PDF and image files are allowed'));
    }
  }
});

  // 🔥 NOVO: Multer para cache (memória)
  const cacheUpload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB limit para imagens de cache
    },
    fileFilter: (req, file, cb) => {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
      if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('INVALID_CACHE_FILE: Only image files are allowed for cache'));
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
    
    console.log(`✅ File uploaded successfully:`);
    console.log(`   Original name: "${req.file.originalname}"`);
    console.log(`   Saved as: "${req.file.filename}"`);
    console.log(`   Size: ${Math.round(req.file.size / 1024)}KB`);
    console.log(`   URL: ${fileUrl}`);
    
    res.json({
      success: true,
      data: {
        filename: req.file.filename,
        originalname: req.file.originalname,
        sanitizedName: req.file.filename.replace(/^document-\d+-\d+-/, ''),
        size: req.file.size,
        url: fileUrl,
        title: title,
        type: type,
        category: category || undefined
      }
    });
  } catch (error) {
    console.error('❌ Upload error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'SERVER_ERROR: Failed to process upload' 
    });
  }
});

  // 🔥 NOVO: 1. ENDPOINT - Upload de página do PLASA
  app.post('/api/upload-plasa-page', cacheUpload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ 
          success: false, 
          error: 'Nenhum arquivo enviado' 
        });
      }

      const pageNumber = req.body.pageNumber;
      const documentId = req.body.documentId || 'default';
      
      // Criar nome do arquivo baseado no documento e página
      const filename = `${documentId}-page-${pageNumber}.jpg`;
      const filePath = path.join(plasaPagesDir, filename);
      const fileUrl = `/uploads/plasa-pages/${filename}`;

      // Salvar arquivo
      await writeFile(filePath, req.file.buffer);

      console.log(`💾 Página PLASA ${pageNumber} salva: ${filename}`);

      res.json({
        success: true,
        data: {
          url: fileUrl,
          filename: filename,
          pageNumber: parseInt(pageNumber),
          documentId: documentId
        }
      });

    } catch (error) {
      console.error('❌ Erro ao salvar página PLASA:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Erro ao salvar página no servidor' 
      });
    }
  });

  // 🔥 NOVO: 2. ENDPOINT - Verificar páginas existentes do PLASA
  app.post('/api/check-plasa-pages', async (req, res) => {
    try {
      const { totalPages, documentId } = req.body;
      
      if (!totalPages || !documentId) {
        return res.status(400).json({
          success: false,
          error: 'totalPages e documentId são obrigatórios'
        });
      }

      // Verificar se todas as páginas existem
      const pageUrls = [];
      let allExist = true;

      for (let i = 1; i <= totalPages; i++) {
        const filename = `${documentId}-page-${i}.jpg`;
        const filePath = path.join(plasaPagesDir, filename);
        
        try {
          await access(filePath);
          pageUrls.push(`/uploads/plasa-pages/${filename}`);
        } catch {
          allExist = false;
          break;
        }
      }

      console.log(`🔍 Verificação PLASA ${documentId}: ${allExist ? 'todas' : 'algumas'} páginas existem`);

      res.json({
        success: true,
        allPagesExist: allExist,
        pageUrls: allExist ? pageUrls : [],
        totalPages: allExist ? totalPages : 0,
        documentId: documentId
      });

    } catch (error) {
      console.error('❌ Erro ao verificar páginas PLASA:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Erro ao verificar páginas' 
      });
    }
  });

  // 🔥 NOVO: 3. ENDPOINT - Salvar cache de escala
  app.post('/api/save-escala-cache', async (req, res) => {
    try {
      const { escalId, imageData } = req.body;
      
      if (!escalId || !imageData) {
        return res.status(400).json({
          success: false,
          error: 'escalId e imageData são obrigatórios'
        });
      }

      // Converter base64 para arquivo
      const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');
      
      const filename = `${escalId}.jpg`;
      const filePath = path.join(escalaCacheDir, filename);
      const fileUrl = `/uploads/escala-cache/${filename}`;

      await writeFile(filePath, buffer);

      console.log(`💾 Cache de escala salvo: ${filename}`);

      res.json({
        success: true,
        data: {
          url: fileUrl,
          filename: filename,
          escalId: escalId
        }
      });

    } catch (error) {
      console.error('❌ Erro ao salvar cache de escala:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Erro ao salvar cache de escala' 
      });
    }
  });

  // 🔥 NOVO: 4. ENDPOINT - Verificar cache de escala
  app.get('/api/check-escala-cache/:escalId', async (req, res) => {
    try {
      const { escalId } = req.params;
      
      const filename = `${escalId}.jpg`;
      const filePath = path.join(escalaCacheDir, filename);
      const fileUrl = `/uploads/escala-cache/${filename}`;

      try {
        await access(filePath);
        
        console.log(`✅ Cache de escala encontrado: ${filename}`);
        
        res.json({
          success: true,
          cached: true,
          url: fileUrl,
          escalId: escalId
        });
      } catch {
        res.json({
          success: true,
          cached: false,
          escalId: escalId
        });
      }

    } catch (error) {
      console.error('❌ Erro ao verificar cache de escala:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Erro ao verificar cache' 
      });
    }
  });

  // 🔥 NOVO: 5. ENDPOINT - Limpar cache do PLASA
  app.delete('/api/clear-plasa-pages', async (req, res) => {
    try {
      let deletedCount = 0;
      
      try {
        const files = await readdir(plasaPagesDir);
        
        for (const file of files) {
          if (file.endsWith('.jpg')) {
            const filePath = path.join(plasaPagesDir, file);
            await unlink(filePath);
            deletedCount++;
          }
        }
      } catch (err) {
        // Diretório não existe ou está vazio
      }

      console.log(`🧹 Cache PLASA limpo: ${deletedCount} arquivos removidos`);

      res.json({
        success: true,
        deletedCount: deletedCount,
        message: `${deletedCount} páginas PLASA removidas do cache`
      });

    } catch (error) {
      console.error('❌ Erro ao limpar cache PLASA:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Erro ao limpar cache' 
      });
    }
  });

  // 🔥 NOVO: 6. ENDPOINT - Limpar cache de escalas
  app.delete('/api/clear-escala-cache', async (req, res) => {
    try {
      let deletedCount = 0;
      
      try {
        const files = await readdir(escalaCacheDir);
        
        for (const file of files) {
          if (file.endsWith('.jpg')) {
            const filePath = path.join(escalaCacheDir, file);
            await unlink(filePath);
            deletedCount++;
          }
        }
      } catch (err) {
        // Diretório não existe ou está vazio
      }

      console.log(`🧹 Cache de escalas limpo: ${deletedCount} arquivos removidos`);

      res.json({
        success: true,
        deletedCount: deletedCount,
        message: `${deletedCount} caches de escala removidos`
      });

    } catch (error) {
      console.error('❌ Erro ao limpar cache de escalas:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Erro ao limpar cache de escalas' 
      });
    }
  });

  // 🔥 NOVO: 7. ENDPOINT - Status do cache
  app.get('/api/cache-status', async (req, res) => {
    try {
      let plasaCount = 0;
      let escalaCount = 0;

      // Contar arquivos PLASA
      try {
        const plasaFiles = await readdir(plasaPagesDir);
        plasaCount = plasaFiles.filter(f => f.endsWith('.jpg')).length;
      } catch {
        // Diretório não existe
      }

      // Contar arquivos de escala
      try {
        const escalaFiles = await readdir(escalaCacheDir);
        escalaCount = escalaFiles.filter(f => f.endsWith('.jpg')).length;
      } catch {
        // Diretório não existe
      }

      res.json({
        success: true,
        cache: {
          plasa: {
            count: plasaCount,
            directory: '/uploads/plasa-pages/'
          },
          escala: {
            count: escalaCount,
            directory: '/uploads/escala-cache/'
          },
          total: plasaCount + escalaCount
        },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('❌ Erro ao verificar status do cache:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Erro ao verificar status do cache' 
      });
    }
  });

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

  /// ✅ CORREÇÃO: Notice routes com melhor tratamento de erro
  app.get('/api/notices', async (req, res) => {
    try {
      console.log('📢 GET /api/notices - Buscando avisos...');
      const notices = await storage.getNotices();
      console.log(`📢 Encontrados ${notices.length} avisos`);
      
      res.json({ 
        success: true, 
        notices: notices,
        count: notices.length,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('❌ Erro ao buscar avisos:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch notices',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

 // ✅ CORREÇÃO: POST notices com validação melhorada
  app.post('/api/notices', async (req, res) => {
    try {
      console.log('📢 POST /api/notices - Dados recebidos:', req.body);
      
      // ✅ Validação manual dos campos obrigatórios primeiro
      const { title, content, priority, startDate, endDate, active } = req.body;
      
      if (!title || typeof title !== 'string' || title.trim() === '') {
        return res.status(400).json({ 
          success: false, 
          error: 'VALIDATION_ERROR: Title is required and must be a non-empty string',
          field: 'title',
          received: title
        });
      }
      
      if (!content || typeof content !== 'string' || content.trim() === '') {
        return res.status(400).json({ 
          success: false, 
          error: 'VALIDATION_ERROR: Content is required and must be a non-empty string',
          field: 'content',
          received: content
        });
      }
      
      if (!priority || !['high', 'medium', 'low'].includes(priority)) {
        return res.status(400).json({ 
          success: false, 
          error: 'VALIDATION_ERROR: Priority must be high, medium, or low',
          field: 'priority',
          received: priority
        });
      }
      
      // ✅ Validação de datas melhorada
      let parsedStartDate: Date;
      let parsedEndDate: Date;
      
      try {
        parsedStartDate = new Date(startDate);
        if (isNaN(parsedStartDate.getTime())) {
          throw new Error('Invalid start date');
        }
      } catch (error) {
        return res.status(400).json({ 
          success: false, 
          error: 'VALIDATION_ERROR: Invalid start date format',
          field: 'startDate',
          received: startDate
        });
      }
      
      try {
        parsedEndDate = new Date(endDate);
        if (isNaN(parsedEndDate.getTime())) {
          throw new Error('Invalid end date');
        }
      } catch (error) {
        return res.status(400).json({ 
          success: false, 
          error: 'VALIDATION_ERROR: Invalid end date format',
          field: 'endDate',
          received: endDate
        });
      }
      
      // ✅ Verificar se a data de início é anterior à data de fim
      if (parsedStartDate >= parsedEndDate) {
        return res.status(400).json({ 
          success: false, 
          error: 'VALIDATION_ERROR: Start date must be before end date',
          startDate: parsedStartDate.toISOString(),
          endDate: parsedEndDate.toISOString()
        });
      }
      
      // ✅ Criar objeto validado manualmente
      const validatedData = {
        title: title.trim(),
        content: content.trim(),
        priority: priority as "high" | "medium" | "low",
        startDate: parsedStartDate,
        endDate: parsedEndDate,
        active: active !== false // Default para true se não especificado
      };
      
      console.log('📢 Dados validados:', validatedData);
      
      // ✅ Tentar criar o aviso
      const notice = await storage.createNotice(validatedData);
      console.log('✅ Aviso criado com sucesso:', notice);
      
      res.json({ 
        success: true, 
        notice: notice,
        message: 'Notice created successfully'
      });
      
    } catch (error) {
      console.error('❌ Erro ao criar aviso:', error);
      
      if (error instanceof z.ZodError) {
        console.error('❌ Erro de validação Zod:', error.errors);
        res.status(400).json({ 
          success: false, 
          error: 'VALIDATION_ERROR: Invalid data format', 
          details: error.errors,
          zodError: true
        });
      } else {
        res.status(500).json({ 
          success: false, 
          error: 'SERVER_ERROR: Failed to create notice',
          details: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  });

// ✅ CORREÇÃO: PUT notices com validação
  app.put('/api/notices/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      console.log(`📝 PUT /api/notices/${id} - Atualizando aviso...`);
      
      if (isNaN(id)) {
        return res.status(400).json({ 
          success: false,
          error: 'VALIDATION_ERROR: Invalid notice ID',
          receivedId: req.params.id
        });
      }
      
      const existingNotice = await storage.getNotice(id);
      
      if (!existingNotice) {
        return res.status(404).json({ 
          success: false,
          error: 'NOT_FOUND: Notice not found',
          id: id
        });
      }

      // ✅ Validar dados de atualização
      const updateData = { ...req.body };
      
      // Converter datas se necessário
      if (updateData.startDate) {
        updateData.startDate = new Date(updateData.startDate);
      }
      if (updateData.endDate) {
        updateData.endDate = new Date(updateData.endDate);
      }

      const updatedNotice = await storage.updateNotice({ 
        ...existingNotice, 
        ...updateData,
        id: id // Garantir que o ID não mude
      });
      
      console.log('✅ Aviso atualizado:', updatedNotice);
      
      res.json({
        success: true,
        notice: updatedNotice,
        message: 'Notice updated successfully'
      });
    } catch (error) {
      console.error(`❌ Erro ao atualizar aviso ${req.params.id}:`, error);
      res.status(500).json({ 
        success: false,
        error: 'SERVER_ERROR: Failed to update notice',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // ✅ CORREÇÃO: DELETE notices
  app.delete('/api/notices/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      console.log(`🗑️ DELETE /api/notices/${id} - Deletando aviso...`);
      
      if (isNaN(id)) {
        return res.status(400).json({ 
          success: false,
          error: 'VALIDATION_ERROR: Invalid notice ID',
          receivedId: req.params.id
        });
      }
      
      const deleted = await storage.deleteNotice(id);
      
      if (!deleted) {
        return res.status(404).json({ 
          success: false,
          error: 'NOT_FOUND: Notice not found',
          id: id
        });
      }

      console.log(`✅ Aviso ${id} deletado com sucesso`);
      
      res.json({ 
        success: true,
        message: 'Notice deleted successfully',
        deletedId: id
      });
    } catch (error) {
      console.error(`❌ Erro ao deletar aviso ${req.params.id}:`, error);
      res.status(500).json({ 
        success: false,
        error: 'SERVER_ERROR: Failed to delete notice',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
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

  // ✅ ATUALIZADO: Check escala image cache route (agora funcional)
  app.get('/api/check-escala-image/:id', async (req, res) => {
    try {
      const { id } = req.params;
      
      const filename = `${id}.jpg`;
      const filePath = path.join(escalaCacheDir, filename);
      const fileUrl = `/uploads/escala-cache/${filename}`;

      try {
        await access(filePath);
        res.json({ 
          exists: true, 
          id, 
          url: fileUrl,
          cached: true
        });
      } catch {
        res.json({ 
          exists: false, 
          id,
          cached: false
        });
      }
    } catch (error) {
      res.status(500).json({ error: 'Failed to check cache' });
    }
  });

  /* Delete uploaded file route
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
*/
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

  // ===== DUTY OFFICERS ROUTES =====
  
  // GET all duty officers
  app.get('/api/duty-officers', async (req, res) => {
    try {
      console.log('🪖 GET /api/duty-officers - Buscando militares de serviço...');
      const officers = await storage.getDutyOfficers();
      console.log(`✅ Encontrados ${officers.length} militares de serviço`);
      res.json(officers);
    } catch (error) {
      console.error('❌ Erro ao buscar militares de serviço:', error);
      res.status(500).json({ 
        error: 'Failed to get duty officers',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // POST create duty officer
  app.post('/api/duty-officers', async (req, res) => {
    try {
      console.log('🪖 POST /api/duty-officers - Criando militar de serviço...');
      const validatedData = insertDutyOfficerSchema.parse(req.body);
      const officer = await storage.createDutyOfficer(validatedData);
      console.log('✅ Militar de serviço criado:', officer);
      res.json(officer);
    } catch (error) {
      console.error('❌ Erro ao criar militar de serviço:', error);
      res.status(500).json({ 
        error: 'Failed to create duty officer',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // PUT update duty officer
  app.put('/api/duty-officers/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      console.log(`🪖 PUT /api/duty-officers/${id} - Atualizando militar de serviço...`);
      
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid officer ID' });
      }

      const existingOfficer = await storage.getDutyOfficer(id);
      if (!existingOfficer) {
        return res.status(404).json({ error: 'Duty officer not found' });
      }

      const updateData = req.body;
      const updatedOfficer = await storage.updateDutyOfficer({ 
        ...existingOfficer, 
        ...updateData,
        id: id
      });
      
      console.log('✅ Militar de serviço atualizado:', updatedOfficer);
      res.json(updatedOfficer);
    } catch (error) {
      console.error(`❌ Erro ao atualizar militar de serviço ${req.params.id}:`, error);
      res.status(500).json({ 
        error: 'Failed to update duty officer',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // DELETE duty officer
  app.delete('/api/duty-officers/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      console.log(`🪖 DELETE /api/duty-officers/${id} - Deletando militar de serviço...`);
      
      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid officer ID' });
      }
      
      const deleted = await storage.deleteDutyOfficer(id);
      
      if (!deleted) {
        return res.status(404).json({ error: 'Duty officer not found' });
      }
      
      console.log(`✅ Militar de serviço ${id} deletado com sucesso`);
      res.json({ success: true, message: 'Duty officer deleted successfully' });
    } catch (error) {
      console.error(`❌ Erro ao deletar militar de serviço ${req.params.id}:`, error);
      res.status(500).json({ 
        error: 'Failed to delete duty officer',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
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

  // 🔥 NOVO: System info com informações de cache
  app.get('/api/system-info', async (req, res) => {
    try {
      const uploadsDir = path.join(process.cwd(), 'uploads');
      
      // Contar arquivos por tipo
      let totalUploads = 0;
      let pdfCount = 0;
      let imageCount = 0;
      let totalSize = 0;
      
      try {
        const files = fs.readdirSync(uploadsDir);
        
        for (const file of files) {
          const filePath = path.join(uploadsDir, file);
          const stats = fs.statSync(filePath);
          
          if (fs.statSync(filePath).isFile()) {
            totalUploads++;
            totalSize += stats.size;
            
            if (file.endsWith('.pdf')) pdfCount++;
            if (file.endsWith('.jpg') || file.endsWith('.png') || file.endsWith('.jpeg')) imageCount++;
          }
        }
      } catch (err) {
        // Diretório não existe
      }

      // Informações de cache
      let plasaCacheCount = 0;
      let escalaCacheCount = 0;
      
      try {
        const plasaFiles = await readdir(plasaPagesDir);
        plasaCacheCount = plasaFiles.filter(f => f.endsWith('.jpg')).length;
      } catch {}
      
      try {
        const escalaFiles = await readdir(escalaCacheDir);
        escalaCacheCount = escalaFiles.filter(f => f.endsWith('.jpg')).length;
      } catch {}

      const systemInfo = {
        server: {
          status: 'online',
          version: '2.0-cache',
          timestamp: new Date().toISOString(),
          uptime: process.uptime(),
          nodeVersion: process.version,
          platform: process.platform
        },
        storage: {
          uploads: {
            total: totalUploads,
            pdfs: pdfCount,
            images: imageCount,
            totalSizeMB: Math.round(totalSize / 1024 / 1024 * 100) / 100
          },
          cache: {
            plasa: {
              pages: plasaCacheCount,
              directory: 'uploads/plasa-pages/'
            },
            escala: {
              cached: escalaCacheCount,
              directory: 'uploads/escala-cache/'
            },
            total: plasaCacheCount + escalaCacheCount
          }
        },
        features: {
          notices: 'enabled',
          documents: 'enabled',
          cache: 'enabled',
          cors: 'enabled',
          upload: 'enabled'
        }
      };

      res.json(systemInfo);

    } catch (error) {
      console.error('❌ Erro ao obter informações do sistema:', error);
      res.status(500).json({ 
        error: 'Failed to get system info',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // 📄 ROTA: Extração de dados de PDF de escala
  app.post('/api/extract-pdf-data/:documentId', async (req, res) => {
    try {
      const documentId = parseInt(req.params.documentId);
      console.log(`📊 POST /api/extract-pdf-data/${documentId} - Extraindo dados do PDF...`);
      
      if (isNaN(documentId)) {
        return res.status(400).json({ 
          success: false,
          error: 'VALIDATION_ERROR: Invalid document ID'
        });
      }

      // Buscar documento no storage
      const document = await storage.getDocument(documentId);
      if (!document) {
        return res.status(404).json({ 
          success: false,
          error: 'Document not found'
        });
      }

      // Verificar se é um PDF de escala
      if (document.type !== 'escala') {
        return res.status(400).json({ 
          success: false,
          error: 'Document is not a scale (escala) type'
        });
      }

      // Extrair filename da URL (assumindo formato: /uploads/arquivo.pdf)
      const filename = document.url.split('/').pop();
      if (!filename) {
        return res.status(400).json({ 
          success: false,
          error: 'Invalid document URL format'
        });
      }

      // Caminho do arquivo PDF
      const pdfPath = path.join(process.cwd(), 'uploads', filename);
      
      // Verificar se arquivo existe
      try {
        await access(pdfPath);
      } catch {
        return res.status(404).json({ 
          success: false,
          error: 'PDF file not found on server'
        });
      }

      // Executar script Python para extração
      const pythonScript = path.join(process.cwd(), 'server', 'pdf_extractor.py');
      const command = `python3 "${pythonScript}" "${pdfPath}"`;
      
      console.log(`🐍 Executando extração Python: ${command}`);
      
      try {
        const { stdout, stderr } = await execPromise(command);
        
        if (stderr) {
          console.warn('⚠️ Python stderr:', stderr);
        }

        // Parse do resultado JSON
        const extractedData = JSON.parse(stdout);
        
        if (extractedData.erro) {
          return res.status(500).json({ 
            success: false,
            error: 'PDF extraction failed',
            details: extractedData.erro
          });
        }

        // Salvar dados extraídos em cache (opcional)
        const cacheDir = path.join(process.cwd(), 'uploads', 'extracted-data');
        try {
          await mkdir(cacheDir, { recursive: true });
          const cacheFile = path.join(cacheDir, `${documentId}-extracted.json`);
          await writeFile(cacheFile, JSON.stringify(extractedData, null, 2));
          console.log(`💾 Dados extraídos salvos em cache: ${cacheFile}`);
        } catch (cacheError) {
          console.warn('⚠️ Erro ao salvar cache:', cacheError);
        }

        console.log(`✅ Extração concluída para documento ${documentId}:`);
        console.log(`   - Total militares: ${extractedData.estatisticas?.total_militares || 0}`);
        console.log(`   - Turnos encontrados: ${Object.keys(extractedData.turnos || {}).length}`);

        res.json({
          success: true,
          documentId: documentId,
          extractedData: extractedData,
          message: 'PDF data extracted successfully'
        });

      } catch (execError) {
        console.error('❌ Erro na execução Python:', execError);
        res.status(500).json({ 
          success: false,
          error: 'Python execution failed',
          details: execError instanceof Error ? execError.message : 'Unknown error'
        });
      }

    } catch (error) {
      console.error(`❌ Erro ao extrair dados do PDF ${req.params.documentId}:`, error);
      res.status(500).json({ 
        success: false,
        error: 'SERVER_ERROR: Failed to extract PDF data',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // 📄 ROTA: Obter dados extraídos em cache
  app.get('/api/extracted-data/:documentId', async (req, res) => {
    try {
      const documentId = parseInt(req.params.documentId);
      console.log(`📊 GET /api/extracted-data/${documentId} - Buscando dados extraídos...`);
      
      if (isNaN(documentId)) {
        return res.status(400).json({ 
          success: false,
          error: 'VALIDATION_ERROR: Invalid document ID'
        });
      }

      const cacheFile = path.join(process.cwd(), 'uploads', 'extracted-data', `${documentId}-extracted.json`);
      
      try {
        await access(cacheFile);
        const cacheData = await readFile(cacheFile, 'utf8');
        const extractedData = JSON.parse(cacheData);
        
        console.log(`✅ Dados extraídos encontrados em cache para documento ${documentId}`);
        
        res.json({
          success: true,
          documentId: documentId,
          extractedData: extractedData,
          cached: true
        });

      } catch {
        res.status(404).json({ 
          success: false,
          error: 'No extracted data found in cache',
          message: 'Use POST /api/extract-pdf-data/:documentId to extract data first'
        });
      }

    } catch (error) {
      console.error(`❌ Erro ao buscar dados extraídos ${req.params.documentId}:`, error);
      res.status(500).json({ 
        success: false,
        error: 'SERVER_ERROR: Failed to get extracted data'
      });
    }
  });

  // 📊 ENDPOINT - Buscar dados extraídos por filename (para integração na página principal)
  app.get('/api/extracted-data-by-filename/:filename', async (req, res) => {
    try {
      const { filename } = req.params;
      console.log(`📊 GET /api/extracted-data-by-filename/${filename} - Buscando dados extraídos por filename...`);

      if (!filename) {
        return res.status(400).json({ 
          success: false,
          error: 'Filename is required' 
        });
      }

      // Tentar encontrar o arquivo cache baseado no filename
      const cacheDir = path.join(process.cwd(), 'uploads', 'extracted-data');
      
      // Buscar documento correspondente ao filename para encontrar seu ID
      const documents = await storage.getDocuments();
      console.log(`🔍 Documentos disponíveis: ${documents.length}`);
      console.log(`🔍 Buscando por filename: ${filename}`);
      
      const matchingDocument = documents.find(doc => {
        console.log(`🔍 Verificando documento:`, { id: doc.id, url: doc.url, includes: doc.url?.includes(filename) });
        return doc.url && doc.url.includes(filename);
      });
      
      if (matchingDocument) {
        // Buscar cache pelo ID do documento
        const cacheFile = path.join(cacheDir, `${matchingDocument.id}-extracted.json`);
        
        try {
          const extractedData = JSON.parse(await readFile(cacheFile, 'utf-8'));
          
          console.log(`✅ Dados extraídos encontrados para ${filename}: ${extractedData.turnos?.pernoite?.length || 0} militares no pernoite`);
          
          res.json({
            success: true,
            extractedData: extractedData,
            filename: filename,
            documentId: matchingDocument.id,
            cacheFile: `${matchingDocument.id}-extracted.json`
          });
        } catch (fileError) {
          res.status(404).json({ 
            success: false,
            error: 'Cache file not found for this document',
            filename: filename,
            documentId: matchingDocument.id,
            message: 'Extract data first using the admin panel'
          });
        }
      } else {
        res.status(404).json({ 
          success: false,
          error: 'Document not found for this filename',
          filename: filename,
          message: 'Upload the document first or check the filename'
        });
      }

    } catch (error) {
      console.error(`❌ Erro ao buscar dados extraídos por filename ${req.params.filename}:`, error);
      res.status(500).json({ 
        success: false,
        error: 'SERVER_ERROR: Failed to get extracted data by filename'
      });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
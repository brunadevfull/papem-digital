const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

// CORREÇÃO CORS COMPLETA: Configuração mais permissiva
app.use(cors({
  origin: function (origin, callback) {
    callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'HEAD'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With', 
    'Content-Type', 
    'Accept', 
    'Authorization',
    'Cache-Control',
    'Pragma',
    'Expires',
    'If-Modified-Since',
    'If-None-Match'
  ],
  exposedHeaders: [
    'Content-Length',
    'Content-Type',
    'Cache-Control',
    'Expires',
    'Last-Modified',
    'ETag'
  ]
}));

// Headers CORS manuais mais completos
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', req.get('Origin') || '*');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, HEAD');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control, Pragma, Expires, If-Modified-Since, If-None-Match');
  res.header('Access-Control-Expose-Headers', 'Content-Length, Content-Type, Cache-Control, Expires, Last-Modified, ETag');
  
  if (req.method === 'OPTIONS') {
    console.log(`📡 CORS Preflight: ${req.get('Origin')} -> ${req.path}`);
    res.sendStatus(200);
    return;
  }
  
  next();
});

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Log detalhado de requests
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  console.log(`  Origin: ${req.get('Origin') || 'none'}`);
  console.log(`  User-Agent: ${req.get('User-Agent')?.substring(0, 50) || 'none'}`);
  next();
});

// Servir arquivos PDF com headers CORS completos
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads'), {
  setHeaders: (res, filePath) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control, Pragma, If-Modified-Since, If-None-Match');
    res.setHeader('Access-Control-Expose-Headers', 'Content-Length, Content-Type, Cache-Control, Expires, Last-Modified, ETag');
    
    const ext = path.extname(filePath).toLowerCase();
    if (ext === '.pdf') {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'inline');
      res.setHeader('X-Content-Type-Options', 'nosniff');
    } else if (['.jpg', '.jpeg'].includes(ext)) {
      res.setHeader('Content-Type', 'image/jpeg');
    } else if (ext === '.png') {
      res.setHeader('Content-Type', 'image/png');
    }
    
    res.setHeader('Cache-Control', 'public, max-age=3600, must-revalidate');
    res.setHeader('Expires', new Date(Date.now() + 3600000).toUTCString());
    
    console.log(`📄 Servindo arquivo: ${path.basename(filePath)} (${ext})`);
  }
}));

app.use('/plasa-pages', express.static(path.join(__dirname, 'public', 'plasa-pages'), {
  setHeaders: (res, filePath) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control');
    res.setHeader('Content-Type', 'image/jpeg');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    
    console.log(`🖼️ Servindo página PLASA: ${path.basename(filePath)}`);
  }
}));

// NOVO: Servir imagens de escala com cache
app.use('/escala-images', express.static(path.join(__dirname, 'public', 'escala-images'), {
  setHeaders: (res, filePath) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control');
    res.setHeader('Content-Type', 'image/jpeg');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    
    console.log(`🖼️ Servindo escala cache: ${path.basename(filePath)}`);
  }
}));

app.use(express.static(path.join(__dirname, 'public')));

// Criar diretórios necessários
const createDirectories = () => {
  const dirs = [
    path.join(__dirname, 'public'),
    path.join(__dirname, 'public', 'uploads'),
    path.join(__dirname, 'public', 'plasa-pages'),
    path.join(__dirname, 'public', 'escala-images'), // NOVO: para cache de escalas
    path.join(__dirname, 'data') // Para dados JSON
  ];
  
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`📁 Diretório criado: ${dir}`);
    }
  });
};

createDirectories();

// Caminhos para arquivos de dados
const NOTICES_FILE = path.join(__dirname, 'data', 'notices.json');
const CONFIG_FILE = path.join(__dirname, 'data', 'config.json');

// Funções auxiliares para gerenciar dados JSON
const readJSONFile = (filePath, defaultValue = []) => {
  try {
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(data);
    }
    return defaultValue;
  } catch (error) {
    console.error(`❌ Erro ao ler ${filePath}:`, error);
    return defaultValue;
  }
};

const writeJSONFile = (filePath, data) => {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error(`❌ Erro ao escrever ${filePath}:`, error);
    return false;
  }
};

// Configurar multer para páginas PLASA (imagens)
const plasaStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const plasaPagesDir = path.join(__dirname, 'public', 'plasa-pages');
    cb(null, plasaPagesDir);
  },
  filename: (req, file, cb) => {
    // CORREÇÃO: Usar timestamp temporário, renomear depois
    cb(null, `escala-temp-${Date.now()}.jpg`);
  }
});


const plasaUpload = multer({ 
  storage: plasaStorage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    fieldSize: 10 * 1024 * 1024
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Apenas imagens são permitidas para páginas PLASA!'), false);
    }
  }
});

// NOVO: Configurar multer específico para escalas (cache)
const escalaStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const escalaImagesDir = path.join(__dirname, 'public', 'escala-images');
    cb(null, escalaImagesDir);
  },
  filename: (req, file, cb) => {
    const documentId = req.body.documentId;
    if (documentId) {
      cb(null, `escala-${documentId}.jpg`);
    } else {
      cb(null, `escala-temp-${Date.now()}.jpg`);
    }
  }
});

const escalaUpload = multer({ 
  storage: escalaStorage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    fieldSize: 10 * 1024 * 1024
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Apenas imagens são permitidas para escalas!'), false);
    }
  }
});

// Configurar multer para upload de documentos
const documentStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadsDir = path.join(__dirname, 'public', 'uploads');
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const documentType = req.body.documentType || 'document';
    const fileExtension = path.extname(file.originalname);
    const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileName = `${documentType}-${timestamp}-${sanitizedName}`;
    cb(null, fileName);
  }
});

const documentUpload = multer({ 
  storage: documentStorage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
    fieldSize: 50 * 1024 * 1024
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/gif',
      'image/webp'
    ];
    
    const isValidMime = allowedTypes.includes(file.mimetype);
    const isValidExt = /\.(pdf|jpg|jpeg|png|gif|webp)$/i.test(file.originalname);
    
    if (isValidMime && isValidExt) {
      cb(null, true);
    } else {
      cb(new Error('Apenas PDFs e imagens (JPG, PNG, GIF, WEBP) são permitidos!'), false);
    }
  }
});

// ================================
// ROTAS DE STATUS E TESTE
// ================================

app.get('/api/status', (req, res) => {
  try {
    const uploadsDir = path.join(__dirname, 'public', 'uploads');
    const plasaPagesDir = path.join(__dirname, 'public', 'plasa-pages');
    const escalaImagesDir = path.join(__dirname, 'public', 'escala-images');
    
    const uploadFiles = fs.existsSync(uploadsDir) ? 
      fs.readdirSync(uploadsDir).filter(f => !f.startsWith('.')) : [];
    
    const plasaFiles = fs.existsSync(plasaPagesDir) ? 
      fs.readdirSync(plasaPagesDir).filter(f => f.startsWith('plasa-page-')) : [];
    
    const escalaFiles = fs.existsSync(escalaImagesDir) ? 
      fs.readdirSync(escalaImagesDir).filter(f => f.startsWith('escala-')) : [];
    
    const notices = readJSONFile(NOTICES_FILE, []);
    
    console.log('✅ Status endpoint acessado');
    
    res.json({
      status: 'online',
      message: 'Servidor PLASA funcionando!',
      timestamp: new Date().toISOString(),
      version: '2.4',
      cors: 'full-enabled',
      directories: {
        uploads: {
          path: uploadsDir,
          exists: fs.existsSync(uploadsDir),
          files: uploadFiles.length
        },
        plasaPages: {
          path: plasaPagesDir,
          exists: fs.existsSync(plasaPagesDir),
          files: plasaFiles.length
        },
        escalaImages: {
          path: escalaImagesDir,
          exists: fs.existsSync(escalaImagesDir),
          files: escalaFiles.length
        }
      },
      statistics: {
        uploadedDocuments: uploadFiles.length,
        convertedPages: plasaFiles.length,
        cachedEscalas: escalaFiles.length,
        notices: notices.length,
        totalFiles: uploadFiles.length + plasaFiles.length + escalaFiles.length
      }
    });
  } catch (error) {
    console.error('❌ Erro ao obter status:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      details: error.message 
    });
  }
});

app.get('/api/test', (req, res) => {
  console.log('🧪 Test endpoint acessado');
  res.json({
    message: "Servidor funcionando perfeitamente!",
    cors: "CORS totalmente configurado",
    endpoints: {
      uploadDocument: "POST /api/upload-pdf",
      uploadPlasaPage: "POST /api/upload-plasa-page",
      uploadEscalaImage: "POST /api/upload-escala-image",
      checkPlasaPages: "POST /api/check-plasa-pages",
      checkEscalaImage: "GET /api/check-escala-image/:id",
      listDocuments: "GET /api/list-pdfs",
      listNotices: "GET /api/notices",
      createNotice: "POST /api/notices",
      updateNotice: "PUT /api/notices/:id",
      deleteNotice: "DELETE /api/notices/:id",
      status: "GET /api/status"
    },
    timestamp: new Date().toISOString()
  });
});

// ================================
// ROTAS PARA AVISOS
// ================================

// Listar todos os avisos
app.get('/api/notices', (req, res) => {
  try {
    const notices = readJSONFile(NOTICES_FILE, []);
    
    console.log(`📢 Listando ${notices.length} avisos`);
    
    res.json({
      success: true,
      notices: notices,
      total: notices.length,
      active: notices.filter(n => n.active).length
    });
  } catch (error) {
    console.error('❌ Erro ao listar avisos:', error);
    res.status(500).json({
      error: 'Erro ao listar avisos',
      details: error.message,
      code: 'LIST_NOTICES_ERROR'
    });
  }
});

// Criar novo aviso
app.post('/api/notices', (req, res) => {
  try {
    const { title, content, priority, startDate, endDate, active } = req.body;
    
    console.log('📢 CRIANDO NOVO AVISO:', {
      title,
      priority,
      startDate,
      endDate,
      active
    });
    
    // Validações
    if (!title || !content) {
      return res.status(400).json({
        error: 'Título e conteúdo são obrigatórios',
        code: 'MISSING_REQUIRED_FIELDS'
      });
    }
    
    if (!['high', 'medium', 'low'].includes(priority)) {
      return res.status(400).json({
        error: 'Prioridade deve ser high, medium ou low',
        code: 'INVALID_PRIORITY'
      });
    }
    
    // Validar datas
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({
        error: 'Datas de início e fim devem ser válidas',
        code: 'INVALID_DATES'
      });
    }
    
    if (start >= end) {
      return res.status(400).json({
        error: 'Data de início deve ser anterior à data de fim',
        code: 'INVALID_DATE_RANGE'
      });
    }
    
    const notices = readJSONFile(NOTICES_FILE, []);
    
    const newNotice = {
      id: `notice-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: title.trim(),
      content: content.trim(),
      priority,
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      active: Boolean(active),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    notices.push(newNotice);
    
    if (writeJSONFile(NOTICES_FILE, notices)) {
      console.log(`✅ AVISO CRIADO: ${newNotice.id} - ${newNotice.title}`);
      
      res.json({
        success: true,
        message: 'Aviso criado com sucesso',
        notice: newNotice
      });
    } else {
      throw new Error('Falha ao salvar arquivo');
    }
    
  } catch (error) {
    console.error('❌ ERRO AO CRIAR AVISO:', error);
    res.status(500).json({
      error: 'Erro ao criar aviso',
      details: error.message,
      code: 'CREATE_NOTICE_ERROR'
    });
  }
});

// Atualizar aviso existente
app.put('/api/notices/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, priority, startDate, endDate, active } = req.body;
    
    console.log(`📝 ATUALIZANDO AVISO: ${id}`);
    
    const notices = readJSONFile(NOTICES_FILE, []);
    const noticeIndex = notices.findIndex(n => n.id === id);
    
    if (noticeIndex === -1) {
      return res.status(404).json({
        error: 'Aviso não encontrado',
        code: 'NOTICE_NOT_FOUND'
      });
    }
    
    // Validações (mesmas da criação)
    if (title && !title.trim()) {
      return res.status(400).json({
        error: 'Título não pode estar vazio',
        code: 'INVALID_TITLE'
      });
    }
    
    if (priority && !['high', 'medium', 'low'].includes(priority)) {
      return res.status(400).json({
        error: 'Prioridade deve ser high, medium ou low',
        code: 'INVALID_PRIORITY'
      });
    }
    
    // Atualizar apenas campos fornecidos
    const updatedNotice = {
      ...notices[noticeIndex],
      ...(title && { title: title.trim() }),
      ...(content && { content: content.trim() }),
      ...(priority && { priority }),
      ...(startDate && { startDate: new Date(startDate).toISOString() }),
      ...(endDate && { endDate: new Date(endDate).toISOString() }),
      ...(typeof active === 'boolean' && { active }),
      updatedAt: new Date().toISOString()
    };
    
    // Validar datas se ambas foram fornecidas
    if (startDate || endDate) {
      const start = new Date(updatedNotice.startDate);
      const end = new Date(updatedNotice.endDate);
      
      if (start >= end) {
        return res.status(400).json({
          error: 'Data de início deve ser anterior à data de fim',
          code: 'INVALID_DATE_RANGE'
        });
      }
    }
    
    notices[noticeIndex] = updatedNotice;
    
    if (writeJSONFile(NOTICES_FILE, notices)) {
      console.log(`✅ AVISO ATUALIZADO: ${id} - ${updatedNotice.title}`);
      
      res.json({
        success: true,
        message: 'Aviso atualizado com sucesso',
        notice: updatedNotice
      });
    } else {
      throw new Error('Falha ao salvar arquivo');
    }
    
  } catch (error) {
    console.error('❌ ERRO AO ATUALIZAR AVISO:', error);
    res.status(500).json({
      error: 'Erro ao atualizar aviso',
      details: error.message,
      code: 'UPDATE_NOTICE_ERROR'
    });
  }
});

// Deletar aviso
app.delete('/api/notices/:id', (req, res) => {
  try {
    const { id } = req.params;
    
    console.log(`🗑️ DELETANDO AVISO: ${id}`);
    
    const notices = readJSONFile(NOTICES_FILE, []);
    const noticeIndex = notices.findIndex(n => n.id === id);
    
    if (noticeIndex === -1) {
      return res.status(404).json({
        error: 'Aviso não encontrado',
        code: 'NOTICE_NOT_FOUND'
      });
    }
    
    const deletedNotice = notices[noticeIndex];
    notices.splice(noticeIndex, 1);
    
    if (writeJSONFile(NOTICES_FILE, notices)) {
      console.log(`✅ AVISO DELETADO: ${id} - ${deletedNotice.title}`);
      
      res.json({
        success: true,
        message: 'Aviso deletado com sucesso',
        deletedNotice: deletedNotice
      });
    } else {
      throw new Error('Falha ao salvar arquivo');
    }
    
  } catch (error) {
    console.error('❌ ERRO AO DELETAR AVISO:', error);
    res.status(500).json({
      error: 'Erro ao deletar aviso',
      details: error.message,
      code: 'DELETE_NOTICE_ERROR'
    });
  }
});

// ================================
// ROTAS PARA UPLOAD DE DOCUMENTOS
// ================================

app.post('/api/upload-pdf', documentUpload.single('pdf'), (req, res) => {
  try {
    console.log('📄 UPLOAD DE DOCUMENTO:');
    console.log(`  Origin: ${req.get('Origin')}`);
    console.log(`  File: ${req.file?.filename || 'none'}`);
    console.log(`  Type: ${req.body.documentType}`);

    if (!req.file) {
      console.log('❌ Nenhum arquivo enviado');
      return res.status(400).json({ 
        error: 'Nenhum arquivo foi enviado',
        code: 'NO_FILE'
      });
    }

    const { documentType, title, category } = req.body;
    
    if (!documentType || !title) {
      console.log('❌ Campos obrigatórios faltando');
      return res.status(400).json({ 
        error: 'Campos obrigatórios: documentType e title',
        code: 'MISSING_FIELDS'
      });
    }

    const filePath = path.join(__dirname, 'public', 'uploads', req.file.filename);
    if (!fs.existsSync(filePath)) {
      throw new Error('Arquivo não foi salvo corretamente');
    }

    const fileUrl = `/uploads/${req.file.filename}`;
    const fullUrl = `http://localhost:${PORT}${fileUrl}`;
    
    console.log(`✅ DOCUMENTO SALVO: ${req.file.filename}`);
    console.log(`   URL: ${fullUrl}`);
    
    res.json({
      success: true,
      message: 'Documento enviado com sucesso',
      data: {
        url: fileUrl,
        fullUrl: fullUrl,
        fileName: req.file.filename,
        originalName: req.file.originalname,
        documentType: documentType,
        title: title,
        category: category || null,
        size: req.file.size,
        mimeType: req.file.mimetype,
        uploadedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ ERRO NO UPLOAD:', error);
    res.status(500).json({ 
      error: 'Erro ao fazer upload do documento',
      details: error.message,
      code: 'UPLOAD_ERROR'
    });
  }
});

// ================================
// ROTAS PARA PÁGINAS PLASA
// ================================

app.post('/api/upload-plasa-page', plasaUpload.single('file'), (req, res) => {
  try {
    console.log('🖼️ UPLOAD DE PÁGINA PLASA:');
    console.log(`  Origin: ${req.get('Origin')}`);
    console.log(`  File: ${req.file?.filename || 'none'}`);

    if (!req.file) {
      return res.status(400).json({ 
        error: 'Nenhuma imagem foi enviada',
        code: 'NO_IMAGE'
      });
    }

    const pageNumber = req.body.pageNumber;
    
    if (!pageNumber) {
      return res.status(400).json({ 
        error: 'pageNumber é obrigatório',
        code: 'NO_PAGE_NUMBER'
      });
    }

    const fileUrl = `/plasa-pages/${req.file.filename}`;
    
    console.log(`✅ PÁGINA PLASA SALVA: ${req.file.filename}`);
    
    res.json({
      success: true,
      message: `Página ${pageNumber} salva com sucesso`,
      data: {
        url: fileUrl,
        fileName: req.file.filename,
        pageNumber: parseInt(pageNumber),
        size: req.file.size,
        savedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ ERRO NO UPLOAD DA PÁGINA:', error);
    res.status(500).json({ 
      error: 'Erro ao salvar página PLASA',
      details: error.message,
      code: 'PAGE_UPLOAD_ERROR'
    });
  }
});

app.post('/api/check-plasa-pages', (req, res) => {
  try {
    const { totalPages } = req.body;
    
    if (!totalPages || totalPages < 1) {
      return res.status(400).json({ 
        error: 'totalPages deve ser um número maior que 0',
        code: 'INVALID_TOTAL_PAGES'
      });
    }

    const plasaPagesDir = path.join(__dirname, 'public', 'plasa-pages');
    const pageUrls = [];
    let allPagesExist = true;
    
    console.log(`🔍 VERIFICANDO ${totalPages} PÁGINAS PLASA...`);
    
    for (let i = 1; i <= totalPages; i++) {
      const fileName = `plasa-page-${i}.jpg`;
      const filePath = path.join(plasaPagesDir, fileName);
      
      if (fs.existsSync(filePath)) {
        const stats = fs.statSync(filePath);
        pageUrls.push({
          url: `/plasa-pages/${fileName}`,
          pageNumber: i,
          size: stats.size,
          exists: true
        });
      } else {
        console.log(`❌ Página ${i} não encontrada`);
        allPagesExist = false;
        break;
      }
    }
    
    console.log(`📊 RESULTADO: ${pageUrls.length}/${totalPages} páginas encontradas`);
    
    res.json({
      success: true,
      allPagesExist,
      pageUrls: allPagesExist ? pageUrls.map(p => p.url) : [],
      totalFound: pageUrls.length,
      totalExpected: totalPages,
      pages: pageUrls
    });

  } catch (error) {
    console.error('❌ ERRO AO VERIFICAR PÁGINAS:', error);
    res.status(500).json({ 
      error: 'Erro ao verificar páginas PLASA',
      details: error.message,
      code: 'CHECK_PAGES_ERROR'
    });
  }
});

app.delete('/api/clear-plasa-pages', (req, res) => {
  try {
    const plasaPagesDir = path.join(__dirname, 'public', 'plasa-pages');
    
    if (!fs.existsSync(plasaPagesDir)) {
      return res.json({
        success: true,
        deletedCount: 0,
        message: 'Diretório de páginas não existe'
      });
    }
    
    const files = fs.readdirSync(plasaPagesDir);
    let deletedCount = 0;
    
    files.forEach(file => {
      if (file.startsWith('plasa-page-') && file.endsWith('.jpg')) {
        const filePath = path.join(plasaPagesDir, file);
        try {
          fs.unlinkSync(filePath);
          deletedCount++;
          console.log(`🗑️ Removido: ${file}`);
        } catch (err) {
          console.error(`❌ Erro ao remover ${file}:`, err);
        }
      }
    });
    
    console.log(`🧹 LIMPEZA CONCLUÍDA: ${deletedCount} páginas removidas`);
    
    res.json({
      success: true,
      deletedCount: deletedCount,
      message: `${deletedCount} páginas PLASA removidas com sucesso`
    });

  } catch (error) {
    console.error('❌ ERRO AO LIMPAR PÁGINAS:', error);
    res.status(500).json({ 
      error: 'Erro ao limpar páginas PLASA',
      details: error.message,
      code: 'CLEAR_PAGES_ERROR'
    });
  }
});

// ================================
// NOVAS ROTAS PARA CACHE DE ESCALAS
// ================================

app.post('/api/upload-escala-image', escalaUpload.single('file'), (req, res) => {
  try {
    console.log('🖼️ UPLOAD DE ESCALA CACHE:');
    console.log(`  Origin: ${req.get('Origin')}`);
    console.log(`  File: ${req.file?.filename || 'none'}`);
    console.log(`  DocumentId: ${req.body.documentId}`);

    const { documentId } = req.body;
    
    if (!req.file || !documentId) {
      return res.status(400).json({
        error: 'Arquivo e documentId são obrigatórios',
        code: 'MISSING_REQUIRED_FIELDS'
      });
    }

    // 🔄 RENOMEAMENTO: Do nome temporário para o nome correto
    const tempFileName = req.file.filename;  // escala-temp-1748829928252.jpg
    const correctFileName = `escala-${documentId}.jpg`;  // escala-1748797177372-jz0iqlr8s.jpg
    
    const oldPath = path.join(__dirname, 'public', 'escala-images', tempFileName);
    const newPath = path.join(__dirname, 'public', 'escala-images', correctFileName);
    
    console.log(`🔄 Renomeando arquivo:`);
    console.log(`   De: ${tempFileName}`);
    console.log(`   Para: ${correctFileName}`);
    console.log(`   Path antigo: ${oldPath}`);
    console.log(`   Path novo: ${newPath}`);
    
    try {
      // Verificar se arquivo temporário existe
      if (!fs.existsSync(oldPath)) {
        throw new Error(`Arquivo temporário não encontrado: ${oldPath}`);
      }
      
      // Verificar se arquivo final já existe (remover se existir)
      if (fs.existsSync(newPath)) {
        console.log(`⚠️ Arquivo final já existe, removendo: ${correctFileName}`);
        fs.unlinkSync(newPath);
      }
      
      // Renomear arquivo
      fs.renameSync(oldPath, newPath);
      console.log(`✅ Arquivo renomeado com sucesso: ${correctFileName}`);
      
      // Verificar se renomeamento funcionou
      if (!fs.existsSync(newPath)) {
        throw new Error(`Falha na verificação: arquivo ${correctFileName} não existe após renomeamento`);
      }
      
    } catch (renameError) {
      console.error(`❌ Erro no renomeamento: ${renameError.message}`);
      return res.status(500).json({
        error: 'Erro ao organizar arquivo no cache',
        details: renameError.message,
        code: 'RENAME_ERROR'
      });
    }

    // ✅ Resposta com URL correta
    const finalUrl = `/escala-images/${correctFileName}`;
    
    console.log(`💾 Escala salva no cache: ${finalUrl}`);

    res.json({
      success: true,
      message: `Escala ${documentId} salva no cache com sucesso`,
      url: finalUrl,
      documentId: documentId,
      originalFile: tempFileName,
      finalFile: correctFileName,
      size: req.file.size,
      savedAt: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Erro ao salvar escala no cache:', error);
    res.status(500).json({ 
      error: 'Erro ao salvar escala no cache',
      details: error.message,
      code: 'ESCALA_CACHE_ERROR'
    });
  }
});

// Verificar se escala já foi convertida e está no cache
app.get('/api/check-escala-image/:documentId', (req, res) => {
  try {
    const { documentId } = req.params;
    const fileName = `escala-${documentId}.jpg`;
    const imagePath = path.join(__dirname, 'public', 'escala-images', fileName);
    
    if (fs.existsSync(imagePath)) {
      const stats = fs.statSync(imagePath);
      console.log(`💾 Cache encontrado para escala: ${documentId} (${stats.size} bytes)`);
      
      res.json({
        success: true,
        exists: true,
        url: `/escala-images/${fileName}`,
        documentId: documentId,
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime
      });
    } else {
      console.log(`🆕 Cache não encontrado para escala: ${documentId}`);
      
      res.json({
        success: true,
        exists: false,
        documentId: documentId
      });
    }
  } catch (error) {
    console.error('❌ Erro ao verificar cache de escala:', error);
    res.status(500).json({ 
      error: 'Erro ao verificar cache de escala',
      details: error.message,
      code: 'CHECK_ESCALA_CACHE_ERROR'
    });
  }
});

// Limpar cache de escalas (opcional)
app.delete('/api/clear-escala-cache', (req, res) => {
  try {
    const escalaImagesDir = path.join(__dirname, 'public', 'escala-images');
    
    if (!fs.existsSync(escalaImagesDir)) {
      return res.json({
        success: true,
        deletedCount: 0,
        message: 'Diretório de cache de escalas não existe'
      });
    }
    
    const files = fs.readdirSync(escalaImagesDir);
    let deletedCount = 0;
    
    files.forEach(file => {
      if (file.startsWith('escala-') && file.endsWith('.jpg')) {
        const filePath = path.join(escalaImagesDir, file);
        try {
          fs.unlinkSync(filePath);
          deletedCount++;
          console.log(`🗑️ Cache removido: ${file}`);
        } catch (err) {
          console.error(`❌ Erro ao remover cache ${file}:`, err);
        }
      }
    });
    
    console.log(`🧹 LIMPEZA DE CACHE CONCLUÍDA: ${deletedCount} escalas removidas`);
    
    res.json({
      success: true,
      deletedCount: deletedCount,
      message: `${deletedCount} escalas removidas do cache com sucesso`
    });

  } catch (error) {
    console.error('❌ ERRO AO LIMPAR CACHE DE ESCALAS:', error);
    res.status(500).json({ 
      error: 'Erro ao limpar cache de escalas',
      details: error.message,
      code: 'CLEAR_ESCALA_CACHE_ERROR'
    });
  }
});

// ================================
// ROTAS PARA GERENCIAR DOCUMENTOS
// ================================

app.get('/api/list-pdfs', (req, res) => {
  try {
    const uploadsDir = path.join(__dirname, 'public', 'uploads');
    
    if (!fs.existsSync(uploadsDir)) {
      return res.json({ 
        success: true,
        documents: [],
        total: 0
      });
    }
    
    const files = fs.readdirSync(uploadsDir);
    
    const documents = files
      .filter(file => !file.startsWith('.'))
      .map(file => {
        const filePath = path.join(uploadsDir, file);
        const stats = fs.statSync(filePath);
        
        const nameParts = file.split('-');
        const type = nameParts[0] || 'unknown';
        
        return {
          filename: file,
          url: `/uploads/${file}`,
          fullUrl: `http://localhost:${PORT}/uploads/${file}`,
          size: stats.size,
          sizeFormatted: formatFileSize(stats.size),
          created: stats.birthtime,
          modified: stats.mtime,
          type: type,
          extension: path.extname(file).toLowerCase(),
          isImage: /\.(jpg|jpeg|png|gif|webp)$/i.test(file),
          isPDF: /\.pdf$/i.test(file)
        };
      })
      .sort((a, b) => new Date(b.created) - new Date(a.created));
    
    console.log(`📋 Lista retornada: ${documents.length} arquivos`);
    
    res.json({ 
      success: true,
      documents,
      total: documents.length,
      totalSize: documents.reduce((sum, doc) => sum + doc.size, 0),
      statistics: {
        pdfs: documents.filter(d => d.isPDF).length,
        images: documents.filter(d => d.isImage).length,
        plasa: documents.filter(d => d.type === 'plasa').length,
        escala: documents.filter(d => d.type === 'escala').length
      }
    });
    
  } catch (error) {
    console.error('❌ ERRO AO LISTAR DOCUMENTOS:', error);
    res.status(500).json({ 
      error: 'Erro ao listar documentos',
      details: error.message,
      code: 'LIST_ERROR'
    });
  }
});

app.delete('/api/delete-pdf/:filename', (req, res) => {
  try {
    const filename = req.params.filename;
    
    if (!filename || filename.includes('..') || filename.includes('/')) {
      return res.status(400).json({
        error: 'Nome de arquivo inválido',
        code: 'INVALID_FILENAME'
      });
    }
    
    const filePath = path.join(__dirname, 'public', 'uploads', filename);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        error: 'Arquivo não encontrado',
        code: 'FILE_NOT_FOUND'
      });
    }
    
    fs.unlinkSync(filePath);
    console.log(`🗑️ DOCUMENTO REMOVIDO: ${filename}`);
    
    res.json({
      success: true,
      message: `Documento ${filename} removido com sucesso`,
      filename: filename,
      deletedAt: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ ERRO AO DELETAR:', error);
    res.status(500).json({ 
      error: 'Erro ao deletar documento',
      details: error.message,
      code: 'DELETE_ERROR'
    });
  }
});

// ================================
// ROTAS DE INFORMAÇÃO
// ================================

app.get('/api/system-info', (req, res) => {
  try {
    const uploadsDir = path.join(__dirname, 'public', 'uploads');
    const plasaPagesDir = path.join(__dirname, 'public', 'plasa-pages');
    const escalaImagesDir = path.join(__dirname, 'public', 'escala-images');
    
    const getDirectoryInfo = (dirPath) => {
      if (!fs.existsSync(dirPath)) {
        return { exists: false, files: [], totalSize: 0 };
      }
      
      const files = fs.readdirSync(dirPath);
      let totalSize = 0;
      
      const fileDetails = files.map(file => {
        const filePath = path.join(dirPath, file);
        const stats = fs.statSync(filePath);
        totalSize += stats.size;
        
        return {
          name: file,
          size: stats.size,
          created: stats.birthtime,
          modified: stats.mtime
        };
      });
      
      return {
        exists: true,
        files: fileDetails,
        count: files.length,
        totalSize: totalSize
      };
    };
    
    const notices = readJSONFile(NOTICES_FILE, []);
    const config = readJSONFile(CONFIG_FILE, {});
    
    res.json({
      server: {
        status: 'online',
        version: '2.4',
        cors: 'full-enabled',
        port: PORT,
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        nodeVersion: process.version,
        platform: process.platform
      },
      directories: {
        uploads: {
          path: uploadsDir,
          ...getDirectoryInfo(uploadsDir)
        },
        plasaPages: {
          path: plasaPagesDir,
          ...getDirectoryInfo(plasaPagesDir)
        },
        escalaImages: {
          path: escalaImagesDir,
          ...getDirectoryInfo(escalaImagesDir)
        }
      },
      data: {
        notices: {
          total: notices.length,
          active: notices.filter(n => n.active).length,
          file: NOTICES_FILE,
          exists: fs.existsSync(NOTICES_FILE)
        },
        config: {
          file: CONFIG_FILE,
          exists: fs.existsSync(CONFIG_FILE),
          settings: Object.keys(config).length
        }
      },
      memory: process.memoryUsage(),
      diskUsage: {
        uploads: getDirectoryInfo(uploadsDir).totalSize,
        plasaPages: getDirectoryInfo(plasaPagesDir).totalSize,
        escalaImages: getDirectoryInfo(escalaImagesDir).totalSize
      }
    });
    
  } catch (error) {
    console.error('❌ ERRO INFO SISTEMA:', error);
    res.status(500).json({ 
      error: 'Erro ao obter informações do sistema',
      details: error.message,
      code: 'SYSTEM_INFO_ERROR'
    });
  }
});

// ================================
// UTILITÁRIOS
// ================================

function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// ================================
// MIDDLEWARE DE ERRO
// ================================

app.use((error, req, res, next) => {
  console.error('❌ ERRO NÃO TRATADO:', error);
  
  res.header('Access-Control-Allow-Origin', req.get('Origin') || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control');
  
  if (error instanceof multer.MulterError) {
    let message = 'Erro no upload do arquivo';
    let code = 'MULTER_ERROR';
    
    switch (error.code) {
      case 'LIMIT_FILE_SIZE':
        message = 'Arquivo muito grande (máximo 50MB para documentos, 10MB para páginas)';
        code = 'FILE_TOO_LARGE';
        break;
      case 'LIMIT_FIELD_VALUE':
        message = 'Valor do campo muito grande';
        code = 'FIELD_TOO_LARGE';
        break;
      case 'LIMIT_UNEXPECTED_FILE':
        message = 'Campo de arquivo inesperado';
        code = 'UNEXPECTED_FILE';
        break;
      case 'MISSING_FIELD_NAME':
        message = 'Nome do campo ausente';
        code = 'MISSING_FIELD_NAME';
        break;
    }
    
    return res.status(400).json({ 
      error: message,
      code: code,
      details: error.message
    });
  }
  
  res.status(500).json({ 
    error: 'Erro interno do servidor',
    code: 'INTERNAL_ERROR',
    details: process.env.NODE_ENV === 'development' ? error.message : 'Erro interno'
  });
});

// Rota 404 para APIs
app.use('/api/*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint não encontrado',
    code: 'NOT_FOUND',
    path: req.path,
    method: req.method
  });
});

// ================================
// INICIALIZAÇÃO DO SERVIDOR
// ================================

app.listen(PORT, () => {
  console.log(`🚀 SERVIDOR PLASA v2.4 INICIADO (CORS + AVISOS + CACHE ESCALAS)`);
  console.log(`🌐 Porta: ${PORT}`);
  console.log(`🔗 CORS totalmente habilitado para todas as origens`);
  console.log(`📁 Uploads: ${path.join(__dirname, 'public', 'uploads')}`);
  console.log(`🖼️ Páginas PLASA: ${path.join(__dirname, 'public', 'plasa-pages')}`);
  console.log(`🖼️ Cache Escalas: ${path.join(__dirname, 'public', 'escala-images')}`);
  console.log(`📢 Avisos: ${NOTICES_FILE}`);
  console.log(`⚙️ Configurações: ${CONFIG_FILE}`);
  console.log(`🔗 URLs de teste:`);
  console.log(`   Status: http://localhost:${PORT}/api/status`);
  console.log(`   Teste: http://localhost:${PORT}/api/test`);
  console.log(`   Sistema: http://localhost:${PORT}/api/system-info`);
  console.log(`   Documentos: http://localhost:${PORT}/api/list-pdfs`);
  console.log(`   Avisos: http://localhost:${PORT}/api/notices`);
  console.log(`   Cache Escalas: http://localhost:${PORT}/api/check-escala-image/[ID]`);
  console.log(`✅ Servidor com CORS, avisos e cache de escalas completo!`);
});

module.exports = app;
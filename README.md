# Sistema PAPEM - Marinha do Brasil

Sistema de Visualização Operacional para Plasa, Avisos e Escalas da Marinha do Brasil.

## Características Implementadas

### 🔧 Sistema de Testes Automatizados
- **Testes Unitários**: Vitest com React Testing Library
- **Testes de API**: Supertest para endpoints REST
- **Testes E2E**: Verificação completa de workflows
- **Script Automatizado**: `./scripts/test-runner.sh` para execução completa

### 🎨 Interface Moderna
- **Tema Dark/Light**: Alternância automática com persistência
- **Design Responsivo**: Interface adaptável para diferentes telas
- **Efeitos Visuais**: Glass morphism e gradientes modernos
- **Componentes Premium**: Baseado em shadcn/ui

### 📊 Analytics e Monitoramento
- **Dashboard Analytics**: Métricas em tempo real
- **Sistema de Status**: Monitoramento de saúde do sistema
- **Notificações**: Alertas contextuais e em tempo real
- **Relatórios Visuais**: Gráficos interativos com Recharts

### 🚀 Funcionalidades Avançadas
- **API REST Completa**: CRUD para avisos e documentos
- **Armazenamento em Memória**: Sistema otimizado com tipos TypeScript
- **Contexto Global**: Gerenciamento de estado centralizado
- **Validação Robusta**: Zod schemas para segurança de dados

## Como Executar os Testes

### Teste Automático Completo
```bash
chmod +x scripts/test-runner.sh
./scripts/test-runner.sh
```

### Testes Individuais
```bash
# Testes unitários
npx vitest run

# Testes com interface
npx vitest --ui

# Verificação de tipos
npm run check

# Build de produção
npm run build
```

## Estrutura do Projeto

```
├── client/src/
│   ├── components/
│   │   ├── Analytics.tsx          # Dashboard de métricas
│   │   ├── RealtimeNotifications.tsx  # Sistema de notificações
│   │   ├── SystemStatus.tsx       # Monitor de status
│   │   ├── ThemeProvider.tsx      # Gerenciamento de tema
│   │   └── ui/                    # Componentes base shadcn
│   ├── context/
│   │   └── DisplayContext.tsx     # Estado global da aplicação
│   └── pages/
│       ├── Index.tsx              # Página principal
│       ├── Admin.tsx              # Painel administrativo
│       └── NotFound.tsx           # Página 404
├── server/
│   ├── index.ts                   # Servidor Express
│   ├── routes.ts                  # Rotas da API
│   └── storage.ts                 # Camada de dados
├── shared/
│   └── schema.ts                  # Tipos e validações
├── test/
│   ├── api.test.ts               # Testes da API
│   ├── components.test.tsx       # Testes de componentes
│   ├── e2e.test.ts              # Testes end-to-end
│   └── setup.ts                 # Configuração de testes
└── scripts/
    └── test-runner.sh           # Script de automação
```

## API Endpoints

### Avisos
- `GET /api/notices` - Listar avisos
- `POST /api/notices` - Criar aviso
- `PUT /api/notices/:id` - Atualizar aviso
- `DELETE /api/notices/:id` - Deletar aviso

### Documentos
- `GET /api/documents` - Listar documentos
- `POST /api/documents` - Criar documento
- `PUT /api/documents/:id` - Atualizar documento
- `DELETE /api/documents/:id` - Deletar documento

### Sistema
- `GET /api/health` - Status da aplicação

## Opções de Estilo Disponíveis

### 1. Tema Naval (Atual)
- Gradientes azul naval e ciano
- Efeitos glass morphism
- Identidade visual marítima

### 2. Tema Corporativo
- Cores neutras e profissionais
- Interface minimalista
- Foco em produtividade

### 3. Tema Alto Contraste
- Cores vibrantes para acessibilidade
- Texto mais legível
- Indicadores visuais claros

## Novas Funcionalidades Sugeridas

### 📱 Mobile First
- PWA (Progressive Web App)
- Notificações push nativas
- Modo offline com sincronização

### 🔐 Segurança Avançada
- Autenticação multi-fator
- Logs de auditoria
- Criptografia de dados sensíveis

### 📈 Analytics Avançados
- Histórico de alterações
- Relatórios de uso
- Métricas de performance

### 🌐 Integração Externa
- WebSockets para atualizações em tempo real
- API externa para sincronização
- Backup automático na nuvem

### 🤖 Automação
- Agendamento de avisos
- Rotação automática de documentos
- Alertas baseados em regras

## Tecnologias Utilizadas

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Backend**: Express, Node.js
- **Testes**: Vitest, React Testing Library, Supertest
- **UI**: shadcn/ui, Radix UI, Lucide React
- **Validação**: Zod
- **Roteamento**: Wouter
- **Build**: Vite
- **Gráficos**: Recharts

## Performance e Otimização

- Bundle splitting automático
- Lazy loading de componentes
- Otimização de imagens
- Cache de API inteligente
- Minificação de código

## Deployment

O projeto está configurado para deployment no Replit com:
- Servidor único na porta 5000
- Build automático de produção
- Servir arquivos estáticos
- Hot reload em desenvolvimento
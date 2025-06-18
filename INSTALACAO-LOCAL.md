# Instalação Local - Sistema de Display da Marinha

## Pré-requisitos
- Node.js versão 18 ou superior
- npm (incluído com Node.js)

## Como executar na sua máquina

### Opção 1: Execução Simples (Recomendada)
```bash
# 1. Navegue até a pasta do projeto
cd /caminho/para/o/projeto

# 2. Instale as dependências (apenas na primeira vez)
npm install

# 3. Execute o sistema
npm run dev
```

### Opção 2: Execução com variáveis de ambiente
```bash
# Se precisar especificar porta ou host diferentes
VITE_BACKEND_HOST=localhost VITE_BACKEND_PORT=5000 npm run dev
```

## Acessando o sistema
- **Sistema principal**: http://localhost:5000
- **Painel administrativo**: http://localhost:5000/admin

## Estrutura do projeto
```
/
├── client/          # Frontend (React)
├── server/          # Backend (Express)
├── shared/          # Tipos compartilhados
└── package.json     # Configurações e dependências
```

## Como funciona
- O sistema roda em **UMA ÚNICA PORTA** (5000)
- O backend e frontend são servidos juntos
- Não precisa subir separadamente

## Resolução de problemas

### ERRO: "CORS blocked" ou "NetworkError"
- **Causa**: Tentativa de acessar portas diferentes
- **Solução**: Sempre use `http://localhost:5000`
- **Se persistir**: Abra `limpar-cache.html` no navegador e limpe o cache

### ERRO: Documentos não carregam ou URLs com porta 3001
- **Solução rápida**: Abrir `limpar-cache.html` e clicar em "Limpar Cache de Documentos"
- **Alternativa**: Pressionar F12 → Console → digitar `localStorage.clear()` → Enter
- Recarregar a página principal

### ERRO: "EADDRINUSE" (porta em uso)
```bash
# Encontrar processo usando a porta 5000
netstat -ano | findstr :5000    # Windows
lsof -i :5000                   # Linux/Mac

# Parar o processo ou usar porta diferente
PORT=5001 npm run dev
```

### ERRO: "Module not found"
```bash
# Limpar cache e reinstalar
rm -rf node_modules package-lock.json
npm install
```

### Ferramenta de limpeza de cache
Para problemas relacionados a cache, abra no navegador:
`http://localhost:5000/limpar-cache.html`

Esta ferramenta permite:
- Verificar cache atual
- Limpar apenas documentos
- Limpar todo o cache
- Detectar URLs problemáticas

## Comandos úteis
```bash
# Instalar dependências
npm install

# Executar em desenvolvimento
npm run dev

# Limpar cache
npm run clean    # (se disponível)

# Verificar porta em uso
npm run check-port    # (se disponível)
```

## Configuração para produção
Para instalar em servidor Oracle Linux, consulte `INSTALACAO-OFFLINE.md`

## Suporte
- Verifique logs no console do navegador (F12)
- Verifique logs do servidor no terminal
- Documente erros com prints de tela para suporte
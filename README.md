# Sistema de Visualização da Marinha do Brasil

**Autor: 2SG Bruna Rocha**  
**Marinha do Brasil**

Sistema completo de exibição automática de documentos PLASA e Escalas para unidades da Marinha do Brasil, com processamento de PDF, gerenciamento de avisos e painel administrativo.

## 📋 Funcionalidades

### Sistema Principal
- **Exibição Automática**: Cicla entre documentos PLASA e Escalas com intervalos configuráveis
- **Processamento de PDF**: Converte PDFs para imagens otimizadas para exibição
- **Scroll Automático**: Navegação automática com velocidade configurável
- **Sistema de Avisos**: Exibe avisos importantes com prioridades e períodos definidos
- **Responsivo**: Interface adaptável para diferentes tamanhos de tela

### Painel Administrativo
- **Gerenciamento de Documentos**: Upload, edição e exclusão de PLASAs e Escalas
- **Sistema de Avisos**: Criação e gerenciamento de avisos com períodos de validade
- **Configurações**: Controle de velocidade de scroll, intervalos de alternância
- **Categorização**: Organização de escalas por categoria (Oficial/Praça)

## 🚀 Instalação

### Pré-requisitos
- Node.js 18+ 
- npm ou yarn
- Chrome/Chromium (para testes automatizados)

### Instalação Local

```bash
# Clonar o repositório
git clone <url-do-repositorio>
cd sistema-visualizacao-marinha

# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento
npm run dev
```

O sistema estará disponível em `http://localhost:5000`

### Instalação em Oracle Linux

Para instalação completa em ambiente de produção Oracle Linux:

```bash
# Executar script de configuração (como root)
sudo ./setup-oracle-linux.sh

# Fazer deploy da aplicação
sudo /usr/local/bin/deploy-navy-display <url-do-repositorio-git>
```

## 🖥️ Interface do Sistema

### Página Principal (`/`)
- Exibição em tela cheia de documentos PLASA e Escalas
- Horário atual no canto superior direito
- Brasão da Marinha como identificação visual
- Alternância automática entre documentos

### Painel Administrativo (`/admin`)
- **Aba Avisos**: Criar, editar e gerenciar avisos
- **Aba Documentos**: Upload e gerenciamento de PDFs
- **Configurações**: Ajustes de velocidade e intervalos

## ⚙️ Configuração

### Variáveis de Ambiente
```bash
NODE_ENV=production          # Ambiente de execução
PORT=5000                   # Porta do servidor
VITE_BACKEND_HOST=localhost # Host do backend
VITE_BACKEND_PORT=5000      # Porta do backend
```

### Configurações do Sistema
- **Intervalo de Alternância**: Tempo entre documentos (padrão: 30s)
- **Velocidade de Scroll**: Lenta, Normal ou Rápida
- **Delay de Reinício**: Tempo antes de reiniciar scroll (padrão: 3s)

## 🧪 Testes

### Testes Rápidos
```bash
# Executar testes básicos
./teste.sh

# Executar testes completos com Selenium
python3 teste_selenium.py
```

### Testes Disponíveis

#### Script Bash (`teste.sh`)
- Verificação de saúde da API
- Testes CRUD de avisos e documentos
- Validação de páginas do frontend
- Testes de tratamento de erro

#### Script Python (`teste_selenium.py`)
- Automação completa do navegador
- Testes de interface responsiva
- Validação de funcionalidades de exibição
- Testes de navegação entre páginas

### Monitoramento Automático

Em ambiente de produção, o sistema inclui:
- Script de monitoramento a cada 5 minutos
- Reinicialização automática em caso de falha
- Logs estruturados para diagnóstico

```bash
# Verificar status do serviço
systemctl status navy-display

# Ver logs em tempo real
journalctl -u navy-display -f

# Executar monitor manual
/usr/local/bin/monitor-navy-display
```

## 📁 Estrutura do Projeto

```
sistema-visualizacao-marinha/
├── client/                 # Frontend React
│   ├── src/
│   │   ├── components/    # Componentes reutilizáveis
│   │   ├── pages/         # Páginas da aplicação
│   │   ├── context/       # Contextos React
│   │   └── lib/           # Utilitários
│   └── public/            # Arquivos estáticos
├── server/                # Backend Express
│   ├── index.ts          # Servidor principal
│   ├── routes.ts         # Rotas da API
│   └── storage.ts        # Interface de dados
├── shared/               # Esquemas compartilhados
│   └── schema.ts         # Definições de tipos
├── teste.sh             # Testes automatizados (Bash)
├── teste_selenium.py    # Testes UI (Python/Selenium)
└── setup-oracle-linux.sh # Instalação produção
```

## 🔧 API Endpoints

### Avisos
- `GET /api/notices` - Listar avisos
- `POST /api/notices` - Criar aviso
- `PUT /api/notices/:id` - Atualizar aviso
- `DELETE /api/notices/:id` - Excluir aviso

### Documentos
- `GET /api/documents` - Listar documentos
- `POST /api/documents` - Adicionar documento
- `PUT /api/documents/:id` - Atualizar documento
- `DELETE /api/documents/:id` - Excluir documento

### Sistema
- `GET /api/health` - Verificação de saúde
- `POST /api/upload-plasa-page` - Upload página PLASA
- `POST /api/upload-escala-image` - Upload imagem Escala

## 🎨 Personalização

### Cores e Temas
As cores podem ser personalizadas no arquivo `client/src/index.css`:

```css
:root {
  --navy-blue: #1e3a8a;      /* Azul Marinha principal */
  --navy-gold: #fbbf24;      /* Dourado dos detalhes */
  --navy-dark: #0f172a;      /* Azul escuro de fundo */
}
```

### Configurações de Exibição
Ajustáveis através do painel administrativo:
- Velocidade de scroll (slow/normal/fast)
- Intervalo entre documentos (segundos)
- Delay para reinício automático

## 🔒 Segurança

### Em Produção
- Firewall configurado (portas 80, 443, SSH)
- SELinux habilitado e configurado
- Nginx como proxy reverso
- Logs estruturados e rotacionados
- Monitoramento automático de serviços

### Backup Automático
O script de deploy cria backups antes de atualizações:
```bash
# Backups armazenados em:
/var/backups/navy-display/
```

## 📱 Compatibilidade

### Navegadores Suportados
- Chrome/Chromium 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### Sistemas Operacionais
- **Desenvolvimento**: Windows, macOS, Linux
- **Produção**: Oracle Linux 8+, RHEL 8+, CentOS 8+

## 🆘 Solução de Problemas

### Problemas Comuns

#### Servidor não inicia
```bash
# Verificar porta ocupada
netstat -tulpn | grep :5000

# Verificar logs
npm run dev
```

#### PDFs não carregam
- Verificar permissões de arquivos
- Confirmar URLs dos documentos
- Checar logs do navegador (F12)

#### Tela branca no admin
```bash
# Limpar cache do navegador
# Verificar console de erros (F12)
# Reiniciar servidor
```

### Logs Importantes
```bash
# Logs do sistema (produção)
journalctl -u navy-display -f

# Logs de desenvolvimento
tail -f servidor.log

# Logs do Nginx
tail -f /var/log/nginx/error.log
```

## 🤝 Contribuição

### Desenvolvimento Local
1. Fork do repositório
2. Criar branch para feature: `git checkout -b nova-funcionalidade`
3. Commit das mudanças: `git commit -m 'Adiciona nova funcionalidade'`
4. Push para branch: `git push origin nova-funcionalidade`
5. Abrir Pull Request

### Padrões de Código
- TypeScript para toda lógica
- React com hooks para frontend
- Express para backend
- Tailwind CSS para estilos

## 📞 Suporte

Para suporte técnico ou dúvidas:
- Verificar logs do sistema
- Executar testes automatizados
- Consultar documentação da API
- Verificar issues conhecidos

## 📦 Instalação Offline

Para ambientes sem acesso à internet, use o script de empacotamento:

```bash
# Criar pacote offline (com internet)
./criar-pacote-offline.sh

# No servidor Oracle Linux (sem internet)
tar -xzf sistema-marinha-offline-*.tar.gz
cd pacote-offline-marinha
sudo ./instalar.sh
```

O pacote inclui:
- Node.js 20.x para Oracle Linux
- Todas as dependências npm
- Scripts de instalação e configuração
- Documentação completa

## 📄 Licença

Sistema desenvolvido para uso interno da Marinha do Brasil.

**Autora: 2SG Bruna Rocha**  
**Marinha do Brasil**

---

**Marinha do Brasil** - Sistema de Visualização Oficial
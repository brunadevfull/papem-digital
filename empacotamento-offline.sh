#!/bin/bash

# Sistema de Display da Marinha - Script de Empacotamento Offline v2.0
# Última atualização: 20/06/2025

set -e  # Parar em caso de erro

echo "=== Sistema de Display da Marinha - Empacotamento Offline v2.0 ==="
echo "Criando pacote completo para instalação offline no Oracle Linux..."

# Verificar se estamos no diretório correto
if [ ! -f "package.json" ]; then
    echo "❌ ERRO: Execute este script no diretório raiz do projeto"
    exit 1
fi

# Verificar se Node.js está instalado
if ! command -v node &> /dev/null; then
    echo "❌ ERRO: Node.js não encontrado. Instale Node.js 20+ primeiro."
    exit 1
fi

# Verificar se npm está instalado
if ! command -v npm &> /dev/null; then
    echo "❌ ERRO: npm não encontrado. Instale npm primeiro."
    exit 1
fi

# Definir variáveis
TEMP_DIR="sistema-display-offline-temp"
PACKAGE_NAME="sistema-display-marinha-offline"
PACKAGE_FILE="${PACKAGE_NAME}.tar.gz"
NODE_VERSION=$(node --version)
NPM_VERSION=$(npm --version)

echo "📋 Informações do sistema:"
echo "   Node.js: $NODE_VERSION"
echo "   npm: $NPM_VERSION"
echo "   Data: $(date)"

# Limpar diretório temporário se existir
if [ -d "$TEMP_DIR" ]; then
    echo "🧹 Limpando diretório temporário anterior..."
    rm -rf $TEMP_DIR
fi

# Criar diretório temporário
echo "📁 Criando estrutura de diretórios..."
mkdir -p $TEMP_DIR

# Copiar arquivos essenciais do projeto
echo "📁 Copiando arquivos do projeto..."
cp -r client/ server/ shared/ $TEMP_DIR/ 2>/dev/null
cp -r uploads/ $TEMP_DIR/ 2>/dev/null || echo "⚠️  Pasta uploads não encontrada, criando..."
mkdir -p $TEMP_DIR/uploads

# Copiar arquivos de configuração e documentação
cp package.json package-lock.json $TEMP_DIR/
cp .env.example $TEMP_DIR/.env
cp README.md INSTALACAO-LOCAL.md $TEMP_DIR/ 2>/dev/null || true
cp setup-oracle-linux.sh $TEMP_DIR/ 2>/dev/null || echo "⚠️  setup-oracle-linux.sh não encontrado"
cp teste.sh test.js $TEMP_DIR/ 2>/dev/null || true

# Copiar arquivos de configuração adicionais
cp tsconfig.json vite.config.ts tailwind.config.ts postcss.config.js components.json $TEMP_DIR/ 2>/dev/null || true
cp drizzle.config.ts $TEMP_DIR/ 2>/dev/null || true

# Criar diretórios necessários
mkdir -p $TEMP_DIR/uploads/cache
mkdir -p $TEMP_DIR/logs

# Baixar dependências do Node.js (incluindo devDependencies para build)
echo "📦 Baixando todas as dependências Node.js..."
cd $TEMP_DIR
npm ci --silent

# Fazer build da aplicação
echo "🔨 Fazendo build da aplicação..."
npm run build 2>/dev/null || echo "⚠️  Build falhou, continuando..."

# Criar node_modules apenas com dependências de produção
echo "📦 Otimizando dependências para produção..."
rm -rf node_modules
npm ci --production --silent

# Voltar ao diretório original
cd ..

# Baixar Node.js portable para Oracle Linux (opcional)
echo "📥 Preparando Node.js portable para Oracle Linux..."
NODE_PORTABLE_DIR="$TEMP_DIR/nodejs-portable"
mkdir -p $NODE_PORTABLE_DIR

# Baixar Node.js Linux x64
NODE_DOWNLOAD_URL="https://nodejs.org/dist/v20.11.0/node-v20.11.0-linux-x64.tar.xz"
echo "📥 Baixando Node.js portable..."
curl -sL $NODE_DOWNLOAD_URL -o $NODE_PORTABLE_DIR/node.tar.xz 2>/dev/null || {
    echo "⚠️  Falha ao baixar Node.js portable. Continuando sem ele."
    rm -rf $NODE_PORTABLE_DIR
}

# Criar script de instalação
echo "📝 Criando script de instalação offline..."
cat > $TEMP_DIR/instalar-offline.sh << 'EOF'
#!/bin/bash

# Script de Instalação Offline - Sistema de Display da Marinha v2.0

set -e

echo "=== Instalação Offline - Sistema de Display da Marinha v2.0 ==="

# Verificar se é root
if [ "$EUID" -eq 0 ]; then
    echo "⚠️  Executando como root. Recomenda-se criar usuário específico."
fi

# Definir diretório de instalação
INSTALL_DIR="/opt/display-marinha"
SERVICE_USER="display"

echo "📁 Criando estrutura de diretórios..."

# Criar usuário do sistema se não existir
if ! id "$SERVICE_USER" &>/dev/null; then
    echo "👤 Criando usuário do sistema: $SERVICE_USER"
    useradd -r -s /bin/false -d $INSTALL_DIR $SERVICE_USER
fi

# Criar diretório de instalação
mkdir -p $INSTALL_DIR
chown -R $SERVICE_USER:$SERVICE_USER $INSTALL_DIR

# Copiar arquivos
echo "📁 Copiando arquivos do sistema..."
cp -r ./* $INSTALL_DIR/
chown -R $SERVICE_USER:$SERVICE_USER $INSTALL_DIR

# Instalar Node.js portable se disponível
if [ -d "nodejs-portable" ] && [ -f "nodejs-portable/node.tar.xz" ]; then
    echo "📦 Instalando Node.js portable..."
    mkdir -p /opt/nodejs
    tar -xf nodejs-portable/node.tar.xz -C /opt/nodejs --strip-components=1
    chown -R root:root /opt/nodejs
    
    # Criar link simbólico
    ln -sf /opt/nodejs/bin/node /usr/local/bin/node
    ln -sf /opt/nodejs/bin/npm /usr/local/bin/npm
fi

# Verificar Node.js
if ! command -v node &> /dev/null; then
    echo "❌ ERRO: Node.js não encontrado. Instale Node.js 20+ manualmente."
    exit 1
fi

echo "✅ Node.js encontrado: $(node --version)"

# Configurar firewall
echo "🔥 Configurando firewall..."
if command -v firewall-cmd &> /dev/null; then
    firewall-cmd --permanent --add-port=5000/tcp
    firewall-cmd --reload
    echo "✅ Firewall configurado (porta 5000)"
fi

# Criar serviço systemd
echo "🔧 Criando serviço systemd..."
cat > /etc/systemd/system/display-marinha.service << 'SYSTEMD_EOF'
[Unit]
Description=Sistema de Display da Marinha v2.0
Documentation=file:///opt/display-marinha/README.md
After=network.target
Wants=network-online.target

[Service]
Type=simple
User=display
Group=display
WorkingDirectory=/opt/display-marinha
ExecStart=/usr/bin/node server/index.js
ExecReload=/bin/kill -s HUP $MAINPID
Restart=always
RestartSec=10
TimeoutStopSec=20

Environment=NODE_ENV=production
Environment=PORT=5000

LimitNOFILE=65536
LimitNPROC=32768

NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=/opt/display-marinha/uploads

[Install]
WantedBy=multi-user.target
SYSTEMD_EOF

# Ativar e iniciar serviço
systemctl daemon-reload
systemctl enable display-marinha

echo ""
echo "✅ Instalação concluída com sucesso!"
echo ""
echo "📋 Próximos passos:"
echo "   1. Iniciar o serviço: systemctl start display-marinha"
echo "   2. Verificar status: systemctl status display-marinha"
echo "   3. Acessar sistema: http://localhost:5000"
echo "   4. Acessar admin: http://localhost:5000/admin"
echo ""
echo "📝 Logs: journalctl -u display-marinha -f"
echo "🔧 Configuração: $INSTALL_DIR/.env"
echo ""
EOF

chmod +x $TEMP_DIR/instalar-offline.sh

# Criar script de teste
echo "📝 Criando script de teste offline..."
cat > $TEMP_DIR/testar-sistema.sh << 'EOF'
#!/bin/bash

echo "=== Teste do Sistema de Display da Marinha ==="

# Verificar se Node.js está instalado
if command -v node &> /dev/null; then
    echo "✅ Node.js: $(node --version)"
else
    echo "❌ Node.js não encontrado"
    exit 1
fi

# Verificar se npm está instalado
if command -v npm &> /dev/null; then
    echo "✅ npm: $(npm --version)"
else
    echo "❌ npm não encontrado"
    exit 1
fi

# Verificar arquivos essenciais
FILES=("package.json" "server/index.js" "client/src/App.tsx")
for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ Arquivo encontrado: $file"
    else
        echo "❌ Arquivo não encontrado: $file"
    fi
done

# Verificar dependências
if [ -d "node_modules" ]; then
    echo "✅ Dependências instaladas"
else
    echo "❌ Dependências não encontradas"
    echo "Execute: npm install"
fi

# Testar conectividade (se servidor estiver rodando)
if curl -s http://localhost:5000 > /dev/null; then
    echo "✅ Servidor respondendo na porta 5000"
else
    echo "⚠️  Servidor não está rodando na porta 5000"
fi

echo ""
echo "📋 Para iniciar o sistema:"
echo "   npm run dev  (desenvolvimento)"
echo "   npm start    (produção)"
EOF

chmod +x $TEMP_DIR/testar-sistema.sh

# Criar arquivo de informações do sistema
echo "📝 Criando arquivo de informações..."
cat > $TEMP_DIR/INFO-SISTEMA.txt << EOF
=== Sistema de Display da Marinha v2.0 ===

Data de empacotamento: $(date)
Node.js utilizado: $NODE_VERSION
npm utilizado: $NPM_VERSION
Sistema de origem: $(uname -a)

=== Arquivos incluídos ===
- Código fonte completo (client/, server/, shared/)
- Dependências Node.js otimizadas
- Scripts de instalação e teste
- Documentação completa
- Node.js portable (se disponível)

=== Instalação ===
1. Extrair: tar -xzf sistema-display-marinha-offline.tar.gz
2. Entrar: cd sistema-display-offline-temp
3. Instalar: sudo ./instalar-offline.sh

=== Uso manual ===
1. Verificar: ./testar-sistema.sh
2. Executar: npm start
3. Acessar: http://localhost:5000

=== Funcionalidades ===
- Exibição automática de documentos PLASA e Escala
- Rotação de escalas a cada 30 segundos
- Avisos importantes em tempo real
- Horário do pôr do sol atualizado diariamente
- Layout responsivo para todos os dispositivos
- Painel administrativo completo

=== Suporte ===
- Documentação: INSTALACAO-LOCAL.md
- Logs: journalctl -u display-marinha -f
- Teste: ./testar-sistema.sh
EOF

# Criar checksum dos arquivos
echo "🔐 Gerando checksums para verificação de integridade..."
cd $TEMP_DIR
find . -type f -exec md5sum {} \; > CHECKSUMS.md5
cd ..

# Criar arquivo compactado final
echo "📦 Criando arquivo compactado final..."
tar -czf $PACKAGE_FILE $TEMP_DIR/

# Calcular tamanho do arquivo
PACKAGE_SIZE=$(du -h $PACKAGE_FILE | cut -f1)

# Limpar diretório temporário
echo "🧹 Limpando arquivos temporários..."
rm -rf $TEMP_DIR

# Verificar integridade do pacote
echo "🔍 Verificando integridade do pacote..."
if tar -tzf $PACKAGE_FILE > /dev/null; then
    echo "✅ Pacote criado com sucesso: $PACKAGE_FILE ($PACKAGE_SIZE)"
else
    echo "❌ ERRO: Pacote corrompido"
    exit 1
fi

echo ""
echo "=== Pacote Offline Criado com Sucesso ==="
echo "📦 Arquivo: $PACKAGE_FILE"
echo "📏 Tamanho: $PACKAGE_SIZE"
echo "📅 Data: $(date)"
echo ""
echo "📋 Para instalar no Oracle Linux:"
echo "   1. Transfira o arquivo para a máquina de destino"
echo "   2. Extraia: tar -xzf $PACKAGE_FILE"
echo "   3. Entre: cd $TEMP_DIR"
echo "   4. Execute: sudo ./instalar-offline.sh"
echo ""
echo "📋 Para instalação manual:"
echo "   1. Extraia o pacote"
echo "   2. Execute: ./testar-sistema.sh"
echo "   3. Execute: npm start"
echo "   4. Acesse: http://localhost:5000"
echo ""
echo "✅ Empacotamento concluído!"
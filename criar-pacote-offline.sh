#!/bin/bash

# =============================================================================
# CRIADOR DE PACOTE OFFLINE SIMPLIFICADO
# Sistema de Visualização da Marinha do Brasil
# 
# Autor: 2SG Bruna Rocha
# Marinha do Brasil
# =============================================================================

set -e

# Cores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() {
    echo -e "${1}${2}${NC}"
}

# Diretório do pacote
PACK_DIR="pacote-offline-marinha"

log $BLUE "=== CRIANDO PACOTE OFFLINE PARA ORACLE LINUX ==="
log $BLUE "Autor: 2SG Bruna Rocha - Marinha do Brasil"

# Limpar e criar diretório
rm -rf "$PACK_DIR"
mkdir -p "$PACK_DIR"

# 1. Copiar código fonte
log $YELLOW "Copiando código fonte..."
cp -r client server shared *.json *.ts *.js *.md *.sh "$PACK_DIR/"

# 2. Instalar e empacotar dependências npm
log $YELLOW "Empacotando dependências npm..."
if [ ! -d "node_modules" ]; then
    npm install
fi
tar -czf "$PACK_DIR/node_modules.tar.gz" node_modules/

# 3. Baixar Node.js
log $YELLOW "Baixando Node.js..."
mkdir -p "$PACK_DIR/binarios"
cd "$PACK_DIR/binarios"
wget -q "https://nodejs.org/dist/v20.15.1/node-v20.15.1-linux-x64.tar.xz" || log $YELLOW "Aviso: Não foi possível baixar Node.js"
cd ../..

# 4. Criar script de instalação
log $YELLOW "Criando script de instalação..."
cat > "$PACK_DIR/instalar.sh" << 'EOF'
#!/bin/bash

# Instalação Offline - Sistema da Marinha
# Autor: 2SG Bruna Rocha

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

log() {
    echo -e "${1}${2}${NC}"
}

log $BLUE "=== INSTALAÇÃO OFFLINE - SISTEMA DA MARINHA ==="

# Verificar root
if [[ $EUID -ne 0 ]]; then
    log $RED "Execute como root: sudo ./instalar.sh"
    exit 1
fi

# Instalar Node.js se necessário
if ! command -v node &> /dev/null; then
    log $BLUE "Instalando Node.js..."
    if [ -f "binarios/node-v20.15.1-linux-x64.tar.xz" ]; then
        tar -xf binarios/node-v20.15.1-linux-x64.tar.xz -C /opt/
        ln -sf /opt/node-v*/bin/node /usr/local/bin/node
        ln -sf /opt/node-v*/bin/npm /usr/local/bin/npm
        ln -sf /opt/node-v*/bin/npx /usr/local/bin/npx
    else
        log $RED "Node.js não encontrado. Instale manualmente."
    fi
fi

# Instalar dependências do sistema
log $BLUE "Instalando dependências..."
dnf install -y git curl wget nginx firewalld python3 python3-pip || yum install -y git curl wget nginx firewalld python3 python3-pip

# Extrair dependências npm
log $BLUE "Extraindo dependências npm..."
if [ -f "node_modules.tar.gz" ]; then
    tar -xzf node_modules.tar.gz
fi

# Configurar diretório de aplicação
APP_DIR="/opt/sistema-marinha"
mkdir -p "$APP_DIR"
cp -r * "$APP_DIR/"
chown -R nobody:nobody "$APP_DIR"

# Criar serviço systemd
cat > /etc/systemd/system/sistema-marinha.service << 'SERV'
[Unit]
Description=Sistema de Visualização da Marinha
After=network.target

[Service]
Type=simple
User=nobody
WorkingDirectory=/opt/sistema-marinha
Environment=NODE_ENV=production
Environment=PORT=5000
ExecStart=/usr/local/bin/npm run start
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
SERV

systemctl daemon-reload
systemctl enable sistema-marinha

# Configurar firewall
systemctl enable firewalld
systemctl start firewalld
firewall-cmd --permanent --add-port=5000/tcp
firewall-cmd --permanent --add-port=80/tcp
firewall-cmd --reload

log $GREEN "=== INSTALAÇÃO CONCLUÍDA ==="
log $BLUE "Para iniciar: systemctl start sistema-marinha"
log $BLUE "Para verificar: systemctl status sistema-marinha"

EOF

chmod +x "$PACK_DIR/instalar.sh"

# 5. Criar documentação
log $YELLOW "Criando documentação..."
cat > "$PACK_DIR/INSTALACAO.md" << 'EOF'
# Sistema de Visualização da Marinha do Brasil
**Instalação Offline para Oracle Linux**

**Autor: 2SG Bruna Rocha**  
**Marinha do Brasil**

## Instalação Rápida

1. Copie a pasta para o servidor Oracle Linux
2. Execute como root:
   ```bash
   sudo ./instalar.sh
   ```

## Inicialização

```bash
# Iniciar serviço
sudo systemctl start sistema-marinha

# Verificar status
sudo systemctl status sistema-marinha

# Ver logs
sudo journalctl -u sistema-marinha -f
```

## Acesso

- Sistema: http://servidor:5000
- Admin: http://servidor:5000/admin

## Comandos Úteis

```bash
# Parar serviço
sudo systemctl stop sistema-marinha

# Reiniciar serviço
sudo systemctl restart sistema-marinha

# Executar testes
cd /opt/sistema-marinha
./teste.sh
```

## Suporte

Consulte o README.md para documentação completa e solução de problemas.

---
**Marinha do Brasil** - Sistema Oficial
EOF

# 6. Compactar tudo
log $YELLOW "Compactando pacote final..."
tar -czf "sistema-marinha-offline-$(date +%Y%m%d).tar.gz" "$PACK_DIR"

log $GREEN "=== PACOTE CRIADO COM SUCESSO ==="
log $GREEN "Arquivo: sistema-marinha-offline-$(date +%Y%m%d).tar.gz"
log $GREEN "Tamanho: $(du -h sistema-marinha-offline-$(date +%Y%m%d).tar.gz | cut -f1)"
log $BLUE "Pronto para instalação offline no Oracle Linux!"
#!/bin/bash

# =============================================================================
# SISTEMA DE VISUALIZAÇÃO DA MARINHA DO BRASIL
# Script de Empacotamento para Instalação Offline no Oracle Linux
# 
# Autor: 2SG Bruna Rocha
# Criado para instalação em ambientes sem acesso à internet
# =============================================================================

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configurações
PACKAGE_DIR="pacotes-oracle-linux"
NODE_VERSION="20"
CURRENT_DIR=$(pwd)

log() {
    local cor=$1
    local mensagem=$2
    echo -e "${cor}${mensagem}${NC}"
}

# Função para baixar Node.js
baixar_nodejs() {
    log $BLUE "Baixando Node.js ${NODE_VERSION} para Oracle Linux..."
    
    mkdir -p ${PACKAGE_DIR}/nodejs
    cd ${PACKAGE_DIR}/nodejs
    
    # Download Node.js binário
    wget -q "https://nodejs.org/dist/v${NODE_VERSION}.15.1/node-v${NODE_VERSION}.15.1-linux-x64.tar.xz"
    
    # Download RPMs para Oracle Linux
    wget -q "https://rpm.nodesource.com/pub_${NODE_VERSION}.x/nodistro/repo/nodesource-release-nodistro-1.noarch.rpm"
    
    cd ${CURRENT_DIR}
    log $GREEN "Node.js baixado com sucesso"
}

# Função para baixar dependências do sistema
baixar_dependencias_sistema() {
    log $BLUE "Baixando dependências do sistema..."
    
    mkdir -p ${PACKAGE_DIR}/system-deps
    cd ${PACKAGE_DIR}/system-deps
    
    # Lista de pacotes necessários
    local pacotes=(
        "git"
        "curl" 
        "wget"
        "unzip"
        "nginx"
        "firewalld"
        "policycoreutils-python-utils"
        "python3"
        "python3-pip"
        "gcc"
        "gcc-c++"
        "make"
        "openssl-devel"
    )
    
    # Criar script de download de RPMs
    cat > download-rpms.sh << 'EOF'
#!/bin/bash
# Script para baixar RPMs necessários

PACKAGES=(
    "git"
    "curl"
    "wget" 
    "unzip"
    "nginx"
    "firewalld"
    "policycoreutils-python-utils"
    "python3"
    "python3-pip"
    "gcc"
    "gcc-c++"
    "make"
    "openssl-devel"
)

for package in "${PACKAGES[@]}"; do
    echo "Baixando $package..."
    yumdownloader --resolve --destdir=. $package || true
done
EOF
    
    chmod +x download-rpms.sh
    
    cd ${CURRENT_DIR}
    log $GREEN "Scripts de download de dependências criados"
}

# Função para baixar Chrome e ChromeDriver
baixar_chrome() {
    log $BLUE "Baixando Google Chrome e ChromeDriver..."
    
    mkdir -p ${PACKAGE_DIR}/chrome
    cd ${PACKAGE_DIR}/chrome
    
    # Download Chrome RPM
    wget -q "https://dl.google.com/linux/direct/google-chrome-stable_current_x86_64.rpm"
    
    # Download ChromeDriver
    CHROME_VERSION="119.0.6045.105"
    wget -q "https://chromedriver.storage.googleapis.com/LATEST_RELEASE_119" -O chrome-version.txt
    CHROMEDRIVER_VERSION=$(cat chrome-version.txt)
    wget -q "https://chromedriver.storage.googleapis.com/${CHROMEDRIVER_VERSION}/chromedriver_linux64.zip"
    
    cd ${CURRENT_DIR}
    log $GREEN "Chrome e ChromeDriver baixados"
}

# Função para empacotar dependências npm
empacotar_npm() {
    log $BLUE "Empacotando dependências npm..."
    
    # Instalar dependências localmente
    if [ ! -d "node_modules" ]; then
        npm install
    fi
    
    # Criar arquivo tar das dependências
    mkdir -p ${PACKAGE_DIR}/npm
    tar -czf ${PACKAGE_DIR}/npm/node_modules.tar.gz node_modules/
    cp package.json ${PACKAGE_DIR}/npm/
    cp package-lock.json ${PACKAGE_DIR}/npm/
    
    log $GREEN "Dependências npm empacotadas"
}

# Função para baixar dependências Python
baixar_python_deps() {
    log $BLUE "Baixando dependências Python..."
    
    mkdir -p ${PACKAGE_DIR}/python
    cd ${PACKAGE_DIR}/python
    
    # Baixar wheels necessários
    pip3 download selenium requests
    
    cd ${CURRENT_DIR}
    log $GREEN "Dependências Python baixadas"
}

# Função para criar script de instalação offline
criar_script_instalacao() {
    log $BLUE "Criando script de instalação offline..."
    
    cat > ${PACKAGE_DIR}/instalar-offline.sh << 'EOF'
#!/bin/bash

# =============================================================================
# INSTALAÇÃO OFFLINE - SISTEMA DE VISUALIZAÇÃO DA MARINHA
# Autor: 2SG Bruna Rocha
# =============================================================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${1}${2}${NC}"
}

# Verificar se está rodando como root
if [[ $EUID -ne 0 ]]; then
    log $RED "Este script deve ser executado como root (use sudo)"
    exit 1
fi

log $BLUE "Iniciando instalação offline do Sistema da Marinha..."

# Instalar Node.js
log $YELLOW "Instalando Node.js..."
cd nodejs
tar -xf node-v*.tar.xz -C /opt/
ln -sf /opt/node-v*/bin/node /usr/local/bin/node
ln -sf /opt/node-v*/bin/npm /usr/local/bin/npm
ln -sf /opt/node-v*/bin/npx /usr/local/bin/npx
cd ..

# Instalar dependências do sistema
log $YELLOW "Instalando dependências do sistema..."
cd system-deps
rpm -Uvh --force --nodeps *.rpm || true
cd ..

# Instalar Chrome
log $YELLOW "Instalando Google Chrome..."
cd chrome
rpm -Uvh google-chrome-stable_current_x86_64.rpm || true
unzip -o chromedriver_linux64.zip
mv chromedriver /usr/local/bin/
chmod +x /usr/local/bin/chromedriver
cd ..

# Instalar dependências Python
log $YELLOW "Instalando dependências Python..."
cd python
pip3 install --no-index --find-links . selenium requests
cd ..

log $GREEN "Instalação offline concluída!"
log $BLUE "Configure o sistema com: ./setup-oracle-linux.sh"

EOF
    
    chmod +x ${PACKAGE_DIR}/instalar-offline.sh
    
    log $GREEN "Script de instalação offline criado"
}

# Função para criar documentação
criar_documentacao() {
    log $BLUE "Criando documentação de instalação..."
    
    cat > ${PACKAGE_DIR}/INSTALACAO-OFFLINE.md << 'EOF'
# Instalação Offline - Sistema de Visualização da Marinha

## Autor
**2SG Bruna Rocha**  
Sistema de Visualização para Unidades da Marinha do Brasil

## Pré-requisitos
- Oracle Linux 8+ ou RHEL 8+
- Acesso root ao sistema
- Mínimo 2GB de espaço livre

## Instruções de Instalação

### 1. Transferir Arquivos
Copie toda a pasta `pacotes-oracle-linux` para o servidor Oracle Linux:

```bash
# Exemplo usando scp
scp -r pacotes-oracle-linux root@servidor-marinha:/tmp/
```

### 2. Executar Instalação
No servidor Oracle Linux, execute:

```bash
cd /tmp/pacotes-oracle-linux
sudo ./instalar-offline.sh
```

### 3. Configurar Sistema
Após a instalação das dependências:

```bash
# Copiar código fonte do sistema
# Executar configuração completa
sudo ./setup-oracle-linux.sh
```

## Conteúdo do Pacote

- **nodejs/**: Node.js 20.x para Oracle Linux
- **system-deps/**: RPMs das dependências do sistema
- **chrome/**: Google Chrome e ChromeDriver para testes
- **npm/**: Dependências JavaScript empacotadas
- **python/**: Bibliotecas Python para automação

## Solução de Problemas

### Dependências em Conflito
Se houver conflitos de RPM:
```bash
rpm -Uvh --force --nodeps *.rpm
```

### Permissões
Verificar permissões dos executáveis:
```bash
chmod +x /usr/local/bin/node
chmod +x /usr/local/bin/chromedriver
```

### Firewall
Configurar portas necessárias:
```bash
firewall-cmd --permanent --add-port=5000/tcp
firewall-cmd --permanent --add-port=80/tcp
firewall-cmd --reload
```

## Suporte
Para problemas técnicos, consulte os logs do sistema e execute os testes automatizados fornecidos.

---
**Marinha do Brasil** - Sistema de Visualização Oficial
EOF
    
    log $GREEN "Documentação criada"
}

# Função principal
main() {
    log $BLUE "=== EMPACOTAMENTO OFFLINE - SISTEMA DA MARINHA ==="
    log $BLUE "Autor: 2SG Bruna Rocha"
    log $BLUE "=================================================="
    
    # Limpar diretório anterior se existir
    if [ -d "$PACKAGE_DIR" ]; then
        log $YELLOW "Removendo pacote anterior..."
        rm -rf "$PACKAGE_DIR"
    fi
    
    mkdir -p "$PACKAGE_DIR"
    
    # Executar empacotamento
    baixar_nodejs
    baixar_dependencias_sistema
    baixar_chrome
    empacotar_npm
    baixar_python_deps
    criar_script_instalacao
    criar_documentacao
    
    # Copiar scripts principais
    log $BLUE "Copiando scripts do sistema..."
    cp setup-oracle-linux.sh ${PACKAGE_DIR}/
    cp teste.sh ${PACKAGE_DIR}/
    cp teste_selenium.py ${PACKAGE_DIR}/
    cp README.md ${PACKAGE_DIR}/
    
    # Criar arquivo compactado final
    log $BLUE "Criando arquivo final..."
    tar -czf sistema-marinha-offline.tar.gz ${PACKAGE_DIR}/
    
    log $GREEN "=== EMPACOTAMENTO CONCLUÍDO ==="
    log $GREEN "Arquivo criado: sistema-marinha-offline.tar.gz"
    log $GREEN "Tamanho: $(du -h sistema-marinha-offline.tar.gz | cut -f1)"
    log $YELLOW "Para instalar: extraia o arquivo e execute ./instalar-offline.sh"
}

# Verificar ferramentas necessárias
if ! command -v wget &> /dev/null; then
    log $RED "wget não encontrado. Instale: sudo dnf install wget"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    log $RED "npm não encontrado. Instale Node.js primeiro."
    exit 1
fi

# Executar empacotamento
main "$@"
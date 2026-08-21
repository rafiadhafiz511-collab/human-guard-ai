#!/bin/bash
# Quick Deploy to DigitalOcean Droplet
# This script automates the entire deployment process

set -e

echo "=========================================="
echo "Human Tech Smart Home - DigitalOcean Deploy"
echo "=========================================="

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   echo -e "${RED}This script must be run as root (use sudo)${NC}"
   exit 1
fi

echo -e "${GREEN}[1/7]${NC} Updating system packages..."
apt update && apt upgrade -y

echo -e "${GREEN}[2/7]${NC} Installing Docker..."
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
rm get-docker.sh

echo -e "${GREEN}[3/7]${NC} Installing Docker Compose..."
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" \
  -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

echo -e "${GREEN}[4/7]${NC} Installing Git..."
apt install -y git

echo -e "${GREEN}[5/7]${NC} Cloning repository..."
cd /opt || mkdir -p /opt && cd /opt
git clone https://github.com/yourusername/human-guard-ai.git
cd human-guard-ai

echo -e "${YELLOW}[6/7]${NC} Please configure .env.production:"
echo "Edit /opt/human-guard-ai/.env.production with your settings:"
echo "- DATABASE_URL"
echo "- REDIS_URL"
echo "- SECRET_KEY"
echo "- ALLOWED_ORIGINS"
echo ""
echo "Press Enter when ready..."
read

# Check if .env.production exists and is configured
if [ ! -f ".env.production" ]; then
    cp .env.production .env.production
fi

echo -e "${GREEN}[7/7]${NC} Starting deployment..."
chmod +x deploy.sh
./deploy.sh deploy

echo ""
echo -e "${GREEN}✅ Deployment Complete!${NC}"
echo "Frontend: http://$(hostname -I | awk '{print $1}')"
echo "Backend Health: http://$(hostname -I | awk '{print $1}'):8000/health"
echo ""
echo "Next: Configure your domain and SSL/TLS in docker-compose.prod.yml"

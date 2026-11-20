#!/bin/bash

##############################################################################
# PRODUCTION DEPLOYMENT SCRIPT
# Human Tech Smart Home System
# 
# Usage:
#   ./deploy.sh                 # Full deployment
#   ./deploy.sh build           # Build images only
#   ./deploy.sh start           # Start containers
#   ./deploy.sh stop            # Stop containers
#   ./deploy.sh restart         # Restart containers
#   ./deploy.sh logs            # View logs
#   ./deploy.sh status          # Check status
#   ./deploy.sh clean           # Stop and remove containers
##############################################################################

set -e  # Exit on error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DOCKER_COMPOSE_FILE="docker-compose.prod.yml"
ENV_FILE=".env.production"
PROJECT_NAME="human-guard-ai"

##############################################################################
# UTILITY FUNCTIONS
##############################################################################

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_requirements() {
    log_info "Checking requirements..."
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    # Check .env.production file
    if [ ! -f "$ENV_FILE" ]; then
        log_error ".env.production file not found!"
        log_info "Creating .env.production from template..."
        cp .env.production.example "$ENV_FILE" 2>/dev/null || log_warning "Could not copy template. Please create .env.production manually."
        exit 1
    fi
    
    log_success "All requirements met!"
}

##############################################################################
# MAIN FUNCTIONS
##############################################################################

build_images() {
    log_info "Building Docker images..."
    docker-compose -f "$DOCKER_COMPOSE_FILE" --env-file "$ENV_FILE" build --no-cache
    log_success "Images built successfully!"
}

start_containers() {
    log_info "Starting containers..."
    docker-compose -f "$DOCKER_COMPOSE_FILE" --env-file "$ENV_FILE" up -d
    
    # Wait for services to be healthy
    log_info "Waiting for services to become healthy..."
    sleep 10
    
    # Check health
    log_info "Checking service health..."
    docker-compose -f "$DOCKER_COMPOSE_FILE" --env-file "$ENV_FILE" ps
    
    log_success "Containers started successfully!"
    log_info "Frontend: http://localhost:80"
    log_info "Backend Health: http://localhost:8000/health"
}

stop_containers() {
    log_info "Stopping containers..."
    docker-compose -f "$DOCKER_COMPOSE_FILE" --env-file "$ENV_FILE" down
    log_success "Containers stopped!"
}

restart_containers() {
    log_info "Restarting containers..."
    docker-compose -f "$DOCKER_COMPOSE_FILE" --env-file "$ENV_FILE" restart
    log_success "Containers restarted!"
}

view_logs() {
    log_info "Viewing logs (press Ctrl+C to exit)..."
    docker-compose -f "$DOCKER_COMPOSE_FILE" --env-file "$ENV_FILE" logs -f
}

view_service_logs() {
    local service=$1
    if [ -z "$service" ]; then
        view_logs
    else
        log_info "Viewing logs for $service (press Ctrl+C to exit)..."
        docker-compose -f "$DOCKER_COMPOSE_FILE" --env-file "$ENV_FILE" logs -f "$service"
    fi
}

check_status() {
    log_info "Checking container status..."
    docker-compose -f "$DOCKER_COMPOSE_FILE" --env-file "$ENV_FILE" ps
    
    log_info "Checking service health..."
    echo ""
    log_info "Backend health check:"
    curl -s http://localhost:8000/health | jq . || echo "Backend not responding"
    
    echo ""
    log_info "Frontend check:"
    curl -s http://localhost/ | head -20 || echo "Frontend not responding"
}

clean_deployment() {
    log_warning "This will stop and remove all containers. Continue? (y/N)"
    read -r response
    if [[ "$response" != "y" ]]; then
        log_info "Cancelled."
        return
    fi
    
    log_info "Stopping and removing containers..."
    docker-compose -f "$DOCKER_COMPOSE_FILE" --env-file "$ENV_FILE" down -v
    log_success "Deployment cleaned!"
}

prune_system() {
    log_warning "This will remove unused Docker images and volumes. Continue? (y/N)"
    read -r response
    if [[ "$response" != "y" ]]; then
        log_info "Cancelled."
        return
    fi
    
    log_info "Pruning Docker system..."
    docker system prune -af
    log_success "System pruned!"
}

migrate_database() {
    log_info "Running database migrations..."
    docker-compose -f "$DOCKER_COMPOSE_FILE" --env-file "$ENV_FILE" exec backend \
        alembic upgrade head
    log_success "Database migration completed!"
}

backup_database() {
    BACKUP_DIR="backups"
    BACKUP_FILE="${BACKUP_DIR}/backup_$(date +%Y%m%d_%H%M%S).sql"
    
    mkdir -p "$BACKUP_DIR"
    
    log_info "Backing up database to $BACKUP_FILE..."
    docker-compose -f "$DOCKER_COMPOSE_FILE" --env-file "$ENV_FILE" exec -T postgres \
        pg_dump -U postgres human_guard_ai > "$BACKUP_FILE"
    
    log_success "Database backup completed: $BACKUP_FILE"
}

full_deployment() {
    log_info "Starting full production deployment..."
    
    check_requirements
    build_images
    start_containers
    migrate_database
    check_status
    
    log_success "Deployment completed successfully!"
    log_info ""
    log_info "Next steps:"
    log_info "1. Verify all services are running: $0 status"
    log_info "2. Check frontend: http://localhost"
    log_info "3. Check backend health: http://localhost:8000/health"
    log_info "4. Configure your domain in .env.production"
    log_info "5. Set up SSL/HTTPS (uncomment in docker-compose.prod.yml)"
}

##############################################################################
# COMMAND HANDLER
##############################################################################

COMMAND=${1:-deploy}

case "$COMMAND" in
    build)
        check_requirements
        build_images
        ;;
    start)
        check_requirements
        start_containers
        ;;
    stop)
        stop_containers
        ;;
    restart)
        restart_containers
        ;;
    logs)
        view_service_logs "$2"
        ;;
    status)
        check_status
        ;;
    clean)
        clean_deployment
        ;;
    prune)
        prune_system
        ;;
    migrate)
        migrate_database
        ;;
    backup)
        backup_database
        ;;
    deploy)
        full_deployment
        ;;
    *)
        echo "Human Tech Smart Home - Production Deployment Script"
        echo ""
        echo "Usage: $0 [COMMAND]"
        echo ""
        echo "Commands:"
        echo "  deploy                   Full deployment (build, start, migrate)"
        echo "  build                    Build Docker images"
        echo "  start                    Start containers"
        echo "  stop                     Stop containers"
        echo "  restart                  Restart containers"
        echo "  logs [service]           View logs (optional: specify service)"
        echo "  status                   Check deployment status"
        echo "  migrate                  Run database migrations"
        echo "  backup                   Backup database"
        echo "  clean                    Stop and remove containers"
        echo "  prune                    Remove unused Docker resources"
        echo ""
        echo "Examples:"
        echo "  $0 deploy                # Full deployment"
        echo "  $0 logs backend          # View backend logs"
        echo "  $0 status                # Check status"
        exit 0
        ;;
esac

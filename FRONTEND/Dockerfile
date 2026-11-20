# ============================================================
# STAGE 1: BUILD
# ============================================================
FROM node:20-alpine as builder

WORKDIR /app

# Copy package files
COPY FRONTEND/human-guard-dashboard/package.json package-lock.json* ./

# Install dependencies
RUN npm install

# Copy source code
COPY FRONTEND/human-guard-dashboard/ .

# Build the application
RUN npm run build

# ============================================================
# STAGE 2: NGINX RUNTIME
# ============================================================
FROM nginx:alpine

# Copy custom nginx configuration
COPY docker/nginx.conf /etc/nginx/nginx.conf
COPY docker/default.conf /etc/nginx/conf.d/default.conf

# Copy built application from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Create nginx log directory
RUN mkdir -p /var/log/nginx && \
    chown -R nginx:nginx /var/log/nginx && \
    chown -R nginx:nginx /usr/share/nginx/html

# Add health check script
COPY docker/health-check.sh /
RUN chmod +x /health-check.sh

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD /health-check.sh

# Expose port
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]

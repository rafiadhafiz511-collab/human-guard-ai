#!/bin/ash
# Health check script for Nginx frontend container

# Check if nginx is running
if ! pgrep -x "nginx" > /dev/null; then
    echo "Nginx process not running"
    exit 1
fi

# Check if nginx can serve requests
if ! wget -q -O- http://localhost/ > /dev/null 2>&1; then
    echo "Nginx not responding to requests"
    exit 1
fi

echo "Frontend health check passed"
exit 0

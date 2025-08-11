# SkyStage Platform - Installation Guide

## 🚀 Complete Self-Hosted Drone Show Platform

This is a full-stack SkyStage platform clone with admin interface, user management, payment processing, and complete backend functionality.

## 📋 System Requirements

### Minimum Requirements
- **Node.js**: 18.0 or higher
- **RAM**: 2GB minimum, 4GB recommended
- **Storage**: 10GB free space
- **OS**: Linux, macOS, or Windows

### Recommended Server Specs
- **CPU**: 2+ cores
- **RAM**: 8GB
- **Storage**: 50GB SSD
- **OS**: Ubuntu 20.04 LTS or CentOS 8

## 🛠️ Installation Steps

### 1. Clone and Setup

```bash
# Clone the repository
git clone <your-repository-url>
cd skystage-clone

# Install dependencies
npm install
# or
bun install
```

### 2. Environment Configuration

Create `.env.local` file in the root directory:

```bash
# Database Configuration
DATABASE_URL=./data/skystage.db

# JWT Configuration (CHANGE IN PRODUCTION!)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Email Configuration (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Payment Configuration (Optional - for Stripe)
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key

# Site Configuration
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NODE_ENV=production
```

### 3. Database Initialization

```bash
# Initialize the database with sample data
npm run db:init

# This creates:
# - All necessary tables
# - Admin user (admin@skystage.local / admin123)
# - Sample formations
# - Database indexes
```

### 4. Build and Start

```bash
# Build the application
npm run build

# Start the production server
npm start

# The application will be available at http://localhost:3000
```

## 🔧 Development Setup

For development environment:

```bash
# Install dependencies
npm install

# Initialize database
npm run db:init

# Start development server
npm run dev

# Available at http://localhost:3000
```

## 👨‍💼 Default Admin Access

After initialization, you can access the admin panel:

- **URL**: `http://localhost:3000/admin`
- **Email**: `admin@skystage.local`
- **Password**: `admin123`

**⚠️ IMPORTANT**: Change the admin password immediately in production!

## 🐳 Docker Deployment (Recommended)

Create `Dockerfile`:

```dockerfile
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application code
COPY . .

# Build the application
RUN npm run build

# Create data directory
RUN mkdir -p data

# Expose port
EXPOSE 3000

# Initialize database and start
CMD ["sh", "-c", "npm run db:init && npm start"]
```

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  skystage:
    build: .
    ports:
      - "3000:3000"
    volumes:
      - ./data:/app/data
      - ./uploads:/app/uploads
    environment:
      - NODE_ENV=production
      - JWT_SECRET=your-super-secret-jwt-key
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - skystage
    restart: unless-stopped
```

Deploy with Docker:

```bash
# Build and start
docker-compose up -d

# View logs
docker-compose logs -f skystage
```

## 🌐 Production Deployment

### Nginx Configuration

Create `/etc/nginx/sites-available/skystage`:

```nginx
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /path/to/your/certificate.crt;
    ssl_certificate_key /path/to/your/private.key;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    location /uploads/ {
        alias /path/to/your/app/uploads/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### SSL Certificate (Let's Encrypt)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

### PM2 Process Manager

```bash
# Install PM2
npm install -g pm2

# Create ecosystem file
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'skystage',
    script: 'npm',
    args: 'start',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
}
EOF

# Start with PM2
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup auto-start on boot
pm2 startup
```

## 📁 Directory Structure

```
skystage-clone/
├── src/
│   ├── app/                 # Next.js app directory
│   │   ├── api/            # API routes
│   │   ├── admin/          # Admin interface pages
│   │   ├── auth/           # Authentication pages
│   │   └── globals.css     # Global styles
│   ├── components/         # React components
│   │   ├── admin/         # Admin-specific components
│   │   └── ui/            # UI components
│   └── lib/               # Utility libraries
│       ├── auth.ts        # Authentication utilities
│       ├── db.ts          # Database utilities
│       └── utils.ts       # General utilities
├── scripts/               # Database and utility scripts
├── data/                  # SQLite database files
├── uploads/              # User uploaded files
├── public/               # Static assets
└── docs/                 # Documentation
```

## 🗄️ Database Schema

The platform uses SQLite with the following main tables:

- **users** - User accounts and profiles
- **formations** - Drone formations library
- **bookings** - Show booking requests
- **shows** - Complete drone shows
- **analytics** - Platform usage analytics
- **payments** - Payment transactions
- **email_subscriptions** - Newsletter subscriptions

## 🔐 Security Considerations

### JWT Secret
```bash
# Generate a secure JWT secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### File Uploads
- Configure file size limits
- Validate file types
- Use virus scanning if needed

### Database Security
- Regular backups
- Access control
- Encryption at rest (for sensitive data)

### Rate Limiting
The platform includes basic rate limiting. For production, consider:
- Nginx rate limiting
- CloudFlare protection
- DDoS protection

## 🔄 Backup and Maintenance

### Database Backup
```bash
# Create backup
sqlite3 data/skystage.db ".backup backup-$(date +%Y%m%d).db"

# Restore backup
sqlite3 data/skystage.db ".restore backup-20231201.db"
```

### Log Management
```bash
# Rotate logs with logrotate
sudo nano /etc/logrotate.d/skystage
```

### Updates
```bash
# Pull updates
git pull origin main

# Install new dependencies
npm install

# Run database migrations (if any)
npm run db:migrate

# Rebuild and restart
npm run build
pm2 restart skystage
```

## 📊 Monitoring

### System Monitoring
- CPU and memory usage
- Disk space
- Network connectivity
- Database performance

### Application Monitoring
- Error rates
- Response times
- User registrations
- Booking conversion rates

### Log Monitoring
```bash
# View application logs
pm2 logs skystage

# View system logs
sudo journalctl -u nginx
```

## 🐛 Troubleshooting

### Common Issues

1. **Database locked error**
   ```bash
   # Stop all processes using the database
   pm2 stop skystage
   # Wait a few seconds
   pm2 start skystage
   ```

2. **Port already in use**
   ```bash
   # Find process using port 3000
   lsof -i :3000
   # Kill the process
   kill -9 <PID>
   ```

3. **Permission errors**
   ```bash
   # Fix file permissions
   sudo chown -R $USER:$USER .
   chmod +x scripts/*.js
   ```

### Support

For technical support:
- Check the logs first: `pm2 logs skystage`
- Review the error messages
- Check system resources
- Verify environment variables

## 🚀 Performance Optimization

### Caching
- Enable Redis for session storage
- Use CDN for static assets
- Implement application-level caching

### Database Optimization
- Regular VACUUM operations
- Index optimization
- Query optimization

### Server Optimization
- Enable gzip compression
- Optimize images
- Use HTTP/2
- Enable browser caching

## 📈 Scaling

### Horizontal Scaling
- Load balancer (Nginx/HAProxy)
- Multiple application instances
- Database clustering
- CDN for static assets

### Vertical Scaling
- Increase server resources
- Optimize database performance
- Code optimization

---

## 🎉 Congratulations!

Your SkyStage platform is now ready!

Access your platform at: `http://localhost:3000`
Admin panel at: `http://localhost:3000/admin`

For questions or support, refer to the troubleshooting section above.

**Remember to change default passwords and configure security settings for production use!**

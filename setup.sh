#!/bin/bash

echo "Setting up PayPips Backend..."

# Create NestJS project
npx @nestjs/cli new paypips-backend
cd paypips-backend

# Install core dependencies
echo "Installing dependencies..."
pnpm install @nestjs/config @nestjs/jwt @nestjs/passport passport passport-jwt
pnpm install @supabase/supabase-js
pnpm install @nestjs/typeorm typeorm pg
pnpm install class-validator class-transformer
pnpm install @nestjs/bull bull bullmq ioredis
pnpm install @nestjs/schedule
pnpm install axios

# Install dev dependencies
pnpm install -D @types/passport-jwt @types/node

# Create project structure
echo "Creating folder structure..."
mkdir -p src/modules/{auth,organizations,users,customers,plans,subscriptions,invoices,payments,notifications,analytics}
mkdir -p src/common/{decorators,filters,guards,interceptors,pipes,utils}
mkdir -p src/config
mkdir -p src/database/{migrations,seeds}

# Create .env file
echo "Creating .env file..."
cat > .env << 'EOF'
# App Config
NODE_ENV=development
PORT=3000
API_PREFIX=api/v1

# Supabase Config
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_KEY=your_service_role_key

# JWT Config
JWT_SECRET=your-secret-jwt-key
JWT_EXPIRATION=7d
`
# Paystack Config
PAYSTACK_SECRET_KEY=your_paystack_secret_key
PAYSTACK_PUBLIC_KEY=your_paystack_public_key
PAYSTACK_WEBHOOK_SECRET=your_webhook_secret

# Redis Config
REDIS_HOST=localhosts
REDIS_PORT=6379

# Email Config (for notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5173
EOF

# Create docker-compose for Redis
echo "Creating docker-compose.yml..."
cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes

volumes:
  redis_data:
EOF

# Create .env.example
cp .env .env.example

# Update .gitignore
cat >> .gitignore << 'EOF'

# Environment
.env
.env.local

# IDE
.vscode/*
!.vscode/extensions.json
.idea/
EOF

echo "Setup complete!"
echo ""
echo "Next steps:"
echo "1. Update .env with your Supabase credentials"
echo "2. Update .env with your Paystack API keys"
echo "3. Run 'docker-compose up -d' to start Redis"
echo "4. Run 'pnpm start:dev' to start the development server"
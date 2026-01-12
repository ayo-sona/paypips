#!/bin/bash

# PayPips Security Features Setup Script

echo "========================================="
echo "PayPips Security Setup"
echo "========================================="

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# ============================================
# 1. Test Security Features
# ============================================
cat > test-security-api.sh << 'EOF'
#!/bin/bash

# Security Testing Script

BASE_URL="http://localhost:4000/api/v1"
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "========================================="
echo "Testing Security Features"
echo "========================================="

# ============================================
# 1. Test Rate Limiting on Login
# ============================================
echo -e "\n${YELLOW}1. Testing Rate Limiting (Login)${NC}"
echo "Sending 10 rapid login requests..."

success_count=0
rate_limited_count=0

for i in {1..10}; do
  response=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"wrong"}')
  
  status_code=$(echo "$response" | tail -n 1)
  
  if [ "$status_code" == "429" ]; then
    rate_limited_count=$((rate_limited_count + 1))
  else
    success_count=$((success_count + 1))
  fi
  
  sleep 0.1
done

echo "Requests allowed: $success_count"
echo "Requests rate-limited: $rate_limited_count"

if [ $rate_limited_count -gt 0 ]; then
  echo -e "${GREEN}✓ Rate limiting is working${NC}"
else
  echo -e "${RED}✗ Rate limiting not working${NC}"
fi

# ============================================
# 2. Test Refresh Token Flow
# ============================================
echo -e "\n${YELLOW}2. Testing Refresh Token Flow${NC}"

# Register new user
echo "Registering test user..."
REGISTER_RESPONSE=$(curl -s -c cookies.txt -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "organizationName": "Security Test Org",
    "organizationEmail": "sectest@example.com",
    "firstName": "Test",
    "lastName": "User",
    "email": "sectest@example.com",
    "password": "SecurePass123!"
  }')

ACCESS_TOKEN=$(echo $REGISTER_RESPONSE | jq -r '.data.access_token')

if [ "$ACCESS_TOKEN" != "null" ]; then
  echo -e "${GREEN}✓ Registration successful${NC}"
  echo -e "${GREEN}✓ Access token received${NC}"
  
  # Check if cookie was set
  if grep -q "refreshToken" cookies.txt; then
    echo -e "${GREEN}✓ Refresh token cookie set${NC}"
  else
    echo -e "${RED}✗ Refresh token cookie NOT set${NC}"
  fi
else
  echo -e "${RED}✗ Registration failed${NC}"
fi

# Test refresh endpoint
echo "Testing refresh token..."
REFRESH_RESPONSE=$(curl -s -b cookies.txt -c cookies.txt -X POST "$BASE_URL/auth/refresh")

NEW_ACCESS_TOKEN=$(echo $REFRESH_RESPONSE | jq -r '.data.access_token')

if [ "$NEW_ACCESS_TOKEN" != "null" ]; then
  echo -e "${GREEN}✓ Refresh token successful${NC}"
  echo -e "${GREEN}✓ New access token received${NC}"
else
  echo -e "${RED}✗ Refresh token failed${NC}"
fi

# Test logout
echo "Testing logout..."
LOGOUT_RESPONSE=$(curl -s -b cookies.txt -X POST "$BASE_URL/auth/logout" \
  -H "Authorization: Bearer $NEW_ACCESS_TOKEN")

if echo $LOGOUT_RESPONSE | grep -q "Logged out successfully"; then
  echo -e "${GREEN}✓ Logout successful${NC}"
else
  echo -e "${RED}✗ Logout failed${NC}"
fi

# Cleanup
rm -f cookies.txt

# ============================================
# 3. Test Token Expiration
# ============================================
echo -e "\n${YELLOW}3. Testing Token Security${NC}"

# Try to use expired/invalid token
INVALID_RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL/organizations/me" \
  -H "Authorization: Bearer invalid_token_here")

STATUS=$(echo "$INVALID_RESPONSE" | tail -n 1)

if [ "$STATUS" == "401" ]; then
  echo -e "${GREEN}✓ Invalid tokens are rejected${NC}"
else
  echo -e "${RED}✗ Invalid tokens not rejected properly${NC}"
fi

# ============================================
# 4. Test CORS
# ============================================
echo -e "\n${YELLOW}4. Testing CORS${NC}"

CORS_RESPONSE=$(curl -s -H "Origin: http://evil-site.com" \
  -H "Access-Control-Request-Method: POST" \
  -X OPTIONS "$BASE_URL/auth/login")

if echo "$CORS_RESPONSE" | grep -q "Access-Control-Allow-Origin"; then
  echo -e "${YELLOW}⚠ CORS headers present (check if origin is restricted)${NC}"
else
  echo -e "${GREEN}✓ CORS properly configured${NC}"
fi

# ============================================
# 5. Test Security Headers
# ============================================
echo -e "\n${YELLOW}5. Testing Security Headers (Helmet)${NC}"

HEADERS=$(curl -s -I "$BASE_URL/auth/profile")

headers_found=0

if echo "$HEADERS" | grep -q "X-Content-Type-Options"; then
  echo -e "${GREEN}✓ X-Content-Type-Options header present${NC}"
  headers_found=$((headers_found + 1))
fi

if echo "$HEADERS" | grep -q "X-Frame-Options"; then
  echo -e "${GREEN}✓ X-Frame-Options header present${NC}"
  headers_found=$((headers_found + 1))
fi

if echo "$HEADERS" | grep -q "Strict-Transport-Security"; then
  echo -e "${GREEN}✓ HSTS header present${NC}"
  headers_found=$((headers_found + 1))
fi

if [ $headers_found -ge 2 ]; then
  echo -e "${GREEN}✓ Security headers configured${NC}"
else
  echo -e "${RED}✗ Security headers missing${NC}"
fi

# ============================================
# Summary
# ============================================
echo -e "\n${YELLOW}========================================="
echo "Security Test Summary"
echo "=========================================${NC}"

echo "
✅ Tested Features:
- Rate limiting
- Refresh token flow
- Token validation
- CORS configuration
- Security headers (Helmet)
- Cookie security

⚠️  Manual Checks Needed:
1. Verify cookies are HttpOnly in browser DevTools
2. Check HTTPS is enforced in production
3. Verify refresh token is NOT in response body
4. Test with multiple devices/browsers
5. Check Supabase logs for suspicious activity
"

echo -e "${GREEN}Security testing complete!${NC}"
EOF

chmod +x test-security.sh

echo -e "${GREEN}✓ Created test-security.sh${NC}"

# ============================================
# 2. Create Quick Reference
# ============================================
cat > SECURITY.md << 'EOF'
# Security Quick Reference

## 🔐 JWT Configuration

- **Access Token:** 15 minutes (in response body)
- **Refresh Token:** 1 day (in HTTP-only cookie)

## 🚦 Rate Limits

| Endpoint | Limit |
|----------|-------|
| /auth/register | 3/minute |
| /auth/login | 5/minute |
| /auth/refresh | 10/minute |
| Default | 100/minute |

## 🍪 Cookie Settings

```
HttpOnly: true
Secure: true (production)
SameSite: Strict
Max-Age: 86400 (1 day)
```

## 🛡️ Security Headers (Helmet)

- Content-Security-Policy
- X-Frame-Options: SAMEORIGIN
- Strict-Transport-Security
- X-Content-Type-Options: nosniff
- X-XSS-Protection: 0

## 📝 Environment Variables

```bash
JWT_SECRET=<32+ characters>
JWT_REFRESH_SECRET=<32+ characters>
NODE_ENV=production
FRONTEND_URL=https://yourdomain.com
```

## 🔧 Testing Commands

```bash
# Test security features
./test-security.sh

# Monitor rate limits
curl -v http://localhost:4000/api/v1/auth/login

# Check cookies
curl -v -c cookies.txt http://localhost:4000/api/v1/auth/login

# Use refresh token
curl -b cookies.txt http://localhost:4000/api/v1/auth/refresh
```

## 🚨 Security Checklist

Production:
- [ ] Strong JWT secrets (32+ chars)
- [ ] HTTPS enabled
- [ ] NODE_ENV=production
- [ ] Secure cookies enabled
- [ ] Rate limits configured
- [ ] CORS restricted to your domain
- [ ] Security headers enabled
- [ ] Regular npm audit
- [ ] Monitoring enabled

## 📞 Emergency Response

If tokens compromised:
```bash
POST /api/v1/auth/logout-all
```

If suspicious activity detected:
1. Check refresh_tokens table
2. Revoke all tokens for user
3. Force password reset
4. Check server logs
EOF

echo -e "${GREEN}✓ Created SECURITY.md${NC}"

echo -e "\n${GREEN}========================================="
echo "Setup Complete!"
echo "=========================================${NC}"

${YELLOW}Important:${NC}
- Keep your JWT secrets secure
- Enable HTTPS in production
- Monitor rate limit violations
- Review security logs regularly
"
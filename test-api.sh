#!/bin/bash

# PayPips API Test Script
# Make sure to replace YOUR_TOKEN with actual JWT token from login

BASE_URL="http://localhost:4000/api/v1"
TOKEN="YOUR_TOKEN_HERE"

echo "========================================="
echo "Testing PayPips API"
echo "========================================="

# 1. Register & Login
echo -e "\n1. REGISTER NEW ORGANIZATION"
REGISTER_RESPONSE=$(curl -s -X POST $BASE_URL/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "organizationName": "Test Gym Lagos",
    "organizationEmail": "gym@testlagos.com",
    "firstName": "Admin",
    "lastName": "User",
    "userEmail": "admin@testlagos.com",
    "password": "password123"
  }')

echo "$REGISTER_RESPONSE" | jq '.'

# Extract registeration token
TOKEN=$(echo $REGISTER_RESPONSE | jq -r '.data.access_token')
echo "Token: $TOKEN"

# Login
echo -e "\n1.1 LOGIN"
LOGIN_RESPONSE=$(curl -X POST http://localhost:4000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@test.com",
    "password": "password123"
  }')

# Extract login token
TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.data.access_token')
echo "Token: $TOKEN"

# 2. Get Profile
echo -e "\n2. GET PROFILE"
curl -s -X GET $BASE_URL/auth/profile \
  -H "Authorization: Bearer $TOKEN" | jq '.'

# 3. Get Organization
echo -e "\n3. GET ORGANIZATION"
curl -s -X GET $BASE_URL/organizations/me \
  -H "Authorization: Bearer $TOKEN" | jq '.'

# 4. Create Plan
echo -e "\n4. CREATE PLAN"
PLAN_RESPONSE=$(curl -s -X POST $BASE_URL/plans \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Monthly Membership",
    "description": "Full gym access",
    "amount": 15000,
    "currency": "NGN",
    "interval": "monthly",
    "features": ["Gym Access", "Free Towel", "Locker"]
  }')

echo "$PLAN_RESPONSE" | jq '.'

# Extract plan ID
PLAN_ID=$(echo $PLAN_RESPONSE | jq -r '.data.id')
echo "Plan ID: $PLAN_ID"

# 5. Get All Plans
echo -e "\n5. GET ALL PLANS"
curl -s -X GET "$BASE_URL/plans?page=1&limit=10" \
  -H "Authorization: Bearer $TOKEN" | jq '.'

# 6. Create Customer
echo -e "\n6. CREATE CUSTOMER"
CUSTOMER_RESPONSE=$(curl -s -X POST $BASE_URL/customers \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "phone": "+2348012345678",
    "metadata": {
      "membership_type": "premium"
    }
  }')

echo "$CUSTOMER_RESPONSE" | jq '.'

# Extract customer ID
CUSTOMER_ID=$(echo $CUSTOMER_RESPONSE | jq -r '.data.id')
echo "Customer ID: $CUSTOMER_ID"

# 7. Get All Customers
echo -e "\n7. GET ALL CUSTOMERS"
curl -s -X GET "$BASE_URL/customers?page=1&limit=10" \
  -H "Authorization: Bearer $TOKEN" | jq '.'

# 8. Create Subscription
echo -e "\n8. CREATE SUBSCRIPTION"
SUBSCRIPTION_RESPONSE=$(curl -s -X POST $BASE_URL/subscriptions \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"customerId\": \"$CUSTOMER_ID\",
    \"planId\": \"$PLAN_ID\"
  }")

echo "$SUBSCRIPTION_RESPONSE" | jq '.'

# Extract subscription ID
SUBSCRIPTION_ID=$(echo $SUBSCRIPTION_RESPONSE | jq -r '.data.id')
echo "Subscription ID: $SUBSCRIPTION_ID"

# 9. Get All Subscriptions
echo -e "\n9. GET ALL SUBSCRIPTIONS"
curl -s -X GET "$BASE_URL/subscriptions?page=1&limit=10" \
  -H "Authorization: Bearer $TOKEN" | jq '.'

# 10. Get Specific Subscription
echo -e "\n10. GET SPECIFIC SUBSCRIPTION"
curl -s -X GET "$BASE_URL/subscriptions/$SUBSCRIPTION_ID" \
  -H "Authorization: Bearer $TOKEN" | jq '.'

# 11. Get Organization Stats
echo -e "\n11. GET ORGANIZATION STATS"
curl -s -X GET $BASE_URL/organizations/stats \
  -H "Authorization: Bearer $TOKEN" | jq '.'

# 12. Get Customer Stats
echo -e "\n12. GET CUSTOMER STATS"
curl -s -X GET "$BASE_URL/customers/$CUSTOMER_ID/stats" \
  -H "Authorization: Bearer $TOKEN" | jq '.'

# 13. Pause Subscription
echo -e "\n13. PAUSE SUBSCRIPTION"
curl -s -X PATCH "$BASE_URL/subscriptions/$SUBSCRIPTION_ID/pause" \
  -H "Authorization: Bearer $TOKEN" | jq '.'

# 14. Resume Subscription
echo -e "\n14. RESUME SUBSCRIPTION"
curl -s -X PATCH "$BASE_URL/subscriptions/$SUBSCRIPTION_ID/resume" \
  -H "Authorization: Bearer $TOKEN" | jq '.'

# 15. Get Team Members
echo -e "\n15. GET TEAM MEMBERS"
curl -s -X GET $BASE_URL/organizations/team \
  -H "Authorization: Bearer $TOKEN" | jq '.'

echo -e "\n========================================="
echo "Testing Complete!"
echo "========================================="

# Save important IDs for future reference
echo -e "\n📝 SAVE THESE IDs:"
echo "Token: $TOKEN"
echo "Plan ID: $PLAN_ID"
echo "Customer ID: $CUSTOMER_ID"
echo "Subscription ID: $SUBSCRIPTION_ID"
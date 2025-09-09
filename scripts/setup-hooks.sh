#!/bin/bash

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo "${BLUE}🔧 Setting up Git Hooks for Pregnancy Plate Planner${NC}"
echo "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Install Husky if not already installed
if [ ! -d ".husky" ]; then
    echo "${YELLOW}Installing Husky...${NC}"
    npm install --save-dev husky
    npx husky init
fi

# Make hooks executable
chmod +x .husky/pre-push

echo ""
echo "${GREEN}✅ Git hooks setup complete!${NC}"
echo ""
echo "${YELLOW}📝 Available hooks:${NC}"
echo "   • pre-push: Runs TypeScript, ESLint, and build checks before push"
echo ""
echo "${YELLOW}🎯 Usage:${NC}"
echo "   • Normal push: git push (runs all checks)"
echo "   • Skip checks: git push --no-verify (use sparingly!)"
echo "   • Quick check: npm run quick-check (TypeScript + ESLint only)"
echo "   • Full check:  npm run pre-push (all checks including build)"
echo ""
echo "${GREEN}Your code will now be tested before every push to prevent Vercel failures!${NC}"
echo "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
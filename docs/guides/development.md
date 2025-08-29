# Development Guide

## Local Setup

### Prerequisites
- Node.js 18+ and npm
- Firebase account and project
- Git configured with your credentials

### Environment Setup
1. Clone the repository
2. Install dependencies: `npm install`
3. Copy `.env.example` to `.env.local`
4. Configure environment variables (see Environment Variables section)
5. Start development server: `npm run dev`

### Environment Variables
```bash
# Firebase Configuration (Vercel naming)
apiKey=your_firebase_api_key
authDomain=your_project_id.firebaseapp.com
projectId=your_project_id
storageBucket=your_project_id.appspot.com
messagingSenderId=your_sender_id
appId=your_app_id

# Firebase Admin (JSON string)
FIREBASE_ADMIN_KEY={"type":"service_account",...}

# Spoonacular API
SPOONACULAR_API_KEY=your_spoonacular_key
```

## Development Commands

Always run these after making changes:
```bash
npm run lint          # ESLint checks
npm run format        # Prettier formatting
npm run typecheck     # TypeScript validation  
npm run build         # Production build test
npm run test          # Run test suite
```

## Automated Hooks

The project includes 8 automated hooks that handle common development tasks:

### Available Hooks
1. **visual-regression-autofix** - Auto-fixes visual discrepancies
2. **recipe-data-guardian** - Protects recipe data integrity  
3. **smart-conflict-resolver** - Handles merge conflicts
4. **build-error-remediation** - Auto-fixes build errors
5. **e2e-self-healing** - Repairs failing E2E tests
6. **test-driven-docs** - Generates docs from tests
7. **vercel-env-sync** - Syncs environment variables
8. **api-route-tester** - Tests API routes automatically

### Using Hooks
```bash
# Check hook status
./scripts/hooks/status.sh

# Run all hooks
./scripts/hooks/run-all-hooks.sh

# Run specific hook
./scripts/hooks/run-hook.sh visual-regression-autofix
```

## Debugging

### Common Issues

**Build Errors:**
- Check for duplicate className attributes
- Verify TypeScript imports and exports
- Ensure environment variables are set
- Run `npm run typecheck` for detailed errors

**Recipe System Issues:**
- Use `LocalRecipeService` for all client-side operations
- Check that offline JSON files are up to date
- Verify Firebase permissions for admin functions
- Use recipe-data-guardian hook for data integrity

**Development Server Issues:**
- Clear `.next` cache: `rm -rf .next`
- Restart development server
- Check for port conflicts (default: 3000)
- Verify all dependencies are installed

**Database Issues:**
- Check Firebase connection
- Verify Firestore security rules
- Ensure admin permissions are set correctly
- Use Firebase emulator for local development

### Debug Tools

**Recipe Debugging:**
```bash
# Check recipe data integrity
npm run validate-recipes

# Test recipe imports
npm run test-import

# Verify offline data export
npm run export-offline-data
```

**Build Debugging:**
```bash
# Analyze bundle size
npm run analyze

# Check TypeScript issues
npx tsc --noEmit

# Verify Next.js configuration
npx next info
```

### Performance Monitoring

- Use React DevTools Profiler
- Monitor Core Web Vitals
- Check bundle size regularly
- Use Lighthouse for audits

## Testing

### Test Structure
```
/tests
  /e2e         # End-to-end tests (minimal)
/src
  /**/__tests__  # Unit tests co-located with code
```

### Running Tests
```bash
npm test              # All tests
npm run test:watch    # Watch mode
npm run test:coverage # Coverage report
```

### Test-Driven Documentation
The `test-driven-docs` hook automatically updates documentation based on test results.

## Deployment

### Vercel Deployment
1. Push to main branch (auto-deploys)
2. Environment variables configured in Vercel dashboard
3. Check deployment logs for issues

### Pre-deployment Checklist
- [ ] All tests pass
- [ ] TypeScript compiles without errors
- [ ] Build succeeds locally
- [ ] Environment variables configured
- [ ] Hooks pass validation

## Code Style

- Use TypeScript strict mode
- Follow Prettier configuration
- ESLint rules enforced
- Semantic commit messages
- Component-first architecture

## Troubleshooting

### Getting Help
1. Check this guide first
2. Review error messages carefully
3. Use automated hooks for common fixes
4. Check recent commits for breaking changes
5. Refer to framework documentation

### Emergency Fixes
- Use smart-conflict-resolver for merge issues
- Use build-error-remediation for build failures
- Use e2e-self-healing for test failures
- Check hook logs in `.claude/logs/`

---

*This guide consolidates setup, debugging, and development workflow information.*
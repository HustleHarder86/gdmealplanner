# Claude Code Development Hooks

This directory contains custom development hooks designed specifically for the GD Meal Planner project. These hooks automate repetitive tasks, catch errors early, and maintain code quality.

## 🎯 Hook Overview

### 1. Visual Regression Auto-Fix Hook
- **Purpose**: Automatically fixes UI mismatches with WordPress design
- **Triggers**: After UI component edits, before commits
- **Features**: Screenshot comparison, CSS auto-fixes, iterative improvement
- **Target**: 95% visual similarity with WordPress

### 2. Build Error Auto-Remediation Hook
- **Purpose**: Fixes common build errors automatically
- **Triggers**: Before commits and pushes
- **Features**: AST transformations, quote escaping, TypeScript fixes
- **Benefit**: Eliminates "fix apostrophe" commits

### 3. E2E Test Self-Healing Hook
- **Purpose**: Auto-fixes flaky E2E tests
- **Triggers**: On test failures, before pushes
- **Features**: Selector updates, timing adjustments, smart retries
- **Result**: More reliable test suite

### 4. Recipe Data Integrity Guardian Hook
- **Purpose**: Validates all recipe data changes
- **Triggers**: Before commits, after data edits
- **Features**: Nutrition validation, duplicate detection, GD compliance
- **Ensures**: Medical accuracy and data quality

### 5. Vercel Environment Sync Hook
- **Purpose**: Ensures environment variables match production
- **Triggers**: Before deployments and pushes
- **Features**: Variable validation, API route testing, mock tests
- **Prevents**: Deployment failures due to env mismatches

### 6. API Route Tester with Auto-Fix Hook
- **Purpose**: Tests and fixes API route issues
- **Triggers**: After API route edits, before commits
- **Features**: Export validation, NextResponse checks, endpoint testing
- **Ensures**: Vercel-compatible API routes

### 7. Smart Conflict Resolution Hook
- **Purpose**: Prevents layout and routing conflicts
- **Triggers**: After layout/routing changes
- **Features**: Route validation, layout hierarchy checks, 404 prevention
- **Solves**: Next.js App Router conflicts

### 8. Test-Driven Documentation Hook
- **Purpose**: Auto-updates debugging guides and docs
- **Triggers**: After bug fixes and commits
- **Features**: Documentation updates, knowledge base maintenance
- **Maintains**: Up-to-date debugging guides

## 📁 Directory Structure

```
.claude/
├── hooks/           # Individual hook implementations
├── utils/           # Shared utility functions
├── config/          # Configuration files
├── logs/            # Hook execution logs
└── README.md        # This file

scripts/
└── hooks/           # Installation and management scripts
```

## ⚙️ Configuration

### Global Settings
- Located in `.claude/config/hooks.json`
- Controls which hooks are enabled
- Defines trigger events and targets
- Configurable thresholds and limits

### Thresholds
- Located in `.claude/config/thresholds.json`
- Visual similarity requirements
- Performance budgets
- Code quality metrics
- Testing parameters

## 🚀 Installation

```bash
# Install all hooks
./scripts/hooks/install-hooks.sh

# Install specific hook
./scripts/hooks/install-hooks.sh visual-regression-autofix

# Verify installation
./scripts/hooks/test-hooks.sh
```

## 📊 Monitoring

### Logs
All hook executions are logged to `.claude/logs/hooks.log` with:
- Timestamp and hook name
- Trigger event and affected files
- Actions taken and results
- Performance metrics
- Error details (if any)

### Status Dashboard
Check hook status and recent activity:
```bash
./scripts/hooks/status.sh
```

## 🔧 Customization

### Enabling/Disabling Hooks
Edit `.claude/config/hooks.json`:
```json
{
  "hooks": {
    "hook-name": {
      "enabled": false  // Disable this hook
    }
  }
}
```

### Adjusting Thresholds
Edit `.claude/config/thresholds.json` to customize:
- Visual similarity requirements
- Performance budgets
- Code quality metrics
- Retry limits

### Hook-Specific Settings
Each hook has its own configuration section in `hooks.json` with customizable options.

## 🐛 Troubleshooting

### Common Issues

1. **Hook not triggering**
   - Check if hook is enabled in config
   - Verify file patterns match targets
   - Check Claude Code settings

2. **Visual regression failing**
   - Ensure WordPress site is accessible
   - Check local development server is running
   - Verify screenshot directories exist

3. **Build fixes not working**
   - Check if build commands are correct
   - Verify AST parser is working
   - Review error patterns

4. **Performance impact**
   - Disable resource-intensive hooks during development
   - Adjust timeouts and retry limits
   - Use parallel execution sparingly

### Debug Mode
Enable verbose logging:
```json
{
  "global": {
    "logLevel": "debug"
  }
}
```

## 🔄 Updates and Maintenance

### Updating Hooks
```bash
# Update all hooks
./scripts/hooks/update-hooks.sh

# Update specific hook
./scripts/hooks/update-hooks.sh hook-name
```

### Health Check
```bash
# Verify all hooks are working
./scripts/hooks/health-check.sh
```

## 📈 Metrics and Analytics

The hooks collect metrics on:
- Fix success rates
- Time saved through automation
- Error prevention statistics
- Code quality improvements
- Test reliability improvements

View metrics:
```bash
./scripts/hooks/metrics.sh
```

## 🤝 Contributing

When adding new hooks:

1. Create hook file in `.claude/hooks/`
2. Add configuration to `hooks.json`
3. Update this README
4. Add tests in `scripts/hooks/test/`
5. Document any new utilities

## 📝 Notes

- Hooks are designed to be non-intrusive
- All changes are logged and can be reverted
- Hooks can be disabled individually
- Performance impact is monitored
- Medical accuracy takes precedence over automation

---

**Last Updated**: 2025-08-28  
**Version**: 1.0.0  
**Author**: Claude Code Development Assistant
#!/bin/bash

# Claude Code Hook Installation Script
# Installs and configures development hooks for the GD Meal Planner project

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
HOOK_DIR=".claude/hooks"
SCRIPT_DIR="scripts/hooks"
LOG_DIR=".claude/logs"

# Helper functions
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

# Check if we're in the right directory
check_project_root() {
    if [ ! -f "package.json" ] || [ ! -d "app" ]; then
        log_error "This script must be run from the project root directory"
        exit 1
    fi
    
    if ! grep -q "pregnancy-plate-planner" package.json; then
        log_error "This doesn't appear to be the GD Meal Planner project"
        exit 1
    fi
    
    log_success "Project directory validated"
}

# Create necessary directories
setup_directories() {
    log_info "Setting up hook directories..."
    
    mkdir -p "$LOG_DIR"
    mkdir -p ".claude/screenshots"
    mkdir -p ".claude/reports"
    mkdir -p ".claude/test-cases"
    
    log_success "Directories created"
}

# Install Node.js dependencies
install_dependencies() {
    log_info "Installing hook dependencies..."
    
    # Check if Playwright is already installed
    if ! npx playwright --version >/dev/null 2>&1; then
        log_info "Installing Playwright..."
        npm install --save-dev playwright
        npx playwright install chromium
    else
        log_success "Playwright already installed"
    fi
    
    # Install other dependencies if needed
    local deps_needed=false
    
    if ! node -e "require('fs').promises" >/dev/null 2>&1; then
        log_warning "Node.js version might be too old for fs.promises"
    fi
    
    log_success "Dependencies checked"
}

# Make hook files executable
make_executable() {
    log_info "Making hook files executable..."
    
    for hook_file in "$HOOK_DIR"/*.js; do
        if [ -f "$hook_file" ]; then
            chmod +x "$hook_file"
            log_success "Made executable: $(basename "$hook_file")"
        fi
    done
}

# Test hook installation
test_hooks() {
    log_info "Testing hook installations..."
    
    local failed_hooks=()
    local hooks=(
        "visual-regression-autofix"
        "build-error-remediation"
        "e2e-self-healing"
        "recipe-data-guardian"
        "vercel-env-sync"
        "api-route-tester"
        "smart-conflict-resolver"
        "test-driven-docs"
    )
    
    for hook in "${hooks[@]}"; do
        local hook_file="$HOOK_DIR/$hook.js"
        
        if [ -f "$hook_file" ]; then
            # Test if the hook can be executed (dry run)
            if node "$hook_file" --help >/dev/null 2>&1 || node "$hook_file" --version >/dev/null 2>&1; then
                log_success "Hook test passed: $hook"
            else
                log_warning "Hook may have issues: $hook"
                failed_hooks+=("$hook")
            fi
        else
            log_error "Hook file missing: $hook_file"
            failed_hooks+=("$hook")
        fi
    done
    
    if [ ${#failed_hooks[@]} -eq 0 ]; then
        log_success "All hooks tested successfully"
        return 0
    else
        log_warning "Some hooks had issues: ${failed_hooks[*]}"
        return 1
    fi
}

# Setup Claude Code integration
setup_claude_integration() {
    log_info "Setting up Claude Code integration..."
    
    # Create a simple integration test
    cat > .claude/test-integration.js << 'EOF'
#!/usr/bin/env node
console.log("Claude Code hooks integration test");
console.log("Available hooks:");
const fs = require('fs');
const hooks = fs.readdirSync('.claude/hooks').filter(f => f.endsWith('.js'));
hooks.forEach(hook => console.log(`  - ${hook}`));
console.log("Integration test completed successfully");
EOF
    
    chmod +x .claude/test-integration.js
    
    # Test the integration
    if node .claude/test-integration.js; then
        log_success "Claude Code integration setup complete"
    else
        log_error "Claude Code integration test failed"
        return 1
    fi
}

# Create wrapper scripts for easy execution
create_wrapper_scripts() {
    log_info "Creating wrapper scripts..."
    
    # Create run-hook.sh script
    cat > scripts/hooks/run-hook.sh << 'EOF'
#!/bin/bash
# Wrapper script to run individual hooks

if [ $# -eq 0 ]; then
    echo "Usage: $0 <hook-name> [args...]"
    echo "Available hooks:"
    ls .claude/hooks/*.js | xargs -n 1 basename | sed 's/.js$//' | sed 's/^/  - /'
    exit 1
fi

HOOK_NAME="$1"
shift

HOOK_FILE=".claude/hooks/$HOOK_NAME.js"

if [ ! -f "$HOOK_FILE" ]; then
    echo "Error: Hook not found: $HOOK_NAME"
    exit 1
fi

echo "Running hook: $HOOK_NAME"
node "$HOOK_FILE" "$@"
EOF
    
    chmod +x scripts/hooks/run-hook.sh
    
    # Create run-all-hooks.sh script
    cat > scripts/hooks/run-all-hooks.sh << 'EOF'
#!/bin/bash
# Run all hooks in sequence

echo "Running all Claude Code hooks..."

HOOKS=(
    "build-error-remediation"
    "api-route-tester"
    "smart-conflict-resolver"
    "recipe-data-guardian"
    "vercel-env-sync"
    "visual-regression-autofix"
    "e2e-self-healing"
    "test-driven-docs"
)

FAILED_HOOKS=()

for hook in "${HOOKS[@]}"; do
    echo "----------------------------------------"
    echo "Running: $hook"
    echo "----------------------------------------"
    
    if ./scripts/hooks/run-hook.sh "$hook"; then
        echo "✓ $hook completed successfully"
    else
        echo "✗ $hook failed"
        FAILED_HOOKS+=("$hook")
    fi
    echo
done

echo "========================================="
echo "Hook Execution Summary"
echo "========================================="

if [ ${#FAILED_HOOKS[@]} -eq 0 ]; then
    echo "All hooks executed successfully! 🎉"
    exit 0
else
    echo "Failed hooks: ${FAILED_HOOKS[*]}"
    echo "Check the logs in .claude/logs/ for details"
    exit 1
fi
EOF
    
    chmod +x scripts/hooks/run-all-hooks.sh
    
    log_success "Wrapper scripts created"
}

# Create status checking script
create_status_script() {
    cat > scripts/hooks/status.sh << 'EOF'
#!/bin/bash
# Check status of all hooks

echo "Claude Code Hooks Status"
echo "========================"
echo

# Check hook files
echo "Hook Files:"
for hook in .claude/hooks/*.js; do
    if [ -f "$hook" ]; then
        name=$(basename "$hook" .js)
        if [ -x "$hook" ]; then
            echo "  ✓ $name (executable)"
        else
            echo "  ⚠ $name (not executable)"
        fi
    fi
done

echo

# Check logs
echo "Recent Activity:"
if [ -d ".claude/logs" ]; then
    recent_logs=$(find .claude/logs -name "*.log" -mtime -1 2>/dev/null | wc -l)
    echo "  - $recent_logs log files updated in last 24 hours"
    
    if [ $recent_logs -gt 0 ]; then
        echo "  - Recent log entries:"
        find .claude/logs -name "*.log" -mtime -1 -exec tail -1 {} + | head -5 | sed 's/^/    /'
    fi
else
    echo "  - No log directory found"
fi

echo

# Check configuration
echo "Configuration:"
if [ -f ".claude/config/hooks.json" ]; then
    enabled_hooks=$(grep -c '"enabled": true' .claude/config/hooks.json)
    total_hooks=$(grep -c '"enabled":' .claude/config/hooks.json)
    echo "  - $enabled_hooks/$total_hooks hooks enabled"
else
    echo "  - No configuration file found"
fi

echo

echo "Run './scripts/hooks/run-all-hooks.sh' to test all hooks"
EOF
    
    chmod +x scripts/hooks/status.sh
    
    log_success "Status script created"
}

# Main installation function
main() {
    echo "============================================="
    echo "Claude Code Hooks Installation"
    echo "GD Meal Planner Development Environment"
    echo "============================================="
    echo
    
    # Pre-flight checks
    check_project_root
    
    # Setup
    setup_directories
    install_dependencies
    make_executable
    
    # Integration
    setup_claude_integration
    create_wrapper_scripts
    create_status_script
    
    # Testing
    if test_hooks; then
        echo
        echo "============================================="
        log_success "Hook installation completed successfully!"
        echo "============================================="
        echo
        echo "Next steps:"
        echo "1. Check hook status: ./scripts/hooks/status.sh"
        echo "2. Test all hooks: ./scripts/hooks/run-all-hooks.sh"
        echo "3. Run individual hook: ./scripts/hooks/run-hook.sh <hook-name>"
        echo
        echo "Available hooks:"
        ls .claude/hooks/*.js | xargs -n 1 basename | sed 's/.js$//' | sed 's/^/  - /'
        echo
        echo "Configuration: .claude/config/hooks.json"
        echo "Logs: .claude/logs/"
        echo
    else
        echo
        echo "============================================="
        log_warning "Installation completed with warnings"
        echo "============================================="
        echo
        echo "Some hooks may need attention. Check the output above."
        echo "You can still use the working hooks."
        echo
    fi
    
    return 0
}

# Handle command line arguments
if [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
    echo "Claude Code Hook Installation Script"
    echo
    echo "Usage: $0 [options]"
    echo
    echo "Options:"
    echo "  --help, -h     Show this help message"
    echo "  --test-only    Only test existing hooks, don't install"
    echo
    exit 0
fi

if [ "$1" = "--test-only" ]; then
    check_project_root
    test_hooks
    exit $?
fi

# Run main installation
main
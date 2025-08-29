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

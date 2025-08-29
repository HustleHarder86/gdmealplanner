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

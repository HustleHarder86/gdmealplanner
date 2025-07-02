#!/bin/bash

# Claude Code Supervisor Runner Script
# This script runs the supervisor agent and handles different scenarios

PROJECT_ROOT="/home/amy/dev/gdmealplanner"
SUPERVISOR_DIR="$PROJECT_ROOT/scripts/supervisor"
PYTHON_CMD="python3"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting Claude Code Supervisor Agent...${NC}"
echo "========================================"

# Check if Python is available
if ! command -v $PYTHON_CMD &> /dev/null; then
    echo -e "${RED}Error: Python 3 is not installed${NC}"
    exit 1
fi

# Navigate to project root
cd "$PROJECT_ROOT" || exit 1

# Parse command line arguments
ARGS=""
WATCH_MODE=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --watch)
            WATCH_MODE=true
            shift
            ;;
        *)
            ARGS="$ARGS $1"
            shift
            ;;
    esac
done

# Function to run supervisor
run_supervisor() {
    echo -e "\n${YELLOW}Running supervisor validation...${NC}"
    $PYTHON_CMD "$SUPERVISOR_DIR/supervisor.py" $ARGS
    
    # Check exit code
    if [ $? -eq 0 ]; then
        echo -e "\n${GREEN}Supervisor completed successfully!${NC}"
        
        # Open dashboard if available
        if [ -f "$SUPERVISOR_DIR/dashboard.html" ]; then
            echo -e "${GREEN}Dashboard available at: file://$SUPERVISOR_DIR/dashboard.html${NC}"
        fi
    else
        echo -e "\n${RED}Supervisor encountered errors${NC}"
        return 1
    fi
}

# Run once or in watch mode
if [ "$WATCH_MODE" = true ]; then
    echo -e "${YELLOW}Running in watch mode (Ctrl+C to stop)...${NC}"
    while true; do
        run_supervisor
        echo -e "\n${YELLOW}Waiting 5 minutes before next run...${NC}"
        sleep 300
    done
else
    run_supervisor
fi

# Show summary report location
if [ -f "$SUPERVISOR_DIR/reports" ]; then
    LATEST_SUMMARY=$(ls -t "$SUPERVISOR_DIR/reports/summary_"*.md 2>/dev/null | head -n1)
    if [ -n "$LATEST_SUMMARY" ]; then
        echo -e "\n${GREEN}Latest summary report: $LATEST_SUMMARY${NC}"
    fi
fi
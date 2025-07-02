#!/bin/bash

# Enhanced Recipe Scraper - Quick Start Script
# This script provides easy commands to run the scraper with common configurations

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Default values
OUTPUT_DIR="scraped_data"
FIREBASE_CREDS=""
SOURCES=()
MAX_PER_SOURCE=50
TOTAL_TARGET=""

# Function to display usage
usage() {
    echo -e "${BLUE}Enhanced Recipe Scraper - Quick Start${NC}"
    echo ""
    echo "Usage: $0 [command] [options]"
    echo ""
    echo "Commands:"
    echo "  quick       - Quick collection (20 recipes from each source)"
    echo "  daily       - Daily collection (50-60 recipes, respecting limits)"
    echo "  full        - Full collection (360 recipes target)"
    echo "  test        - Test run (5 recipes from DiabetesFoodHub)"
    echo "  dashboard   - View progress dashboard"
    echo "  report      - Generate reports only"
    echo ""
    echo "Options:"
    echo "  --firebase path/to/creds.json  - Enable Firebase storage"
    echo "  --no-images                    - Skip image processing"
    echo "  --sources source1 source2      - Specific sources only"
    echo ""
    echo "Examples:"
    echo "  $0 quick"
    echo "  $0 daily --firebase creds.json"
    echo "  $0 full --sources diabetesfoodhub eatingwell"
    echo ""
}

# Function to check dependencies
check_dependencies() {
    echo -e "${BLUE}Checking dependencies...${NC}"
    
    # Check Python
    if ! command -v python3 &> /dev/null; then
        echo -e "${RED}Error: Python 3 is not installed${NC}"
        exit 1
    fi
    
    # Check if requirements are installed
    if ! python3 -c "import bs4" &> /dev/null; then
        echo -e "${YELLOW}Installing requirements...${NC}"
        pip install -r requirements.txt
    fi
    
    echo -e "${GREEN}Dependencies OK${NC}"
}

# Function to run scraper
run_scraper() {
    local mode=$1
    shift
    
    # Parse additional arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --firebase)
                FIREBASE_CREDS="--firebase-creds $2"
                shift 2
                ;;
            --no-images)
                NO_IMAGES="--no-images"
                shift
                ;;
            --sources)
                shift
                while [[ $# -gt 0 ]] && [[ ! "$1" =~ ^-- ]]; do
                    SOURCES+=("$1")
                    shift
                done
                ;;
            *)
                shift
                ;;
        esac
    done
    
    # Build sources argument
    SOURCES_ARG=""
    if [ ${#SOURCES[@]} -gt 0 ]; then
        SOURCES_ARG="--sources ${SOURCES[@]}"
    fi
    
    # Set parameters based on mode
    case $mode in
        quick)
            echo -e "${GREEN}Running quick collection (20 per source)...${NC}"
            MAX_PER_SOURCE=20
            ;;
        daily)
            echo -e "${GREEN}Running daily collection (50-60 recipes)...${NC}"
            MAX_PER_SOURCE=50
            TOTAL_TARGET="--total-target 60"
            ;;
        full)
            echo -e "${GREEN}Running full collection (360 recipes target)...${NC}"
            MAX_PER_SOURCE=100
            TOTAL_TARGET="--total-target 360"
            ;;
        test)
            echo -e "${GREEN}Running test collection (5 recipes)...${NC}"
            MAX_PER_SOURCE=5
            SOURCES_ARG="--sources diabetesfoodhub"
            ;;
        *)
            echo -e "${RED}Unknown mode: $mode${NC}"
            usage
            exit 1
            ;;
    esac
    
    # Run the scraper
    cmd="python3 enhanced_recipe_scraper.py \
        --output-dir $OUTPUT_DIR \
        --max-per-source $MAX_PER_SOURCE \
        $TOTAL_TARGET \
        $SOURCES_ARG \
        $FIREBASE_CREDS \
        $NO_IMAGES"
    
    echo -e "${BLUE}Executing: $cmd${NC}"
    eval $cmd
}

# Function to view dashboard
view_dashboard() {
    echo -e "${GREEN}Generating dashboard...${NC}"
    
    # Check which mode to use
    if [ "$1" == "html" ]; then
        python3 progress_dashboard.py --mode html --data-dir $OUTPUT_DIR
        echo -e "${GREEN}Dashboard saved to: $OUTPUT_DIR/reports/dashboard.html${NC}"
        
        # Try to open in browser
        if command -v xdg-open &> /dev/null; then
            xdg-open "$OUTPUT_DIR/reports/dashboard.html"
        elif command -v open &> /dev/null; then
            open "$OUTPUT_DIR/reports/dashboard.html"
        fi
    else
        # Console mode
        python3 progress_dashboard.py --mode console --data-dir $OUTPUT_DIR
    fi
}

# Function to generate reports only
generate_reports() {
    echo -e "${GREEN}Generating reports...${NC}"
    
    # Create a simple Python script to generate reports
    python3 -c "
from enhanced_recipe_scraper import EnhancedRecipeScraper
scraper = EnhancedRecipeScraper('$OUTPUT_DIR')
scraper.generate_reports()
print('Reports generated in: $OUTPUT_DIR/reports/')
"
}

# Main execution
check_dependencies

case $1 in
    quick|daily|full|test)
        run_scraper "$@"
        ;;
    dashboard)
        view_dashboard "${2:-console}"
        ;;
    report)
        generate_reports
        ;;
    *)
        usage
        ;;
esac
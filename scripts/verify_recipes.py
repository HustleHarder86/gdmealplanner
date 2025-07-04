#!/usr/bin/env python3
"""
Recipe URL Verification Script
Checks if recipe URLs from diabetesfoodhub.org actually exist
"""

import json
import requests
import time
from datetime import datetime
from typing import Dict, List, Tuple
import concurrent.futures
from urllib.parse import urlparse

def load_recipes(file_path: str) -> List[Dict]:
    """Load recipes from JSON file"""
    with open(file_path, 'r') as f:
        return json.load(f)

def check_url(recipe: Dict, timeout: int = 10) -> Tuple[Dict, bool, int, str]:
    """
    Check if a recipe URL exists
    Returns: (recipe, is_valid, status_code, error_message)
    """
    url = recipe.get('url', '')
    
    # Skip if no URL
    if not url:
        return (recipe, False, 0, "No URL provided")
    
    # Check if URL is from diabetesfoodhub.org
    parsed_url = urlparse(url)
    if 'diabetesfoodhub.org' not in parsed_url.netloc:
        return (recipe, False, 0, f"Not a diabetesfoodhub.org URL: {parsed_url.netloc}")
    
    try:
        # Add headers to avoid being blocked
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        
        response = requests.get(url, headers=headers, timeout=timeout, allow_redirects=True)
        
        # Check if successful (2xx status codes)
        is_valid = 200 <= response.status_code < 300
        
        return (recipe, is_valid, response.status_code, "")
        
    except requests.exceptions.Timeout:
        return (recipe, False, 0, "Timeout")
    except requests.exceptions.ConnectionError:
        return (recipe, False, 0, "Connection error")
    except requests.exceptions.RequestException as e:
        return (recipe, False, 0, str(e))

def verify_recipes(recipes: List[Dict], max_workers: int = 5) -> Dict:
    """
    Verify all recipes using concurrent requests
    """
    results = {
        'valid': [],
        'invalid': [],
        'errors': [],
        'statistics': {
            'total': len(recipes),
            'valid_count': 0,
            'invalid_count': 0,
            'error_count': 0,
            'no_url_count': 0,
            'wrong_domain_count': 0
        }
    }
    
    print(f"Starting verification of {len(recipes)} recipes...")
    print(f"Using {max_workers} concurrent workers")
    print("-" * 60)
    
    # Process recipes concurrently
    with concurrent.futures.ThreadPoolExecutor(max_workers=max_workers) as executor:
        # Submit all tasks
        future_to_recipe = {
            executor.submit(check_url, recipe): recipe 
            for recipe in recipes
        }
        
        # Process completed tasks
        for i, future in enumerate(concurrent.futures.as_completed(future_to_recipe)):
            recipe, is_valid, status_code, error_msg = future.result()
            
            # Progress indicator
            if (i + 1) % 10 == 0:
                print(f"Processed {i + 1}/{len(recipes)} recipes...")
            
            # Categorize results
            if error_msg:
                if "No URL" in error_msg:
                    results['statistics']['no_url_count'] += 1
                elif "Not a diabetesfoodhub.org URL" in error_msg:
                    results['statistics']['wrong_domain_count'] += 1
                
                results['errors'].append({
                    'recipe': recipe,
                    'error': error_msg,
                    'status_code': status_code
                })
                results['statistics']['error_count'] += 1
            elif is_valid:
                results['valid'].append({
                    'recipe': recipe,
                    'status_code': status_code
                })
                results['statistics']['valid_count'] += 1
            else:
                results['invalid'].append({
                    'recipe': recipe,
                    'status_code': status_code
                })
                results['statistics']['invalid_count'] += 1
            
            # Rate limiting - be respectful to the server
            time.sleep(0.1)  # 100ms delay between requests
    
    return results

def generate_report(results: Dict, output_file: str):
    """Generate a detailed verification report"""
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    report = []
    report.append("=" * 80)
    report.append("RECIPE URL VERIFICATION REPORT")
    report.append(f"Generated: {timestamp}")
    report.append("=" * 80)
    report.append("")
    
    # Summary statistics
    stats = results['statistics']
    report.append("SUMMARY STATISTICS")
    report.append("-" * 40)
    report.append(f"Total recipes checked: {stats['total']}")
    report.append(f"Valid URLs (200 OK): {stats['valid_count']} ({stats['valid_count']/stats['total']*100:.1f}%)")
    report.append(f"Invalid URLs (404, etc): {stats['invalid_count']} ({stats['invalid_count']/stats['total']*100:.1f}%)")
    report.append(f"Errors/Issues: {stats['error_count']} ({stats['error_count']/stats['total']*100:.1f}%)")
    report.append(f"  - No URL provided: {stats['no_url_count']}")
    report.append(f"  - Wrong domain: {stats['wrong_domain_count']}")
    report.append("")
    
    # Valid recipes
    report.append("=" * 80)
    report.append("VALID RECIPES (Real URLs)")
    report.append("=" * 80)
    for item in results['valid']:
        recipe = item['recipe']
        report.append(f"✓ {recipe['title']}")
        report.append(f"  URL: {recipe.get('url', 'N/A')}")
        report.append(f"  Status: {item['status_code']}")
        report.append("")
    
    # Invalid recipes
    report.append("=" * 80)
    report.append("INVALID RECIPES (Fake/Dead URLs)")
    report.append("=" * 80)
    for item in results['invalid']:
        recipe = item['recipe']
        report.append(f"✗ {recipe['title']}")
        report.append(f"  URL: {recipe.get('url', 'N/A')}")
        report.append(f"  Status: {item['status_code']}")
        report.append("")
    
    # Errors
    report.append("=" * 80)
    report.append("ERRORS/ISSUES")
    report.append("=" * 80)
    for item in results['errors']:
        recipe = item['recipe']
        report.append(f"⚠ {recipe['title']}")
        report.append(f"  URL: {recipe.get('url', 'N/A')}")
        report.append(f"  Error: {item['error']}")
        report.append("")
    
    # Save report
    with open(output_file, 'w') as f:
        f.write('\n'.join(report))
    
    # Also save JSON results
    json_file = output_file.replace('.txt', '.json')
    with open(json_file, 'w') as f:
        json.dump(results, f, indent=2)
    
    print(f"\nReport saved to: {output_file}")
    print(f"JSON results saved to: {json_file}")

def main():
    """Main function"""
    # File paths
    recipes_file = "/home/amy/dev/gdmealplanner/data/recipes/recipes.json"
    report_file = "/home/amy/dev/gdmealplanner/data/recipes/verification_report.txt"
    
    try:
        # Load recipes
        print("Loading recipes...")
        recipes = load_recipes(recipes_file)
        print(f"Loaded {len(recipes)} recipes")
        
        # Verify recipes
        results = verify_recipes(recipes, max_workers=3)  # Use 3 concurrent workers
        
        # Generate report
        print("\nGenerating report...")
        generate_report(results, report_file)
        
        # Print summary
        print("\n" + "=" * 60)
        print("VERIFICATION COMPLETE")
        print("=" * 60)
        stats = results['statistics']
        print(f"Valid recipes: {stats['valid_count']} ({stats['valid_count']/stats['total']*100:.1f}%)")
        print(f"Invalid recipes: {stats['invalid_count']} ({stats['invalid_count']/stats['total']*100:.1f}%)")
        print(f"Errors: {stats['error_count']} ({stats['error_count']/stats['total']*100:.1f}%)")
        
    except Exception as e:
        print(f"Error: {e}")
        return 1
    
    return 0

if __name__ == "__main__":
    exit(main())
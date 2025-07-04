#!/usr/bin/env python3
"""
Generate a summary visualization of recipe verification results
"""

import json
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches

# Load the JSON results
with open('/home/amy/dev/gdmealplanner/data/recipes/verification_report.json', 'r') as f:
    results = json.load(f)

stats = results['statistics']

# Create pie chart
plt.figure(figsize=(10, 8))

# Data for pie chart
labels = ['Valid (Real)', 'Invalid (Fake/404)', 'Errors']
sizes = [stats['valid_count'], stats['invalid_count'], stats['error_count']]
colors = ['#2ecc71', '#e74c3c', '#f39c12']
explode = (0.1, 0, 0)  # explode the valid slice

# Create pie chart
plt.pie(sizes, explode=explode, labels=labels, colors=colors, autopct='%1.1f%%',
        shadow=True, startangle=90)

plt.title('Recipe URL Verification Results\n(diabetesfoodhub.org)', fontsize=16, fontweight='bold')

# Add summary text
summary_text = f"""
Total Recipes Checked: {stats['total']}
Valid URLs: {stats['valid_count']} ({stats['valid_count']/stats['total']*100:.1f}%)
Invalid URLs: {stats['invalid_count']} ({stats['invalid_count']/stats['total']*100:.1f}%)

Key Finding: Only 1 out of 48 recipes has a valid URL on diabetesfoodhub.org
"""

plt.figtext(0.5, 0.02, summary_text, ha='center', fontsize=12, 
            bbox=dict(boxstyle='round,pad=0.5', facecolor='lightgray', alpha=0.8))

# Save the figure
plt.tight_layout()
plt.savefig('/home/amy/dev/gdmealplanner/data/recipes/verification_summary.png', dpi=150, bbox_inches='tight')
plt.close()

# Print the valid recipe details
print("\n" + "="*60)
print("VALID RECIPE FOUND:")
print("="*60)
for item in results['valid']:
    recipe = item['recipe']
    print(f"Title: {recipe['title']}")
    print(f"URL: {recipe['url']}")
    print(f"Category: {recipe.get('category', 'N/A')}")
    print(f"Description: {recipe.get('description', 'N/A')}")

print("\n" + "="*60)
print("RECOMMENDATIONS:")
print("="*60)
print("1. The vast majority (97.9%) of recipes have fake/invalid URLs")
print("2. Only 'Mediterranean Chicken Pita' has a valid URL")
print("3. Consider either:")
print("   - Removing fake URLs from the recipes")
print("   - Finding real diabetesfoodhub.org URLs for these recipes")
print("   - Creating your own recipe pages instead of linking externally")
print("   - Using a different recipe source with valid URLs")
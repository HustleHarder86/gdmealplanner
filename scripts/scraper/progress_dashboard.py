#!/usr/bin/env python3
"""
Progress dashboard for visualizing recipe collection status.
Provides real-time insights into scraping progress and diversity.
"""

import logging
from typing import Dict, List, Optional
from datetime import datetime, timedelta
import json
from pathlib import Path

import pandas as pd
import plotly.graph_objects as go
import plotly.express as px
from plotly.subplots import make_subplots
from rich.console import Console
from rich.table import Table
from rich.progress import Progress, SpinnerColumn, BarColumn, TextColumn
from rich.panel import Panel
from rich.layout import Layout
from rich.live import Live
from rich import box
import time

logger = logging.getLogger(__name__)

# Color scheme for visualizations
COLORS = {
    'primary': '#2E86AB',
    'secondary': '#A23B72',
    'success': '#6A994E',
    'warning': '#F18F01',
    'danger': '#C73E1D',
    'info': '#4361EE',
    'light': '#F7F7F7',
    'dark': '#212529'
}

MEAL_COLORS = {
    'breakfast': '#FFB347',
    'lunch': '#77DD77',
    'dinner': '#89CFF0',
    'snacks': '#F49AC2'
}


class ProgressDashboard:
    """Interactive dashboard for recipe collection progress."""
    
    def __init__(self, data_dir: str = "."):
        self.data_dir = Path(data_dir)
        self.console = Console()
        self.load_data()
        
    def load_data(self):
        """Load progress data from various sources."""
        # Load diversity report
        diversity_file = self.data_dir / "diversity_report.json"
        if diversity_file.exists():
            with open(diversity_file, 'r') as f:
                self.diversity_data = json.load(f)
        else:
            self.diversity_data = {}
            
        # Load scraping progress
        progress_file = self.data_dir / "scraping_progress.json"
        if progress_file.exists():
            with open(progress_file, 'r') as f:
                self.scraping_data = json.load(f)
        else:
            self.scraping_data = {}
            
        # Load validation report
        validation_file = self.data_dir / "validation_report.json"
        if validation_file.exists():
            with open(validation_file, 'r') as f:
                self.validation_data = json.load(f)
        else:
            self.validation_data = {}
            
    def create_overview_chart(self) -> go.Figure:
        """Create overall progress overview chart."""
        if not self.diversity_data:
            return go.Figure()
            
        summary = self.diversity_data.get('summary', {})
        total = summary.get('total_target', 360)
        completed = summary.get('total_collected', 0)
        remaining = total - completed
        
        # Create gauge chart
        fig = go.Figure(go.Indicator(
            mode="gauge+number+delta",
            value=completed,
            domain={'x': [0, 1], 'y': [0, 1]},
            title={'text': "Overall Collection Progress"},
            delta={'reference': total, 'relative': False},
            gauge={
                'axis': {'range': [None, total]},
                'bar': {'color': COLORS['success']},
                'steps': [
                    {'range': [0, total * 0.25], 'color': COLORS['light']},
                    {'range': [total * 0.25, total * 0.5], 'color': '#E8F5E9'},
                    {'range': [total * 0.5, total * 0.75], 'color': '#C8E6C9'},
                    {'range': [total * 0.75, total], 'color': '#A5D6A7'}
                ],
                'threshold': {
                    'line': {'color': COLORS['danger'], 'width': 4},
                    'thickness': 0.75,
                    'value': total * 0.9
                }
            }
        ))
        
        fig.update_layout(
            height=400,
            font={'size': 16}
        )
        
        return fig
        
    def create_meal_type_chart(self) -> go.Figure:
        """Create meal type distribution chart."""
        if not self.diversity_data:
            return go.Figure()
            
        meal_data = self.diversity_data.get('by_meal_type', {})
        
        # Prepare data
        meals = []
        current = []
        target = []
        colors = []
        
        for meal_type, data in meal_data.items():
            meals.append(meal_type.capitalize())
            current.append(data.get('current', 0))
            target.append(data.get('target', 90))
            colors.append(MEAL_COLORS.get(meal_type, COLORS['primary']))
            
        # Create grouped bar chart
        fig = go.Figure()
        
        fig.add_trace(go.Bar(
            name='Current',
            x=meals,
            y=current,
            marker_color=colors,
            text=current,
            textposition='auto'
        ))
        
        fig.add_trace(go.Bar(
            name='Target',
            x=meals,
            y=target,
            marker_color='lightgray',
            opacity=0.5,
            text=target,
            textposition='auto'
        ))
        
        fig.update_layout(
            title="Progress by Meal Type",
            xaxis_title="Meal Type",
            yaxis_title="Number of Recipes",
            barmode='overlay',
            height=400,
            showlegend=True
        )
        
        return fig
        
    def create_cuisine_chart(self) -> go.Figure:
        """Create cuisine diversity chart."""
        if not self.diversity_data:
            return go.Figure()
            
        cuisine_data = self.diversity_data.get('by_cuisine', {})
        
        # Prepare data for sunburst chart
        cuisines = []
        values = []
        parents = []
        
        for cuisine, data in cuisine_data.items():
            if data.get('current', 0) > 0:
                cuisines.append(cuisine.replace('_', ' ').title())
                values.append(data.get('current', 0))
                parents.append("")
                
        # Create sunburst chart
        fig = go.Figure(go.Sunburst(
            labels=cuisines,
            values=values,
            parents=parents,
            marker=dict(
                colors=px.colors.qualitative.Pastel,
                line=dict(width=2)
            ),
            textinfo="label+value+percent parent"
        ))
        
        fig.update_layout(
            title="Recipe Distribution by Cuisine",
            height=500
        )
        
        return fig
        
    def create_daily_progress_chart(self) -> go.Figure:
        """Create daily scraping progress chart."""
        if not self.scraping_data:
            return go.Figure()
            
        daily_counts = self.scraping_data.get('daily_counts', {})
        
        # Prepare time series data
        dates = []
        counts = []
        
        for date, domains in sorted(daily_counts.items()):
            dates.append(date)
            counts.append(sum(domains.values()))
            
        # Create line chart
        fig = go.Figure()
        
        fig.add_trace(go.Scatter(
            x=dates,
            y=counts,
            mode='lines+markers',
            name='Daily Recipes',
            line=dict(color=COLORS['primary'], width=3),
            marker=dict(size=8)
        ))
        
        # Add cumulative line
        cumulative = []
        total = 0
        for count in counts:
            total += count
            cumulative.append(total)
            
        fig.add_trace(go.Scatter(
            x=dates,
            y=cumulative,
            mode='lines',
            name='Cumulative Total',
            line=dict(color=COLORS['secondary'], width=2, dash='dash'),
            yaxis='y2'
        ))
        
        fig.update_layout(
            title="Daily Collection Progress",
            xaxis_title="Date",
            yaxis_title="Recipes Collected",
            yaxis2=dict(
                title="Cumulative Total",
                overlaying='y',
                side='right'
            ),
            height=400,
            hovermode='x unified'
        )
        
        return fig
        
    def create_quality_metrics_chart(self) -> go.Figure:
        """Create quality metrics visualization."""
        # Create subplots for different quality metrics
        fig = make_subplots(
            rows=2, cols=2,
            subplot_titles=('Glycemic Index Distribution', 'Prep Time Distribution',
                          'Fiber Content', 'Validation Status'),
            specs=[[{'type': 'pie'}, {'type': 'histogram'}],
                   [{'type': 'box'}, {'type': 'pie'}]]
        )
        
        # Mock data for demonstration (would come from actual recipe data)
        # Glycemic Index Distribution
        gi_labels = ['Low', 'Medium', 'High']
        gi_values = [150, 180, 30]
        
        fig.add_trace(
            go.Pie(labels=gi_labels, values=gi_values,
                  marker_colors=[COLORS['success'], COLORS['warning'], COLORS['danger']]),
            row=1, col=1
        )
        
        # Prep Time Distribution
        prep_times = [15, 20, 25, 30, 35, 40, 45, 15, 20, 25, 30, 35] * 10
        
        fig.add_trace(
            go.Histogram(x=prep_times, nbinsx=10,
                        marker_color=COLORS['info']),
            row=1, col=2
        )
        
        # Fiber Content Box Plot
        fiber_by_meal = {
            'Breakfast': [3, 4, 5, 6, 4, 5, 7, 8, 5],
            'Lunch': [5, 6, 7, 8, 6, 7, 8, 9, 7],
            'Dinner': [6, 7, 8, 9, 7, 8, 9, 10, 8],
            'Snacks': [2, 3, 4, 5, 3, 4, 5, 6, 4]
        }
        
        for meal, values in fiber_by_meal.items():
            fig.add_trace(
                go.Box(y=values, name=meal,
                      marker_color=MEAL_COLORS.get(meal.lower(), COLORS['primary'])),
                row=2, col=1
            )
            
        # Validation Status
        validation_labels = ['Passed', 'Failed', 'Warnings']
        validation_values = [280, 40, 40]
        
        fig.add_trace(
            go.Pie(labels=validation_labels, values=validation_values,
                  marker_colors=[COLORS['success'], COLORS['danger'], COLORS['warning']]),
            row=2, col=2
        )
        
        fig.update_layout(height=800, showlegend=False)
        
        return fig
        
    def print_console_summary(self):
        """Print a rich console summary of progress."""
        self.console.clear()
        
        # Create layout
        layout = Layout()
        layout.split_column(
            Layout(name="header", size=3),
            Layout(name="body"),
            Layout(name="footer", size=3)
        )
        
        # Header
        layout["header"].update(
            Panel(
                "[bold blue]Gestational Diabetes Recipe Collection Dashboard[/bold blue]",
                box=box.DOUBLE
            )
        )
        
        # Body content
        body = Layout()
        body.split_row(
            Layout(name="stats", ratio=1),
            Layout(name="progress", ratio=2)
        )
        
        # Statistics table
        stats_table = Table(title="Collection Statistics", box=box.ROUNDED)
        stats_table.add_column("Metric", style="cyan")
        stats_table.add_column("Value", style="green")
        
        if self.diversity_data:
            summary = self.diversity_data.get('summary', {})
            stats_table.add_row("Total Target", str(summary.get('total_target', 360)))
            stats_table.add_row("Total Collected", str(summary.get('total_collected', 0)))
            stats_table.add_row("Overall Progress", f"{summary.get('overall_progress', 0):.1f}%")
            stats_table.add_row("Remaining", str(summary.get('total_target', 360) - summary.get('total_collected', 0)))
            
        body["stats"].update(Panel(stats_table))
        
        # Progress bars
        progress_panel = Layout()
        progress_content = ""
        
        if self.diversity_data:
            meal_data = self.diversity_data.get('by_meal_type', {})
            for meal_type, data in meal_data.items():
                current = data.get('current', 0)
                target = data.get('target', 90)
                progress = (current / target) * 100 if target > 0 else 0
                
                progress_content += f"[bold]{meal_type.capitalize()}[/bold]\n"
                progress_content += f"[{'█' * int(progress / 5)}{'░' * (20 - int(progress / 5))}] {progress:.1f}% ({current}/{target})\n\n"
                
        body["progress"].update(Panel(progress_content, title="Progress by Meal Type"))
        
        layout["body"].update(body)
        
        # Footer
        layout["footer"].update(
            Panel(
                f"Last updated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
                box=box.ROUNDED
            )
        )
        
        self.console.print(layout)
        
    def generate_html_dashboard(self, output_file: str = "dashboard.html"):
        """Generate a complete HTML dashboard."""
        # Create all charts
        charts = {
            'overview': self.create_overview_chart(),
            'meal_types': self.create_meal_type_chart(),
            'cuisines': self.create_cuisine_chart(),
            'daily_progress': self.create_daily_progress_chart(),
            'quality_metrics': self.create_quality_metrics_chart()
        }
        
        # Generate HTML
        html_template = """
        <!DOCTYPE html>
        <html>
        <head>
            <title>GD Recipe Collection Dashboard</title>
            <script src="https://cdn.plot.ly/plotly-latest.min.js"></script>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    margin: 0;
                    padding: 20px;
                    background-color: #f5f5f5;
                }
                .container {
                    max-width: 1400px;
                    margin: 0 auto;
                }
                h1 {
                    color: #2E86AB;
                    text-align: center;
                    margin-bottom: 30px;
                }
                .chart-container {
                    background: white;
                    border-radius: 8px;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                    padding: 20px;
                    margin-bottom: 20px;
                }
                .row {
                    display: flex;
                    gap: 20px;
                    margin-bottom: 20px;
                }
                .col {
                    flex: 1;
                }
                .summary-cards {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                    gap: 20px;
                    margin-bottom: 30px;
                }
                .card {
                    background: white;
                    border-radius: 8px;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                    padding: 20px;
                    text-align: center;
                }
                .card h3 {
                    margin: 0 0 10px 0;
                    color: #666;
                    font-size: 14px;
                    text-transform: uppercase;
                }
                .card .value {
                    font-size: 36px;
                    font-weight: bold;
                    color: #2E86AB;
                }
                .card .subtext {
                    color: #999;
                    font-size: 12px;
                    margin-top: 5px;
                }
                .timestamp {
                    text-align: center;
                    color: #999;
                    font-size: 12px;
                    margin-top: 30px;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>Gestational Diabetes Recipe Collection Dashboard</h1>
                
                <div class="summary-cards">
                    {summary_cards}
                </div>
                
                <div class="chart-container">
                    <div id="overview-chart"></div>
                </div>
                
                <div class="row">
                    <div class="col">
                        <div class="chart-container">
                            <div id="meal-types-chart"></div>
                        </div>
                    </div>
                    <div class="col">
                        <div class="chart-container">
                            <div id="cuisines-chart"></div>
                        </div>
                    </div>
                </div>
                
                <div class="chart-container">
                    <div id="daily-progress-chart"></div>
                </div>
                
                <div class="chart-container">
                    <div id="quality-metrics-chart"></div>
                </div>
                
                <div class="timestamp">
                    Generated on {timestamp}
                </div>
            </div>
            
            <script>
                {plot_scripts}
            </script>
        </body>
        </html>
        """
        
        # Generate summary cards
        summary_cards = ""
        if self.diversity_data:
            summary = self.diversity_data.get('summary', {})
            cards_data = [
                ('Total Collected', summary.get('total_collected', 0), 'recipes'),
                ('Overall Progress', f"{summary.get('overall_progress', 0):.1f}%", 'complete'),
                ('Days Active', len(self.scraping_data.get('daily_counts', {})), 'days'),
                ('Sources Used', len(set(domain for daily in self.scraping_data.get('daily_counts', {}).values() for domain in daily)), 'websites')
            ]
            
            for title, value, subtext in cards_data:
                summary_cards += f"""
                <div class="card">
                    <h3>{title}</h3>
                    <div class="value">{value}</div>
                    <div class="subtext">{subtext}</div>
                </div>
                """
        
        # Generate plot scripts
        plot_scripts = ""
        for chart_id, fig in charts.items():
            div_id = f"{chart_id.replace('_', '-')}-chart"
            plot_scripts += f"Plotly.newPlot('{div_id}', {fig.to_json()});\n"
        
        # Fill template
        html = html_template.format(
            summary_cards=summary_cards,
            timestamp=datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
            plot_scripts=plot_scripts
        )
        
        # Save to file
        with open(output_file, 'w') as f:
            f.write(html)
            
        logger.info(f"Generated HTML dashboard: {output_file}")
        return output_file
        
    def run_live_dashboard(self, refresh_interval: int = 5):
        """Run a live updating console dashboard."""
        with Live(self.print_console_summary(), refresh_per_second=1) as live:
            while True:
                time.sleep(refresh_interval)
                self.load_data()  # Reload data
                self.print_console_summary()
                
    def get_recommendations(self) -> List[str]:
        """Get actionable recommendations based on current progress."""
        recommendations = []
        
        if self.diversity_data:
            # Check overall progress
            summary = self.diversity_data.get('summary', {})
            progress = summary.get('overall_progress', 0)
            
            if progress < 25:
                recommendations.append("Focus on high-volume scraping from diabetesfoodhub.org")
            elif progress < 50:
                recommendations.append("Start diversifying sources to ensure variety")
            elif progress < 75:
                recommendations.append("Focus on filling gaps in underrepresented cuisines")
            else:
                recommendations.append("Final push - target specific missing categories")
                
            # Check meal type balance
            meal_data = self.diversity_data.get('by_meal_type', {})
            for meal_type, data in meal_data.items():
                if data.get('progress', 0) < 50:
                    recommendations.append(f"Prioritize {meal_type} recipes (only {data.get('progress', 0):.0f}% complete)")
                    
            # Check cuisine diversity
            cuisine_data = self.diversity_data.get('by_cuisine', {})
            low_cuisines = [c for c, d in cuisine_data.items() if d.get('progress', 0) < 30]
            if low_cuisines:
                recommendations.append(f"Need more recipes from: {', '.join(low_cuisines)}")
                
        return recommendations
        
        
def main():
    """Run the dashboard."""
    import argparse
    
    parser = argparse.ArgumentParser(description='Recipe Collection Progress Dashboard')
    parser.add_argument('--mode', choices=['console', 'html', 'live'], default='console',
                       help='Dashboard display mode')
    parser.add_argument('--output', default='dashboard.html',
                       help='Output file for HTML mode')
    parser.add_argument('--data-dir', default='.',
                       help='Directory containing progress data files')
    
    args = parser.parse_args()
    
    dashboard = ProgressDashboard(args.data_dir)
    
    if args.mode == 'console':
        dashboard.print_console_summary()
        recommendations = dashboard.get_recommendations()
        if recommendations:
            dashboard.console.print("\n[bold yellow]Recommendations:[/bold yellow]")
            for rec in recommendations:
                dashboard.console.print(f"  • {rec}")
    elif args.mode == 'html':
        output_file = dashboard.generate_html_dashboard(args.output)
        dashboard.console.print(f"[green]Generated HTML dashboard: {output_file}[/green]")
    elif args.mode == 'live':
        dashboard.run_live_dashboard()
        

if __name__ == "__main__":
    main()
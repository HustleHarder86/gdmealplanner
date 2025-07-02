#!/usr/bin/env python3
"""
Notification system for Supervisor Agent
Sends alerts when agents fail or need review
"""

import json
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from pathlib import Path
from typing import List, Dict, Any
import os

class NotificationSystem:
    """Handle notifications for supervisor results"""
    
    def __init__(self, config_path: str = None):
        """Initialize notification system with optional config"""
        self.config = {}
        if config_path and Path(config_path).exists():
            with open(config_path, 'r') as f:
                self.config = json.load(f)
    
    def send_email(self, subject: str, body: str, to_emails: List[str]):
        """Send email notification (requires SMTP configuration)"""
        if not self.config.get('smtp'):
            print("SMTP not configured, skipping email notification")
            return
        
        smtp_config = self.config['smtp']
        
        msg = MIMEMultipart()
        msg['From'] = smtp_config['from_email']
        msg['To'] = ', '.join(to_emails)
        msg['Subject'] = subject
        
        msg.attach(MIMEText(body, 'html'))
        
        try:
            with smtplib.SMTP(smtp_config['host'], smtp_config['port']) as server:
                if smtp_config.get('use_tls'):
                    server.starttls()
                if smtp_config.get('username'):
                    server.login(smtp_config['username'], smtp_config['password'])
                server.send_message(msg)
            print(f"Email sent successfully to {', '.join(to_emails)}")
        except Exception as e:
            print(f"Failed to send email: {str(e)}")
    
    def send_slack(self, message: str, webhook_url: str = None):
        """Send Slack notification (requires webhook URL)"""
        webhook_url = webhook_url or self.config.get('slack', {}).get('webhook_url')
        if not webhook_url:
            print("Slack webhook not configured, skipping notification")
            return
        
        try:
            import requests
            response = requests.post(webhook_url, json={'text': message})
            if response.status_code == 200:
                print("Slack notification sent successfully")
            else:
                print(f"Failed to send Slack notification: {response.status_code}")
        except ImportError:
            print("requests library not installed, cannot send Slack notification")
        except Exception as e:
            print(f"Failed to send Slack notification: {str(e)}")
    
    def create_summary_html(self, reports: List[Dict[str, Any]]) -> str:
        """Create HTML summary of supervisor reports"""
        html = """
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; }
                .status-failed { color: #dc3545; }
                .status-needs-review { color: #ffc107; }
                .status-completed { color: #28a745; }
                table { border-collapse: collapse; width: 100%; margin-top: 20px; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                th { background-color: #f2f2f2; }
                .issues { background-color: #fff3cd; }
            </style>
        </head>
        <body>
            <h2>Claude Code Supervisor Report</h2>
        """
        
        # Summary statistics
        total = len(reports)
        failed = sum(1 for r in reports if r['status'] == 'Failed ❌')
        needs_review = sum(1 for r in reports if r['status'] == 'Needs Review ⚠️')
        completed = sum(1 for r in reports if r['status'] == 'Completed ✅')
        
        html += f"""
            <p><strong>Total Agents:</strong> {total}</p>
            <ul>
                <li class="status-completed">Completed: {completed}</li>
                <li class="status-needs-review">Needs Review: {needs_review}</li>
                <li class="status-failed">Failed: {failed}</li>
            </ul>
        """
        
        # Detailed table
        html += """
            <table>
                <tr>
                    <th>Agent</th>
                    <th>Status</th>
                    <th>Issues</th>
                    <th>Recommendations</th>
                </tr>
        """
        
        for report in reports:
            status_class = 'status-failed' if 'Failed' in report['status'] else \
                          'status-needs-review' if 'Review' in report['status'] else \
                          'status-completed'
            
            issues = '<br>'.join(report.get('issues', []))
            recommendations = '<br>'.join(report.get('recommendations', []))
            
            html += f"""
                <tr class="{status_class}">
                    <td>{report['agent_name']}</td>
                    <td>{report['status']}</td>
                    <td class="issues">{issues}</td>
                    <td>{recommendations}</td>
                </tr>
            """
        
        html += """
            </table>
        </body>
        </html>
        """
        
        return html
    
    def notify_on_failures(self, reports_dir: str):
        """Check latest reports and send notifications if needed"""
        reports_path = Path(reports_dir)
        
        # Find the latest summary
        summaries = list(reports_path.glob("summary_*.md"))
        if not summaries:
            print("No summary reports found")
            return
        
        latest_summary = max(summaries, key=lambda p: p.stat().st_mtime)
        
        # Load individual reports from the same time period
        timestamp = latest_summary.stem.replace('summary_', '')
        reports = []
        
        for report_file in reports_path.glob(f"*_{timestamp}.json"):
            if 'summary' not in report_file.name:
                with open(report_file, 'r') as f:
                    reports.append(json.load(f))
        
        # Check if we need to send notifications
        failed_agents = [r for r in reports if 'Failed' in r.get('status', '')]
        needs_review = [r for r in reports if 'Review' in r.get('status', '')]
        
        if not failed_agents and not needs_review:
            print("All agents passed validation, no notifications needed")
            return
        
        # Prepare notification content
        subject = f"Claude Code Supervisor Alert: {len(failed_agents)} Failed, {len(needs_review)} Need Review"
        
        # Create HTML summary
        html_body = self.create_summary_html(reports)
        
        # Send notifications
        if self.config.get('email', {}).get('enabled'):
            to_emails = self.config['email'].get('recipients', [])
            if to_emails:
                self.send_email(subject, html_body, to_emails)
        
        if self.config.get('slack', {}).get('enabled'):
            slack_message = f"*{subject}*\n"
            for agent in failed_agents:
                slack_message += f"\n❌ *{agent['agent_name']}*: {', '.join(agent.get('issues', []))}"
            for agent in needs_review:
                slack_message += f"\n⚠️ *{agent['agent_name']}*: {', '.join(agent.get('issues', []))}"
            
            self.send_slack(slack_message)

def main():
    """Main entry point for notifications"""
    import argparse
    
    parser = argparse.ArgumentParser(description="Supervisor Notification System")
    parser.add_argument("--config", help="Path to notification config file")
    parser.add_argument("--reports-dir", default="/home/amy/dev/gdmealplanner/scripts/supervisor/reports",
                        help="Directory containing supervisor reports")
    parser.add_argument("--test-email", action="store_true", help="Send a test email")
    parser.add_argument("--test-slack", action="store_true", help="Send a test Slack message")
    
    args = parser.parse_args()
    
    notifier = NotificationSystem(args.config)
    
    if args.test_email:
        notifier.send_email(
            "Test Email from Claude Code Supervisor",
            "<h1>Test Email</h1><p>This is a test email from the supervisor notification system.</p>",
            notifier.config.get('email', {}).get('recipients', [])
        )
    elif args.test_slack:
        notifier.send_slack("Test message from Claude Code Supervisor")
    else:
        notifier.notify_on_failures(args.reports_dir)

if __name__ == "__main__":
    main()
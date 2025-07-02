#!/usr/bin/env python3
"""
Scraping ethics module for responsible web scraping.
Handles robots.txt compliance, rate limiting, and progress saving.
"""

import logging
import time
import json
import os
from typing import Dict, List, Optional, Tuple
from urllib.parse import urlparse, urljoin
from datetime import datetime, timedelta
import pickle
from pathlib import Path

import requests
from urllib.robotparser import RobotFileParser
from ratelimit import limits, sleep_and_retry
import schedule

logger = logging.getLogger(__name__)

# Ethical scraping limits
DAILY_LIMITS = {
    'diabetesfoodhub.org': 60,
    'eatingwell.com': 50,
    'healthline.com': 40,
    'allrecipes.com': 50,
    'default': 30
}

# Rate limiting settings (requests per minute)
RATE_LIMITS = {
    'diabetesfoodhub.org': 30,  # 30 requests per minute
    'eatingwell.com': 20,
    'healthline.com': 15,
    'allrecipes.com': 25,
    'default': 10
}

# Delay between requests (seconds)
REQUEST_DELAYS = {
    'diabetesfoodhub.org': 2,
    'eatingwell.com': 3,
    'healthline.com': 4,
    'allrecipes.com': 2,
    'default': 5
}


class RobotsChecker:
    """Check and cache robots.txt compliance."""
    
    def __init__(self, cache_dir: str = ".robots_cache"):
        self.cache_dir = Path(cache_dir)
        self.cache_dir.mkdir(exist_ok=True)
        self.robots_cache = {}
        self._load_cache()
        
    def _load_cache(self):
        """Load robots.txt cache from disk."""
        cache_file = self.cache_dir / "robots_cache.json"
        if cache_file.exists():
            try:
                with open(cache_file, 'r') as f:
                    cache_data = json.load(f)
                    # Convert back to RobotFileParser objects
                    for domain, data in cache_data.items():
                        if datetime.fromisoformat(data['expires']) > datetime.now():
                            rp = RobotFileParser()
                            rp.set_url(data['url'])
                            rp.parse(data['content'].split('\n'))
                            self.robots_cache[domain] = {
                                'parser': rp,
                                'expires': datetime.fromisoformat(data['expires'])
                            }
            except Exception as e:
                logger.error(f"Error loading robots cache: {e}")
                
    def _save_cache(self):
        """Save robots.txt cache to disk."""
        cache_file = self.cache_dir / "robots_cache.json"
        cache_data = {}
        
        for domain, data in self.robots_cache.items():
            # Get the content by making a request
            try:
                robots_url = urljoin(f"https://{domain}", "/robots.txt")
                response = requests.get(robots_url, timeout=10)
                content = response.text if response.status_code == 200 else ""
                
                cache_data[domain] = {
                    'url': robots_url,
                    'content': content,
                    'expires': data['expires'].isoformat()
                }
            except:
                pass
                
        with open(cache_file, 'w') as f:
            json.dump(cache_data, f)
            
    def can_fetch(self, url: str, user_agent: str = "*") -> bool:
        """Check if URL can be fetched according to robots.txt."""
        parsed = urlparse(url)
        domain = parsed.netloc
        
        # Check cache
        if domain in self.robots_cache:
            if self.robots_cache[domain]['expires'] > datetime.now():
                return self.robots_cache[domain]['parser'].can_fetch(user_agent, url)
                
        # Fetch and cache robots.txt
        try:
            robots_url = urljoin(f"{parsed.scheme}://{domain}", "/robots.txt")
            rp = RobotFileParser()
            rp.set_url(robots_url)
            rp.read()
            
            # Cache for 24 hours
            self.robots_cache[domain] = {
                'parser': rp,
                'expires': datetime.now() + timedelta(hours=24)
            }
            self._save_cache()
            
            return rp.can_fetch(user_agent, url)
            
        except Exception as e:
            logger.warning(f"Error checking robots.txt for {domain}: {e}")
            # Be conservative - assume we can't fetch if robots.txt fails
            return False
            
    def get_crawl_delay(self, domain: str, user_agent: str = "*") -> Optional[float]:
        """Get crawl delay from robots.txt if specified."""
        if domain in self.robots_cache:
            parser = self.robots_cache[domain]['parser']
            # Note: robotparser doesn't directly expose crawl-delay
            # This is a simplified approach
            return None
        return None


class ProgressTracker:
    """Track scraping progress and enable resumability."""
    
    def __init__(self, progress_file: str = "scraping_progress.json"):
        self.progress_file = progress_file
        self.progress = self._load_progress()
        
    def _load_progress(self) -> Dict:
        """Load progress from file."""
        if os.path.exists(self.progress_file):
            try:
                with open(self.progress_file, 'r') as f:
                    return json.load(f)
            except Exception as e:
                logger.error(f"Error loading progress: {e}")
                
        return {
            'session_id': datetime.now().isoformat(),
            'daily_counts': {},
            'total_scraped': 0,
            'last_urls': {},
            'completed_urls': set(),
            'failed_urls': {},
            'last_save': datetime.now().isoformat()
        }
        
    def save_progress(self):
        """Save current progress to file."""
        self.progress['last_save'] = datetime.now().isoformat()
        
        # Convert sets to lists for JSON serialization
        progress_copy = self.progress.copy()
        progress_copy['completed_urls'] = list(self.progress['completed_urls'])
        
        with open(self.progress_file, 'w') as f:
            json.dump(progress_copy, f, indent=2)
            
    def update_daily_count(self, domain: str):
        """Update daily count for a domain."""
        today = datetime.now().date().isoformat()
        
        if 'daily_counts' not in self.progress:
            self.progress['daily_counts'] = {}
            
        if today not in self.progress['daily_counts']:
            self.progress['daily_counts'][today] = {}
            
        if domain not in self.progress['daily_counts'][today]:
            self.progress['daily_counts'][today][domain] = 0
            
        self.progress['daily_counts'][today][domain] += 1
        self.progress['total_scraped'] += 1
        
    def get_daily_count(self, domain: str) -> int:
        """Get today's count for a domain."""
        today = datetime.now().date().isoformat()
        
        if today in self.progress.get('daily_counts', {}):
            return self.progress['daily_counts'][today].get(domain, 0)
        return 0
        
    def can_scrape_today(self, domain: str) -> Tuple[bool, int]:
        """Check if we can scrape more from this domain today."""
        daily_limit = DAILY_LIMITS.get(domain, DAILY_LIMITS['default'])
        current_count = self.get_daily_count(domain)
        
        return current_count < daily_limit, daily_limit - current_count
        
    def mark_completed(self, url: str):
        """Mark URL as completed."""
        if isinstance(self.progress['completed_urls'], list):
            self.progress['completed_urls'] = set(self.progress['completed_urls'])
        self.progress['completed_urls'].add(url)
        
        # Update domain progress
        domain = urlparse(url).netloc
        self.update_daily_count(domain)
        self.progress['last_urls'][domain] = url
        
        # Save every 10 URLs
        if self.progress['total_scraped'] % 10 == 0:
            self.save_progress()
            
    def mark_failed(self, url: str, error: str):
        """Mark URL as failed with error."""
        self.progress['failed_urls'][url] = {
            'error': error,
            'timestamp': datetime.now().isoformat()
        }
        
    def is_completed(self, url: str) -> bool:
        """Check if URL has been completed."""
        if isinstance(self.progress['completed_urls'], list):
            self.progress['completed_urls'] = set(self.progress['completed_urls'])
        return url in self.progress['completed_urls']
        
    def get_resume_point(self, domain: str) -> Optional[str]:
        """Get the last URL scraped for a domain to resume from."""
        return self.progress['last_urls'].get(domain)
        
    def reset_daily_counts(self):
        """Reset daily counts (called by scheduler)."""
        yesterday = (datetime.now() - timedelta(days=1)).date().isoformat()
        if yesterday in self.progress.get('daily_counts', {}):
            # Archive old counts
            if 'daily_archives' not in self.progress:
                self.progress['daily_archives'] = {}
            self.progress['daily_archives'][yesterday] = self.progress['daily_counts'][yesterday]
            
        # Reset for today
        today = datetime.now().date().isoformat()
        self.progress['daily_counts'] = {today: {}}
        self.save_progress()
        
    def get_statistics(self) -> Dict:
        """Get scraping statistics."""
        stats = {
            'total_scraped': self.progress['total_scraped'],
            'total_completed': len(self.progress['completed_urls']),
            'total_failed': len(self.progress['failed_urls']),
            'todays_progress': {},
            'domains_at_limit': []
        }
        
        today = datetime.now().date().isoformat()
        if today in self.progress.get('daily_counts', {}):
            for domain, count in self.progress['daily_counts'][today].items():
                limit = DAILY_LIMITS.get(domain, DAILY_LIMITS['default'])
                stats['todays_progress'][domain] = {
                    'count': count,
                    'limit': limit,
                    'percentage': (count / limit) * 100
                }
                if count >= limit:
                    stats['domains_at_limit'].append(domain)
                    
        return stats


class EthicalScraper:
    """Main class for ethical web scraping with all safety features."""
    
    def __init__(self, user_agent: str = None):
        self.user_agent = user_agent or 'GDMealPlanner-Bot/1.0 (Gestational Diabetes Recipe Collector)'
        self.robots_checker = RobotsChecker()
        self.progress_tracker = ProgressTracker()
        self.session = requests.Session()
        self.session.headers.update({'User-Agent': self.user_agent})
        
        # Schedule daily reset
        schedule.every().day.at("00:00").do(self.progress_tracker.reset_daily_counts)
        
    def can_scrape(self, url: str) -> Tuple[bool, str]:
        """Check if URL can be scraped ethically."""
        # Check robots.txt
        if not self.robots_checker.can_fetch(url, self.user_agent):
            return False, "Blocked by robots.txt"
            
        # Check daily limits
        domain = urlparse(url).netloc
        can_scrape, remaining = self.progress_tracker.can_scrape_today(domain)
        if not can_scrape:
            return False, f"Daily limit reached for {domain}"
            
        # Check if already scraped
        if self.progress_tracker.is_completed(url):
            return False, "URL already scraped"
            
        return True, f"OK (remaining today: {remaining})"
        
    def get_rate_limiter(self, domain: str):
        """Get rate limiter for domain."""
        rate_limit = RATE_LIMITS.get(domain, RATE_LIMITS['default'])
        
        @sleep_and_retry
        @limits(calls=rate_limit, period=60)  # X calls per minute
        def rate_limited_request():
            pass
            
        return rate_limited_request
        
    def scrape_url(self, url: str, scraper_func, **kwargs) -> Optional[Dict]:
        """Scrape URL with all ethical safeguards."""
        # Check if we can scrape
        can_scrape, reason = self.can_scrape(url)
        if not can_scrape:
            logger.info(f"Skipping {url}: {reason}")
            return None
            
        domain = urlparse(url).netloc
        
        try:
            # Apply rate limiting
            rate_limiter = self.get_rate_limiter(domain)
            rate_limiter()
            
            # Apply delay
            delay = REQUEST_DELAYS.get(domain, REQUEST_DELAYS['default'])
            time.sleep(delay)
            
            # Scrape the URL
            logger.info(f"Scraping {url}")
            result = scraper_func(url, **kwargs)
            
            if result:
                # Mark as completed
                self.progress_tracker.mark_completed(url)
                return result
            else:
                self.progress_tracker.mark_failed(url, "No data returned")
                return None
                
        except Exception as e:
            logger.error(f"Error scraping {url}: {e}")
            self.progress_tracker.mark_failed(url, str(e))
            return None
            
    def scrape_batch(self, urls: List[str], scraper_func, **kwargs) -> List[Dict]:
        """Scrape a batch of URLs ethically."""
        results = []
        
        # Group by domain for better rate limiting
        domain_urls = {}
        for url in urls:
            domain = urlparse(url).netloc
            if domain not in domain_urls:
                domain_urls[domain] = []
            domain_urls[domain].append(url)
            
        # Scrape domain by domain
        for domain, domain_url_list in domain_urls.items():
            logger.info(f"Scraping {len(domain_url_list)} URLs from {domain}")
            
            for url in domain_url_list:
                # Check daily schedule
                schedule.run_pending()
                
                result = self.scrape_url(url, scraper_func, **kwargs)
                if result:
                    results.append(result)
                    
                # Check if we should stop for this domain
                can_continue, remaining = self.progress_tracker.can_scrape_today(domain)
                if not can_continue:
                    logger.info(f"Daily limit reached for {domain}")
                    break
                    
        return results
        
    def get_scraping_plan(self, total_target: int = 360) -> Dict:
        """Generate a scraping plan based on current progress and limits."""
        stats = self.progress_tracker.get_statistics()
        plan = {
            'total_target': total_target,
            'total_completed': stats['total_completed'],
            'remaining': total_target - stats['total_completed'],
            'days_needed': 0,
            'daily_plan': {},
            'recommendations': []
        }
        
        # Calculate daily capacity
        daily_capacity = sum(DAILY_LIMITS.values()) - sum(DAILY_LIMITS.values()) // 4  # 75% capacity for safety
        
        # Calculate days needed
        plan['days_needed'] = max(1, plan['remaining'] // daily_capacity)
        
        # Generate daily targets
        domains = list(DAILY_LIMITS.keys())
        domains.remove('default')
        
        for day in range(plan['days_needed']):
            day_key = f"day_{day + 1}"
            plan['daily_plan'][day_key] = {}
            
            for domain in domains:
                # Allocate proportionally
                domain_allocation = min(
                    DAILY_LIMITS[domain] * 0.8,  # 80% of limit for safety
                    plan['remaining'] // len(domains) // plan['days_needed']
                )
                plan['daily_plan'][day_key][domain] = int(domain_allocation)
                
        # Add recommendations
        if plan['days_needed'] > 7:
            plan['recommendations'].append(
                f"Consider increasing daily limits or running multiple sessions to complete in fewer days"
            )
            
        for domain in stats.get('domains_at_limit', []):
            plan['recommendations'].append(
                f"{domain} has reached its daily limit - will resume tomorrow"
            )
            
        return plan
        
    def export_progress_report(self, output_file: str = "scraping_report.json"):
        """Export detailed progress report."""
        report = {
            'generated_at': datetime.now().isoformat(),
            'statistics': self.progress_tracker.get_statistics(),
            'scraping_plan': self.get_scraping_plan(),
            'failed_urls': self.progress_tracker.progress.get('failed_urls', {}),
            'configuration': {
                'daily_limits': DAILY_LIMITS,
                'rate_limits': RATE_LIMITS,
                'request_delays': REQUEST_DELAYS
            }
        }
        
        with open(output_file, 'w') as f:
            json.dump(report, f, indent=2)
            
        logger.info(f"Exported progress report to {output_file}")
        
        return report
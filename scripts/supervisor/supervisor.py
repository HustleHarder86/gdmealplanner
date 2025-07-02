#!/usr/bin/env python3
"""
Supervisor Agent for Claude Code Agents
Monitors and validates the work of other agents in the Pregnancy Plate Planner project.
"""

import os
import sys
import json
import subprocess
import datetime
import re
from pathlib import Path
from typing import Dict, List, Optional, Tuple, Any
from dataclasses import dataclass, asdict
from enum import Enum
import logging
import concurrent.futures
import hashlib
import time

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("SupervisorAgent")


class AgentStatus(Enum):
    """Status of an agent's execution"""
    NOT_STARTED = "Not Started"
    IN_PROGRESS = "In Progress"
    COMPLETED = "Completed ✅"
    FAILED = "Failed ❌"
    NEEDS_REVIEW = "Needs Review ⚠️"


class ValidationStatus(Enum):
    """Status of validation checks"""
    PASSED = "Passed"
    FAILED = "Failed"
    WARNING = "Warning"
    SKIPPED = "Skipped"


@dataclass
class ValidationResult:
    """Result of a validation check"""
    check_name: str
    status: ValidationStatus
    message: str
    details: Optional[Dict[str, Any]] = None
    

@dataclass
class AgentReport:
    """Detailed report for an agent's execution"""
    agent_name: str
    status: AgentStatus
    start_time: str
    end_time: str
    duration: float
    files_created: List[str]
    files_modified: List[str]
    validation_results: List[ValidationResult]
    git_commits: List[str]
    issues: List[str]
    recommendations: List[str]
    dependencies_checked: bool
    tests_passed: Optional[bool]
    

class SupervisorAgent:
    """Main supervisor agent class"""
    
    def __init__(self, project_root: str):
        self.project_root = Path(project_root)
        self.logs_dir = self.project_root / "logs" / "agents"
        self.supervisor_dir = self.project_root / "scripts" / "supervisor"
        self.claude_md_path = self.project_root / "CLAUDE.md"
        self.reports_dir = self.supervisor_dir / "reports"
        self.state_file = self.supervisor_dir / "supervisor_state.json"
        
        # Ensure directories exist
        self.logs_dir.mkdir(parents=True, exist_ok=True)
        self.reports_dir.mkdir(parents=True, exist_ok=True)
        
        # Load or initialize state
        self.state = self._load_state()
        
        # Agent definitions
        self.agents = {
            "Firebase Setup Agent": {
                "files": ["firebase.json", "firestore.rules", "storage.rules", "src/lib/firebase.ts"],
                "dependencies": [],
                "tests": ["npm run typecheck"],
                "validation_checks": ["firebase_config", "security_rules", "typescript_types"]
            },
            "Next.js Foundation Agent": {
                "files": ["next.config.js", "tailwind.config.ts", "tsconfig.json", "app/layout.tsx"],
                "dependencies": [],
                "tests": ["npm run build"],
                "validation_checks": ["nextjs_config", "routing_structure", "ui_components"]
            },
            "Authentication Flow Agent": {
                "files": ["src/contexts/AuthContext.tsx", "app/auth/login/page.tsx", "app/auth/signup/page.tsx"],
                "dependencies": ["Firebase Setup Agent", "Next.js Foundation Agent"],
                "tests": ["npm run typecheck"],
                "validation_checks": ["auth_context", "protected_routes", "auth_pages"]
            },
            "Recipe Scraper Agent": {
                "files": ["scripts/scraper/recipe_scraper.py", "scripts/scraper/cli.py"],
                "dependencies": ["Firebase Setup Agent"],
                "tests": ["cd scripts/scraper && python test_scraper.py"],
                "validation_checks": ["scraper_implementation", "cli_interface", "sample_data"]
            },
            "UI Component Library Agent": {
                "files": ["components/ui/Button.tsx", "components/ui/Card.tsx", "components/ui/Modal.tsx"],
                "dependencies": ["Next.js Foundation Agent"],
                "tests": ["npm run typecheck"],
                "validation_checks": ["ui_components", "accessibility", "responsive_design"]
            }
        }
        
    def _load_state(self) -> Dict[str, Any]:
        """Load supervisor state from disk"""
        if self.state_file.exists():
            with open(self.state_file, 'r') as f:
                return json.load(f)
        return {
            "last_run": None,
            "agent_states": {},
            "file_hashes": {}
        }
    
    def _save_state(self):
        """Save supervisor state to disk"""
        self.state["last_run"] = datetime.datetime.now().isoformat()
        with open(self.state_file, 'w') as f:
            json.dump(self.state, f, indent=2)
    
    def _get_file_hash(self, file_path: Path) -> str:
        """Get hash of a file for change detection"""
        if not file_path.exists():
            return ""
        with open(file_path, 'rb') as f:
            return hashlib.sha256(f.read()).hexdigest()
    
    def _run_command(self, command: str, cwd: Optional[str] = None) -> Tuple[bool, str, str]:
        """Run a shell command and return success, stdout, stderr"""
        try:
            result = subprocess.run(
                command,
                shell=True,
                cwd=cwd or self.project_root,
                capture_output=True,
                text=True,
                timeout=300  # 5 minute timeout
            )
            return result.returncode == 0, result.stdout, result.stderr
        except subprocess.TimeoutExpired:
            return False, "", "Command timed out after 5 minutes"
        except Exception as e:
            return False, "", str(e)
    
    def _get_git_commits(self, since: Optional[str] = None) -> List[str]:
        """Get git commits since a certain time"""
        cmd = "git log --oneline"
        if since:
            cmd += f" --since='{since}'"
        success, stdout, _ = self._run_command(cmd)
        if success:
            return stdout.strip().split('\n') if stdout.strip() else []
        return []
    
    def _detect_file_changes(self) -> Tuple[List[str], List[str]]:
        """Detect created and modified files"""
        created = []
        modified = []
        
        # Use git to detect changes
        success, stdout, _ = self._run_command("git status --porcelain")
        if success:
            for line in stdout.strip().split('\n'):
                if not line:
                    continue
                status = line[:2]
                file_path = line[3:]
                if 'A' in status or '?' in status:
                    created.append(file_path)
                elif 'M' in status:
                    modified.append(file_path)
        
        # Also check against our stored hashes
        for file_path, old_hash in self.state.get("file_hashes", {}).items():
            path = self.project_root / file_path
            if path.exists():
                new_hash = self._get_file_hash(path)
                if new_hash != old_hash and file_path not in modified:
                    modified.append(file_path)
        
        return created, modified
    
    def _validate_firebase_config(self) -> ValidationResult:
        """Validate Firebase configuration"""
        firebase_json = self.project_root / "firebase.json"
        if not firebase_json.exists():
            return ValidationResult(
                "firebase_config",
                ValidationStatus.FAILED,
                "firebase.json not found"
            )
        
        try:
            with open(firebase_json, 'r') as f:
                config = json.load(f)
            
            # Check for required sections
            required_keys = ["firestore", "hosting", "storage"]
            missing_keys = [k for k in required_keys if k not in config]
            
            if missing_keys:
                return ValidationResult(
                    "firebase_config",
                    ValidationStatus.WARNING,
                    f"Missing configuration for: {', '.join(missing_keys)}"
                )
            
            return ValidationResult(
                "firebase_config",
                ValidationStatus.PASSED,
                "Firebase configuration is valid"
            )
        except json.JSONDecodeError:
            return ValidationResult(
                "firebase_config",
                ValidationStatus.FAILED,
                "Invalid JSON in firebase.json"
            )
    
    def _validate_security_rules(self) -> ValidationResult:
        """Validate Firestore and Storage security rules"""
        issues = []
        
        # Check Firestore rules
        firestore_rules = self.project_root / "firestore.rules"
        if not firestore_rules.exists():
            issues.append("firestore.rules not found")
        else:
            with open(firestore_rules, 'r') as f:
                content = f.read()
                if "allow read, write: if true" in content:
                    issues.append("Firestore rules are too permissive (allow all)")
        
        # Check Storage rules
        storage_rules = self.project_root / "storage.rules"
        if not storage_rules.exists():
            issues.append("storage.rules not found")
        else:
            with open(storage_rules, 'r') as f:
                content = f.read()
                if "allow read, write: if true" in content:
                    issues.append("Storage rules are too permissive (allow all)")
        
        if issues:
            return ValidationResult(
                "security_rules",
                ValidationStatus.WARNING,
                "Security rule issues found",
                {"issues": issues}
            )
        
        return ValidationResult(
            "security_rules",
            ValidationStatus.PASSED,
            "Security rules are properly configured"
        )
    
    def _validate_typescript_types(self) -> ValidationResult:
        """Validate TypeScript types exist for Firebase"""
        types_file = self.project_root / "src" / "types" / "firebase.ts"
        if not types_file.exists():
            return ValidationResult(
                "typescript_types",
                ValidationStatus.FAILED,
                "Firebase TypeScript types not found"
            )
        
        with open(types_file, 'r') as f:
            content = f.read()
            
        # Check for required type definitions
        required_types = ["User", "Recipe", "MealPlan", "GlucoseReading"]
        missing_types = [t for t in required_types if f"interface {t}" not in content and f"type {t}" not in content]
        
        if missing_types:
            return ValidationResult(
                "typescript_types",
                ValidationStatus.WARNING,
                f"Missing type definitions for: {', '.join(missing_types)}"
            )
        
        return ValidationResult(
            "typescript_types",
            ValidationStatus.PASSED,
            "All required TypeScript types are defined"
        )
    
    def _validate_nextjs_config(self) -> ValidationResult:
        """Validate Next.js configuration"""
        config_file = self.project_root / "next.config.js"
        if not config_file.exists():
            return ValidationResult(
                "nextjs_config",
                ValidationStatus.FAILED,
                "next.config.js not found"
            )
        
        # Run Next.js build to validate
        success, _, stderr = self._run_command("npm run build")
        if not success:
            return ValidationResult(
                "nextjs_config",
                ValidationStatus.FAILED,
                "Next.js build failed",
                {"error": stderr[:500]}  # First 500 chars of error
            )
        
        return ValidationResult(
            "nextjs_config",
            ValidationStatus.PASSED,
            "Next.js configuration is valid"
        )
    
    def _validate_routing_structure(self) -> ValidationResult:
        """Validate the routing structure exists"""
        app_dir = self.project_root / "app"
        required_routes = [
            "auth/login",
            "auth/signup",
            "(protected)/dashboard",
            "(protected)/meal-planner",
            "(protected)/recipes",
            "(protected)/tracking/glucose"
        ]
        
        missing_routes = []
        for route in required_routes:
            route_path = app_dir / route / "page.tsx"
            if not route_path.exists():
                missing_routes.append(route)
        
        if missing_routes:
            return ValidationResult(
                "routing_structure",
                ValidationStatus.WARNING,
                f"Missing routes: {', '.join(missing_routes)}"
            )
        
        return ValidationResult(
            "routing_structure",
            ValidationStatus.PASSED,
            "All required routes are present"
        )
    
    def _validate_ui_components(self) -> ValidationResult:
        """Validate UI components exist"""
        components_dir = self.project_root / "components" / "ui"
        required_components = ["Button.tsx", "Card.tsx", "Input.tsx", "Modal.tsx"]
        
        missing_components = []
        for component in required_components:
            if not (components_dir / component).exists():
                missing_components.append(component)
        
        if missing_components:
            return ValidationResult(
                "ui_components",
                ValidationStatus.WARNING,
                f"Missing UI components: {', '.join(missing_components)}"
            )
        
        return ValidationResult(
            "ui_components",
            ValidationStatus.PASSED,
            "All required UI components are present"
        )
    
    def _validate_auth_context(self) -> ValidationResult:
        """Validate AuthContext implementation"""
        auth_context = self.project_root / "src" / "contexts" / "AuthContext.tsx"
        if not auth_context.exists():
            return ValidationResult(
                "auth_context",
                ValidationStatus.FAILED,
                "AuthContext.tsx not found"
            )
        
        with open(auth_context, 'r') as f:
            content = f.read()
        
        # Check for required functionality
        required_functions = ["login", "logout", "signup", "resetPassword"]
        missing_functions = [f for f in required_functions if f not in content]
        
        if missing_functions:
            return ValidationResult(
                "auth_context",
                ValidationStatus.WARNING,
                f"Missing auth functions: {', '.join(missing_functions)}"
            )
        
        return ValidationResult(
            "auth_context",
            ValidationStatus.PASSED,
            "AuthContext is properly implemented"
        )
    
    def _validate_scraper_implementation(self) -> ValidationResult:
        """Validate recipe scraper implementation"""
        scraper_file = self.project_root / "scripts" / "scraper" / "recipe_scraper.py"
        if not scraper_file.exists():
            return ValidationResult(
                "scraper_implementation",
                ValidationStatus.FAILED,
                "recipe_scraper.py not found"
            )
        
        # Check if requirements.txt exists
        requirements = self.project_root / "scripts" / "scraper" / "requirements.txt"
        if not requirements.exists():
            return ValidationResult(
                "scraper_implementation",
                ValidationStatus.WARNING,
                "requirements.txt not found for scraper"
            )
        
        # Try to run the test
        success, stdout, stderr = self._run_command(
            "python test_scraper.py",
            cwd=str(self.project_root / "scripts" / "scraper")
        )
        
        if not success:
            return ValidationResult(
                "scraper_implementation",
                ValidationStatus.FAILED,
                "Scraper tests failed",
                {"error": stderr[:500]}
            )
        
        return ValidationResult(
            "scraper_implementation",
            ValidationStatus.PASSED,
            "Recipe scraper is properly implemented"
        )
    
    def _validate_protected_routes(self) -> ValidationResult:
        """Validate protected routes are properly configured"""
        protected_route = self.project_root / "components" / "auth" / "ProtectedRoute.tsx"
        if not protected_route.exists():
            return ValidationResult(
                "protected_routes",
                ValidationStatus.FAILED,
                "ProtectedRoute component not found"
            )
        
        # Check protected layout
        protected_layout = self.project_root / "app" / "(protected)" / "layout.tsx"
        if not protected_layout.exists():
            return ValidationResult(
                "protected_routes",
                ValidationStatus.WARNING,
                "Protected layout not found"
            )
        
        return ValidationResult(
            "protected_routes",
            ValidationStatus.PASSED,
            "Protected routes are properly configured"
        )
    
    def _validate_auth_pages(self) -> ValidationResult:
        """Validate authentication pages exist"""
        auth_pages = ["login", "signup", "forgot-password"]
        missing_pages = []
        
        for page in auth_pages:
            page_path = self.project_root / "app" / "auth" / page / "page.tsx"
            if not page_path.exists():
                missing_pages.append(page)
        
        if missing_pages:
            return ValidationResult(
                "auth_pages",
                ValidationStatus.WARNING,
                f"Missing auth pages: {', '.join(missing_pages)}"
            )
        
        return ValidationResult(
            "auth_pages",
            ValidationStatus.PASSED,
            "All authentication pages exist"
        )
    
    def _validate_cli_interface(self) -> ValidationResult:
        """Validate CLI interface for scraper"""
        cli_file = self.project_root / "scripts" / "scraper" / "cli.py"
        if not cli_file.exists():
            return ValidationResult(
                "cli_interface",
                ValidationStatus.FAILED,
                "CLI interface not found"
            )
        
        return ValidationResult(
            "cli_interface",
            ValidationStatus.PASSED,
            "CLI interface exists"
        )
    
    def _validate_sample_data(self) -> ValidationResult:
        """Validate sample recipe data exists"""
        sample_file = self.project_root / "scripts" / "scraper" / "sample_recipes.json"
        if not sample_file.exists():
            return ValidationResult(
                "sample_data",
                ValidationStatus.WARNING,
                "Sample recipes file not found"
            )
        
        try:
            with open(sample_file, 'r') as f:
                data = json.load(f)
                if not isinstance(data, list) or len(data) == 0:
                    return ValidationResult(
                        "sample_data",
                        ValidationStatus.WARNING,
                        "Sample recipes file is empty"
                    )
        except json.JSONDecodeError:
            return ValidationResult(
                "sample_data",
                ValidationStatus.FAILED,
                "Invalid JSON in sample recipes file"
            )
        
        return ValidationResult(
            "sample_data",
            ValidationStatus.PASSED,
            "Sample recipe data is valid"
        )
    
    def _validate_accessibility(self) -> ValidationResult:
        """Basic accessibility validation"""
        # This is a placeholder for more comprehensive accessibility checks
        # In a real implementation, this could use axe-core or similar tools
        return ValidationResult(
            "accessibility",
            ValidationStatus.SKIPPED,
            "Accessibility validation not yet implemented"
        )
    
    def _validate_responsive_design(self) -> ValidationResult:
        """Basic responsive design validation"""
        # Check if Tailwind responsive classes are used
        components_dir = self.project_root / "components"
        responsive_classes = ["sm:", "md:", "lg:", "xl:"]
        has_responsive = False
        
        for comp_file in components_dir.rglob("*.tsx"):
            with open(comp_file, 'r') as f:
                content = f.read()
                if any(cls in content for cls in responsive_classes):
                    has_responsive = True
                    break
        
        if not has_responsive:
            return ValidationResult(
                "responsive_design",
                ValidationStatus.WARNING,
                "No responsive classes found in components"
            )
        
        return ValidationResult(
            "responsive_design",
            ValidationStatus.PASSED,
            "Components use responsive design classes"
        )
    
    def _run_validation_check(self, check_name: str) -> ValidationResult:
        """Run a specific validation check"""
        validation_methods = {
            "firebase_config": self._validate_firebase_config,
            "security_rules": self._validate_security_rules,
            "typescript_types": self._validate_typescript_types,
            "nextjs_config": self._validate_nextjs_config,
            "routing_structure": self._validate_routing_structure,
            "ui_components": self._validate_ui_components,
            "auth_context": self._validate_auth_context,
            "scraper_implementation": self._validate_scraper_implementation,
            "protected_routes": self._validate_protected_routes,
            "auth_pages": self._validate_auth_pages,
            "cli_interface": self._validate_cli_interface,
            "sample_data": self._validate_sample_data,
            "accessibility": self._validate_accessibility,
            "responsive_design": self._validate_responsive_design,
        }
        
        if check_name in validation_methods:
            try:
                return validation_methods[check_name]()
            except Exception as e:
                return ValidationResult(
                    check_name,
                    ValidationStatus.FAILED,
                    f"Validation check failed with error: {str(e)}"
                )
        
        return ValidationResult(
            check_name,
            ValidationStatus.SKIPPED,
            "Unknown validation check"
        )
    
    def _check_dependencies(self, agent_name: str) -> bool:
        """Check if agent dependencies are satisfied"""
        agent_config = self.agents.get(agent_name, {})
        dependencies = agent_config.get("dependencies", [])
        
        for dep in dependencies:
            dep_state = self.state.get("agent_states", {}).get(dep, {})
            if dep_state.get("status") != AgentStatus.COMPLETED.value:
                logger.warning(f"Dependency {dep} not completed for {agent_name}")
                return False
        
        return True
    
    def _run_tests(self, agent_name: str) -> Tuple[bool, str]:
        """Run tests for an agent"""
        agent_config = self.agents.get(agent_name, {})
        tests = agent_config.get("tests", [])
        
        if not tests:
            return True, "No tests configured"
        
        all_passed = True
        results = []
        
        for test_cmd in tests:
            success, stdout, stderr = self._run_command(test_cmd)
            if success:
                results.append(f"✓ {test_cmd}")
            else:
                all_passed = False
                results.append(f"✗ {test_cmd}: {stderr[:200]}")
        
        return all_passed, "\n".join(results)
    
    def validate_agent(self, agent_name: str) -> AgentReport:
        """Validate a specific agent's work"""
        logger.info(f"Validating {agent_name}...")
        
        start_time = datetime.datetime.now()
        
        # Check dependencies
        deps_ok = self._check_dependencies(agent_name)
        
        # Detect file changes
        created_files, modified_files = self._detect_file_changes()
        
        # Run validation checks
        agent_config = self.agents.get(agent_name, {})
        validation_checks = agent_config.get("validation_checks", [])
        validation_results = []
        
        for check in validation_checks:
            result = self._run_validation_check(check)
            validation_results.append(result)
        
        # Run tests
        tests_passed, test_results = self._run_tests(agent_name)
        
        # Get recent commits
        last_run = self.state.get("agent_states", {}).get(agent_name, {}).get("last_validated")
        commits = self._get_git_commits(since=last_run) if last_run else []
        
        # Determine status
        issues = []
        recommendations = []
        
        if not deps_ok:
            issues.append("Dependencies not satisfied")
            status = AgentStatus.FAILED
        elif any(r.status == ValidationStatus.FAILED for r in validation_results):
            status = AgentStatus.FAILED
            issues.extend([r.message for r in validation_results if r.status == ValidationStatus.FAILED])
        elif not tests_passed:
            status = AgentStatus.NEEDS_REVIEW
            issues.append("Some tests failed")
            recommendations.append("Review and fix failing tests")
        elif any(r.status == ValidationStatus.WARNING for r in validation_results):
            status = AgentStatus.NEEDS_REVIEW
            issues.extend([r.message for r in validation_results if r.status == ValidationStatus.WARNING])
            recommendations.append("Address validation warnings")
        else:
            status = AgentStatus.COMPLETED
        
        end_time = datetime.datetime.now()
        
        # Create report
        report = AgentReport(
            agent_name=agent_name,
            status=status,
            start_time=start_time.isoformat(),
            end_time=end_time.isoformat(),
            duration=(end_time - start_time).total_seconds(),
            files_created=created_files,
            files_modified=modified_files,
            validation_results=validation_results,
            git_commits=commits[:10],  # Last 10 commits
            issues=issues,
            recommendations=recommendations,
            dependencies_checked=deps_ok,
            tests_passed=tests_passed if tests_passed is not None else None
        )
        
        # Update state
        self.state["agent_states"][agent_name] = {
            "status": status.value,
            "last_validated": end_time.isoformat(),
            "report_path": str(self.reports_dir / f"{agent_name.replace(' ', '_')}_{end_time.strftime('%Y%m%d_%H%M%S')}.json")
        }
        
        # Save report
        self._save_report(report)
        
        return report
    
    def _save_report(self, report: AgentReport):
        """Save agent report to disk"""
        timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"{report.agent_name.replace(' ', '_')}_{timestamp}.json"
        report_path = self.reports_dir / filename
        
        # Convert report to dict
        report_dict = asdict(report)
        
        # Convert enums to strings
        for result in report_dict["validation_results"]:
            result["status"] = result["status"].value if isinstance(result["status"], ValidationStatus) else result["status"]
        
        report_dict["status"] = report.status.value
        
        with open(report_path, 'w') as f:
            json.dump(report_dict, f, indent=2)
        
        logger.info(f"Report saved to {report_path}")
    
    def update_claude_md(self):
        """Update CLAUDE.md with current agent statuses"""
        logger.info("Updating CLAUDE.md...")
        
        with open(self.claude_md_path, 'r') as f:
            content = f.read()
        
        # Update agent statuses
        for agent_name, agent_state in self.state.get("agent_states", {}).items():
            status = agent_state.get("status", "Not Started")
            
            # Find the agent section
            pattern = rf"(### \d+\. {re.escape(agent_name)}\s*\n\s*\*\*Status\*\*:\s*)[^\n]+"
            replacement = rf"\1{status}"
            content = re.sub(pattern, replacement, content)
        
        # Add last update timestamp
        timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        if "Last Supervisor Update:" in content:
            content = re.sub(
                r"Last Supervisor Update: [^\n]+",
                f"Last Supervisor Update: {timestamp}",
                content
            )
        else:
            # Add before the first agent section
            content = re.sub(
                r"(## Claude Code Agents\s*\n)",
                rf"\1\nLast Supervisor Update: {timestamp}\n",
                content
            )
        
        with open(self.claude_md_path, 'w') as f:
            f.write(content)
        
        logger.info("CLAUDE.md updated successfully")
    
    def monitor_agents(self, agent_names: Optional[List[str]] = None, parallel: bool = True):
        """Monitor and validate multiple agents"""
        if agent_names is None:
            agent_names = list(self.agents.keys())
        
        logger.info(f"Starting supervision of {len(agent_names)} agents...")
        
        reports = []
        
        if parallel and len(agent_names) > 1:
            # Use thread pool for parallel validation
            with concurrent.futures.ThreadPoolExecutor(max_workers=3) as executor:
                future_to_agent = {
                    executor.submit(self.validate_agent, agent): agent
                    for agent in agent_names
                }
                
                for future in concurrent.futures.as_completed(future_to_agent):
                    agent = future_to_agent[future]
                    try:
                        report = future.result()
                        reports.append(report)
                        logger.info(f"Completed validation of {agent}: {report.status.value}")
                    except Exception as e:
                        logger.error(f"Error validating {agent}: {str(e)}")
        else:
            # Sequential validation
            for agent in agent_names:
                try:
                    report = self.validate_agent(agent)
                    reports.append(report)
                    logger.info(f"Completed validation of {agent}: {report.status.value}")
                except Exception as e:
                    logger.error(f"Error validating {agent}: {str(e)}")
        
        # Save state and update CLAUDE.md
        self._save_state()
        self.update_claude_md()
        
        # Generate summary
        self._generate_summary(reports)
        
        return reports
    
    def _generate_summary(self, reports: List[AgentReport]):
        """Generate a summary of all agent reports"""
        timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
        summary_path = self.reports_dir / f"summary_{timestamp}.md"
        
        with open(summary_path, 'w') as f:
            f.write("# Supervisor Agent Summary Report\n\n")
            f.write(f"Generated: {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n")
            
            # Overall status
            f.write("## Overall Status\n\n")
            status_counts = {}
            for report in reports:
                status_counts[report.status.value] = status_counts.get(report.status.value, 0) + 1
            
            for status, count in status_counts.items():
                f.write(f"- {status}: {count} agents\n")
            
            f.write("\n## Agent Details\n\n")
            
            # Individual agent details
            for report in reports:
                f.write(f"### {report.agent_name}\n\n")
                f.write(f"**Status**: {report.status.value}\n")
                f.write(f"**Duration**: {report.duration:.2f} seconds\n")
                
                if report.issues:
                    f.write(f"\n**Issues**:\n")
                    for issue in report.issues:
                        f.write(f"- {issue}\n")
                
                if report.recommendations:
                    f.write(f"\n**Recommendations**:\n")
                    for rec in report.recommendations:
                        f.write(f"- {rec}\n")
                
                f.write("\n**Validation Results**:\n")
                for result in report.validation_results:
                    emoji = "✅" if result.status == ValidationStatus.PASSED else "❌" if result.status == ValidationStatus.FAILED else "⚠️"
                    f.write(f"- {emoji} {result.check_name}: {result.message}\n")
                
                f.write("\n---\n\n")
        
        logger.info(f"Summary report saved to {summary_path}")
    
    def generate_dashboard(self):
        """Generate an HTML dashboard for agent status"""
        dashboard_path = self.supervisor_dir / "dashboard.html"
        
        html_content = """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Claude Code Agent Supervisor Dashboard</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; }
        h1 { color: #333; text-align: center; }
        .agent-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px; margin-top: 30px; }
        .agent-card { background: white; border-radius: 8px; padding: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .agent-card h3 { margin-top: 0; color: #333; }
        .status { padding: 5px 10px; border-radius: 4px; font-size: 14px; font-weight: 500; display: inline-block; }
        .status-completed { background: #d4edda; color: #155724; }
        .status-failed { background: #f8d7da; color: #721c24; }
        .status-needs-review { background: #fff3cd; color: #856404; }
        .status-not-started { background: #e2e3e5; color: #383d41; }
        .timestamp { color: #666; font-size: 12px; margin-top: 10px; }
        .issues { margin-top: 10px; }
        .issues li { color: #dc3545; }
        .last-update { text-align: center; color: #666; margin-top: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Claude Code Agent Supervisor Dashboard</h1>
        <div class="agent-grid">
"""
        
        # Add agent cards
        for agent_name in self.agents.keys():
            agent_state = self.state.get("agent_states", {}).get(agent_name, {})
            status = agent_state.get("status", "Not Started")
            status_class = status.lower().replace(" ", "-").replace("✅", "").replace("❌", "").replace("⚠️", "").strip()
            
            html_content += f"""
            <div class="agent-card">
                <h3>{agent_name}</h3>
                <span class="status status-{status_class}">{status}</span>
"""
            
            if "last_validated" in agent_state:
                last_validated = datetime.datetime.fromisoformat(agent_state["last_validated"])
                html_content += f"""
                <div class="timestamp">Last validated: {last_validated.strftime('%Y-%m-%d %H:%M')}</div>
"""
            
            # Add recent issues if any
            if "report_path" in agent_state and Path(agent_state["report_path"]).exists():
                with open(agent_state["report_path"], 'r') as f:
                    report_data = json.load(f)
                    if report_data.get("issues"):
                        html_content += """
                <div class="issues">
                    <strong>Issues:</strong>
                    <ul>
"""
                        for issue in report_data["issues"][:3]:  # Show first 3 issues
                            html_content += f"                        <li>{issue}</li>\n"
                        html_content += """                    </ul>
                </div>
"""
            
            html_content += """            </div>
"""
        
        html_content += f"""
        </div>
        <div class="last-update">
            Last dashboard update: {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
        </div>
    </div>
</body>
</html>
"""
        
        with open(dashboard_path, 'w') as f:
            f.write(html_content)
        
        logger.info(f"Dashboard saved to {dashboard_path}")


def main():
    """Main entry point for the supervisor agent"""
    import argparse
    
    parser = argparse.ArgumentParser(description="Claude Code Supervisor Agent")
    parser.add_argument("--agents", nargs="+", help="Specific agents to validate")
    parser.add_argument("--sequential", action="store_true", help="Run validations sequentially")
    parser.add_argument("--dashboard", action="store_true", help="Generate HTML dashboard")
    parser.add_argument("--project-root", default="/home/amy/dev/gdmealplanner", help="Project root directory")
    
    args = parser.parse_args()
    
    supervisor = SupervisorAgent(args.project_root)
    
    if args.dashboard:
        supervisor.generate_dashboard()
    else:
        reports = supervisor.monitor_agents(
            agent_names=args.agents,
            parallel=not args.sequential
        )
        
        # Print summary
        print("\nSupervision Complete!")
        print("=" * 50)
        for report in reports:
            print(f"{report.agent_name}: {report.status.value}")
        
        # Generate dashboard after monitoring
        supervisor.generate_dashboard()


if __name__ == "__main__":
    main()
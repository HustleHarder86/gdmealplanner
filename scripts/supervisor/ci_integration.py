#!/usr/bin/env python3
"""
CI/CD Integration for Supervisor Agent
This script is designed to be used in CI/CD pipelines like GitHub Actions
"""

import sys
import json
from pathlib import Path
from supervisor import SupervisorAgent, AgentStatus

def main():
    """Run supervisor in CI mode with strict validation"""
    
    # Parse arguments
    agents_to_validate = sys.argv[1:] if len(sys.argv) > 1 else None
    
    # Initialize supervisor
    project_root = "/home/amy/dev/gdmealplanner"
    supervisor = SupervisorAgent(project_root)
    
    # Run validation
    print("🔍 Running Claude Code Supervisor validation...")
    reports = supervisor.monitor_agents(agent_names=agents_to_validate, parallel=True)
    
    # Check results
    failed_agents = []
    needs_review_agents = []
    completed_agents = []
    
    for report in reports:
        if report.status == AgentStatus.FAILED:
            failed_agents.append(report.agent_name)
        elif report.status == AgentStatus.NEEDS_REVIEW:
            needs_review_agents.append(report.agent_name)
        elif report.status == AgentStatus.COMPLETED:
            completed_agents.append(report.agent_name)
    
    # Print results
    print("\n📊 Validation Results:")
    print(f"✅ Completed: {len(completed_agents)} agents")
    if completed_agents:
        for agent in completed_agents:
            print(f"   - {agent}")
    
    print(f"⚠️  Needs Review: {len(needs_review_agents)} agents")
    if needs_review_agents:
        for agent in needs_review_agents:
            print(f"   - {agent}")
    
    print(f"❌ Failed: {len(failed_agents)} agents")
    if failed_agents:
        for agent in failed_agents:
            print(f"   - {agent}")
    
    # Generate CI report
    ci_report = {
        "total_agents": len(reports),
        "completed": len(completed_agents),
        "needs_review": len(needs_review_agents),
        "failed": len(failed_agents),
        "agents": {
            report.agent_name: {
                "status": report.status.value,
                "issues": report.issues,
                "recommendations": report.recommendations
            }
            for report in reports
        }
    }
    
    # Save CI report
    ci_report_path = Path(project_root) / "scripts" / "supervisor" / "ci_report.json"
    with open(ci_report_path, 'w') as f:
        json.dump(ci_report, f, indent=2)
    
    print(f"\n📄 CI report saved to: {ci_report_path}")
    
    # Exit with appropriate code
    if failed_agents:
        print("\n❌ Validation failed! Please fix the issues above.")
        sys.exit(1)
    elif needs_review_agents:
        print("\n⚠️  Some agents need review. Consider addressing the warnings.")
        sys.exit(0)  # Don't fail CI for warnings
    else:
        print("\n✅ All validations passed!")
        sys.exit(0)

if __name__ == "__main__":
    main()
# Claude Code Supervisor Agent

The Supervisor Agent monitors and validates the work of other Claude Code agents in the Pregnancy Plate Planner project.

## Features

- **Agent Monitoring**: Tracks the execution status of all agents
- **Validation Checks**: Runs specific validation tests for each agent's work
- **Dependency Management**: Ensures agents run in the correct order
- **Parallel Execution**: Can validate multiple agents simultaneously
- **Detailed Reporting**: Generates comprehensive reports for each validation
- **Dashboard Generation**: Creates an HTML dashboard for visual status tracking
- **CLAUDE.md Updates**: Automatically updates agent statuses in the main documentation

## Usage

### Basic Validation
Run validation for all agents:
```bash
python scripts/supervisor/supervisor.py
```

### Validate Specific Agents
```bash
python scripts/supervisor/supervisor.py --agents "Firebase Setup Agent" "Next.js Foundation Agent"
```

### Sequential Validation
Run validations one at a time instead of in parallel:
```bash
python scripts/supervisor/supervisor.py --sequential
```

### Generate Dashboard Only
```bash
python scripts/supervisor/supervisor.py --dashboard
```

## Validation Checks

The supervisor performs these validation checks for each agent:

### Firebase Setup Agent
- Firebase configuration file validity
- Security rules configuration
- TypeScript type definitions

### Next.js Foundation Agent
- Next.js build success
- Routing structure completeness
- UI component presence

### Authentication Flow Agent
- AuthContext implementation
- Protected route setup
- Authentication page existence

### Recipe Scraper Agent
- Scraper implementation
- CLI interface functionality
- Test execution

### UI Component Library Agent
- Component file existence
- Accessibility compliance
- Responsive design validation

## Reports

Reports are saved in `/scripts/supervisor/reports/` with the following information:
- Agent status (Completed, Failed, Needs Review)
- Files created and modified
- Validation results
- Test outcomes
- Issues encountered
- Recommendations for fixes

## Dashboard

The HTML dashboard (`/scripts/supervisor/dashboard.html`) provides:
- Visual status overview of all agents
- Recent issues for each agent
- Last validation timestamps
- Color-coded status indicators

## State Management

The supervisor maintains state in `supervisor_state.json`:
- Last run timestamp
- Agent validation history
- File hashes for change detection

## Integration with CI/CD

The supervisor can be integrated into CI/CD pipelines:
```bash
# Exit with error code if any agent fails
python scripts/supervisor/supervisor.py || exit 1
```

## Troubleshooting

### Common Issues

1. **Permission Errors**: Ensure the supervisor has read/write access to the project directory
2. **Git Not Available**: The supervisor uses git for change detection - ensure git is installed
3. **Test Failures**: Some tests require npm dependencies to be installed

### Logging

The supervisor uses Python's logging module. To increase verbosity:
```python
logging.basicConfig(level=logging.DEBUG)
```

## Future Enhancements

- Slack/Email notifications for failures
- Historical trend analysis
- Performance metrics tracking
- Integration with monitoring services
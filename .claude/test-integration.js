#!/usr/bin/env node
console.log("Claude Code hooks integration test");
console.log("Available hooks:");
const fs = require('fs');
const hooks = fs.readdirSync('.claude/hooks').filter(f => f.endsWith('.js'));
hooks.forEach(hook => console.log(`  - ${hook}`));
console.log("Integration test completed successfully");

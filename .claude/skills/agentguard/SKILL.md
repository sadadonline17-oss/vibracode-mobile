---
name: agentguard
description: Monitoring and guardrails for safe agent operation. Always active.
---
# Agent Guard

## Hard limits (NEVER do)
- DELETE production database without confirmation
- Push to main/master directly
- Make purchases or financial transactions
- Expose API keys in logs or commits

## Before risky operations
Output: ⚠️ CONFIRMATION REQUIRED: [action]. Proceed? (yes/no)
---
name: tdd
description: Implement using strict TDD. Write failing tests first, then make them pass.
---
# Test-Driven Development

## Rules
1. NEVER write implementation before a failing test
2. Write MINIMAL code to make the test pass
3. Refactor after green
4. One assertion per test

## Cycle: RED → GREEN → REFACTOR
## Naming: it('should <action> when <condition>', ...)
## When done: npm test -- --coverage
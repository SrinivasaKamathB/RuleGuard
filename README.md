# RuleGuard AI

RuleGuard AI is a multi-agent software safety tool designed to protect important company rules before software updates are released.

Software companies often have critical business rules hidden inside old support tickets, bug reports, and code comments. RuleGuard AI discovers these hidden rules and checks whether a proposed software update could violate them.

## How It Works

RuleGuard AI uses a four-agent pipeline:

1. **Change Agent**
   - Reads and understands the proposed software update.

2. **Rule Agent**
   - Analyzes historical company records.
   - Discovers important hidden business rules.
   - Identifies supporting evidence.

3. **Test Agent**
   - Compares the proposed update against the discovered rule.
   - Determines whether the update creates a rule violation.

4. **Safety Agent**
   - Produces the final release recommendation.
   - Returns either:
     - Safe to release
     - Unsafe to release
   - Explains the reason and provides a suggested fix when necessary.

A human developer always makes the final decision. RuleGuard AI does not automatically release or block software.

## Demo Scenario

RuleGuard AI demonstrates a hidden refund policy:

> Refunds above ₹5,000 need manager approval.

The rule is discovered from historical records including support tickets, bug reports, and code comments.

An unsafe software update that removes manager approval is detected and marked:

**❌ Unsafe to release**

The system explains the violation and recommends restoring manager approval.

A safe update that preserves the approval requirement is marked:

**✅ Safe to release**

## Features

- Multi-agent architecture
- Four specialized software safety agents
- Agent orchestration pipeline
- Hidden business-rule discovery
- Software change analysis
- Rule violation detection
- Evidence extraction
- Safe and unsafe release recommendations
- Suggested fixes for unsafe changes
- Agent-by-agent progress visualization
- Editable company records and software updates
- Safe and unsafe demo scenarios
- Real frontend-to-backend API communication
- Local demo data
- No database required
- No login required

## Technology Stack

### Frontend

- React
- Vite
- TypeScript
- CSS

### Backend

- Node.js
- Express
- TypeScript

## API Endpoints

### GET /api/health

Checks whether the RuleGuard AI backend is running.

### GET /api/demo-data

Returns the local Safe and Unsafe demonstration data.

### POST /api/analyze

Receives:

- Old company records
- Proposed software update

The backend runs the RuleGuard AI agent pipeline and returns:

- Discovered rule
- Agent findings
- Supporting evidence
- Test result
- Safe or unsafe decision
- Explanation
- Suggested fix

## Project Structure

```text
RULEGUARD AI/
├── backend/
│   └── src/
│       ├── agents/
│       │   ├── changeAgent.ts
│       │   ├── ruleAgent.ts
│       │   ├── testAgent.ts
│       │   └── safetyAgent.ts
│       ├── orchestrator.ts
│       ├── orchestrator.test.ts
│       └── server.ts
│
├── frontend/
│   └── src/
│       ├── App.tsx
│       └── App.css
│
└── README.md
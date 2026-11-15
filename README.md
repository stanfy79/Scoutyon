# Scoutyon — Frontend

**Your AI-powered gateway to research and cross-chain transactions.**

Scoutyon is a conversational interface that makes interacting with Web3 simpler. Instead of navigating multiple platforms, researching manually, or dealing with complicated blockchain workflows, users can interact with an AI assistant using natural language.

The frontend provides the interface through which users research opportunities, explore information, request cross-chain transfer quotes, review transactions and monitor their progress.

## Overview

Cross-chain transactions and Web3 research can be unnecessarily complicated. Users often need to switch between applications, understand different blockchain networks, compare assets and manually navigate transaction workflows.

Scoutyon brings these experiences together in one conversational workspace.

Through its AI-powered chat interface, users can:

- Research crypto projects, companies, products and services.
- Compare providers, features, pricing and available options.
- Investigate project legitimacy and reputation using available evidence.
- Request cross-chain transfer quotes.
- Review transaction details before authorization.
- Authorize supported transactions through an embedded wallet.
- Track transfer progress and settlement status.

## Key Features

### AI Chat Interface
A conversational workspace where users can interact with Scoutyon using natural language. The interface supports research requests, follow-up questions and transaction-related conversations.

### Research and Discovery
Users can investigate projects, companies, products and services, compare alternatives and receive evidence-backed information with relevant sources.

### Cross-Chain Transfers
Users can request quotes for supported cross-chain transfers, review the available route and understand the expected transaction outcome before proceeding.

### Transaction Review and Authorization
Transaction details are presented for review before users explicitly authorize supported transactions through their embedded wallet.

### Transfer Tracking
Users can follow the progress of their transfers and view the reported transaction status.

### Persistent Conversations
Users can revisit previous chat sessions and continue conversations without unnecessarily losing their transaction context.

## Technology Integrations

Scoutyon brings together AI, embedded wallets and cross-chain infrastructure.

| Technology | Purpose |
|---|---|
| Gemini | AI-powered conversation, reasoning and research |
| NEAR Intents | Cross-chain asset routing and swaps |
| Privy | Embedded wallets and transaction authorization |
| Backend API | Application logic, data and transaction coordination |

### Why NEAR Intents?

NEAR Intents enables Scoutyon to abstract much of the complexity involved in moving assets across supported blockchain networks. Users can request cross-chain transfers through a conversational interface instead of manually navigating different bridging platforms.

## Frontend Responsibilities

The frontend is responsible for:

- Rendering the conversational interface.
- Managing chat sessions and conversation state.
- Displaying AI-generated research and responses.
- Presenting transfer quotes and transaction details.
- Handling user interactions and authorization flows.
- Communicating with the Scoutyon backend API.
- Displaying transfer status and relevant feedback.

## Getting Started

### Prerequisites

- Node.js (LTS recommended)
- npm, yarn or pnpm
- Access to the Scoutyon backend API

### Installation

Clone the repository:

```bash
git clone <FRONTEND_REPOSITORY_URL>

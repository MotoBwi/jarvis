# J.A.R.V.I.S. - Complete User Guide

> **Just A Rather Very Intelligent System** — Your personal AI assistant that runs 24/7, sees your screen, automates tasks, and helps you achieve goals.

---

## Quick Start (5 Minutes)

Want to get running immediately? Do these 3 steps:

```bash
# 1. Install JARVIS
bun install -g @usejarvis/brain

# 2. Set up your AI brain
jarvis onboard

# 3. Start the daemon
jarvis start -d
```

Then open **http://localhost:3142** in your browser. You're done!

---

## Table of Contents

1. [What is J.A.R.V.I.S.?](#what-is-jarvis)
2. [Installation](#installation)
3. [Command Reference](#command-reference)
4. [Configuration](#configuration)
5. [LLM Providers](#llm-providers)
6. [Dashboard](#dashboard)
7. [Features Overview](#features-overview)
8. [Sidecar Setup](#sidecar-setup)
9. [Workflows](#workflows)
10. [Voice Interface](#voice-interface)
11. [Troubleshooting](#troubleshooting)

---

## What is J.A.R.V.I.S.?

J.A.R.V.I.S. is an **always-on AI daemon** — not just a chatbot, but a persistent assistant that:

- **Runs 24/7** on your server or local machine
- **Sees your screen** through sidecar agents
- **Controls desktop apps** across multiple machines
- **Builds workflows** to automate repetitive tasks
- **Tracks goals** and holds you accountable
- **Learns your preferences** over time
- **Works with multiple LLM providers** (Anthropic, OpenAI, Ollama)

### Key Capabilities

| Feature | Description |
|---------|-------------|
| Continuous Awareness | Watches your screen, detects struggles, offers help |
| Multi-Agent System | 9 specialist roles for different tasks |
| Workflow Automation | 50+ node visual builder, natural language creation |
| Memory & Knowledge | Stores entities, facts, relationships in SQLite |
| Voice Interface | Wake word + streaming TTS |
| Authority Levels | Controls what JARVIS can do automatically |
| Cross-Machine Control | One daemon, unlimited sidecars |

---

## Installation

### Quick Install (Recommended)

```bash
# Install globally with bun
bun install -g @usejarvis/brain

# Run interactive setup wizard
jarvis onboard

# Start the daemon
jarvis start -d
```

### Manual Installation

```bash
# Clone the repository
git clone https://github.com/vierisid/jarvis.git ~/.jarvis/daemon
cd ~/.jarvis/daemon

# Install dependencies
bun install

# Build the UI
bun run build:ui

# Run setup wizard
jarvis onboard
```

### Requirements

- **Bun** runtime (>= 1.0)
- **OS**: Windows, macOS, or Linux
- **At least one LLM provider**:
  - Anthropic API key (recommended)
  - OpenAI API key
  - Google Gemini API key
  - Ollama (local, free)

---

## Command Reference

### Daemon Commands

```bash
# Start JARVIS in foreground (see logs in terminal)
jarvis start

# Start as background daemon
jarvis start -d

# Start on custom port (default: 3142)
jarvis start --port 3142

# Start without opening browser
jarvis start --no-open

# Restart the daemon
jarvis restart
jarvis restart --port 3142  # with options

# Stop the daemon
jarvis stop

# Check if running
jarvis status

# View logs (last 50 lines)
jarvis logs

# Follow live logs (like tail -f)
jarvis logs -f

# View specific number of lines
jarvis logs -n 100

# Verify environment setup
jarvis doctor

# Update to latest version
jarvis update
jarvis upgrade  # alias

# Show version
jarvis version
jarvis -v

# Show help
jarvis help
```

### Development Commands

```bash
# Run in development mode (hot reload)
bun run dev

# Run tests
bun test

# Build the UI
bun run build:ui

# Initialize/reset database
bun run db:init

# Setup configuration
bun run setup

# Test LLM providers
bun run test:llm

# Run examples
bun run examples
```

### Package Scripts (package.json)

| Command | Description |
|---------|-------------|
| `bun run start` | Start daemon |
| `bun run dev` | Development mode with hot reload |
| `bun run build:ui` | Build the dashboard UI |
| `bun run test` | Run all tests |
| `bun run db:init` | Initialize SQLite database |
| `bun run setup` | Run interactive setup |
| `bun run test:llm` | Test LLM provider connections |
| `bun run examples` | Run example code |

---

## Configuration

### Configuration File Location

```
~/.jarvis/config.yaml
```

### Full Configuration Example

```yaml
# Daemon Settings
daemon:
  port: 3142                    # Dashboard port
  data_dir: "~/.jarvis"        # Data directory
  db_path: "~/.jarvis/jarvis.db" # Database file

# LLM Provider Settings
llm:
  primary: "anthropic"          # Main provider
  fallback: ["openai", "ollama"] # Backup providers

  # Anthropic (Claude)
  anthropic:
    api_key: "sk-ant-..."
    model: "claude-sonnet-4-6"

  # OpenAI (GPT)
  openai:
    api_key: "sk-..."
    model: "gpt-4o"

  # Google Gemini
  gemini:
    api_key: "..."
    model: "gemini-2.0-flash"

  # Ollama (Local)
  ollama:
    base_url: "http://localhost:11434"
    model: "llama3"

# Personality Settings
personality:
  core_traits:
    - "loyal"
    - "efficient"
    - "proactive"
  assistant_name: "Jarvis"

# Authority Settings (0-5)
authority:
  default_level: 3

# Active Role
active_role: "personal-assistant"

# Google OAuth (optional)
google:
  client_id: "..."
  client_secret: "..."
  redirect_uri: "http://localhost:3142/auth/google/callback"

# Notification Channels (optional)
telegram:
  bot_token: "..."
  chat_id: "..."

discord:
  bot_token: "..."
  channel_id: "..."

# Voice Settings (optional)
voice:
  provider: "edge"  # or "elevenlabs"
  elevenlabs:
    api_key: "..."
    voice_id: "..."
```

### Interactive Setup

Run the setup wizard to configure everything:

```bash
jarvis onboard
```

This will walk you through:
1. LLM provider selection and API keys
2. Personality traits
3. Authority levels
4. Notification channels (Telegram, Discord)
5. Voice settings

---

## LLM Providers

JARVIS supports multiple LLM providers with automatic fallback.

### Supported Providers

| Provider | Model Examples | Cost | Best For |
|----------|---------------|------|----------|
| **Anthropic Claude** | claude-opus-4-6, claude-sonnet-4-6 | Paid | Best overall reasoning |
| **OpenAI GPT** | gpt-4o, gpt-4-turbo | Paid | Tool use, vision |
| **Google Gemini** | gemini-2.0-flash | Paid | Fast, cheap |
| **Ollama** | llama3, mistral, codellama | Free | Local, private |

### Setting Up Providers

**Anthropic (Recommended):**
```yaml
llm:
  primary: "anthropic"
  anthropic:
    api_key: "sk-ant-YOUR_KEY_HERE"
    model: "claude-sonnet-4-6"
```

**OpenAI:**
```yaml
llm:
  primary: "openai"
  openai:
    api_key: "sk-YOUR_KEY_HERE"
    model: "gpt-4o"
```

**Ollama (Local):**
```bash
# Install Ollama
curl -fsSL https://ollama.ai/install.sh | sh

# Pull a model
ollama pull llama3

# Start server
ollama serve
```

```yaml
llm:
  primary: "ollama"
  ollama:
    base_url: "http://localhost:11434"
    model: "llama3"
```

### Provider Fallback

JARVIS automatically switches to backup providers if the primary fails:

```yaml
llm:
  primary: "anthropic"
  fallback: ["openai", "ollama"]
```

---

## Dashboard

The dashboard is your control center for JARVIS. Access it at:

```
http://localhost:3142
```

### Dashboard Pages

| Page | Purpose |
|------|---------|
| **Chat** | Main conversation with JARVIS |
| **Tasks** | Active commitments and background work |
| **Content Pipeline** | Multi-step content generation |
| **Knowledge Graph** | Visual vault explorer |
| **Memory** | Raw vault search |
| **Calendar** | Google Calendar integration |
| **Agent Office** | Multi-agent management |
| **Command Center** | Tool execution history |
| **Authority** | Approval queue and permissions |
| **Awareness** | Live screen capture and suggestions |
| **Workflows** | Visual workflow builder |
| **Goals** | OKR tracking dashboard |
| **Settings** | All configuration options |

---

## Features Overview

### 1. Conversations & Tools

JARVIS has **14+ built-in tools** including:

- **Browser Control** — Chrome automation via CDP
- **File Operations** — Read, write, execute shell commands
- **Web Search** — Search and summarize web content
- **Gmail** — Send emails, read inbox
- **Calendar** — Create events, check schedules
- **Telegram/Discord** — Send messages
- **Desktop Control** — Via sidecar (click, type, screenshots)

Tools can run up to **200 iterations** per turn until the task is complete.

### 2. Memory (Vault)

JARVIS stores knowledge in a SQLite knowledge graph:

- **Entities**: People, projects, tools, places, concepts
- **Facts**: Atomic knowledge with confidence scores
- **Relationships**: Connections between entities
- **Commitments**: Tasks and promises
- **Observations**: Raw events from awareness

The vault is **automatically populated** — JARVIS extracts knowledge from every conversation and stores it for recall in future interactions.

### 3. Personality Engine

JARVIS learns your communication preferences:

- **Verbosity** — Brief vs detailed responses
- **Formality** — Casual vs formal
- **Humor** — Serious vs playful
- **Emoji Usage** — On/off
- **Format** — Lists, prose, tables, or adaptive

Preferences are learned from:
- Explicit instructions ("Keep it brief")
- Implicit signals (your message style)
- Feedback over time

Trust level grows with interaction count:
- 0-9 messages: Level 3 (low)
- 10-29 messages: Level 4-5 (developing)
- 30-69 messages: Level 6-7 (moderate)
- 70+ messages: Level 8-10 (high)

### 4. Multi-Agent System

JARVIS has **9 specialist roles**:

| Role | Purpose |
|------|---------|
| personal-assistant | General help, reminders |
| researcher | Web searches, information gathering |
| coder | Programming assistance |
| writer | Content creation, editing |
| analyst | Data analysis, calculations |
| planner | Scheduling, task decomposition |
| negotiator | Communication, dispute resolution |
| educator | Teaching, explanations |
| creative | Brainstorming, creative writing |

Delegate tasks using:
```
"Ask the researcher to find information about X"
"Have the coder review my code"
```

### 5. Authority System

Authority levels control what JARVIS can do automatically:

| Level | Capabilities |
|-------|-------------|
| 0 | Read-only, no actions |
| 1 | Limited queries |
| 2 | Read + search |
| 3 | Most tools, requires approval for sensitive actions |
| 4 | Most tools, auto-approve low-risk |
| 5 | Full autonomy |

Actions that require approval:
- Sending emails
- Making purchases
- Posting to social media
- Running shell commands

### 6. Continuous Awareness

JARVIS monitors your screen every 5-10 seconds:

- **Full desktop capture** — All monitors combined
- **OCR text extraction** — Tesseract.js + Cloud Vision
- **Activity tracking** — Apps, files, sessions
- **Struggle detection** — Errors, repeated actions
- **Proactive suggestions** — Based on context

Privacy: JARVIS captures everything. No filters or redaction.

### 7. Goals & OKRs

Set objectives and JARVIS holds you accountable:

- **Objectives** — Big goals ("Learn Spanish")
- **Key Results** — Measurable outcomes ("Complete 50 lessons")
- **Daily Actions** — Specific tasks for each day

Features:
- Morning planning
- Evening review
- Escalation when behind
- Integration with awareness and workflows

---

## Sidecar Setup

The **sidecar** gives JARVIS physical control over additional machines.

### What is a Sidecar?

A lightweight agent that runs on any machine (laptop, desktop, server) and connects to the main JARVIS daemon. It provides:

- Desktop screenshots
- Browser control
- Terminal access
- File system access
- Clipboard access
- App automation

### Installation

**Via bun:**
```bash
bun install -g @usejarvis/sidecar
```

**Or download binary** from GitHub Releases.

### Enrollment

1. Open dashboard at `http://localhost:3142`
2. Go to **Settings** → **Sidecar**
3. Enter a name (e.g., "work laptop")
4. Click **Enroll**
5. Copy the token command

### Running the Sidecar

```bash
# First time (with token)
jarvis-sidecar --token <your-token>

# Subsequent runs (token saved locally)
jarvis-sidecar
```

The sidecar will appear in the dashboard where you can configure its capabilities.

---

## Workflows

Workflows automate repetitive tasks with a visual builder.

### Creating a Workflow

**Method 1: Natural Language (Fastest)**
```
"Create a workflow that checks my GitHub PRs every morning at 9am and sends me a Telegram summary"
```

**Method 2: Visual Builder**
1. Go to **Workflows** in dashboard
2. Click **New Workflow**
3. Drag nodes from the palette
4. Connect nodes by dragging between handles
5. Configure nodes in the right panel

**Method 3: REST API**
```bash
curl -X POST http://localhost:3142/api/workflows \
  -H "Content-Type: application/json" \
  -d '{"name": "My Workflow"}'
```

### Node Types

**Triggers (11 types):**
- Cron schedule
- Webhook (HTTP)
- Polling (HTTP)
- File changes
- Clipboard
- Process start/stop
- Email received
- Calendar events
- Screen conditions
- Git events

**Actions (12 types):**
- Send message (chat, Telegram, Discord)
- Run tool
- Spawn agent
- HTTP request
- File write
- Send notification
- Send Gmail
- Calendar action
- Shell command
- Code execution

**Logic (9 types):**
- If/else
- Switch
- Loop
- Delay
- Variable set/get

**Transform (5 types):**
- JSON parse
- CSV parse
- Regex match
- Aggregate
- Map/filter

### Example Workflows

**Morning GitHub Summary:**
```
Trigger: Cron (0 9 * * *)
Action: HTTP GET GitHub API
Action: Transform JSON
Action: Send Telegram message
```

**File Watcher:**
```
Trigger: File change (/path/to/downloads)
Action: If extension = .pdf
  Action: OCR with Tesseract
  Action: Extract key info
  Action: Add to Knowledge Graph
```

---

## Voice Interface

### Features

- **Wake Word** — "Hey Jarvis" detection (openwakeword)
- **Streaming TTS** — Real-time speech output
- **STT** — Speech-to-text input
- **Multi-channel** — Edge TTS (free) or ElevenLabs (premium)

### Setup

In config.yaml:

```yaml
voice:
  provider: "edge"  # or "elevenlabs"

  # For ElevenLabs (premium voice)
  elevenlabs:
    api_key: "..."
    voice_id: "your-voice-id"
```

### Usage

1. Enable voice in dashboard Settings
2. Say "Hey Jarvis" to activate
3. Speak your request
4. JARVIS responds verbally

---

## Troubleshooting

### Common Issues

**"No LLM providers configured"**
```bash
# Run setup wizard
jarvis onboard

# Or manually edit config
nano ~/.jarvis/config.yaml
```

**"Ollama not available"**
```bash
# Start Ollama
ollama serve

# Verify it's running
curl http://localhost:11434/api/tags
```

**"Port already in use"**
```bash
# Check what's using the port
lsof -i :3142

# Use a different port
jarvis start --port 3143
```

**"Config file not found"**
```bash
# Create config directory
mkdir -p ~/.jarvis

# Copy example config
cp config.example.yaml ~/.jarvis/config.yaml
```

**"API key invalid"**
- Verify the key in config has no extra spaces/quotes
- Check account has credits (for paid APIs)

### Debug Mode

```bash
# View live logs
jarvis logs -f

# Run in foreground to see all output
jarvis start
```

### Health Check

```bash
# Verify environment
jarvis doctor
```

---

## Quick Reference Card

### Essential Commands

```bash
# First time setup
bun install -g @usejarvis/brain
jarvis onboard
jarvis start -d

# Access dashboard
# Open http://localhost:3142

# Stop/Start
jarvis stop
jarvis start -d

# View status
jarvis status
jarvis logs -f

# Update
jarvis update
```

### File Locations

| File | Location |
|------|----------|
| Config | `~/.jarvis/config.yaml` |
| Database | `~/.jarvis/jarvis.db` |
| Logs | `~/.jarvis/logs/` |
| Sidecar Token | `~/.jarvis/sidecar-token` |

### Default Ports

| Service | Port |
|---------|------|
| Dashboard | 3142 |
| Ollama | 11434 |
| Chrome DevTools | 9222 |

---

## Getting Help

- **Discord**: https://discord.gg/nE3hcaFYZP
- **Website**: https://usejarvis.dev
- **GitHub Issues**: https://github.com/vierisid/jarvis/issues

---

*Last updated: March 2026*
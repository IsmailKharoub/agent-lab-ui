# Brainess Agents Lab Backend API Requirements

## Overview

This document outlines the backend API requirements for the Brainess Agents Lab application. It includes API endpoints, data models, authentication methods, and other necessary details to ensure alignment between frontend and backend development.

## Version

**Current API Version:** v1.0.0-alpha

## Base URL

The base URL for all API endpoints: `http://localhost:3000/api/v1/` (development)

## Authentication

### API Key Authentication

All requests must include an API key in the request header:

```
X-API-Key: <openai_api_key>
```

### Error Responses

Authentication errors will return:

```json
{
  "status": "error",
  "code": 401,
  "message": "Invalid or missing API key"
}
```

## Data Models

### Agent Model

```typescript
enum AgentStatus {
  PENDING = "PENDING",
  RUNNING = "RUNNING",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
  PAUSED = "PAUSED",
  STOPPED = "STOPPED"
}

interface Agent {
  id: string;
  instruction: string;
  status: AgentStatus;
  createdAt: string; // ISO 8601 format
  updatedAt: string; // ISO 8601 format
  completedAt?: string; // ISO 8601 format
  model: string; // "gpt-4o" | "gpt-3.5-turbo" | "gpt-4-turbo"
  maxSteps: number;
  headless: boolean;
  useVision: boolean;
  generateGif: boolean;
  userId?: string;
  results?: AgentResult;
  logs?: AgentLog[];
  currentStep?: number;
}
```

### Agent Result Model

```typescript
interface AgentResult {
  id: string;
  agentId: string;
  summary: string;
  outputText: string;
  outputHtml?: string;
  artifacts?: Artifact[];
  createdAt: string; // ISO 8601 format
}

interface Artifact {
  id: string;
  agentId: string;
  resultId: string;
  type: "image" | "video" | "gif" | "json" | "text" | "html";
  url: string;
  filename: string;
  contentType: string;
  size: number;
  createdAt: string; // ISO 8601 format
}
```

### Agent Log Model

```typescript
interface AgentLog {
  id: string;
  agentId: string;
  stepNumber: number;
  level: "info" | "warning" | "error" | "debug";
  message: string;
  details?: Record<string, any>;
  timestamp: string; // ISO 8601 format
  url?: string;
  screenshot?: string;
}
```

### Preset Prompts Model

```typescript
interface PresetPrompt {
  id: string;
  title: string;
  icon: string;
  iconColor: string;
  tag: string;
  description: string;
  instruction: string;
}
```

### Credential Model (For Backend Storage)

```typescript
interface Credential {
  id: string;
  userId: string;
  service: string;
  username: string;
  password: string; // Should be encrypted at rest
  isActive: boolean;
  createdAt: string; // ISO 8601 format
  updatedAt: string; // ISO 8601 format
}
```

## API Endpoints

### Agents

#### Get All Agents

```
GET /agents
```

Parameters:
- `limit` (optional): Number of agents to return (default: 20)
- `offset` (optional): Pagination offset (default: 0)
- `status` (optional): Filter by agent status
- `sort` (optional): Sort field (default: "createdAt")
- `order` (optional): Sort order ("asc" or "desc", default: "desc")

Response:
```json
{
  "status": "success",
  "data": {
    "agents": Agent[],
    "total": number,
    "limit": number,
    "offset": number
  }
}
```

#### Get Agent by ID

```
GET /agents/:id
```

Response:
```json
{
  "status": "success",
  "data": {
    "agent": Agent
  }
}
```

#### Create New Agent

```
POST /agents
```

Request Body:
```json
{
  "instruction": string,
  "model": string,
  "maxSteps": number,
  "headless": boolean,
  "useVision": boolean,
  "generateGif": boolean
}
```

Response:
```json
{
  "status": "success",
  "data": {
    "agent": Agent
  }
}
```

#### Update Agent

```
PATCH /agents/:id
```

Request Body (all fields optional):
```json
{
  "instruction": string,
  "model": string,
  "maxSteps": number,
  "headless": boolean,
  "useVision": boolean,
  "generateGif": boolean,
  "status": AgentStatus
}
```

Response:
```json
{
  "status": "success",
  "data": {
    "agent": Agent
  }
}
```

#### Delete Agent

```
DELETE /agents/:id
```

Response:
```json
{
  "status": "success",
  "message": "Agent deleted successfully"
}
```

#### Start Agent

```
POST /agents/:id/start
```

Response:
```json
{
  "status": "success",
  "message": "Agent started successfully",
  "data": {
    "agent": Agent
  }
}
```

#### Stop Agent

```
POST /agents/:id/stop
```

Response:
```json
{
  "status": "success",
  "message": "Agent stopped successfully",
  "data": {
    "agent": Agent
  }
}
```

#### Pause Agent

```
POST /agents/:id/pause
```

Response:
```json
{
  "status": "success",
  "message": "Agent paused successfully",
  "data": {
    "agent": Agent
  }
}
```

#### Resume Agent

```
POST /agents/:id/resume
```

Response:
```json
{
  "status": "success",
  "message": "Agent resumed successfully",
  "data": {
    "agent": Agent
  }
}
```

### Agent Results

#### Get Agent Results

```
GET /agents/:id/results
```

Response:
```json
{
  "status": "success",
  "data": {
    "results": AgentResult
  }
}
```

#### Get Agent Artifacts

```
GET /agents/:id/artifacts
```

Parameters:
- `type` (optional): Filter by artifact type

Response:
```json
{
  "status": "success",
  "data": {
    "artifacts": Artifact[]
  }
}
```

### Agent Logs

#### Get Agent Logs

```
GET /agents/:id/logs
```

Parameters:
- `limit` (optional): Number of logs to return (default: 100)
- `offset` (optional): Pagination offset (default: 0)
- `level` (optional): Filter by log level
- `sort` (optional): Sort field (default: "timestamp")
- `order` (optional): Sort order ("asc" or "desc", default: "asc")

Response:
```json
{
  "status": "success",
  "data": {
    "logs": AgentLog[],
    "total": number,
    "limit": number,
    "offset": number
  }
}
```

### Preset Prompts

#### Get All Preset Prompts

```
GET /preset-prompts
```

Response:
```json
{
  "status": "success",
  "data": {
    "presetPrompts": PresetPrompt[]
  }
}
```

### Credentials (Server-side Management)

These endpoints are for backend management of credentials if server-side authentication is needed. For security reasons, these would be used in combination with the locally stored credentials on the frontend.

#### Verify Credentials

```
POST /credentials/verify
```

Request Body:
```json
{
  "service": string,
  "username": string,
  "password": string
}
```

Response:
```json
{
  "status": "success",
  "data": {
    "valid": boolean
  }
}
```

## Real-time Updates

The backend should support WebSocket connections for real-time updates:

WebSocket URL: `ws://localhost:3000/ws`

### Agent Status Updates

Event: `agent-status-update`
Data:
```json
{
  "agentId": string,
  "status": AgentStatus,
  "currentStep": number,
  "timestamp": string // ISO 8601 format
}
```

### Agent Log Updates

Event: `agent-log-update`
Data:
```json
{
  "agentId": string,
  "log": AgentLog
}
```

## Error Handling

All API errors will follow this format:

```json
{
  "status": "error",
  "code": number, // HTTP status code
  "message": string, // Human-readable error message
  "details": {} // Optional additional error details
}
```

Common error codes:
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 409: Conflict
- 429: Too Many Requests
- 500: Internal Server Error

## Rate Limiting

API endpoints are rate limited to prevent abuse:

- 100 requests per minute per API key
- Rate limit headers will be included in responses:
  - `X-Rate-Limit-Limit`: Total requests allowed per window
  - `X-Rate-Limit-Remaining`: Remaining requests in current window
  - `X-Rate-Limit-Reset`: Time (in seconds) until the rate limit resets

When rate limit is exceeded:
```json
{
  "status": "error",
  "code": 429,
  "message": "Rate limit exceeded. Please try again in {X} seconds."
}
```

## Implementation Notes

1. All timestamps should be in ISO 8601 format (YYYY-MM-DDTHH:mm:ss.sssZ)
2. IDs should be UUIDs (version 4)
3. The backend should validate all request payloads against the defined schemas
4. Credentials should be encrypted both in transit and at rest
5. Implement proper CORS policies to restrict API access

## Deployment Requirements

- MongoDB  for data storage
- Redis for caching and rate limiting
- Support for WebSockets (Socket.io or similar)
- Containerization using Docker
- Environment variables for configuration 
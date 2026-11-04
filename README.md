# Full-Stack Authentication Monorepo

A production-ready authentication starter for teams building modern web apps. It handles email sign-up, verification, password recovery, and Google OAuth so developers can spend less time on auth plumbing and more time on product features.

## Overview

This project gives development teams a complete user authentication system plus an AI-powered desktop file agent out of the box. It handles email and password accounts with verification and password reset flows, sign-in with Google, and secure cookie-based sessions. Signed-in users can describe file tasks in plain English, review the generated plan, and let a local desktop agent carry it out on their own computer.

The repository is structured as a monorepo, with the backend fully implemented in `apps/server` and room for a frontend client and shared packages under `apps/*`.

## System Design

The system separates the web client, API, database, external AI service, and a local desktop agent. The API owns user accounts, sessions, AI plans, and agent pairing. The desktop agent runs on the user's machine, claims approved plans, and executes file actions locally.

```mermaid
flowchart LR
    WebClient["Web Client"]
    API["API Server"]
    Agent["Desktop Agent"]
    Postgres[("PostgreSQL")]
    MetaAI["Meta AI"]

    WebClient --> API
    Agent --> API
    API --> Postgres
    API --> MetaAI

    style WebClient fill:#1e1b4b,stroke:#6366f1,stroke-width:2px,color:#fff
    style API fill:#2e1065,stroke:#8b5cf6,stroke-width:2px,color:#fff
    style Agent fill:#064e3b,stroke:#10b981,stroke-width:2px,color:#fff
    style Postgres fill:#0f172a,stroke:#3b82f6,stroke-width:2px,color:#fff
    style MetaAI fill:#1e3a8a,stroke:#38bdf8,stroke-width:2px,color:#fff
```

## Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd meta_ai
```

2. Install dependencies with pnpm:

```bash
pnpm install
```

3. Create a backend environment file at `apps/server/.env` and fill in the values listed in the [Environment Variables](#environment-variables) section.

4. Push the database schema:

```bash
pnpm --filter server drizzle-kit push
```

5. If you are using the desktop agent, create `apps/agent/.env`:

```bash
API_URL="http://localhost:3000"
WEB_URL="http://localhost:3001"
```

6. Start the development server:

```bash
pnpm dev
```

To run only the backend:

```bash
pnpm dev --filter server
```

To run only the desktop agent:

```bash
pnpm dev --filter agent
```

## Usage

Once the server is running, it is available at `http://localhost:3000` by default.

Create an account:

```bash
curl -X POST http://localhost:3000/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"jane_doe","email":"jane@example.com","password":"securePassword123"}'
```

Log in:

```bash
curl -X POST http://localhost:3000/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"jane@example.com","password":"securePassword123"}'
```

For Google sign-in, call `GET /v1/oauth/google` to receive the Google authorization URL, redirect the user to that URL, and let Google redirect back to `/v1/oauth/google/callback`.

### AI Plans

Describe a file task and store it as a plan:

```bash
curl -X POST http://localhost:3000/v1/ai/plan \
  -H "Content-Type: application/json" \
  -H "Cookie: accessToken=..." \
  -d '{"prompt":"Find image.png and move it to a folder named Archive on the desktop"}'
```

Approve the plan so the desktop agent can claim it:

```bash
curl -X POST http://localhost:3000/v1/ai/plans/<planId>/approve \
  -H "Cookie: accessToken=..."
```

### Desktop Agent

The agent runs locally at `http://127.0.0.1:4317`. It only accepts requests from the configured `WEB_URL` and requires the custom header `X-Agent-Request: connect`.

Pair the agent with your account:

```bash
curl -X POST http://127.0.0.1:4317/connect \
  -H "Content-Type: application/json" \
  -H "X-Agent-Request: connect"
```

After pairing, the agent polls the server for approved plans and executes them. You can also trigger execution manually:

```bash
curl -X POST http://127.0.0.1:4317/execute \
  -H "Content-Type: application/json" \
  -H "X-Agent-Request: connect"
```

## Features

- Email and password registration with username availability suggestions
- Time-limited email verification tokens
- Resend verification email endpoint
- Login with signed, httpOnly JWT access and refresh cookies
- Logout that clears cookies and invalidates the server session
- Forgot password flow using a six-digit OTP
- OTP verification before password reset
- Secure password reset with token invalidation
- Google OAuth sign-in and automatic account linking
- AI-generated file management plans from plain English prompts
- Review, approve, or reject AI plans before execution
- Desktop agent that claims approved plans and runs file actions locally
- File actions: list, find, create folders, and move files within the user's home directory
- Agent pairing flow with a user code and verification URL
- Plan result reporting and history
- Structured error responses and input validation
- Monorepo workspace ready for a Next.js client and shared packages

### AI Plan Execution Flow

When a user asks for a file task, the backend asks the configured AI model for a structured plan, saves it, and waits for approval. The desktop agent then claims the approved plan, runs the actions locally, and reports the results.

```mermaid
sequenceDiagram
    actor User
    participant Web as Web Client
    participant API as API Server
    participant Meta as Meta AI
    participant DB as Database
    participant Agent as Desktop Agent

    User->>Web: Describe file task
    Web->>API: Create plan
    API->>Meta: Generate file actions
    Meta->>API: Return plan
    API->>DB: Save pending plan
    API->>Web: Show plan for review
    User->>Web: Approve plan
    Web->>API: Approve plan
    API->>DB: Mark plan approved
    Agent->>API: Claim approved plan
    API->>DB: Update plan to executing
    API->>Agent: Return plan
    Agent->>Agent: Run file actions locally
    Agent->>API: Report results
    API->>DB: Save execution result
```

### Agent Pairing Flow

Pairing links a local desktop agent to a signed-in user through a short user code. The agent polls the server until the user approves the pairing, then it receives a token it can use on future requests.

```mermaid
sequenceDiagram
    actor User
    participant Agent as Desktop Agent
    participant API as API Server
    participant DB as Database

    User->>Agent: Start pairing
    Agent->>API: Start device pairing
    API->>DB: Create pairing record
    API->>Agent: Return device code and user code
    Agent->>User: Show verification URL and code
    User->>API: Approve pairing with user code
    API->>DB: Link agent to user
    Agent->>API: Poll for approval
    API->>Agent: Issue agent token
```

## Technologies Used

| Technology | Purpose |
|---|---|
| [TypeScript](https://www.typescriptlang.org/) | Type-safe code across the stack |
| [Next.js](https://nextjs.org/) | React framework for the frontend |
| [React](https://react.dev/) | UI library |
| [Hono](https://hono.dev/) | Lightweight backend web framework |
| [Node.js](https://nodejs.org/) | JavaScript runtime |
| [Drizzle ORM](https://orm.drizzle.team/) | Type-safe database access |
| [PostgreSQL](https://www.postgresql.org/) | Relational database, accessed via Neon serverless driver |
| [Argon2](https://github.com/P-H-C/phc-winner-argon2) | Secure password hashing |
| [Zod](https://zod.dev/) | Runtime schema validation |
| [Google APIs](https://github.com/googleapis/google-api-nodejs-client) | Google OAuth integration |
| [Meta AI](https://ai.meta.com/) | External AI model used to generate file plans |
| [pnpm](https://pnpm.io/) | Fast package manager and workspace tool |
| [Turborepo](https://turbo.build/) | Monorepo task runner |
| [Bun](https://bun.sh/) | Fast dev runtime for the server |

## API Documentation

All routes are mounted under `/v1`.

### Authentication Endpoints

#### POST /v1/auth/register

**Description**: Creates a new user account, stores a hashed password, and sends a verification email.

**Request**:

```json
{
  "username": "jane_doe",
  "email": "jane@example.com",
  "password": "securePassword123"
}
```

**Response**:

```json
{
  "success": true,
  "message": "Account created. Check your inbox to verify your email."
}
```

**Errors**:

- 400: Validation error
- 409: Username already taken or email already exists
- 500: Unable to create account

#### GET /v1/auth/verify-email

**Description**: Verifies a user's email address using the token from the verification link.

**Request**: Query parameter `token`

```txt
GET /v1/auth/verify-email?token=abc123
```

**Response**:

```json
{
  "success": true,
  "message": "Email verified successfully. You can now log in."
}
```

**Errors**:

- 400: Invalid or expired token
- 500: Unable to verify email

#### POST /v1/auth/resend-verification

**Description**: Resends the email verification link for an unverified account.

**Request**:

```json
{
  "email": "jane@example.com"
}
```

**Response**:

```json
{
  "success": true,
  "message": "A new verification link has been sent to your email."
}
```

**Errors**:

- 500: Unable to resend verification email

#### POST /v1/auth/login

**Description**: Authenticates a user and sets signed `accessToken` and `refreshToken` cookies.

**Request**:

```json
{
  "email": "jane@example.com",
  "password": "securePassword123"
}
```

**Response**:

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "...",
      "username": "jane_doe",
      "email": "jane@example.com",
      "displayName": "jane_doe",
      "avatarUrl": null
    }
  }
}
```

**Errors**:

- 400: Validation error
- 401: Invalid email or password
- 403: Email not verified
- 500: Unable to log in

#### POST /v1/auth/logout

**Description**: Ends the current session, removes the server refresh token, and clears auth cookies. Requires authentication.

**Response**:

```json
{
  "success": true,
  "message": "Logged out successfully",
  "data": null
}
```

**Errors**:

- 401: Not authenticated
- 500: Could not logout

#### POST /v1/auth/forgot-password

**Description**: Sends a six-digit OTP to the user's email for password reset.

**Request**:

```json
{
  "email": "jane@example.com"
}
```

**Response**:

```json
{
  "success": true,
  "message": "If an account with that email exists, a password reset code will be sent."
}
```

**Errors**:

- 400: Validation error
- 404: No account exists with this email address
- 500: Unable to process password reset request

#### POST /v1/auth/verify-otp

**Description**: Validates the six-digit password reset OTP.

**Request**:

```json
{
  "email": "jane@example.com",
  "otp": "123456"
}
```

**Response**:

```json
{
  "success": true,
  "message": "Reset code verified."
}
```

**Errors**:

- 400: Invalid or expired reset code
- 422: Validation failed
- 500: Unable to verify OTP

#### POST /v1/auth/reset-password

**Description**: Resets the user's password after the OTP has been verified.

**Request**:

```json
{
  "email": "jane@example.com",
  "otp": "123456",
  "newPassword": "newSecurePassword123"
}
```

**Response**:

```json
{
  "success": true,
  "message": "Password reset successfully. You can now log in."
}
```

**Errors**:

- 400: Invalid reset request or invalid reset code
- 500: Unable to reset password

### OAuth Endpoints

#### GET /v1/oauth/google

**Description**: Returns the Google OAuth URL that the client should redirect the user to.

**Response**:

```json
{
  "success": true,
  "url": "https://accounts.google.com/o/oauth2/v2/auth?..."
}
```

**Errors**:

- 500: Unable to start Google authentication

#### GET /v1/oauth/google/callback

**Description**: Handles the Google OAuth callback, creates or links the user account, sets auth cookies, and redirects the browser.

**Request**: Query parameters `code` and `state`.

```txt
GET /v1/oauth/google/callback?code=abc&state=xyz
```

**Response**: HTTP redirect to `${FRONTEND_URL}/dashboard` on success, or to `${FRONTEND_URL}/error?message=...` on failure.

**Errors**:

- 400: Missing authorization code or state
- 401: Google identity verification failed
- 404: The account associated with Google was not found
- 500: Google authentication failed

### AI Endpoints

All AI routes require a valid session cookie.

#### POST /v1/ai/plan

**Description**: Sends a natural-language file task to the configured AI model and stores the generated plan for review.

**Request**:

```json
{
  "prompt": "Find image.png and move it to a folder named Archive on the desktop"
}
```

**Response**:

```json
{
  "success": true,
  "message": "Plan generated. Review it before approving.",
  "data": {
    "id": "...",
    "userId": "...",
    "goal": "Find image.png and move it to Archive on the desktop",
    "plan": {
      "goal": "Find image.png and move it to Archive on the desktop",
      "explanation": "Locate image.png, create Archive on the desktop, and move the file into it.",
      "actions": [...]
    },
    "status": "pending_approval",
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

**Errors**:

- 400: Validation error or invalid JSON
- 401: Authentication required
- 502: AI returned an invalid plan or the plan structure failed validation

#### POST /v1/ai/plans/:planId/approve

**Description**: Approves a pending plan so the desktop agent can claim and execute it.

**Response**:

```json
{
  "success": true,
  "message": "Plan approved. Ready for execution.",
  "data": {
    "id": "...",
    "goal": "Find image.png and move it to Archive on the desktop",
    "status": "approved"
  }
}
```

**Errors**:

- 400: Invalid plan ID
- 401: Authentication required
- 409: Plan not found or already reviewed
- 500: Could not approve the plan

#### POST /v1/ai/plans/:planId/reject

**Description**: Rejects a pending plan so it will not be executed.

**Response**:

```json
{
  "success": true,
  "message": "Plan rejected. No actions will be executed.",
  "data": {
    "id": "...",
    "goal": "Find image.png and move it to Archive on the desktop",
    "status": "rejected"
  }
}
```

**Errors**:

- 400: Invalid plan ID
- 401: Authentication required
- 409: Plan not found or already reviewed
- 500: Could not reject the plan

### Agent Endpoints

Agent endpoints use `Authorization: Bearer <agent-token>`, where the token is returned by the pairing flow. The result and history endpoints require a normal session cookie instead.

#### POST /v1/agent/start

**Description**: Starts the device pairing flow. Returns a device code and a short user code.

**Response**:

```json
{
  "success": true,
  "data": {
    "deviceCode": "...",
    "userCode": "ABCD-1234",
    "verificationUrl": "http://localhost:3001/connect-agent?code=ABCD-1234",
    "expiresIn": 600
  }
}
```

**Errors**:

- 500: Could not start pairing

#### POST /v1/agent/approve

**Description**: Links a pairing code to the signed-in user. Requires authentication.

**Request**:

```json
{
  "userCode": "ABCD-1234"
}
```

**Response**:

```json
{
  "success": true
}
```

**Errors**:

- 400: Invalid or expired code
- 401: Authentication required
- 500: Could not approve pairing

#### POST /v1/agent/poll

**Description**: Polls for the pairing status. Returns 202 while pending, or the agent token once approved.

**Request**:

```json
{
  "deviceCode": "..."
}
```

**Response when approved**:

```json
{
  "success": true,
  "data": {
    "token": "..."
  }
}
```

**Response when pending**:

```txt
HTTP 202 Accepted
```

**Errors**:

- 400: Pairing expired or invalid device code

#### POST /v1/agent/claim

**Description**: Claims the next approved plan for the authenticated agent's user.

**Response**:

```json
{
  "success": true,
  "data": {
    "id": "...",
    "goal": "Find image.png and move it to Archive on the desktop",
    "plan": {
      "goal": "...",
      "explanation": "...",
      "actions": [...]
    },
    "status": "executing"
  }
}
```

**Errors**:

- 204: No approved plan available
- 401: Agent authentication required
- 500: Could not claim a plan

#### POST /v1/agent/plans/:planId/result

**Description**: Reports the outcome of executing a claimed plan.

**Request**:

```json
{
  "status": "completed",
  "results": [...]
}
```

**Response**:

```json
{
  "success": true,
  "message": "Execution result saved successfully.",
  "data": {
    "id": "...",
    "goal": "...",
    "status": "completed",
    "executionResult": [...]
  }
}
```

**Errors**:

- 400: Invalid plan ID, invalid JSON, or invalid result body
- 401: Agent authentication required
- 409: Plan not found or is not being executed
- 500: Could not save execution result

#### GET /v1/agent/result/:planId

**Description**: Retrieves the execution result of a specific plan for the signed-in user.

**Response**:

```json
{
  "success": true,
  "message": "Execution result retrieved successfully.",
  "data": {
    "id": "...",
    "goal": "...",
    "status": "completed",
    "executionResult": [...]
  }
}
```

**Errors**:

- 400: Invalid plan ID
- 401: Authentication required
- 404: Plan not found
- 500: Could not retrieve execution result

#### GET /v1/agent/history

**Description**: Lists completed, failed, or rejected plans for the signed-in user.

**Response**:

```json
{
  "success": true,
  "data": [
    {
      "id": "...",
      "goal": "...",
      "status": "completed",
      "executionResult": [...],
      "createdAt": "...",
      "updatedAt": "..."
    }
  ]
}
```

**Errors**:

- 401: Authentication required
- 500: Could not retrieve plan history

### Authentication Notes

- After login or Google callback, the server sets two signed, httpOnly cookies: `accessToken` (15 minutes) and `refreshToken` (7 days).
- Most auth endpoints are public. Cookie-protected routes can read the `accessToken` cookie on subsequent requests.
- The desktop agent uses a separate bearer token obtained from the pairing flow. This token is saved to `~/.meta-agent/config.json` on the user's machine.
- The Google callback URL is `${FRONTEND_URL}/api/v1/oauth/google/callback`.

### Environment Variables

Create `apps/server/.env` with the following values:

```bash
DATABASE_URL="postgresql://user:password@host/db"
COOKIE_SECRET="a-long-random-string"
NODE_ENV="development"
JWT_ACCESS_SECRET="another-long-random-string"
JWT_REFRESH_SECRET="yet-another-long-random-string"
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
APP_URL="http://localhost:3000"
FRONTEND_URL="http://localhost:3001"
WEB_URL="http://localhost:3001"
SESSION_SECRET="a-session-secret"
AGENT_TOKEN="a-secret-used-to-sign-agent-tokens"
META_MODEL_NAME="model-name"
META_MODEL_API_URL="https://api.meta.ai/v1/responses"
META_MODEL_API_KEY="your-meta-api-key"
```

For the desktop agent, create `apps/agent/.env`:

```bash
API_URL="http://localhost:3000"
WEB_URL="http://localhost:3001"
```

## Author

Built and maintained by the project author.

- Questions or feedback? Open an issue in this repository.

## Badges

[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
[![Hono](https://img.shields.io/badge/Hono-E36002?style=for-the-badge&logo=hono&logoColor=white)](https://hono.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![pnpm](https://img.shields.io/badge/pnpm-F69220?style=for-the-badge&logo=pnpm&logoColor=white)](https://pnpm.io/)
[![Turborepo](https://img.shields.io/badge/Turborepo-EF4444?style=for-the-badge&logo=turborepo&logoColor=white)](https://turbo.build/)
[![Bun](https://img.shields.io/badge/Bun-000000?style=for-the-badge&logo=bun&logoColor=white)](https://bun.sh/)

[![Readme was generated by Dokugen](https://img.shields.io/badge/Readme%20was%20generated%20by-Dokugen-brightgreen)](https://dokugen.samueltuoyo.com)
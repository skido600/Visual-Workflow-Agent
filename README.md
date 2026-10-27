# Visual Workflow Agent my meta hackathon

A production-ready authentication starter for teams building modern web apps. It handles email sign-up, verification, password recovery, and Google OAuth so developers can spend less time on auth plumbing and more time on product features.

## Overview

This project gives development teams a complete user authentication system out of the box. It supports email and password accounts with verification and password reset flows, plus sign-in with Google, all backed by secure cookie-based sessions. Teams can plug it into their product and stop rebuilding login screens and token logic from scratch.

The repository is structured as a monorepo, with the Hono backend fully implemented in `apps/server` and room for a Next.js frontend and shared packages under `apps/*`.

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

4. Push the database schema (make sure `apps/server/src/db/schema.ts` is in place):

```bash
pnpm --filter server drizzle-kit push
```

5. Start the development server:

```bash
pnpm dev
```

To run only the backend:

```bash
pnpm dev --filter server
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

## Features

- Email and password registration with username availability suggestions
- Time-limited email verification tokens
- Resend verification email endpoint
- Login with signed, httpOnly JWT access and refresh cookies
- Forgot password flow using a six-digit OTP
- OTP verification before password reset
- Secure password reset with token invalidation
- Google OAuth sign-in and automatic account linking
- Structured error responses and input validation
- Monorepo workspace ready for a Next.js client and shared packages

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
- 429: Too many OTP attempts
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

**Description**: Handles the Google OAuth callback, creates or links the user account, and sets auth cookies.

**Request**: Query parameters `code` and `state`.

```txt
GET /v1/oauth/google/callback?code=abc&state=xyz
```

**Response**:

```json
{
  "success": true,
  "message": "Google authentication successful",
  "data": {
    "id": "...",
    "email": "jane@example.com",
    "username": "...",
    "displayName": "Jane Doe",
    "avatarUrl": "https://...",
    "emailVerified": true
  }
}
```

**Errors**:

- 400: Missing authorization code or state
- 401: Google identity verification failed
- 404: The account associated with Google was not found
- 500: Google authentication failed

### Authentication Notes

- After login or Google callback, the server sets two signed, httpOnly cookies: `accessToken` (15 minutes) and `refreshToken` (7 days).
- Most auth endpoints are public. Cookie-protected routes can read the `accessToken` cookie on subsequent requests.
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
SESSION_SECRET="a-session-secret"
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

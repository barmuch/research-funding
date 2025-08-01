# Copilot Instructions

<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

## Project Overview
This is a **Research Fund Tracker** application built with Next.js, TypeScript, MongoDB, and Mongoose. The application is designed to track and monitor research funding, both personally and collaboratively.

## Tech Stack
- **Frontend**: Next.js 15 with App Router, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT tokens with bcrypt password hashing
- **Validation**: Zod for input validation

## Project Structure
- `src/app/` - Next.js App Router pages and API routes
- `src/models/` - Mongoose models and schemas
- `src/lib/` - Utility functions, database connection, middleware
- `src/types/` - TypeScript type definitions
- `src/components/` - Reusable React components

## Authentication Flow
1. Users register with email and password
2. Passwords are hashed using bcrypt
3. JWT tokens are issued upon successful login
4. Tokens are used to protect private routes
5. User data includes workspaces they own or have access to

## Coding Guidelines
- Use TypeScript strict mode
- Follow Next.js 15 App Router patterns
- Use Mongoose for database operations
- Implement proper error handling and validation
- Use consistent naming conventions
- Add proper TypeScript types for all functions and components
- Use environment variables for sensitive configuration
- Follow REST API conventions for API routes

## Security Considerations
- Never store plain text passwords
- Use bcrypt with proper salt rounds (12+)
- Validate all inputs on both client and server
- Use HTTPS in production
- Implement rate limiting for auth endpoints
- Use secure JWT practices (short expiration, secure storage)

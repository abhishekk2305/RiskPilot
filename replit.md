# Compliance Risk Micro-Pilot

## Overview

This is a production-ready Next.js application that provides instant contractor compliance risk assessment. The application allows users to input basic contractor details through a form, calculates a risk score using a rule-based engine, and generates downloadable PDF reports. It includes an admin dashboard for analytics and real-time monitoring, with Google Sheets integration for comprehensive logging and data analysis.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The application uses Next.js 14 with the App Router pattern, providing both server-side and client-side rendering capabilities. The UI is built with React components using TypeScript for type safety. The design system leverages Tailwind CSS for styling and shadcn/ui components for consistent UI elements. Form handling is managed through react-hook-form with Zod validation schemas for robust input validation.

### Backend Architecture
The backend is implemented using Next.js API routes, providing a serverless function approach for handling requests. The application includes several key API endpoints:
- `/api/score` - Processes risk assessments using a rule-based engine
- `/api/report` - Generates PDF reports using PDFKit
- `/api/feedback` - Handles user feedback collection
- `/api/admin/*` - Provides administrative functionality with authentication

The risk assessment engine uses a rule-based scoring system that evaluates factors such as contractor country, contract type, contract value, and GDPR data processing requirements to generate Low/Medium/High risk levels.

### Data Storage Solutions
The application uses a hybrid data storage approach:
- PostgreSQL database managed through Drizzle ORM for structured data persistence
- Google Sheets integration for comprehensive logging, analytics, and admin reporting
- In-memory caching for rate limiting and temporary data storage

The database schema includes tables for risk assessments with fields for user inputs, calculated scores, timestamps, and metadata. Google Sheets serves as both a backup system and analytics platform.

### Authentication and Authorization
Admin functionality is protected through a simple key-based authentication system. The application checks for admin keys via Authorization headers or query parameters. Rate limiting is implemented using in-memory storage to prevent abuse, allowing 10 requests per 10-minute window per IP address.

### PDF Generation System
Server-side PDF generation is handled by PDFKit, creating formatted compliance reports with assessment details, risk scores, and explanatory text. Reports include company branding, structured data presentation, and are downloadable directly from the results interface.

## External Dependencies

### Third-party Services
- **Google Sheets API**: Used for comprehensive logging, analytics data storage, and admin dashboard data source via Google Service Account authentication
- **Neon Database**: PostgreSQL hosting service for primary data persistence
- **Vercel**: Deployment platform optimized for Next.js applications

### Key Libraries
- **Drizzle ORM**: Type-safe database operations with PostgreSQL
- **PDFKit**: Server-side PDF document generation
- **Chart.js**: Client-side data visualization for admin dashboard
- **React Hook Form**: Form state management and validation
- **Zod**: Runtime type validation and schema definition
- **Tailwind CSS**: Utility-first CSS framework
- **shadcn/ui**: Pre-built React components built on Radix UI

### Analytics and Monitoring
- **Plausible Analytics**: Optional privacy-focused web analytics (configured via environment variables)
- **Custom logging**: Application-level logging for API requests and user interactions

The application is designed to be privacy-focused, collecting minimal data with explicit user consent, and implements proper data masking for sensitive information in admin interfaces.
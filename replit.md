# UGC Maroc - Platform Overview

## Overview
UGC Maroc is a Moroccan platform designed to connect content creators with brands for user-generated content (UGC) campaigns. The platform facilitates the creation, submission, and management of UGC, featuring separate dashboards for creators, brands, and administrators. Its primary purpose is to streamline UGC campaign workflows, enhance creator-brand collaboration, and leverage AI for content generation and creator matching. The platform supports Arabic RTL layout and integrates advanced features like AI-powered content assistance and secure video storage with automatic watermarking.

## User Preferences
This section has been intentionally left blank as no user preferences were specified in the original `replit.md` beyond general project functionality.

## System Architecture

### UI/UX Decisions
The platform features an Arabic RTL (Right-to-Left) layout using the Cairo font, ensuring a localized and user-friendly experience for Moroccan users. The design utilizes modern card-based displays with skeleton loaders for improved perceived performance. Key UI/UX elements include:
- **Responsive Layout**: Adapts to different screen sizes (mobile, tablet, desktop).
- **Dark Mode Support**: Available throughout the application.
- **Localized Content**: All messages, labels, and date formats are in Arabic.
- **Intuitive Navigation**: Clickable logos and clear navigation paths.
- **Interactive Elements**: Advanced filtering, search, and sorting options for campaigns.

### Technical Implementations
- **Frontend**: Primarily static HTML/CSS/JavaScript with Tailwind CSS for styling.
- **Backend**: Node.js with Express, running on port 5000 for Replit compatibility.
- **Database**: Supabase (PostgreSQL) handles all data storage, authentication, and user profiles. Drizzle ORM is used for schema management.
- **Authentication**: Client-side authentication handled exclusively by Supabase Auth, ensuring security and performance. Custom event-driven Supabase initialization prevents race conditions.
- **Video Storage**: Cloudflare R2 is used for robust and scalable video asset storage, replacing Supabase Storage for better performance and cost efficiency.
- **Video Processing**: FFmpeg is integrated for automatic video watermarking during the upload process, applying "UGC Maroc" branding and campaign-specific overlays.
- **AI Integration**: DeepSeek V3.1 is integrated for various AI-powered features, including script generation, content suggestions, performance prediction, brief generation, and creator matching, with full Arabic/Moroccan Darija support.
- **Email Service**: Resend is used for sending transactional emails.

### Feature Specifications
- **Campaign Discovery**: Creators can browse campaigns with advanced filtering (category, budget, difficulty), search, and sorting options. Includes a dedicated "beginner" section and AI recommendations.
- **AI-Powered Tools**:
    - Script Generator
    - Content Suggestion for campaigns
    - Video Performance Prediction
    - Campaign Brief Generator
    - Creator Matching for brands
- **Video Upload System**: Robust system for uploading videos up to 500MB, featuring:
    - Drag-and-drop UI with real-time progress bar.
    - Automatic watermarking (logo + campaign name overlay).
    - Memory-efficient streaming uploads to Cloudflare R2.
    - Public CDN URLs for playback.
- **User Roles**: Distinct dashboards and functionalities for Creators, Brands, and Administrators.
- **Security**: Row-Level Security (RLS) policies in Supabase ensure data privacy. Environment variables are used for sensitive API keys.

### System Design Choices
- **Unified Server Architecture**: A single Express server serves both static files and API endpoints.
- **Event-Driven Supabase Initialization**: `supabaseReady` custom event ensures proper timing for Supabase client access.
- **Robust Error Handling**: Comprehensive error handling is implemented, particularly for authentication and profile creation, with user-friendly Arabic messages.
- **Optimized Video Pipeline**: Videos are processed on disk to avoid memory overflows, then streamed to R2, and temporary files are cleaned up.

## External Dependencies

- **Supabase**:
    - PostgreSQL Database
    - Authentication (Email/Password)
    - Realtime functionalities (if expanded)
- **Cloudflare R2**:
    - Object Storage for video assets (`ugc-maroc-assets` bucket)
    - CDN for public video delivery
- **DeepSeek V3.1**:
    - AI API for various generative and analytical tasks
- **Resend**:
    - Email delivery service for transactional emails
- **FFmpeg**:
    - System package used for video processing (watermarking)
- **Tailwind CSS**:
    - CSS framework (currently via CDN)
- **Multer**:
    - Node.js middleware for handling `multipart/form-data` (file uploads)
- **fluent-ffmpeg**:
    - Node.js wrapper for FFmpeg
- **AWS SDK S3 Client**:
    - Used for programmatic interaction with Cloudflare R2 (S3-compatible API)
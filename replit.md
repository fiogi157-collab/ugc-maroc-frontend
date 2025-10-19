# UGC Maroc - Platform Overview

## Overview
UGC Maroc is a Moroccan platform designed to connect content creators with brands for user-generated content (UGC) campaigns. The platform facilitates the creation, submission, and management of UGC, featuring separate dashboards for creators, brands, and administrators. Its primary purpose is to streamline UGC campaign workflows, enhance creator-brand collaboration, and leverage AI for content generation and creator matching. The platform supports Arabic RTL layout and integrates advanced features like AI-powered content assistance and secure video storage with automatic watermarking.

## User Preferences
This section has been intentionally left blank as no user preferences were specified in the original `replit.md` beyond general project functionality.

## System Architecture

### UI/UX Decisions
The platform features an Arabic RTL (Right-to-Left) layout using the Cairo font, ensuring a localized and user-friendly experience for Moroccan users. The design utilizes modern card-based displays with skeleton loaders for improved perceived performance. Key UI/UX elements include:
- **Responsive Layout**: Adapts to different screen sizes (mobile, tablet, desktop).
- **Dark Mode Support**: Global dark/light mode toggle (moon/sun icon) with localStorage persistence (`js/dark-mode-toggle.js`). Users can switch themes from any page with a fixed top-left button.
- **Localized Content**: All messages, labels, and date formats are in Arabic.
- **Bilingual Labels**: Content types and key fields display Arabic with English translations in parentheses for clarity (e.g., "فيديو (Video)", "صور (Images)").
- **Native Script Support**: Language options shown in their native scripts (العربية, ⵜⴰⵎⴰⵣⵉⵖⵜ Amazigh, Français, English, Español) for authentic multilingual experience.
- **Intuitive Navigation**: Clickable logos and clear navigation paths.
- **Interactive Elements**: Advanced filtering, search, and sorting options for campaigns.

### Technical Implementations
- **Frontend**: Primarily static HTML/CSS/JavaScript with Tailwind CSS for styling.
- **Backend**: Node.js with Express, running on port 5000 for Replit compatibility.
- **Database**: Supabase (PostgreSQL) handles all data storage, authentication, and user profiles. Drizzle ORM is used for schema management.
- **Authentication**: Client-side authentication handled exclusively by Supabase Auth, ensuring security and performance. Custom event-driven Supabase initialization prevents race conditions.
- **Video Storage**: Cloudflare R2 is used for robust and scalable video asset storage, replacing Supabase Storage for better performance and cost efficiency.
- **Video Processing**: FFmpeg is integrated for automatic video watermarking during the upload process, applying "UGC Maroc" branding and campaign-specific overlays.
- **AI Integration**: DeepSeek V3.1 via OpenRouter is integrated for various AI-powered features, including script generation, content suggestions, performance prediction, brief generation, creator matching, and intelligent campaign description generation with automatic language detection (Arabic/Darija/French/English support).
- **Email Service**: Resend is used for sending transactional emails.

### Feature Specifications
- **Campaign Discovery**: Creators can browse campaigns with advanced filtering (category, budget, difficulty), search, and sorting options. Includes a dedicated "beginner" section and AI recommendations.
- **Brand Premium Dashboard**: Modern, elegant dashboard for brands featuring:
    - Header with integrated wallet widget (balance display + quick recharge)
    - 4 key performance stats cards (active campaigns, engaged creators, budget spent, ROI)
    - 5 quick action cards: Create Campaign (AI-assisted), Search Creators, Manage Funds, My Campaigns, Messages
    - Advanced creator search with filters (category, followers, location, budget, rating)
    - Campaign management section with status badges and quick actions
    - Wallet management modal with transaction history and fund management
    - Toast notification system for user feedback
    - Skeleton loaders for optimal perceived performance
- **Campaign Creation Wizard**: Professional 4-step wizard for creating campaigns featuring:
    - Step 1: Basic information with AI-powered description generation (auto-detects language from title)
    - Step 2: Budget configuration, platform selection, and optional dates
    - Step 3: Product details with drag-and-drop media upload (images/videos, optional but recommended) and additional notes field for brand-specific requirements
    - Step 4: Preview and publish with terms acceptance
    - Real-time validation, progress tracking, and elegant RTL design
    - Bilingual content types (فيديو/Video, صور/Images, قصة/Story, ريلز/Reels)
    - Native script language options (العربية, ⵜⴰⵎⴰⵣⵉⵖⵜ Amazigh, Darija, Français, English, Español)
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
- **Agreement-Based Escrow System** (MVP Implementation):
    - **Virtual Wallet Reservations**: Brands create campaigns without blocking funds; virtual reservations prevent over-inviting
    - **Individual Agreements**: Brands create agreements via application or invitation, negotiate terms via real-time WebSocket messaging
    - **Escrow on Finalization**: Funds blocked only when agreement accepted (reservation→escrow conversion + wallet debit)
    - **Re-submission Workflow**: Brands can request revisions, creators resubmit, or reject submissions
    - **Manual Dispute Resolution**: Admin-only access (ADMIN_USER_IDS env var) with split/refund options
    - **Mutual Rating System**: Post-completion feedback for brands and creators
    - **Atomic Transactions**: All critical flows (accept, approve, dispute) wrapped in db.transaction() for data integrity
    - **Platform Fee**: 15% commission on all released escrow payments to creators
    - **Socket.IO Integration**: Real-time negotiation messaging with WebSocket events
- **Platform Banking Settings** (Admin-Managed):
    - **Platform Settings Table**: Stores UGC Maroc's bank account details (bank_name, account_holder, RIB, SWIFT, IBAN, bank_address, special_instructions)
    - **Admin Interface** (`admin/platform-settings.html`): Secure form for admin-only modification of platform banking information, protected by ADMIN_USER_IDS environment variable
    - **Public API Endpoint**: GET `/api/platform/bank-info` provides current RIB and bank details for wire transfer deposits (no auth required)
    - **Admin Update Endpoint**: PUT `/api/platform/bank-info` allows admins to update banking details with proper authorization check
    - **Dynamic RIB Loading**: Brand deposit page (`Depot_de_Fonds_Marque.html`) loads bank details dynamically from API with copy-to-clipboard functionality
    - **Wire Transfer Instructions**: Detailed 3-step guide in Arabic with alerts (reference requirements, 24-48h verification, 5% commission)
- **Campaign Details Page** (`brand/campaign-details.html`):
    - **Complete Campaign View**: Displays all campaign information (title, description, budget, platforms, content types, media, dates, status)
    - **Applications/Agreements Section**: Shows list of creator applications with real-time status badges (pending, negotiating, finalized, work_in_progress, submitted, approved, etc.)
    - **Detailed Application Display**: Shows application_message, portfolio_links (clickable badges), delivery_days, additional_notes in color-coded sections (blue/purple/green)
    - **Agreement Actions**: Brand can accept/reject pending applications, open chat for negotiation, view detailed agreement info
    - **API Integration**: Loads campaign details from GET `/api/campaigns/:id` and agreements from GET `/api/agreements?campaign_id=X`
    - **Escrow Integration**: Accept button triggers `/api/agreements/:id/approve` which creates escrow and debits wallet
    - **Email Notifications**: Brand receives RTL Arabic email via Resend when creator submits application, with direct link to campaign-details page
- **Real-Time Messaging System** (`brand/chat.html`):
    - **Conversations Database**: `conversations` table (one per agreement) tracks last_message, timestamps, unread counts for both brand and creator
    - **Messages Database**: `messages` table stores individual chat messages with sender_id, message content, type (text/system/offer/file), and read status
    - **Automatic Conversation Creation**: Conversations automatically created when brand approves application or creator accepts invitation (within escrow transaction)
    - **REST API Endpoints**:
        - GET `/api/conversations/:user_id` - Fetch all user conversations with campaign titles, party names, unread counts
        - GET `/api/conversations/unread-count/:user_id` - Get total unread messages count across all conversations for notification badges
        - GET `/api/conversations/:conversation_id/messages` - Fetch all messages in a conversation
        - POST `/api/conversations/:conversation_id/messages` - Send message (also updates last_message and unread counts)
        - PUT `/api/conversations/:conversation_id/mark-read` - Mark messages as read, reset unread count
    - **Socket.IO Real-Time Events**:
        - `join_negotiation` - Join conversation room for live updates
        - `send_message` - Send message with automatic DB save and broadcast
        - `new_message` - Receive messages in real-time from other party
        - `typing` - Typing indicators for better UX
    - **Chat Interface Features**:
        - Split-screen layout: conversations list (left) + active chat window (right)
        - Real-time message delivery with Socket.IO
        - Unread message badges on conversations
        - Auto-scroll to latest messages
        - Direct link from campaign-details: clicking "محادثة" button redirects to `/brand/chat.html?agreement_id=X`
        - URL parameter support: opens specific conversation automatically when `agreement_id` provided
    - **File Attachments in Chat**:
        - POST `/api/conversations/:conversation_id/upload` endpoint for uploading attachments
        - Type-specific file size limits: images (10MB), documents (20MB), videos (50MB)
        - Supported formats: JPEG, PNG, GIF, WebP images; MP4, WebM, MOV videos; PDF, DOC, DOCX, XLS, XLSX documents
        - Files stored in `/uploads/chat/` directory with unique filenames
        - Security: sender_id verification, participant validation, file type filtering, automatic cleanup on size violations
        - Messages table supports metadata (filename, fileUrl, fileSize, mimeType) for attachments
        - UI features: file picker button (📎), preview before upload, progress bar, cancel option
        - Real-time broadcast via Socket.IO with metadata included
        - Inline display: images show as lightbox, videos as player, documents as download links

### System Design Choices
- **Unified Server Architecture**: A single Express server serves both static files and API endpoints.
- **Supabase Client Loading**: Campaign wizard loads Supabase directly via CDN (`@supabase/supabase-js@2`) for simplicity and reliability.
- **Robust Error Handling**: Comprehensive error handling is implemented, particularly for authentication and profile creation, with user-friendly Arabic messages.
- **Optimized Video Pipeline**: Videos are processed on disk to avoid memory overflows, then streamed to R2, and temporary files are cleaned up.
- **Multer Configuration**: Separate upload middlewares for different file types:
  - `uploadVideo`: Creator UGC submissions (videos only, 500MB max)
  - `uploadMedia`: Campaign media assets (images + videos, 100MB max)
  - `uploadChatFile`: Chat attachments with type-specific limits enforced post-upload (images: 10MB, videos: 50MB, documents: 20MB)
- **Secure API Key Management**: API keys never logged with fragments; only status messages shown.

## External Dependencies

- **Supabase**:
    - PostgreSQL Database
    - Authentication (Email/Password)
    - Realtime functionalities (if expanded)
- **Cloudflare R2**:
    - Object Storage for video assets (`ugc-maroc-assets` bucket)
    - CDN for public video delivery
- **OpenRouter + DeepSeek V3.1**:
    - AI API gateway (OpenRouter) routing to DeepSeek V3.1 model for various generative and analytical tasks
    - Campaign description generation with automatic language detection
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
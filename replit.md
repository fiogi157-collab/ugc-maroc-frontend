# UGC Maroc - Platform Overview

## Project Information

**UGC Maroc** is a Moroccan platform connecting content creators with brands for user-generated content (UGC) campaigns. The platform supports Arabic RTL layout and features separate dashboards for creators, brands, and administrators.

## Recent Changes

### Migration from Vercel to Replit (October 18, 2025)

Successfully migrated the entire platform from Vercel to Replit with the following improvements:

1. **Security Enhancement**: Moved hardcoded Supabase credentials from frontend to secure environment variables
2. **Unified Server Architecture**: Created single Express server serving both static files and API endpoints
3. **Proper Port Configuration**: Configured server to run on port 5000 with 0.0.0.0 binding for Replit compatibility
4. **Event-Driven Initialization**: Implemented `supabaseReady` custom event to ensure proper initialization timing

## Project Architecture

### Frontend
- **Technology**: Static HTML/CSS/JavaScript with Tailwind CSS
- **Layout**: Arabic RTL (Right-to-Left) using Cairo font
- **Structure**:
  - `/auth/` - Authentication pages (login/signup for creators and brands)
  - `/creator/` - Creator dashboard and features
  - `/brand/` - Brand dashboard and campaign management
  - `/admin/` - Administrative panels
  - `/js/` - JavaScript modules

### Backend
- **Location**: `/api/`
- **Technology**: Node.js with Express
- **Port**: 5000 (required for Replit)
- **Endpoints**:
  - `GET /api` - Health check
  - `GET /api/ping` - API connectivity test
  - `POST /api/send-email` - Email sending via Resend
  - `GET /api/config` - Supabase configuration for frontend

### Database & Authentication
- **Supabase**: PostgreSQL database with authentication
- **Tables**: profiles, creators, brands, wallets, campaigns, submissions
- **Authentication**: Email/password with role-based access (creator, brand, admin)

## Environment Variables

Required secrets (stored in Replit Secrets):
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_ANON_KEY` - Supabase anonymous/public key
- `RESEND_API_KEY` - Email service API key

## Key Technical Decisions

### Supabase Initialization Pattern

The platform uses a custom event-driven initialization pattern to handle timing:

1. **config.js** initializes Supabase client and emits `supabaseReady` event
2. Other scripts listen for this event before accessing `window.supabaseClient`
3. This prevents race conditions between script loading and client initialization

**Important**: Any new scripts that need Supabase should follow this pattern:

```javascript
// Wait for Supabase to be ready
if (window.supabaseClient) {
  // Already initialized, use immediately
  doWork();
} else {
  // Wait for the ready event
  window.addEventListener('supabaseReady', () => {
    doWork();
  });
}
```

### Script Loading Order

Critical order in HTML pages:
1. Supabase CDN library
2. `config.js` (initializes Supabase, provides API base URL)
3. `auth.js` (authentication functions)
4. `nav-links.js` (navigation and auth checks)
5. Other page-specific scripts

## Current State

✅ **Fully Functional** - All systems operational:
- Server running on port 5000
- Frontend displaying correctly with Arabic RTL
- Supabase authentication working
- API endpoints responding
- Email service configured

## User Roles

1. **Creator**: Content creators who submit videos for campaigns
2. **Brand**: Companies creating campaigns and reviewing submissions
3. **Admin**: Platform administrators managing users and content

## Known Considerations

- Tailwind CSS loaded from CDN (development mode) - should migrate to PostCSS for production
- Some legacy files with ES6 imports (`signup_creator_supabase.js`, `signup_brand_supabase.js`) not currently in use

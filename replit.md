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

### DeepSeek V3.1 AI Integration (October 18, 2025)

Integrated AI-powered features using DeepSeek V3.1 with complete Arabic/Moroccan Darija support:

1. **Backend AI Service**: Created `/api/services/deepseek.js` with 5 specialized prompts
2. **API Endpoints**: 5 new REST endpoints under `/api/ai/*` for all AI features
3. **Frontend Module**: `ai-assistant.js` provides easy-to-use functions with loading states
4. **Test Interface**: `test-ai.html` demonstrates all AI capabilities in production-ready UI

### Database Integration for AI Features (October 18, 2025)

Connected all AI features with Supabase database to use real data instead of static placeholders:

1. **Campaign Brief Generator** (`brand/إنشاء_حملة_جديدة.html`):
   - Auto-loads latest brand campaign from Supabase on page load
   - Stores in global variable `currentCampaign`
   - AI brief generation uses real DB data (title, description, budget, deadline, content_type, video_duration)
   - Falls back to DOM placeholder data if no campaigns exist
   
2. **Creator Recommendations** (`brand/brand_dashboard_premium.html`):
   - Queries Supabase `creators` table with JOIN on `profiles`
   - Intelligent bio analysis to determine creator specialization
   - Fetches active campaign data for contextualized recommendations
   - Handles empty DB with Arabic error messages
   
3. **Security & Performance**:
   - All queries scoped to authenticated user (`brand_id = user.id`)
   - LIMIT clauses to prevent overload (20 creators, 1 campaign)
   - Try/catch error handling throughout
   - Loading states and user feedback in Arabic

### Authentication Architecture Refactor (October 18, 2025)

Fixed critical authentication bugs and unified all auth pages to use client-side Supabase Auth:

1. **Problem Solved**: Eliminated "Unexpected token '<'" errors caused by:
   - Missing backend routes (login pages)
   - Obsolete ES6 module imports (signup pages)
2. **Complete Client-Side Auth**: All 4 auth pages now use `js/auth.js` exclusively:
   - `creator-login.html` → `window.auth.loginUser()`
   - `brand-login.html` → `window.auth.loginUser()`
   - `creator-signup.html` → `window.auth.signupUser()`
   - `brand-signup.html` → `window.auth.signupUser()`
3. **Security Fix**: Removed backend auth routes that had session leakage vulnerability
4. **Cleanup**: Deleted obsolete files (`signup_creator_supabase.js`, `signup_brand_supabase.js`)
5. **Benefits**: Unified architecture, no shared sessions, faster performance, production-ready

See `AUTH_FIX_COMPLETE.md` for detailed technical documentation.

### Clickable Logo Navigation (October 18, 2025)

Implemented universal clickable logo functionality across the platform:

1. **Feature**: Logo "UGC Maroc" now redirects to `/index.html` from any page
2. **Implementation**: JavaScript-based solution in `nav-links.js` (auto-wraps logo in anchor tag)
3. **Scope**: Works on all pages where `nav-links.js` is loaded (auth, brand, creator pages)
4. **Script Path Fix**: Corrected 9 pages from relative `./js/nav-links.js` to absolute `/js/nav-links.js`
5. **Benefits**: Maintainable (single file), extensible (auto-applies to future pages), non-invasive

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
- **Standard Endpoints**:
  - `GET /api` - Health check
  - `GET /api/ping` - API connectivity test
  - `POST /api/send-email` - Email sending via Resend
  - `GET /api/config` - Supabase configuration for frontend
- **AI Endpoints** (DeepSeek V3.1):
  - `POST /api/ai/generate-script` - مولد السكريبت - Generate UGC video scripts
  - `POST /api/ai/suggest-content` - اقتراحات المحتوى - Content suggestions for campaigns
  - `POST /api/ai/predict-performance` - تحليل الأداء - Predict video performance
  - `POST /api/ai/generate-brief` - مولد البريف - Auto-generate campaign briefs
  - `POST /api/ai/match-creators` - توصيات المبدعين - Match creators to campaigns

### Database & Authentication
- **Supabase**: PostgreSQL database with authentication
- **Tables**: profiles, creators, brands, wallets, campaigns, submissions
- **Authentication**: Email/password with role-based access (creator, brand, admin)
- **Auth Architecture**: 100% client-side via Supabase Auth (no backend auth routes for security)

## Environment Variables

Required secrets (stored in Replit Secrets):
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_ANON_KEY` - Supabase anonymous/public key
- `RESEND_API_KEY` - Email service API key
- `DEEPSEEK_API_KEY` - DeepSeek V3.1 AI API key for intelligent features

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

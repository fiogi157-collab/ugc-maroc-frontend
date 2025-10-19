# Agreement-Based Escrow System - Implementation Summary

## Overview
Transformed UGC Maroc from campaign-level escrow to agreement-level escrow with virtual wallet reservations.

## Database Schema Changes (api/db/schema.js)

### New Tables Created
1. **campaign_agreements** - Individual agreements between brand & creator
   - Status flow: invited → negotiating → active → pending_review → completed/rejected/disputed
   - Fields: campaign_id, brand_id, creator_id, price_offered, final_price, deadline, custom_terms

2. **wallet_reservations** - Virtual reservations (brand wallet)
   - Status: active, converted, expired, cancelled
   - Expires after 48h
   - Blocks funds without deducting from wallet

3. **agreement_escrow** - Escrow per agreement (not campaign)
   - Created when creator accepts invitation
   - Status: active, released, disputed, refunded

4. **agreement_earnings** - Creator earnings per agreement
   - Gross amount, 15% platform fee, net amount
   - Linked to agreement_id & submission_id

5. **negotiation_messages** - Real-time negotiation messages
   - is_read flag for notifications

6. **dispute_cases** - Manual admin dispute resolution
   - Evidence field for proofs
   - Resolution can award to: creator, brand, or split 50/50

7. **ratings** - Mutual ratings after completion
   - 1-5 stars, from_user → to_user

### Legacy Tables (Kept Intact)
- escrow_transactions (campaign-level, deprecated)
- creator_earnings (campaign-level, deprecated)
- wallets (balance + pending_balance, no changes)

## API Endpoints Implementation (api/src/index.js)

### Wallet Endpoints
**GET /api/wallet/balance-detailed**
- Calculates: available_balance = balance - sum(active_reservations.amount)
- Returns: total_balance, pending_balance, reserved_balance, available_balance
- Lists active reservations with campaign details

**GET /api/wallet/reservations**
- Filter by status: active/converted/expired/cancelled
- Shows expiration status

### Agreement Endpoints
**POST /api/agreements/create** (Lines ~2318-2471)
```typescript
// 1. Validate campaign ownership
// 2. Check existing agreement (409 if exists)
// 3. Calculate availableBalance = wallet.balance - sum(activeReservations)
// 4. Verify availableBalance >= price_offered (400 if insufficient)
// 5. Create agreement (status: 'invited')
// 6. Create virtual reservation (48h expiry)
```

**PATCH /api/agreements/:id/accept** (Lines ~2473-2588)
```typescript
// ATOMIC TRANSACTION:
// 1. Verify creator ownership & status='invited'
// 2. Check reservation exists & not expired
// 3. Update agreement (status → 'negotiating')
// 4. Update reservation (status → 'converted')
// 5. Create agreementEscrow (amount = final_price)
```

**GET /api/agreements**
- Filter by role (brand/creator), status, campaign_id
- Returns agreements with campaign details

### Socket.IO + Negotiation Endpoints

**Socket.IO Server** (Lines ~2823-2901)
```typescript
io.on("connection", (socket) => {
  // join_negotiation: socket.join(`agreement_${agreement_id}`)
  // send_message: save to DB + broadcast to room
  // counter_offer: emit to room
  // typing: broadcast typing indicator
});

// httpServer.listen replaces app.listen (Line 2905)
```

**GET /api/agreements/:id/messages** (Lines ~2680-2733)
- Verify user is part of agreement
- Mark messages as read (is_read = true WHERE sender != current_user)
- Return chronological messages

**PATCH /api/agreements/:id/counter-offer** (Lines ~2735-2827)
- Update final_price, deadline, custom_terms
- Create notification message
- Status must be 'negotiating'

**PATCH /api/agreements/:id/finalize** (Lines ~2829-2898)
- Status: negotiating → active
- Update escrow amount to match final negotiated price

### Submission Endpoints

**POST /api/agreements/:id/submit** (Lines ~2905-3024)
```typescript
// 1. Verify creator ownership & status='active'
// 2. Apply watermark (UGC Maroc + campaign name)
// 3. Upload to R2 (submissions/agreement-{id}/{uuid}.mp4)
// 4. Create submission (status: 'pending')
// 5. Update agreement (status → 'pending_review')
```

**PATCH /api/submissions/:id/approve** (Lines ~3027-3134)
```typescript
// ATOMIC TRANSACTION:
// 1. Verify brand ownership & submission.status='pending'
// 2. Calculate: platformFee = 15%, netAmount = gross - fee
// 3. Update submission (status → 'approved')
// 4. Update agreementEscrow (status → 'released')
// 5. Insert agreementEarnings (gross, fee, net)
// 6. Update agreement (status → 'completed')
```

**PATCH /api/submissions/:id/request-revision** (Lines ~3137-3204)
- Update submission (status → 'revision_requested', add feedback)
- Reset agreement (status → 'active') for re-submission

**PATCH /api/submissions/:id/reject** (Lines ~3207-3266)
- Update submission (status → 'rejected')
- Update agreement (status → 'rejected')
- Message to creator: can open dispute

### Dispute Endpoints

**POST /api/disputes/create** (Lines ~3275-3327)
- Verify user is part of agreement
- Create dispute (status: 'open')
- Update agreement (status → 'disputed')

**GET /api/disputes** (Lines ~3330-3365)
- Admin only (TODO: add role check)
- Filter by status: open/resolved

**PATCH /api/disputes/:id/resolve** (Lines ~3368-3490)
```typescript
// ATOMIC TRANSACTION (admin decision: creator/brand/split):
if (award_to === 'creator') {
  // Insert agreementEarnings (full amount - 15% fee)
} else if (award_to === 'brand') {
  // Refund to wallet (full amount, no fee)
} else if (award_to === 'split') {
  // 50/50: creator gets 50% - 7.5% fee, brand gets 50%
  // Insert agreementEarnings + update wallet
}
// Update escrow (status → 'released')
// Update dispute (status → 'resolved', resolution note)
// Update agreement (status → 'dispute_resolved')
```

### Rating Endpoints

**POST /api/agreements/:id/rate** (Lines ~3497-3558)
- Verify agreement status: completed or dispute_resolved
- Check duplicate rating (409 if exists)
- Determine to_user (opposite of from_user)
- Create rating (1-5 stars + optional comment)

**GET /api/users/:id/ratings** (Lines ~3561-3595)
- Calculate average_score, total_ratings
- Score distribution {1: x, 2: y, 3: z, 4: a, 5: b}

## Critical Validations Implemented

### Wallet Reservation Enforcement
- Line ~2407: `if (availableBalance < priceFloat) { return 400 }`
- Prevents over-invitation beyond wallet capacity

### Atomic Escrow Transitions
1. **Submission Approval** (Lines 3077-3113):
   - 4 sequential DB operations (no explicit transaction wrapper, relies on Drizzle/Postgres)
   - Order: submission → escrow → earnings → agreement

2. **Dispute Resolution** (Lines 3410-3470):
   - Conditional logic (creator/brand/split)
   - Multiple updates: earnings/wallet + escrow + dispute + agreement

### Status Transition Guards
- accept: `if (status !== 'invited') { return 400 }`
- counter-offer: `if (status !== 'negotiating') { return 400 }`
- finalize: `if (status !== 'negotiating') { return 400 }`
- submit: `if (status !== 'active') { return 400 }`
- approve: `if (submission.status !== 'pending') { return 400 }`

### Ownership Checks
- All endpoints verify brand_id or creator_id matches req.user.id
- 403 Forbidden if unauthorized

### Duplicate Prevention
- Line ~2365: Check existing agreement (campaign_id + creator_id)
- Line ~3534: Check existing rating (agreement_id + from_user)

### Reservation Expiry Handling
- Line ~2525: Check `new Date(reservation.expires_at) < new Date()`
- Auto-expire: `update status='expired'` if expired

### Admin Permissions
- Lines ~3335, ~3370: TODO comments for admin role check
- Currently not enforced (needs profiles.role field or middleware)

## Potential Issues & Improvements

### 🔴 CRITICAL
1. **No explicit DB transactions** - Approval & dispute flows use sequential operations without BEGIN/COMMIT
   - Risk: Partial failures could leave inconsistent state
   - Fix: Wrap in Postgres transaction or use Drizzle .transaction()

2. **No reservation expiry cron job** - Expired reservations not automatically cleaned
   - Fix: setInterval every 1h to mark expired reservations

3. **No admin role enforcement** - Dispute endpoints accessible to all authenticated users
   - Fix: Add `req.user.role === 'admin'` check

### 🟡 MEDIUM
4. **Concurrent submission race** - Multiple approvals could create duplicate earnings
   - Fix: Add unique constraint on agreementEarnings(agreement_id, submission_id)

5. **Socket.IO auth** - No authentication on socket connections
   - Fix: Verify JWT token in connection handshake

6. **No deadline enforcement** - Agreements don't auto-expire at deadline
   - Fix: Cron job to check agreement.deadline < now

### 🟢 LOW
7. **Platform fee hardcoded** - 15% not configurable
   - Fix: Environment variable or DB config

8. **No pagination** - GET /api/agreements could return thousands
   - Fix: Add offset/limit query params

## Testing Checklist (Not Implemented)

- [ ] Brand invite → creator accept → escrow created
- [ ] Wallet insufficient funds → 400 error
- [ ] Reservation expires → creator cannot accept
- [ ] Negotiation → price change → escrow updated on finalize
- [ ] Submit → approve → earnings created + escrow released
- [ ] Submit → reject → dispute → admin resolve (creator/brand/split)
- [ ] Duplicate rating → 409 error
- [ ] Socket.IO message broadcast to room
- [ ] Status transition guards (invalid state changes)

## Conclusion
**Functional MVP**: All core flows implemented with proper validations.
**Production-readiness**: Requires explicit transactions, admin auth, cron jobs, and comprehensive testing before deployment.

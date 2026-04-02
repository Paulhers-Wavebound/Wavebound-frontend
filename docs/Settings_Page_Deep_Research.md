# Settings Page — Deep Research Reference

> Source: Competitive analysis of 14 music industry platforms + B2B SaaS best practices.
> Date: March 30, 2026. Use as reference when building settings features.

---

## Six Settings Sections — Build Order

1. **Account & Profile** — name, email, password, timezone, avatar. Auto-save toggles for simple preferences; explicit save for email/password changes.

2. **Team Management** — invite by email, assign roles (Admin / Member / Viewer), manage pending invitations, remove users. Three roles is the sweet spot for launch.

3. **Notification Preferences** — per-artist alert configuration for playlist adds, streaming milestones, chart entries, social spikes. Three cadences: real-time push (critical), daily digest, weekly summary. Email primary; Slack second channel.

4. **Data & Reporting** — CSV export from any view, scheduled weekly email reports, custom date ranges. Music-specific windows: Day 1, Week 1, release-window, Friday-to-Thursday chart cycles. PDF export with optional white-labeling later.

5. **Integrations** — DSP connections (Spotify for Artists, Apple Music for Artists), Slack webhook, API keys for enterprise.

6. **Security** — MFA, session management, basic audit log. SSO (SAML 2.0) non-negotiable for major label enterprise deals but can start as Google/Microsoft OAuth.

---

## Role Hierarchy (maps to real label org charts)

| Role | Access Scope | Typical User |
|------|-------------|-------------|
| **Owner** | Full settings, billing, all artists | Label founder, Head of Digital |
| **Admin** | Team management, all artist data | Operations lead, senior staff |
| **Member** | Assigned artists, full analytics | A&R, marketing coordinator |
| **Viewer** | Assigned artists, read-only | External consultant, management company |

---

## Competitor Access Models

- **Spotify for Artists**: per-artist teams, Admin/Editor/Reader roles, unlimited invites
- **Apple Music for Artists**: Admin/Analyst/Profile Editor
- **FUGA**: hub-and-spoke, white-label sub-accounts for sub-labels
- **Soundcharts**: Admin/Member/Guest, charge per artists tracked not per seat
- **Linkfire**: workspace model, 1 workspace (Starter) to unlimited (Enterprise)
- **DistroKid Labels**: single-account, no multi-user — most criticized limitation

**Our model**: workspace per label, artists as resources, users granted access to specific artists within workspace. Charge per artists tracked with unlimited users (Soundcharts model).

---

## What Label Teams Actually Need

### A&R Teams
- Discovery signals: streaming growth velocity, TikTok UGC rates, Shazam spikes, playlist momentum
- Read-only broad discovery data, write access for internal shortlists/tagging
- Should NOT see financial or pre-release data from other departments

### Digital Marketing Teams
- Campaign-aligned date ranges, geographic fan breakdowns for ad targeting
- Playlist tracking with daily add/drop updates
- Heaviest users of CSV/PDF export, most likely to request Slack integration
- Daily digests during campaigns, weekly summaries otherwise

### Label Operations
- Catalog management, metadata monitoring, DSP delivery tracking
- Audit trails for metadata changes
- Most admin-level access needed

### External Consultants / Management
- Time-limited, artist-scoped, read-only access
- Ideally without requiring full platform account
- Shareable report links with expiration dates solve this

---

## Notification Design — Music Industry Rhythms

Anchored to **New Music Friday** (global release day).

### Real-time alerts (push/in-app)
- Editorial playlist additions or removals
- Chart entries
- Streaming anomalies (sudden spikes = viral moments)
- Shazam velocity spikes

### Daily digests (email)
- Streaming milestone thresholds
- Social follower changes
- Playlist position movements
- Release performance during critical first-week window

### Weekly summaries (email + optional PDF)
- Roster-wide performance
- Competitive benchmarking
- Market/territory trends
- Catalog performance
- Lands in Head of Digital's inbox Monday morning

### Configuration granularity
- **Per-artist alert settings**: breaking artist → real-time; catalog artist → weekly
- **Per-user channel preferences**: VP → email; social media manager → Slack
- **Admin-configurable team defaults**: new members inherit sensible settings
- **Shortlist-based alerts** (Chartmetric pattern): group artists, apply unified criteria

---

## Dark Theme UX Rules

- Text hierarchy: 87% white primary, 60% secondary, 38% disabled
- Desaturate accent colors ~20 points vs light mode
- Input fields: visible outline borders, not filled backgrounds
- Test focus indicators explicitly — most commonly overlooked

### Settings Navigation
- **Sidebar navigation** for 6+ sections (Linear, Notion, Slack, Figma pattern)
- Group sections with headers: Personal, Workspace, Advanced
- Sticky sidebar, independently scrollable
- Deep-linking to specific sections (for onboarding/help docs)
- Search once >15 sections

### Save Patterns
- **Auto-save for toggles** (imperative controls like light switches)
- **Explicit Save/Discard for multi-field forms**
- NEVER mix auto-save and explicit save on the same page
- Always show save confirmation ("Saved ✓" indicator or toast)

### Anti-patterns to avoid
- Settings as dumping ground for every toggle
- Destructive actions behind hover-only interactions
- Mixing save patterns
- No confirmation dialog for irreversible actions (removing users, revoking keys)

---

## Phased Build Roadmap

### Phase 1 — Launch (Week 1-4)
- Account profile (email, password, avatar)
- Three-role team management (Admin/Member/Viewer) with email invites
- Per-artist access scoping
- Basic notification toggles (on/off per alert type, email only)
- CSV export from any data view
- MFA support
- Covers ~80% of daily settings interactions for 5-15 person team

### Phase 2 — Growth (Month 2-3)
- Notification cadence config (real-time/daily/weekly)
- Per-artist notification granularity
- Scheduled weekly email reports with custom date ranges
- Google/Microsoft OAuth
- Pending invitation management (resend/revoke)
- Audit log for team changes and data exports
- Shareable read-only report links for external stakeholders

### Phase 3 — Scale (Month 4-6)
- Slack integration for notifications
- PDF report generation with label branding
- API keys for enterprise
- SAML SSO (unlocks major label deals)
- Department-based permission groups
- Territory-based data filtering
- Bulk user management (CSV import)

### Phase 4 — Enterprise (Month 6+)
- White-label reporting
- Custom roles beyond three defaults
- SCIM provisioning
- Advanced audit trails with data access logging
- Webhook integrations
- IP whitelisting
- SOC 2 compliance

---

## Three Features That Separate Serious Label Tools From Toys

1. **Per-artist access scoping** — external consultant sees only assigned artists
2. **Configurable notification cadences tied to release cycles** — not generic daily/weekly
3. **One-click export** that produces something a Head of Digital can forward to their CEO

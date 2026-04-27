---
date: 2026-04-27
domains: [devops, deployment, kamal]
topics: [kamal, deploy, docker, healthcheck, gitignore]
subject: 2026-04-26.trello-clone-mvp
artifacts: [plan-trello-clone.md]
related: [trello-clone-implementation-2026-04-26.md, card-drag-fix-2026-04-26.md]
priority: high
status: active
---

# Session: 2026-04-27 - Trello Clone Deployment Preparation

## Context
- Continuing trello-clone MVP implementation
- Session focused on making Kamal deploy.yaml production-ready
- Compared with QR Pro's deploy.yaml for infrastructure patterns

## What Was Done

### 1. Updated deploy.yml (config/deploy.yml)
Migrated configuration from QR Pro's deployment infrastructure:
- **Server**: `72.60.126.128` (same Hostinger VPS)
- **Registry**: `registry.digitalocean.com` (same DigitalOcean Container Registry)
- **Image**: `releaseoften/trello-clone`
- **Domain**: `trello.buckleyrobinson.com` (new subdomain)
- **SSL**: Enabled via Kamal proxy
- **Build args**: APP_VERSION, GIT_SHA
- **Secrets**: JWT_SECRET, KAMAL_REGISTRY_USERNAME, KAMAL_REGISTRY_PASSWORD

### 2. Enhanced Health Check (app/api/health/route.ts)
Added database verification to the health endpoint:
- Returns `{ status: 'ok', timestamp, database: { status: 'ok' } }` when healthy
- Returns 503 with `{ status: 'degraded', database: { status: 'error', message } }` on DB failure
- Uses `sqlite.prepare('SELECT 1').get()` for quick connection check

### 3. Added SQLite to .gitignore
Added database files to version control exclusion:
- `*.db` - main database file
- `*.db-*` - WAL and shared memory files

## Decisions Made

### Removed Rails/PostgreSQL References
- This is a Next.js app with SQLite (better-sqlite3), not Rails
- Removed `RAILS_MASTER_KEY`, `DATABASE_URL` from secrets
- Removed PostgreSQL accessory from deploy.yml
- SQLite data persisted via volume mount: `/var/lib/trello-clone_data:/data`

### Infrastructure Reuse
- Using same VPS and container registry as QR Pro
- Same Kamal configuration patterns
- Registry credentials shared via Kamal secrets

## Files Modified
- `config/deploy.yml` - Kamal deployment configuration
- `app/api/health/route.ts` - Enhanced with DB check
- `.gitignore` - Added *.db patterns

## Next Steps for Deployment
1. Create `.kamal/secrets` file with required secrets
2. Set up domain DNS for `trello.buckleyrobinson.com`
3. Run `kamal setup` to deploy initially
4. Run `kamal deploy` for subsequent updates
5. Manual testing of deployed application

## Secrets Required
- `JWT_SECRET` - Authentication signing key
- `KAMAL_REGISTRY_USERNAME` - DigitalOcean registry username
- `KAMAL_REGISTRY_PASSWORD` - DigitalOcean registry password (via 1Password)

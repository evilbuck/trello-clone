---
date: 2026-04-27
domains: [debugging, deployment, kamal, docker, sqlite]
topics: [sqlite, better-sqlite3, docker-volume, database-path, kamal-deploy]
subject: 2026-04-26.trello-clone-mvp
related: [trello-clone-deploy-2026-04-27.md]
priority: high
status: completed
---

# Session: 2026-04-27 - Registration 500 Error Debug

## Context
- User reported 500 error when submitting registration form on deployed app
- App deployed via Kamal to Hostinger VPS at trello.buckleyrobinson.com
- Using SQLite with better-sqlite3 for database

## Root Cause

The error was `SqliteError: unable to open database file (SQLITE_CANTOPEN)`.

**Two issues:**

1. **Wrong database path**: Database used relative path `trello-clone.db` which resolved to `/app/trello-clone.db` in the container, but the volume mount was at `/data`, not `/app`.

2. **Wrong directory permissions**: The `/data` directory was owned by root:root with mode 755, but the Docker container runs as user `nextjs` (uid 1001), which couldn't write to the directory.

## Fix Applied

### 1. Updated `lib/db/index.ts`
Changed database path to use environment variable:
```typescript
const dbPath = process.env.DATABASE_PATH ?? 'trello-clone.db';
const sqlite = new Database(dbPath);
```

### 2. Added `DATABASE_PATH` to `config/deploy.yml`
```yaml
env:
  clear:
    DATABASE_PATH: /data/trello-clone.db
```

### 3. Fixed permissions on server
```bash
ssh root@72.60.126.128 "chown -R 1001:1001 /var/lib/trello-clone_data && chmod 755 /var/lib/trello-clone_data"
```

### 4. Committed changes to git
```bash
git add lib/db/index.ts config/deploy.yml
git commit -m "fix: Use DATABASE_PATH env var for SQLite in production"
```

## Files Modified
- `lib/db/index.ts` - Added DATABASE_PATH env var support
- `config/deploy.yml` - Added DATABASE_PATH environment variable

## Verification
- ✅ Container starts without SQLite errors
- ✅ Database file created at `/data/trello-clone.db`
- ✅ Registration endpoint returns 201 with user data
- ✅ User buckleyrobinson@gmail.com registered successfully

## Key Lesson
When using volume mounts with Docker containers that run as non-root users, ensure:
1. The mounted directory path matches the app's expected path
2. Directory permissions allow the container's user to write

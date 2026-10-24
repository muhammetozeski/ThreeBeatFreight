CREATE TABLE IF NOT EXISTS locker(profile_id TEXT NOT NULL REFERENCES profiles(id), arena_id TEXT NOT NULL, title TEXT NOT NULL, arena_json TEXT NOT NULL, updated_at INTEGER NOT NULL, PRIMARY KEY(profile_id,arena_id));
CREATE TABLE IF NOT EXISTS billing_events(event_id TEXT PRIMARY KEY, kind TEXT NOT NULL, received_at INTEGER NOT NULL);

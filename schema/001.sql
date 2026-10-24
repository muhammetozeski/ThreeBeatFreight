PRAGMA foreign_keys = ON;
CREATE TABLE IF NOT EXISTS profiles(id TEXT PRIMARY KEY, alias TEXT NOT NULL, recovery_hash TEXT NOT NULL UNIQUE, created_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS sessions(token_hash TEXT PRIMARY KEY, profile_id TEXT NOT NULL REFERENCES profiles(id), expires_at INTEGER NOT NULL);
CREATE INDEX IF NOT EXISTS sessions_expiry ON sessions(expires_at);
CREATE TABLE IF NOT EXISTS rooms(id TEXT PRIMARY KEY, host_id TEXT NOT NULL REFERENCES profiles(id), arena_json TEXT NOT NULL, state_json TEXT, phase TEXT NOT NULL DEFAULT 'lobby', round INTEGER NOT NULL DEFAULT 0, version INTEGER NOT NULL DEFAULT 0, deadline INTEGER, last_resolution TEXT, last_replay TEXT, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS members(room_id TEXT NOT NULL REFERENCES rooms(id), profile_id TEXT NOT NULL REFERENCES profiles(id), joined_at INTEGER NOT NULL, PRIMARY KEY(room_id,profile_id));
CREATE TABLE IF NOT EXISTS plans(room_id TEXT NOT NULL, round INTEGER NOT NULL, profile_id TEXT NOT NULL, plan_json TEXT NOT NULL, committed_at INTEGER NOT NULL, PRIMARY KEY(room_id,round,profile_id));
CREATE TABLE IF NOT EXISTS replays(room_id TEXT NOT NULL, round INTEGER NOT NULL, replay_json TEXT NOT NULL, PRIMARY KEY(room_id,round));
CREATE TABLE IF NOT EXISTS limits(bucket TEXT PRIMARY KEY, hits INTEGER NOT NULL, expires_at INTEGER NOT NULL);

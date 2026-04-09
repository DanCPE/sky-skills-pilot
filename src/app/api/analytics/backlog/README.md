Analytics storage is now production-first:

- If `DATABASE_URL` is set, events are stored in PostgreSQL table `analytics_events`.
- If `DATABASE_URL` is missing, local fallback writes to `analytics-data/usage-events.jsonl`.

The table is auto-created by the runtime on first write.

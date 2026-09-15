# lcklytics

LCK analytics dashboard built with Next.js and Supabase.

## Dashboard

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

For team logos and player headshots, add a server-only LoL Esports persisted
API key. Champion icons come from Riot Data Dragon and do not need a key.

```bash
LOLESPORTS_API_KEY="..."
```

## Oracle's Elixir Updater

Run the log table SQL once in Supabase:

```sql
-- sql/etl_update_log.sql
```

Add write credentials locally in your shell or `.env.local`. The dashboard can
keep using the public anon key, but the updater needs a server-only secret key
because it writes/upserts data. A legacy `service_role` key still works, but
Supabase now recommends `sb_secret_...` keys for backend jobs.

```bash
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_SECRET_KEY="sb_secret_..."
```

Then run the updater with either a direct CSV/download URL:

```bash
npm run update:data -- --source-url "https://drive.usercontent.google.com/download?id=FILE_ID&export=download&confirm=t"
```

or a Google Drive file id:

```bash
npm run update:data -- --drive-file-id "FILE_ID"
```

Regular Google Drive share links also work; the updater converts the file id
into a download URL.

Useful flags:

```bash
npm run update:data -- --source-file "C:\path\to\2026_LoL_esports_match_data_from_OraclesElixir.csv"
npm run update:data -- --dry-run --source-file "C:\path\to\file.csv"
npm run update:data -- --force --drive-file-id "FILE_ID"
npm run update:data -- --keep-raw --drive-file-id "FILE_ID"
```

What it does:

- downloads or reads the Oracle's Elixir CSV
- filters to domestic `league = LCK` rows with a non-empty split
- exits as a no-op when the file hash is unchanged or the latest LCK `game_id`
  is already loaded
- normalizes into `games`, `teams`, `players`, `game_team_stats`,
  `game_player_stats`, `draft_actions`, and `game_player_timeline`
- upserts through Supabase REST
- writes a local hash state under `data/state/` and attempts to insert an
  `etl_update_log` row

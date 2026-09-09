#!/usr/bin/env python3
"""
Download the latest Oracle's Elixir match CSV, filter it to domestic LCK rows,
normalize the rows into the lcklytics Supabase tables, and upsert changes.

The script is intentionally dependency-free. It uses Supabase's PostgREST API
directly and expects a service role key for writes.
"""

from __future__ import annotations

import argparse
import csv
import datetime as dt
import hashlib
import html
import json
import os
import re
import shutil
import sys
import tempfile
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path
from typing import Any, Iterable


PROJECT_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_DOWNLOADS_PAGE = "https://oracleselixir.com/tools/downloads"
DEFAULT_STATE_PATH = PROJECT_ROOT / "data" / "state" / "oracles_elixir_lck.json"
DEFAULT_RAW_DIR = PROJECT_ROOT / "data" / "raw"
USER_AGENT = "lcklytics-updater/1.0 (+https://oracleselixir.com/tools/downloads)"

ROLE_POSITIONS = {"top", "jng", "mid", "bot", "sup"}
TEAM_POSITION = "team"
TIMELINE_MINUTES = (10, 15)


class UpdaterError(RuntimeError):
    pass


def read_env_file(path: Path) -> dict[str, str]:
    if not path.exists():
        return {}

    values: dict[str, str] = {}
    for line in path.read_text(encoding="utf-8").splitlines():
        stripped = line.strip()
        if not stripped or stripped.startswith("#") or "=" not in stripped:
            continue

        key, value = stripped.split("=", 1)
        values[key.strip()] = value.strip().strip('"').strip("'")

    return values


def load_env() -> dict[str, str]:
    env = read_env_file(PROJECT_ROOT / ".env.local")
    env.update(os.environ)
    return env


def get_env(env: dict[str, str], *names: str) -> str | None:
    for name in names:
        value = env.get(name)
        if value:
            return value
    return None


def http_request(
    url: str,
    *,
    method: str = "GET",
    headers: dict[str, str] | None = None,
    data: bytes | None = None,
    timeout: int = 90,
) -> tuple[int, bytes, dict[str, str]]:
    request = urllib.request.Request(
        url,
        data=data,
        method=method,
        headers={"User-Agent": USER_AGENT, **(headers or {})},
    )

    try:
        with urllib.request.urlopen(request, timeout=timeout) as response:
            return (
                response.status,
                response.read(),
                {key.lower(): value for key, value in response.headers.items()},
            )
    except urllib.error.HTTPError as error:
        body = error.read().decode("utf-8", errors="replace")
        raise UpdaterError(f"HTTP {error.code} for {url}: {body}") from error
    except urllib.error.URLError as error:
        raise UpdaterError(f"Could not reach {url}: {error.reason}") from error


def build_google_drive_download_url(file_id: str) -> str:
    return (
        "https://drive.google.com/uc?"
        + urllib.parse.urlencode(
            {"id": file_id, "export": "download"}
        )
    )


def extract_google_drive_file_id(url: str) -> str | None:
    patterns = [
        r"/file/d/([^/]+)",
        r"[?&]id=([^&]+)",
        r"/uc\?[^#]*id=([^&]+)",
    ]

    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            return urllib.parse.unquote(match.group(1))

    return None


def discover_latest_csv_url(downloads_page: str, year: int) -> str:
    _, body, _ = http_request(downloads_page)
    text = body.decode("utf-8", errors="replace")
    candidates = re.findall(r'https?://[^"\'<>\s]+', text)
    year_marker = f"{year}_LoL_esports_match_data_from_OraclesElixir"

    csv_candidates = [
        candidate
        for candidate in candidates
        if year_marker in urllib.parse.unquote(candidate)
        and ".csv" in urllib.parse.unquote(candidate).lower()
    ]

    if csv_candidates:
        return csv_candidates[0]

    drive_candidates = [
        candidate
        for candidate in candidates
        if "drive.google.com" in candidate and year_marker in urllib.parse.unquote(candidate)
    ]

    for candidate in drive_candidates:
        file_id = extract_google_drive_file_id(candidate)
        if file_id:
            return build_google_drive_download_url(file_id)

    raise UpdaterError(
        "Could not auto-discover the latest Oracle's Elixir CSV. "
        "Pass --source-url or set ORACLES_ELIXIR_CSV_URL/ORACLES_ELIXIR_FILE_ID."
    )


def resolve_source_url(args: argparse.Namespace, env: dict[str, str]) -> str:
    if args.source_url:
        return normalize_source_url(args.source_url)

    env_url = get_env(env, "ORACLES_ELIXIR_CSV_URL", "OE_CSV_URL")
    if env_url:
        return normalize_source_url(env_url)

    file_id = args.drive_file_id or get_env(
        env, "ORACLES_ELIXIR_FILE_ID", "OE_FILE_ID"
    )
    if file_id:
        return build_google_drive_download_url(file_id)

    return discover_latest_csv_url(args.downloads_page, args.year)


def normalize_source_url(url: str) -> str:
    url = url.strip().strip('"').strip("'")
    markdown_link = re.fullmatch(r"\[[^\]]+\]\((https?://[^)]+)\)", url)
    if markdown_link:
        url = markdown_link.group(1)

    if "drive.google.com" not in url:
        return url

    file_id = extract_google_drive_file_id(url)
    if file_id:
        return build_google_drive_download_url(file_id)

    return url


def file_head(path: Path, size: int = 4096) -> bytes:
    with path.open("rb") as handle:
        return handle.read(size)


def looks_like_html(path: Path) -> bool:
    head = file_head(path).lstrip().lower()
    return head.startswith(b"<!doctype html") or head.startswith(b"<html")


def extract_drive_warning_url(downloaded_path: Path, current_url: str) -> str | None:
    if not looks_like_html(downloaded_path):
        return None

    text = file_head(downloaded_path, 80_000).decode("utf-8", errors="replace")
    if "Google Drive" not in text and "drive.google" not in text:
        return None

    href_match = re.search(r'href="([^"]*(?:confirm|download_warning)[^"]*)"', text)
    if href_match:
        return urllib.parse.urljoin(current_url, html.unescape(href_match.group(1)))

    form_match = re.search(
        r'<form[^>]+id="download-form"[^>]+action="([^"]+)"[^>]*>(.*?)</form>',
        text,
        flags=re.IGNORECASE | re.DOTALL,
    )
    if not form_match:
        return None

    action = html.unescape(form_match.group(1))
    form_body = form_match.group(2)
    params: dict[str, str] = {}

    for input_match in re.finditer(
        r'<input[^>]+name="([^"]+)"[^>]+value="([^"]*)"',
        form_body,
        flags=re.IGNORECASE,
    ):
        params[html.unescape(input_match.group(1))] = html.unescape(
            input_match.group(2)
        )

    if not params:
        return None

    return urllib.parse.urljoin(current_url, action) + "?" + urllib.parse.urlencode(
        params
    )


def raise_if_not_csv(path: Path, source_url: str) -> None:
    head = file_head(path)

    if looks_like_html(path):
        snippet = head.decode("utf-8", errors="replace").strip().replace("\n", " ")
        if "Quota exceeded" in snippet or "download quota" in snippet.lower():
            raise UpdaterError(
                "Google Drive download quota is exceeded for this Oracle's Elixir file. "
                "The updater received a quota page instead of the CSV. "
                "Try again later, download the CSV manually from Oracle's Elixir/Drive "
                "and run with --source-file, or use a different mirror/copy of the CSV. "
                f"Source: {source_url}."
            )

        raise UpdaterError(
            "Downloaded HTML instead of an Oracle's Elixir CSV. "
            "For Google Drive, make sure the file is shared with anyone who has "
            f"the link and that the URL points to the CSV file, not a folder. "
            f"Source: {source_url}. Response starts with: {snippet[:220]}"
        )

    decoded = head.decode("utf-8-sig", errors="replace").lower()
    if "gameid" not in decoded or "league" not in decoded:
        raise UpdaterError(
            "Downloaded file does not look like Oracle's Elixir match data. "
            "Expected CSV headers such as gameid and league. "
            f"Source: {source_url}. First bytes: {decoded[:220]!r}"
        )


def download_to_file(url: str, destination: Path) -> None:
    destination.parent.mkdir(parents=True, exist_ok=True)
    opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor())
    current_url = url

    for _ in range(4):
        try:
            with opener.open(
                urllib.request.Request(current_url, headers={"User-Agent": USER_AGENT}),
                timeout=180,
            ) as response:
                with destination.open("wb") as output:
                    shutil.copyfileobj(response, output)
        except urllib.error.HTTPError as error:
            body = error.read().decode("utf-8", errors="replace")
            raise UpdaterError(f"HTTP {error.code} for {current_url}: {body}") from error
        except urllib.error.URLError as error:
            raise UpdaterError(
                f"Could not reach {current_url}: {error.reason}"
            ) from error

        next_url = extract_drive_warning_url(destination, current_url)
        if not next_url or next_url == current_url:
            raise_if_not_csv(destination, current_url)
            return

        current_url = next_url

    raise UpdaterError(
        "Google Drive kept returning confirmation pages instead of the CSV. "
        "Try downloading the CSV manually and run with --source-file."
    )


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def read_state(path: Path) -> dict[str, Any]:
    if not path.exists():
        return {}

    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return {}


def write_state(path: Path, state: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(state, indent=2, sort_keys=True) + "\n", encoding="utf-8")


def normalized_header(row: dict[str, str]) -> dict[str, str]:
    return {key.strip().lower().replace(" ", "_"): value for key, value in row.items()}


def first(row: dict[str, str], *names: str, default: str = "") -> str:
    for name in names:
        value = row.get(name)
        if value is not None and str(value).strip() != "":
            return str(value).strip()
    return default


def to_bool(value: str | int | float | bool | None) -> bool | None:
    if value is None:
        return None
    if isinstance(value, bool):
        return value

    text = str(value).strip().lower()
    if text in {"1", "true", "t", "yes", "y"}:
        return True
    if text in {"0", "false", "f", "no", "n"}:
        return False
    return None


def to_int(value: str | int | float | None) -> int | None:
    if value is None or str(value).strip() == "":
        return None

    try:
        return int(float(str(value).strip()))
    except ValueError:
        return None


def to_float(value: str | int | float | None) -> float | None:
    if value is None or str(value).strip() == "":
        return None

    try:
        return float(str(value).strip())
    except ValueError:
        return None


def slug_id(prefix: str, value: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "_", value.lower()).strip("_")
    return f"{prefix}_{slug}" if slug else f"{prefix}_unknown"


def clean_record(record: dict[str, Any]) -> dict[str, Any]:
    return {key: value for key, value in record.items() if value is not None}


def game_sort_key(row: dict[str, str]) -> tuple[str, int, str]:
    return (
        first(row, "date", "game_date"),
        to_int(first(row, "game", "game_number")) or 0,
        first(row, "gameid", "game_id"),
    )


def read_lck_rows(csv_path: Path) -> tuple[list[dict[str, str]], int]:
    rows: list[dict[str, str]] = []
    total_rows = 0

    with csv_path.open("r", encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle)

        if not reader.fieldnames:
            raise UpdaterError("Downloaded CSV has no header row.")

        for raw_row in reader:
            total_rows += 1
            row = normalized_header(raw_row)

            if first(row, "league").upper() != "LCK":
                continue

            split = first(row, "split")
            if not split:
                continue

            rows.append(row)

    if not rows:
        raise UpdaterError("No domestic LCK rows found in the Oracle's Elixir CSV.")

    return rows, total_rows


def normalize_rows(rows: list[dict[str, str]]) -> dict[str, list[dict[str, Any]]]:
    games: dict[str, dict[str, Any]] = {}
    teams: dict[str, dict[str, Any]] = {}
    players: dict[str, dict[str, Any]] = {}
    game_team_stats: dict[tuple[str, str], dict[str, Any]] = {}
    game_player_stats: dict[tuple[str, str], dict[str, Any]] = {}
    draft_actions: dict[tuple[str, str, str, int], dict[str, Any]] = {}
    game_player_timeline: dict[tuple[str, str, int], dict[str, Any]] = {}

    for row in rows:
        game_id = first(row, "gameid", "game_id")
        if not game_id:
            continue

        game_number = to_int(first(row, "game", "game_number"))
        game_date = first(row, "date", "game_date")
        games[game_id] = clean_record(
            {
                "game_id": game_id,
                "league": first(row, "league"),
                "split": first(row, "split"),
                "playoffs": to_bool(first(row, "playoffs")),
                "game_date": game_date or None,
                "game_number": game_number,
                "patch": first(row, "patch") or None,
                "game_length_seconds": to_int(
                    first(row, "gamelength", "game_length", "game_length_seconds")
                ),
            }
        )

        team_name = first(row, "teamname", "team")
        team_id = first(row, "teamid", "team_id") or slug_id("team", team_name)
        if team_name:
            teams[team_id] = {"team_id": team_id, "name": team_name}

        position = first(row, "position").lower()
        side = first(row, "side")
        result = to_bool(first(row, "result"))

        if position == TEAM_POSITION:
            game_team_stats[(game_id, team_id)] = clean_record(
                {
                    "game_id": game_id,
                    "team_id": team_id,
                    "side": side,
                    "result": result,
                    "first_pick": to_bool(first(row, "firstpick", "first_pick")),
                    "team_kills": to_int(first(row, "teamkills", "team_kills")),
                    "team_deaths": to_int(first(row, "teamdeaths", "team_deaths")),
                    "first_blood": to_bool(first(row, "firstblood", "first_blood")),
                    "first_dragon": to_bool(first(row, "firstdragon", "first_dragon")),
                    "dragons": to_int(first(row, "dragons")),
                    "opp_dragons": to_int(first(row, "opp_dragons", "oppdragons")),
                    "infernals": to_int(first(row, "infernals")),
                    "mountains": to_int(first(row, "mountains")),
                    "clouds": to_int(first(row, "clouds")),
                    "oceans": to_int(first(row, "oceans")),
                    "chemtechs": to_int(first(row, "chemtechs")),
                    "hextechs": to_int(first(row, "hextechs")),
                    "elders": to_int(first(row, "elders")),
                    "first_herald": to_bool(first(row, "firstherald", "first_herald")),
                    "heralds": to_int(first(row, "heralds")),
                    "void_grubs": to_int(first(row, "voidgrubs", "void_grubs")),
                    "first_baron": to_bool(first(row, "firstbaron", "first_baron")),
                    "barons": to_int(first(row, "barons")),
                    "atakhans": to_int(first(row, "atakhans")),
                    "first_tower": to_bool(first(row, "firsttower", "first_tower")),
                    "towers": to_int(first(row, "towers")),
                    "first_mid_tower": to_bool(
                        first(row, "firstmidtower", "first_mid_tower")
                    ),
                    "first_to_three_towers": to_bool(
                        first(row, "firsttothreetowers", "first_to_three_towers")
                    ),
                    "turret_plates": to_int(first(row, "turretplates", "turret_plates")),
                    "inhibitors": to_int(first(row, "inhibitors")),
                    "total_gold": to_int(first(row, "totalgold", "total_gold")),
                    "earned_gold": to_int(first(row, "earnedgold", "earned_gold")),
                    "gold_spent": to_int(first(row, "goldspent", "gold_spent")),
                }
            )

            for index in range(1, 6):
                ban = first(row, f"ban{index}")
                if ban:
                    draft_actions[(game_id, side, "ban", index)] = {
                        "game_id": game_id,
                        "team_id": team_id,
                        "side": side,
                        "action_type": "ban",
                        "action_order": index,
                        "champion": ban,
                    }

                pick = first(row, f"pick{index}")
                if pick:
                    draft_actions[(game_id, side, "pick", index)] = {
                        "game_id": game_id,
                        "team_id": team_id,
                        "side": side,
                        "action_type": "pick",
                        "action_order": index,
                        "champion": pick,
                    }

        if position in ROLE_POSITIONS:
            player_name = first(row, "playername", "player")
            player_id = first(row, "playerid", "player_id") or slug_id(
                "player", f"{team_name}_{player_name}"
            )

            if player_name:
                players[player_id] = {
                    "player_id": player_id,
                    "name": player_name,
                    "current_team_id": team_id,
                }

            game_player_stats[(game_id, player_id)] = clean_record(
                {
                    "game_id": game_id,
                    "player_id": player_id,
                    "team_id": team_id,
                    "side": side,
                    "position": position,
                    "champion": first(row, "champion") or None,
                    "result": result,
                    "kills": to_int(first(row, "kills")),
                    "deaths": to_int(first(row, "deaths")),
                    "assists": to_int(first(row, "assists")),
                    "double_kills": to_int(first(row, "doublekills", "double_kills")),
                    "triple_kills": to_int(first(row, "triplekills", "triple_kills")),
                    "quadra_kills": to_int(first(row, "quadrakills", "quadra_kills")),
                    "penta_kills": to_int(first(row, "pentakills", "penta_kills")),
                    "damage_to_champions": to_int(
                        first(row, "damagetochampions", "damage_to_champions")
                    ),
                    "dpm": to_float(first(row, "dpm")),
                    "damage_share": to_float(first(row, "damageshare", "damage_share")),
                    "vision_score": to_float(first(row, "visionscore", "vision_score")),
                    "wards_placed": to_float(first(row, "wardsplaced", "wards_placed")),
                    "wards_killed": to_float(first(row, "wardskilled", "wards_killed")),
                    "control_wards_bought": to_float(
                        first(row, "controlwardsbought", "control_wards_bought")
                    ),
                    "total_gold": to_int(first(row, "totalgold", "total_gold")),
                    "earned_gold": to_int(first(row, "earnedgold", "earned_gold")),
                    "gold_spent": to_int(first(row, "goldspent", "gold_spent")),
                    "total_cs": to_int(first(row, "totalcs", "total_cs")),
                    "cspm": to_float(first(row, "cspm")),
                }
            )

            for minute in TIMELINE_MINUTES:
                game_player_timeline[(game_id, player_id, minute)] = clean_record(
                    {
                        "game_id": game_id,
                        "player_id": player_id,
                        "minute": minute,
                        "gold": to_float(first(row, f"goldat{minute}", f"gold_at_{minute}")),
                        "xp": to_float(first(row, f"xpat{minute}", f"xp_at_{minute}")),
                        "cs": to_float(first(row, f"csat{minute}", f"cs_at_{minute}")),
                        "gold_diff": to_float(
                            first(row, f"golddiffat{minute}", f"gold_diff_at_{minute}")
                        ),
                        "xp_diff": to_float(
                            first(row, f"xpdiffat{minute}", f"xp_diff_at_{minute}")
                        ),
                        "cs_diff": to_float(
                            first(row, f"csdiffat{minute}", f"cs_diff_at_{minute}")
                        ),
                    }
                )

    return {
        "games": sorted(games.values(), key=lambda item: item["game_id"]),
        "teams": sorted(teams.values(), key=lambda item: item["team_id"]),
        "players": sorted(players.values(), key=lambda item: item["player_id"]),
        "game_team_stats": list(game_team_stats.values()),
        "game_player_stats": list(game_player_stats.values()),
        "draft_actions": list(draft_actions.values()),
        "game_player_timeline": list(game_player_timeline.values()),
    }


def latest_game_id(rows: list[dict[str, str]]) -> str | None:
    if not rows:
        return None
    return max(rows, key=game_sort_key).get("gameid") or max(rows, key=game_sort_key).get(
        "game_id"
    )


class SupabaseRestClient:
    def __init__(self, url: str, key: str):
        self.base_url = url.rstrip("/") + "/rest/v1"
        self.key = key

    def request(
        self,
        path: str,
        *,
        method: str = "GET",
        query: dict[str, str] | None = None,
        payload: Any | None = None,
        prefer: str | None = None,
    ) -> Any:
        url = f"{self.base_url}/{path.lstrip('/')}"
        if query:
            url += "?" + urllib.parse.urlencode(query, safe=",.*()")

        headers = {
            "apikey": self.key,
            "Authorization": f"Bearer {self.key}",
            "Content-Type": "application/json",
        }
        if prefer:
            headers["Prefer"] = prefer

        data = None if payload is None else json.dumps(payload).encode("utf-8")
        status, body, _ = http_request(url, method=method, headers=headers, data=data)

        if status == 204 or not body:
            return None
        return json.loads(body.decode("utf-8"))

    def upsert(
        self,
        table: str,
        rows: list[dict[str, Any]],
        *,
        conflict_columns: Iterable[str],
        chunk_size: int,
        dry_run: bool,
    ) -> int:
        if not rows:
            return 0

        if dry_run:
            return len(rows)

        query = {"on_conflict": ",".join(conflict_columns)}
        for start in range(0, len(rows), chunk_size):
            chunk = rows[start : start + chunk_size]
            self.request(
                table,
                method="POST",
                query=query,
                payload=chunk,
                prefer="resolution=merge-duplicates,return=minimal",
            )

        return len(rows)

    def insert(
        self,
        table: str,
        rows: list[dict[str, Any]],
        *,
        chunk_size: int,
        dry_run: bool,
    ) -> int:
        if not rows:
            return 0

        if dry_run:
            return len(rows)

        for start in range(0, len(rows), chunk_size):
            chunk = rows[start : start + chunk_size]
            self.request(
                table,
                method="POST",
                payload=chunk,
                prefer="return=minimal",
            )

        return len(rows)

    def delete_by_game_ids(
        self,
        table: str,
        game_ids: list[str],
        *,
        chunk_size: int,
        dry_run: bool,
    ) -> None:
        if dry_run:
            return

        unique_game_ids = sorted(set(game_ids))
        for start in range(0, len(unique_game_ids), chunk_size):
            chunk = unique_game_ids[start : start + chunk_size]
            in_filter = "in.(" + ",".join(quote_postgrest_value(value) for value in chunk) + ")"
            self.request(
                table,
                method="DELETE",
                query={"game_id": in_filter},
                prefer="return=minimal",
            )

    def insert_log(self, log_row: dict[str, Any], *, dry_run: bool) -> None:
        if dry_run:
            return

        try:
            self.request(
                "etl_update_log",
                method="POST",
                payload=log_row,
                prefer="return=minimal",
            )
        except UpdaterError as error:
            print(f"warning: could not write etl_update_log: {error}", file=sys.stderr)

    def latest_loaded_game_id(self) -> str | None:
        try:
            rows = self.request(
                "games",
                query={
                    "select": "game_id",
                    "league": "eq.LCK",
                    "order": "game_date.desc,game_number.desc",
                    "limit": "1",
                },
            )
        except UpdaterError:
            return None

        if isinstance(rows, list) and rows:
            return rows[0].get("game_id")
        return None

    def table_columns(self) -> dict[str, set[str]]:
        return {
            table_name: set(columns.keys())
            for table_name, columns in self.table_metadata().items()
        }

    def table_metadata(self) -> dict[str, dict[str, dict[str, Any]]]:
        schema = self.request("")
        definitions = schema.get("definitions", {}) if isinstance(schema, dict) else {}

        tables: dict[str, dict[str, dict[str, Any]]] = {}
        for table_name, table_schema in definitions.items():
            properties = table_schema.get("properties", {})
            tables[table_name] = properties

        return tables


def filter_rows_to_columns(
    rows: list[dict[str, Any]],
    columns: set[str] | None,
) -> list[dict[str, Any]]:
    if not columns:
        return rows

    return [
        {key: value for key, value in row.items() if key in columns}
        for row in rows
    ]


def make_rows_uniform(rows: list[dict[str, Any]]) -> list[dict[str, Any]]:
    if not rows:
        return rows

    keys = sorted({key for row in rows for key in row})
    return [{key: row.get(key) for key in keys} for row in rows]


def coerce_rows_to_schema(
    rows: list[dict[str, Any]],
    column_metadata: dict[str, dict[str, Any]] | None,
) -> list[dict[str, Any]]:
    if not column_metadata:
        return rows

    coerced_rows: list[dict[str, Any]] = []
    for row in rows:
        coerced: dict[str, Any] = {}
        for key, value in row.items():
            if value is None:
                coerced[key] = None
                continue

            metadata = column_metadata.get(key, {})
            column_type = metadata.get("type")
            column_format = metadata.get("format")

            if column_type == "integer" or column_format == "integer":
                coerced[key] = to_int(value)
            elif column_type == "number" or column_format == "numeric":
                coerced[key] = to_float(value)
            elif column_type == "boolean" or column_format == "boolean":
                coerced[key] = to_bool(value)
            else:
                coerced[key] = value

        coerced_rows.append(coerced)

    return coerced_rows


def quote_postgrest_value(value: str) -> str:
    escaped = value.replace("\\", "\\\\").replace('"', '\\"')
    return f'"{escaped}"'


def should_skip(
    *,
    state: dict[str, Any],
    file_hash: str,
    latest_source_game_id: str | None,
    latest_loaded_game_id: str | None,
    force: bool,
) -> tuple[bool, str]:
    if force:
        return False, "--force was supplied"

    if state.get("sha256") == file_hash:
        return True, "downloaded file hash is unchanged"

    if (
        latest_source_game_id
        and latest_loaded_game_id
        and latest_source_game_id == latest_loaded_game_id
    ):
        return True, "latest source game_id is already loaded"

    return False, "new or changed Oracle's Elixir data detected"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Update lcklytics Supabase tables from Oracle's Elixir CSV."
    )
    parser.add_argument("--source-url", help="Direct CSV or Google Drive download URL.")
    parser.add_argument("--drive-file-id", help="Google Drive file id for the CSV.")
    parser.add_argument(
        "--source-file",
        type=Path,
        help="Use an already downloaded Oracle's Elixir CSV instead of downloading.",
    )
    parser.add_argument("--year", type=int, default=dt.date.today().year)
    parser.add_argument("--downloads-page", default=DEFAULT_DOWNLOADS_PAGE)
    parser.add_argument("--state-path", type=Path, default=DEFAULT_STATE_PATH)
    parser.add_argument("--raw-dir", type=Path, default=DEFAULT_RAW_DIR)
    parser.add_argument("--chunk-size", type=int, default=500)
    parser.add_argument("--force", action="store_true")
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument(
        "--keep-raw",
        action="store_true",
        help="Keep the downloaded source CSV under data/raw.",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    env = load_env()

    supabase_url = get_env(env, "SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_URL")
    supabase_key = get_env(
        env,
        "SUPABASE_SECRET_KEY",
        "SUPABASE_SERVICE_ROLE_KEY",
        "SUPABASE_SERVICE_KEY",
    )
    if not supabase_url or not supabase_key:
        raise UpdaterError(
            "Set SUPABASE_URL and SUPABASE_SECRET_KEY. "
            "A legacy SUPABASE_SERVICE_ROLE_KEY also works, but the anon key is "
            "intentionally not used for write upserts."
        )

    with tempfile.TemporaryDirectory() as temp_dir_name:
        temp_dir = Path(temp_dir_name)

        if args.source_file:
            csv_path = args.source_file.resolve()
            if not csv_path.exists():
                raise UpdaterError(f"Source file does not exist: {csv_path}")
            source_url = str(csv_path)
        else:
            source_url = resolve_source_url(args, env)
            csv_path = temp_dir / f"{args.year}_oracles_elixir.csv"
            print(f"downloading Oracle's Elixir CSV from {source_url}")
            download_to_file(source_url, csv_path)

        raise_if_not_csv(csv_path, source_url)
        file_hash = sha256_file(csv_path)
        lck_rows, total_rows = read_lck_rows(csv_path)
        latest_source_game_id = latest_game_id(lck_rows)

        client = SupabaseRestClient(supabase_url, supabase_key)
        state = read_state(args.state_path)
        latest_loaded_game_id = client.latest_loaded_game_id()
        skip, reason = should_skip(
            state=state,
            file_hash=file_hash,
            latest_source_game_id=latest_source_game_id,
            latest_loaded_game_id=latest_loaded_game_id,
            force=args.force,
        )

        if skip:
            print(f"no-op: {reason}")
            source_file_for_log = str(csv_path) if args.source_file else csv_path.name
            client.insert_log(
                {
                    "source": "oracles_elixir",
                    "source_url": source_url,
                    "source_file": source_file_for_log,
                    "file_sha256": file_hash,
                    "latest_game_id": latest_source_game_id,
                    "rows_downloaded": total_rows,
                    "rows_lck": len(lck_rows),
                    "status": "skipped",
                    "message": reason,
                    "updated_at": dt.datetime.now(dt.UTC).isoformat(),
                },
                dry_run=args.dry_run,
            )
            return 0

        normalized = normalize_rows(lck_rows)
        table_metadata = client.table_metadata()
        table_columns = {
            table_name: set(columns.keys())
            for table_name, columns in table_metadata.items()
        }
        conflict_keys = {
            "games": ("game_id",),
            "teams": ("team_id",),
            "players": ("player_id",),
            "game_team_stats": ("game_id", "team_id"),
            "game_player_stats": ("game_id", "player_id"),
            "draft_actions": ("game_id", "side", "action_type", "action_order"),
            "game_player_timeline": ("game_id", "player_id", "minute"),
        }

        counts: dict[str, int] = {}
        started = time.time()

        for table in (
            "games",
            "teams",
            "players",
            "game_team_stats",
            "game_player_stats",
            "draft_actions",
            "game_player_timeline",
        ):
            available_columns = table_columns.get(table)
            missing_conflict_columns = [
                column
                for column in conflict_keys[table]
                if available_columns and column not in available_columns
            ]
            if missing_conflict_columns:
                raise UpdaterError(
                    f"{table} is missing expected conflict column(s): "
                    + ", ".join(missing_conflict_columns)
                )

            rows = make_rows_uniform(
                coerce_rows_to_schema(
                    filter_rows_to_columns(normalized[table], available_columns),
                    table_metadata.get(table),
                )
            )

            if table == "draft_actions":
                client.delete_by_game_ids(
                    table,
                    [row["game_id"] for row in normalized["games"]],
                    chunk_size=args.chunk_size,
                    dry_run=args.dry_run,
                )
                counts[table] = client.insert(
                    table,
                    rows,
                    chunk_size=args.chunk_size,
                    dry_run=args.dry_run,
                )
                action = "would replace" if args.dry_run else "replaced"
            else:
                counts[table] = client.upsert(
                    table,
                    rows,
                    conflict_columns=conflict_keys[table],
                    chunk_size=args.chunk_size,
                    dry_run=args.dry_run,
                )
                action = "would upsert" if args.dry_run else "upserted"

            print(f"{action} {counts[table]} {table}")

        raw_copy: Path | None = None
        if args.keep_raw and not args.source_file:
            args.raw_dir.mkdir(parents=True, exist_ok=True)
            raw_copy = args.raw_dir / f"{args.year}_oracles_elixir_{file_hash[:12]}.csv"
            shutil.copy2(csv_path, raw_copy)

        finished_at = dt.datetime.now(dt.UTC).isoformat()
        if raw_copy:
            source_file_for_log = str(raw_copy)
        elif args.source_file:
            source_file_for_log = str(csv_path)
        else:
            source_file_for_log = csv_path.name

        log_row = {
            "source": "oracles_elixir",
            "source_url": source_url,
            "source_file": source_file_for_log,
            "file_sha256": file_hash,
            "latest_game_id": latest_source_game_id,
            "rows_downloaded": total_rows,
            "rows_lck": len(lck_rows),
            "games_upserted": counts["games"],
            "teams_upserted": counts["teams"],
            "players_upserted": counts["players"],
            "game_team_stats_upserted": counts["game_team_stats"],
            "game_player_stats_upserted": counts["game_player_stats"],
            "draft_actions_upserted": counts["draft_actions"],
            "game_player_timeline_upserted": counts["game_player_timeline"],
            "status": "dry_run" if args.dry_run else "success",
            "message": f"completed in {time.time() - started:.1f}s",
            "updated_at": finished_at,
        }
        client.insert_log(log_row, dry_run=args.dry_run)

        if not args.dry_run:
            write_state(
                args.state_path,
                {
                    "sha256": file_hash,
                    "latest_game_id": latest_source_game_id,
                    "source_url": source_url,
                    "source_file": source_file_for_log,
                    "updated_at": finished_at,
                    "counts": counts,
                },
            )

        print("update complete")
        return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except UpdaterError as error:
        print(f"error: {error}", file=sys.stderr)
        raise SystemExit(1)

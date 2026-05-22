#!/usr/bin/env python3
"""
Upload the verified CDS/Supabase-shaped schools CSV into Supabase.

This script updates only the existing schools-table columns represented in
supabase_schools_cds_import.csv. Empty CSV cells are sent as nulls.
"""

from __future__ import annotations

import csv
import json
import os
import re
from pathlib import Path
from typing import Any

from supabase import create_client


ROOT = Path(__file__).resolve().parents[1]
CSV_PATH = ROOT / "TransferSpace_Backend" / "supabase_schools_cds_import.csv"

ARRAY_COLUMNS = {"popular_majors"}
BOOLEAN_COLUMNS = {
    "is_need_blind",
    "accepts_transfer_summer",
    "accepts_transfer_winter",
    "accepts_fall",
    "accepts_spring",
}
INTEGER_COLUMNS = {
    "id",
    "undergrad_population",
    "tuition_in_state",
    "tuition_out_of_state",
    "app_fee",
    "max_credits_accepted",
    "residency_credits_required",
    "min_credits_required",
}
FLOAT_COLUMNS = {
    "acceptance_rate_transfer",
    "avg_gpa_transfer",
    "min_gpa",
    "in_state_min_GPA",
}


def read_supabase_credentials() -> tuple[str, str]:
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_KEY") or os.getenv("SUPABASE_KEY")
    if url and key:
        return url, key

    scanner = ROOT / "TransferSpace_Backend" / "CDS_Scanner.py"
    text = scanner.read_text()
    url_match = re.search(r'SUPABASE_URL\s*=\s*"([^"]+)"', text)
    key_match = re.search(r'SUPABASE_KEY\s*=\s*"([^"]+)"', text)
    if not url_match or not key_match:
        raise RuntimeError("Set SUPABASE_URL and SUPABASE_SERVICE_KEY before running.")
    return url_match.group(1), key_match.group(1)


def parse_cell(column: str, value: str) -> Any:
    value = (value or "").strip()
    if value == "":
        return None
    if column in ARRAY_COLUMNS:
        return json.loads(value)
    if column in BOOLEAN_COLUMNS:
        return value.lower() == "true"
    if column in INTEGER_COLUMNS:
        return int(float(value))
    if column in FLOAT_COLUMNS:
        return float(value)
    return value


def main() -> int:
    with CSV_PATH.open() as file:
        rows = [
            {column: parse_cell(column, value) for column, value in row.items()}
            for row in csv.DictReader(file)
        ]

    url, key = read_supabase_credentials()
    supabase = create_client(url, key)
    for start in range(0, len(rows), 25):
        chunk = rows[start : start + 25]
        supabase.table("schools").upsert(chunk, on_conflict="id").execute()
        print(f"Uploaded rows {start + 1}-{start + len(chunk)}")

    print(f"Uploaded {len(rows)} schools from {CSV_PATH}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
update_transfer_gpas.py

Pushes a small, hand-curated set of mid-50% transfer GPA values into the
`schools` table on Supabase. Only the `avg_gpa_transfer` column is touched —
the schema is not changed. Run this once after pulling new data; the website
reads these values back via loadSchoolsFromDB() in index.html.

Usage:
    python3 update_transfer_gpas.py
"""

import os
from supabase import create_client

# --- CONFIGURATION ---
# Same project as the existing seed scripts.
SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_KEY"]

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# Mid-point of each published Mid-50% Transfer GPA range.
# Format: { ipeds_id : (display_name, avg_gpa_transfer) }
TRANSFER_GPAS = {
    "166683": ("MIT",                                3.95),  # 3.9 – 4.0
    "166027": ("Harvard",                            3.95),  # 3.9+
    "243744": ("Stanford",                           3.95),  # 3.95+
    "130794": ("Yale",                               3.95),  # 3.9 – 4.0
    "198419": ("Duke",                               3.95),  # 3.9 – 4.0
    "110662": ("UCLA",                               3.87),  # 3.74 – 4.00
    "110635": ("UC Berkeley",                        3.79),  # 3.61 – 3.96
    "170976": ("University of Michigan-Ann Arbor",   3.85),  # 3.8 – 3.9
    "228778": ("UT Austin",                          3.83),  # 3.75 – 3.9
    "164988": ("Boston University",                  3.70),  # 3.6 – 3.8
}


def update_transfer_gpas():
    print(f"Updating avg_gpa_transfer for {len(TRANSFER_GPAS)} schools...\n")
    ok, fail = 0, 0
    for ipeds_id, (name, gpa) in TRANSFER_GPAS.items():
        try:
            response = (
                supabase.table("schools")
                .update({"avg_gpa_transfer": gpa})
                .eq("id", ipeds_id)
                .execute()
            )
            # supabase-py returns the updated rows in response.data
            if response.data:
                print(f"  OK   {ipeds_id}  {name:<35}  -> {gpa}")
                ok += 1
            else:
                print(f"  MISS {ipeds_id}  {name:<35}  (no row matched this id)")
                fail += 1
        except Exception as e:
            print(f"  ERR  {ipeds_id}  {name:<35}  {e}")
            fail += 1

    print(f"\nDone. {ok} updated, {fail} skipped.")


if __name__ == "__main__":
    update_transfer_gpas()

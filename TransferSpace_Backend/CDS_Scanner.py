#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Created on Mon Apr 20 12:59:44 2026

@author: jacksoncollins
"""

import os
import pandas as pd
from supabase import create_client

# --- CONFIGURATION ---
SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_KEY"]
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

def upload_transfer_data_from_text():
    try:
        # 1. Load the text file (formatted as a CSV)
        # We use skipinitialspace=True to handle cases like "ID, Name"
        df = pd.read_csv('CDS.txt', skipinitialspace=True)
        
        # 2. Basic Cleanup
        # Replace 0 with None so we don't upload '0' for missing data
        df = df.replace(0, None)
        
        # Ensure column names are clean (no trailing spaces)
        df.columns = df.columns.str.strip()

        for _, row in df.iterrows():
            # Prepare data to match your Supabase columns
            update_payload = {
                "acceptance_rate_transfer": row['acceptance_rate_transfer'] / 100 if row['acceptance_rate_transfer'] else None,
                "max_credits_accepted": row['max_credits_accepted'],
                "residency_credits_required": row['residency_credits_required']
            }

            # Filter out None values to prevent overwriting existing data with nulls
            clean_payload = {k: v for k, v in update_payload.items() if v is not None}

            if not clean_payload:
                continue

            # 3. Update by ID
            supabase.table("schools").update(clean_payload).eq("id", str(row['id'])).execute()
            print(f"✅ Updated: {row['name']}")

    except FileNotFoundError:
        print("❌ Error: 'CDS.txt' not found. Make sure it's in the same folder as this script.")
    except Exception as e:
        print(f"❌ An error occurred: {e}")

if __name__ == "__main__":
    upload_transfer_data_from_text()
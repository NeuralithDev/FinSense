#!/usr/bin/env python3
"""
Convert large raw CSV files to Parquet format for fast loading.
Run ONCE: python scripts/convert_to_parquet.py
After this, all notebooks load data in ~2s instead of 25+ minutes.
"""
import pandas as pd
from pathlib import Path
import time, sys

import pyarrow as pa
import pyarrow.parquet as pq

ROOT = Path(__file__).parent.parent
RAW  = ROOT / "data" / "raw"
PROC = ROOT / "data" / "processed"
PROC.mkdir(parents=True, exist_ok=True)


def is_dataless(path: Path) -> bool:
    """Check if file is an evicted macOS APFS dataless stub (0 blocks on disk)."""
    try:
        st = path.stat()
        return bool(getattr(st, "st_flags", 0) & 0x40000000) or (st.st_blocks == 0 and st.st_size > 0)
    except Exception:
        return False


FILES = [
    (RAW / "financial" / "cleaned_financial_data.csv",          PROC / "financial.parquet",        None),
    (RAW / "paysim"    / "PaySim.csv",                          PROC / "paysim.parquet",           None),
    (RAW / "IBM"       / "credit_card_transactions-ibm_v2.csv", PROC / "ibm_transactions.parquet", RAW / "IBM" / "User0_credit_card_transactions.csv"),
]

def convert(csv_path, parquet_path, chunk_size=100_000, max_retries=3):
    size_mb = csv_path.stat().st_size / (1024**2)
    print(f"\n→ Converting {csv_path.name}  ({size_mb:.0f} MB) ...")
    t0 = time.time()

    total_rows = 0
    writer = None

    for attempt in range(1, max_retries + 1):
        try:
            total_rows = 0
            writer = None
            for chunk in pd.read_csv(csv_path, chunksize=chunk_size, low_memory=False,
                                     encoding='utf-8', on_bad_lines='skip'):
                table = pa.Table.from_pandas(chunk, preserve_index=False)
                if writer is None:
                    writer = pq.ParquetWriter(parquet_path, table.schema, compression='snappy')
                writer.write_table(table)
                total_rows += len(chunk)
                elapsed = time.time() - t0
                speed = total_rows / elapsed if elapsed > 0 else 0
                print(f"   {total_rows:>10,} rows  |  {elapsed:.0f}s  |  {speed:,.0f} rows/s", end="\r")
            if writer:
                writer.close()
            break  # success
        except OSError as e:
            if writer:
                writer.close()
            print(f"\n   ⚠️  Attempt {attempt}/{max_retries} failed: {e}")
            if attempt == max_retries:
                print(f"   ❌ Failed after {max_retries} attempts. Skipping.")
                return False
            print(f"   Retrying in 3s...")
            time.sleep(3)

    parquet_mb = parquet_path.stat().st_size / (1024**2) if parquet_path.exists() else 0
    elapsed = time.time() - t0
    print(f"\n   ✅ Done in {elapsed:.0f}s  |  {size_mb:.0f} MB CSV → {parquet_mb:.0f} MB Parquet  ({total_rows:,} rows)")
    return True

for csv_path, parquet_path, fallback_path in FILES:
    target_csv = csv_path
    if is_dataless(target_csv):
        print(f"⚠️  Dataless/evicted iCloud file: {target_csv.name}")
        if fallback_path and fallback_path.exists() and not is_dataless(fallback_path):
            print(f"   Using local sample fallback: {fallback_path.name}")
            target_csv = fallback_path
        else:
            print(f"   Skipping {target_csv.name} (file not materialized locally)")
            continue

    if not target_csv.exists():
        print(f"SKIP (not found): {target_csv.name}")
        continue
    if parquet_path.exists():
        print(f"SKIP (already done): {parquet_path.name}")
        continue
    convert(target_csv, parquet_path)

print("\n✅ All done! Your notebooks will now load data in ~2 seconds.")

#!/usr/bin/env python3
"""Treat modern-entry-points.csv as golden. Rewire official CIP names into
the original unobvious-paths.json / unobvious-paths.csv, and fold remaining
into the same titles."""

from __future__ import annotations

import csv
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MODERN = ROOT / "modern-entry-points.csv"
REMAINING = ROOT / "remaining-entry-points.csv"
MAJORS = ROOT / "public/data/majors.json"
OCCUPATIONS = ROOT / "public/data/occupations.json"
PATHS_JSON = ROOT / "public/data/unobvious-paths.json"
PATHS_CSV = ROOT / "unobvious-paths.csv"


def money(n: str) -> str:
    return f"${int(n):,}"


def why(trad: str, low: str, high: str) -> str:
    return (
        f"Typical first-two-years range {money(low)} to {money(high)}. "
        f"Not the {trad} seat."
    )


def main() -> None:
    majors = {m["cip"]: m for m in json.loads(MAJORS.read_text())}
    occs = json.loads(OCCUPATIONS.read_text())
    occ_by_title = {re.sub(r"[^a-z0-9]+", " ", o["title"].lower()).strip(): o["soc"] for o in occs}

    modern = {r["cip_code"]: r for r in csv.DictReader(MODERN.open(encoding="utf-8"))}
    remaining = {r["cip"]: r for r in csv.DictReader(REMAINING.open(encoding="utf-8"))}
    orig_rows = list(csv.DictReader(PATHS_CSV.open(encoding="utf-8")))
    orig_by_cip = {r["cip"]: r for r in orig_rows}

    missing = sorted(set(modern) - set(majors))
    extra = sorted(set(remaining) - set(modern))
    if missing or extra:
        raise SystemExit(f"CIP mismatch modern-only={missing} remaining-only={extra}")

    combined = []
    cip6 = []
    for cip in sorted(modern):
        g = modern[cip]
        official = majors[cip]["name"].rstrip(".").strip()
        category = majors[cip].get("category") or remaining[cip]["category"]
        prev = orig_by_cip[cip]
        trad = g["traditional_entry_point"].strip()
        jobs = [
            g["new_entry_point_1"].strip(),
            g["new_entry_point_2"].strip(),
            g["new_entry_point_3"].strip(),
        ]
        job_why = why(trad, g["new_entry_wage_low_usd"], g["new_entry_wage_high_usd"])
        job_rows = []
        for title in jobs:
            key = re.sub(r"[^a-z0-9]+", " ", title.lower()).strip()
            soc = occ_by_title.get(key)
            job_rows.append({"title": title, "why": job_why, "soc": soc})

        family = prev.get("family") or "other"
        combined.append(
            {
                "cip": cip,
                "major": official,
                "category": category,
                "traditional": trad,
                "new_1": jobs[0],
                "why_1": job_why,
                "new_2": jobs[1],
                "why_2": job_why,
                "new_3": jobs[2],
                "why_3": job_why,
                "traditional_wage": g["traditional_entry_median_wage_usd"],
                "new_wage_low": g["new_entry_wage_low_usd"],
                "new_wage_high": g["new_entry_wage_high_usd"],
            }
        )
        cip6.append(
            {
                "cip": cip,
                "family": family,
                "major": official,
                "not": trad,
                "jobs": job_rows,
                "rank": 0,
                "enroll": 0,
            }
        )

        prev["major"] = official
        prev["category"] = category
        prev["source"] = "cip6"
        prev["path_label"] = official
        prev["traditional_entry"] = trad
        prev["job_1"] = jobs[0]
        prev["why_1"] = job_why
        prev["soc_1"] = job_rows[0]["soc"] or ""
        prev["job_2"] = jobs[1]
        prev["why_2"] = job_why
        prev["soc_2"] = job_rows[1]["soc"] or ""
        prev["job_3"] = jobs[2]
        prev["why_3"] = job_why
        prev["soc_3"] = job_rows[2]["soc"] or ""

    # Official names back onto the golden file
    modern_fields = [
        "cip_code",
        "major",
        "cip_family",
        "traditional_entry_point",
        "traditional_entry_median_wage_usd",
        "new_entry_point_1",
        "new_entry_point_2",
        "new_entry_point_3",
        "new_entry_wage_low_usd",
        "new_entry_wage_high_usd",
        "wage_lift_at_midpoint_usd",
        "wage_source",
    ]
    modern_out = []
    for cip in sorted(modern):
        row = dict(modern[cip])
        row["major"] = majors[cip]["name"].rstrip(".").strip()
        row["cip_family"] = majors[cip].get("category") or row["cip_family"]
        modern_out.append(row)
    with MODERN.open("w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=modern_fields, extrasaction="ignore")
        w.writeheader()
        w.writerows(modern_out)

    rem_fields = [
        "cip",
        "major",
        "category",
        "traditional",
        "new_1",
        "why_1",
        "new_2",
        "why_2",
        "new_3",
        "why_3",
        "traditional_wage",
        "new_wage_low",
        "new_wage_high",
    ]
    with REMAINING.open("w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=rem_fields, extrasaction="ignore")
        w.writeheader()
        w.writerows(combined)

    csv_fields = list(orig_rows[0].keys())
    with PATHS_CSV.open("w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=csv_fields, extrasaction="ignore")
        w.writeheader()
        w.writerows(orig_rows)

    data = json.loads(PATHS_JSON.read_text())
    data["source"] = (
        "NSC Final Fall Enrollment Trends 2025 for the top-50 4-digit CIP families; "
        "220 remaining health / business / history majors use modern-entry-points.csv "
        "(golden, exact CIP). Other majors inherit a 2-digit CIP fallback. "
        "Doors are editorial; soc is a BLS match when the door is the same occupation. "
        "Traditional entry on fallbacks is taken from that major's CIP-SOC primary occupations."
    )
    data["cip6"] = cip6
    PATHS_JSON.write_text(json.dumps(data, indent=2) + "\n", encoding="utf-8")

    print(f"cip6={len(cip6)} remaining={len(combined)} modern_names_rewired={len(modern_out)}")
    sample = next(x for x in cip6 if x["cip"] == "51.1801")
    print("51.1801", sample["not"], "→", [j["title"] for j in sample["jobs"]])
    cs = orig_by_cip["11.0701"]
    print("11.0701 source", cs["source"], cs["traditional_entry"], "→", cs["job_1"])


if __name__ == "__main__":
    main()

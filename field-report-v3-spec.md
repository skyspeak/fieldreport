# Field Report v2: Employer Layer

Build spec. Target: Next.js App Router, Postgres, Vercel.

New route: `/results/[cip]/[zip]`. The existing `/results/[cip]` stays and redirects to a zip prompt.

Three features ship on this route:

1. **Nine Names** — employers hiring your major in your metro
2. **Five Years Out** — what the job becomes, and whether you have to leave to get there
3. **The Door** — whether AI is closing entry to this field, and who is still opening it

---

## 0. Decisions already made

These were open. They are now closed. Do not re-litigate them in code review.

| Question | Decision |
|---|---|
| What if a metro returns fewer than 5 employers? | Page does not die. Widen to adjacent CBSAs, label the widening, and surface the metro comparison as the primary action. See §4.4. |
| Rank employers by pay or by employer count? | Neither. Rank by hiring intensity, then entry badge, then core-role flag, then distance. Pay is not available per company. See §4.3. |
| Does an unrated company read as bad? | Only rated companies appear. There is no "unrated" row and no implied ranking of absent firms. Every list carries the coverage line in §7.2. |
| Is zip the right single input? | Yes, plus a city switcher that writes a new zip. No autocomplete, no map, no geocoder. |
| Which number is the share card? | The funnel: total rated → rated in your field → hiring in your metro. See §5.1. |
| Can we name companies? | Gated behind `FEATURE_NAMED_EMPLOYERS`. Off by default. When off, the page renders counts and badge distribution with names redacted. Build both states. |
| Who owns the occupation names shown to a user? | We do. `display_group` overrides vendor `cluster_name` on every user-facing surface. See §2.3. |

---

## 1. What the sample data changed

Read this before writing the join. It is not what the earlier design assumed.

`occupation_clusters` contains 1,016 rows, 1,016 distinct `onet_code`, 882 distinct `cluster_id`. Of the 882 clusters, 780 contain exactly one occupation. The largest contains 8.

**The cluster layer is a relabeling, not a grouping.** Consolidation is about 13%.

Consequence: a single CIP fans out much wider than expected. CIP 11.0701 (Computer Science) maps through CIP-SOC to roughly 17 SOC codes, which map to 32 O*NET codes, which land in **26 distinct clusters**. A page cannot list 26 occupations.

Second finding: 64 SOC codes span more than one cluster. `15-1299` alone splits into nine, including Blockchain Engineers, Penetration Testers, and Web Administrators. OEWS publishes wages at the 6-digit SOC level only, so all nine share one wage row. Averaging cluster-level wages without SOC-weighting produces a number that means nothing.

Third finding, a bug: the 8/11/26 xlsx is encoding-corrupted. Fourteen `cluster_name` values lost their em dash to mojibake (`K–12` became `K\u00e2\u0080\u009312`). That column is an indexed join key. The 12/4/25 CSV is clean. It also carries two columns the xlsx dropped: `consolidated_title` and `cluster_occs`.

**Ingest the 12/4/25 CSV. Do not ingest the xlsx.** File the encoding bug with the vendor.

---

## 2. Data model

### 2.1 Tables to load

| Table | Source | Notes |
|---|---|---|
| `cip_soc` | NCES CIP-SOC 2020 crosswalk | 6-digit CIP 2020 to 6-digit SOC 2018 |
| `soc_onet` | O*NET-SOC 2019 crosswalk | 6-digit SOC 2018 to 8-digit O*NET-SOC |
| `occupation_clusters` | vendor CSV 12/4/25 | 1,016 rows, keep all five columns |
| `location_mapping` | vendor | zip, cbsa, cbsa_name, msa_size |
| `hiring_flag` | vendor | company × cluster × cbsa |
| `company_occupation_summary` | vendor | badges per company × cluster |
| `companies` | vendor | includes `company_event_type` |
| `company_aliases` | vendor | brand name resolution |
| `promotion_retention` | vendor | cluster × experience_level × msa_size |
| `occupation_info` | vendor | destination clusters, ba_plus_share, job_level |
| `ai_expertise_impact` | vendor | source of truth for AI flags |
| `wage_data` | vendor | cluster × msa_size, coarse |
| `oews` | BLS OEWS May 2025 | soc × cbsa, p25/median/p75 |
| `bls_ep` | BLS Employment Projections 2024–34 | soc, growth openings, replacement openings |
| `bea_rpp` | BEA Regional Price Parities | cbsa, all-items index |

### 2.2 Type harmonization

Two known landmines in the vendor schema. Fix them in the ingest layer, not at query time.

```sql
-- hiring_flag.cbsa is INT; location_mapping.cbsa is VARCHAR(20).
-- Normalize both to TEXT of 5 numeric chars during load.
ALTER TABLE hiring_flag ALTER COLUMN cbsa TYPE text USING lpad(cbsa::text, 5, '0');

-- postings_count_qtile carries different meanings in two tables.
-- Rename on load so it is impossible to confuse.
ALTER TABLE hiring_flag
  RENAME COLUMN postings_count_qtile TO hiring_intensity;  -- 0/1/2
ALTER TABLE company_occupation_summary
  RENAME COLUMN postings_count_qtile TO postings_quintile; -- 1..5
```

Add a CI assertion that fails if either original name reappears.

### 2.3 New table: `display_group`

This is the layer that makes the page readable. Owned by us, not the vendor.

```sql
CREATE TABLE display_group (
  display_group_id   serial PRIMARY KEY,
  display_name       text NOT NULL,   -- what a 22-year-old would call it
  display_blurb      text,            -- one line, plain English
  sort_hint          int DEFAULT 100
);

CREATE TABLE display_group_cluster (
  display_group_id   int REFERENCES display_group(display_group_id),
  cluster_id         int NOT NULL,
  PRIMARY KEY (display_group_id, cluster_id)
);
```

Rules:

- Every `cluster_id` reachable from a supported CIP must map to exactly one `display_group_id`.
- A page renders at most **4** display groups. If a CIP produces more, keep the top 4 by employer count and roll the remainder into a "Related roles" disclosure.
- `display_name` never renders vendor `cluster_name` directly. The vendor name appears only inside the receipts panel.

Seed for CIP 11.0701 (all 26 clusters accounted for):

| display_group | cluster_ids | display_name |
|---|---|---|
| 1 | 187, 891, 1001, 1000, 993, 103 | Software engineering |
| 2 | 242, 118, 159, 243, 245 | Data and analytics |
| 3 | 189, 190, 260, 718, 182, 183, 655, 191 | Security and infrastructure |
| 4 | 193, 510, 192, 186, 266, 440, 457 | Technical management and specialist |

Build a seeding script that emits a review CSV for any CIP with unmapped clusters. Do not auto-assign.

### 2.4 The resolution view

```sql
CREATE MATERIALIZED VIEW cip_cluster AS
SELECT DISTINCT
  cs.cip_code,
  oc.cluster_id,
  oc.cluster_name       AS vendor_cluster_name,
  oc.consolidated_title,
  so.soc_code,
  dgc.display_group_id
FROM cip_soc cs
JOIN soc_onet so            ON so.soc_code = cs.soc_code
JOIN occupation_clusters oc ON oc.onet_code = so.onet_code
LEFT JOIN display_group_cluster dgc ON dgc.cluster_id = oc.cluster_id;

CREATE INDEX ON cip_cluster (cip_code);
```

One SOC can produce several clusters. One cluster can arrive via several SOCs. `DISTINCT` matters. Keep `soc_code` on the row because OEWS and EP join on it, not on cluster.

---

## 3. Route and API

### 3.1 Route

`app/results/[cip]/[zip]/page.tsx` — server component, statically renderable per (cip, zip) pair with `revalidate: 86400`.

Validation:

- `cip` matches `^\d{2}\.\d{4}$`. Otherwise 404.
- `zip` matches `^\d{5}$`. Otherwise redirect to `/results/[cip]` with the zip prompt.
- Zip not in `location_mapping` → render the "we do not cover that area" state, §7.3. Do not 404.

### 3.2 Single data function

One server function, one round trip budget. No client fetching for first paint.

```ts
type FieldReport = {
  cip: { code: string; title: string };
  place: { zip: string; cbsa: string; cbsaName: string; msaSize: 'Large' | 'Small/Medium' };
  funnel: { totalRated: number; ratedInField: number; hiringHere: number };
  groups: DisplayGroup[];        // max 4
  employers: Employer[];         // §4
  destinations: Destination[];   // §5
  door: Door;                    // §6
  metros: MetroOption[];         // §7.1
  coverage: CoverageNote;        // §7.2
  radiusExpanded: boolean;       // §4.4
};
```

---

## 4. Feature 1: Nine Names

### 4.1 Query

```sql
WITH clusters AS (
  SELECT cluster_id, display_group_id FROM cip_cluster WHERE cip_code = $1
),
place AS (
  SELECT cbsa, msa_size FROM location_mapping WHERE zip = $2 LIMIT 1
)
SELECT
  c.company_uid,
  c.company_name,
  c.company_url,
  c.primary_industry,
  cos.cluster_id,
  cl.display_group_id,
  cos.badge_early_career,
  cos.badge_growth,
  cos.badge_stability,
  cos.top10_occupation,
  hf.hiring_intensity
FROM hiring_flag hf
JOIN clusters cl                     ON cl.cluster_id = hf.cluster_id
JOIN place p                         ON p.cbsa = hf.cbsa
JOIN companies c                     ON c.company_uid = hf.company_uid
LEFT JOIN company_occupation_summary cos
       ON cos.company_uid = hf.company_uid AND cos.cluster_id = hf.cluster_id
WHERE hf.hiring_intensity IN ('1','2')
  AND cos.badge_early_career IS NOT NULL
  AND (c.company_event_type IS NULL OR c.company_event_type = '');
```

### 4.2 Deduplication

A company can appear once per cluster. Collapse to one row per `company_uid`:

- Keep the highest `hiring_intensity` across its clusters.
- Keep the best `badge_early_career` (Platinum > Gold).
- `top10_occupation = 'Yes'` if any matching cluster says yes.
- Attach the set of `display_group_id` values it matched. The UI shows the group names as sublabels.

### 4.3 Ranking

Deterministic. No weighted score, no tuning knob.

```
ORDER BY
  hiring_intensity DESC,                       -- 2 before 1
  (badge_early_career = 'Platinum') DESC,
  (top10_occupation = 'Yes') DESC,
  matched_cluster_count DESC,
  company_name ASC                             -- stable tiebreak
```

Pay does not enter the ranking. There is no per-company wage in this dataset and inferring one from OEWS would be fabrication.

### 4.4 Thin results

Count rows after dedup.

| Count | Behavior |
|---|---|
| ≥ 6 | Normal render. Show all, cap the initial view at 12 with "show all". |
| 3 to 5 | Normal render. Append the widening block below the list. |
| 1 to 2 | Render what exists. Auto-expand to adjacent CBSAs in the same state, set `radiusExpanded = true`, label every added row with its metro name. |
| 0 | No employer section. Lead with the metro comparison (§7.1) under the heading "Where this degree is hiring". |

Adjacent CBSA set: precompute a `cbsa_neighbors` table from centroid distance, capped at 90 miles. Do not compute at request time.

### 4.5 Component

`<EmployerTable>` — server-rendered rows, client island for filters only.

Columns on desktop: Company / Field / Entry rating / Hiring / Distance. On mobile, stack with inline labels.

Filters, client-side over the already-loaded set, no refetch:

- Core role only → `top10_occupation = 'Yes'`
- Platinum only → `badge_early_career = 'Platinum'`
- One chip per display group present

Filter state goes in the URL as a query string so a filtered list is shareable.

Instrument every chip press. Which chip gets pressed is the ranking answer we do not have yet.

---

## 5. Feature 2: Five Years Out

### 5.1 Funnel

Three counts, computed once, rendered above the fold. This is the share card.

```sql
-- totalRated
SELECT count(*) FROM companies WHERE overall_badge IS NOT NULL;
-- ratedInField
SELECT count(DISTINCT company_uid) FROM company_occupation_summary
 WHERE cluster_id IN (SELECT cluster_id FROM cip_cluster WHERE cip_code = $1)
   AND badge_early_career IS NOT NULL;
-- hiringHere = length of the deduped employer list
```

Render as three numbers with a proportional bar. The third is the accent color. Do not animate on reduced motion.

### 5.2 Destinations

For each display group, take its clusters, pull destinations, roll up.

```sql
SELECT oi.cluster_id AS from_cluster,
       d.dest_cluster_id,
       oc.cluster_name AS dest_vendor_name,
       dgc.display_group_id AS dest_display_group
FROM occupation_info oi
CROSS JOIN LATERAL (VALUES
  (oi.cluster_id_destination_1),
  (oi.cluster_id_destination_2),
  (oi.cluster_id_destination_3)) AS d(dest_cluster_id)
JOIN occupation_clusters oc ON oc.cluster_id = d.dest_cluster_id
LEFT JOIN display_group_cluster dgc ON dgc.cluster_id = d.dest_cluster_id
WHERE oi.cluster_id = ANY($1) AND d.dest_cluster_id IS NOT NULL;
```

Rank destinations by how many source clusters point at them. Show the top 3 per display group. Drop any destination that is itself in the source display group, since "Software engineering leads to software engineering" is noise.

### 5.3 The promotion split

This is the differentiated number. It is the reason to build this at all.

```sql
SELECT cluster_id,
       internal_promotion_rate,
       external_promotion_rate,
       retention_rate_3yr
FROM promotion_retention
WHERE cluster_id = ANY($1)
  AND experience_level = 'Entry'
  AND msa_size = $2;
```

Aggregate across a display group by simple mean, weighted by nothing. State that in the receipts.

Render one line per display group:

> **Software engineering.** 34% move up without changing employer. 21% have to leave to move up.

Copy rules:

| Condition | Line |
|---|---|
| internal > external by ≥ 5pts | "Most people who move up here do it without changing employer." |
| within 5pts either way | "Moving up and moving on are about equally common." |
| external > internal by ≥ 5pts | "More people move up by leaving than by staying." |

Never say "good" or "bad." The third case is not a warning, it is how consulting and agencies work.

### 5.4 Outlook and pay

Join at the SOC level, not the cluster level.

```sql
-- Pay: employment-weighted across the SOCs in the display group
SELECT sum(o.pct_25 * o.tot_emp) / nullif(sum(o.tot_emp),0) AS entry_p25,
       sum(o.a_median * o.tot_emp) / nullif(sum(o.tot_emp),0) AS median
FROM oews o
WHERE o.cbsa = $1 AND o.soc_code = ANY($2);

-- Outlook: separate growth from churn
SELECT sum(growth_openings) AS growth,
       sum(replacement_openings) AS replacement,
       sum(growth_openings + replacement_openings) AS total_annual
FROM bls_ep WHERE soc_code = ANY($1);
```

Show growth and replacement separately. A field with 40,000 annual openings that are 90% replacement is not the same as one that is 60% growth, and every other career site conflates them.

If OEWS suppresses a cell for a small metro, fall back to state, then national, and label the fallback inline.

---

## 6. Feature 3: The Door

### 6.1 Source

Read `ai_expertise_impact`, never `occupation_info.ai_flag`. The latter is a denormalized cache.

```sql
SELECT cluster_id, ai_flag, entry_barrier_trend, expertise_premium_trend,
       low_expertise_narrative, high_expertise_narrative, methodology_version
FROM ai_expertise_impact WHERE cluster_id = ANY($1);
```

### 6.2 Rollup

Within a display group, take the modal `entry_barrier_trend` and modal `expertise_premium_trend`. On a tie, show both and say the field is split. Do not average directional flags.

### 6.3 The four states

| Barrier | Premium | Heading | Body |
|---|---|---|---|
| Rising | Rising | Harder to get in, better once you are | Fewer employers are opening junior roles. The ones above are the ones that still are. |
| Falling | Rising | Open door, rising ceiling | Entry is getting easier and experience still pays. Best odds of the four. |
| Rising | Falling | Narrow door, flat ceiling | Harder to enter and the pay premium for experience is shrinking. Worth comparing against your other groups. |
| Falling | Falling | Open door, flat ceiling | Easy to enter, less reward for staying. Plan the next move early. |

Every state ends with a link to the employer list anchor. The door section is never a dead end. It always resolves to names.

### 6.4 What not to do

- Do not render a 2×2 quadrant chart. It reads as a horoscope and it is not what a graduate needs.
- Do not show `low_expertise_narrative` verbatim without review. Vendor narrative text is unaudited and goes in the receipts panel, not the body.
- Do not use the word "risk" or the word "safe."

---

## 7. Supporting sections

### 7.1 Other metros

Same CIP, five other CBSAs, ranked by cost-adjusted entry pay times employer density.

```
score = (oews_p25 / bea_rpp) * ln(1 + employers_hiring)
```

The log dampens large metros so that New York does not win on raw count alone. Always include the user's own metro in the list, highlighted, even when it ranks last. Clicking a row navigates to `/results/[cip]/[thatMetroSeedZip]`.

Maintain a `cbsa_seed_zip` table: one representative zip per CBSA for the link target.

### 7.2 Coverage note

Fixed copy, always rendered directly under the employer list. Not a tooltip, not a footnote.

> This list covers companies rated for early-career hiring. A company not shown here has not been rated, which is not a judgment about it.

Legal reviews this string before launch. It does not change per page.

### 7.3 Receipts panel

One toggle, page-level, off by default, state in `localStorage`. When on, every section reveals a monospace block naming source, vintage, and the exact vendor column.

Required entries:

| Section | Text |
|---|---|
| Funnel | Major to occupation: NCES–BLS CIP-SOC Crosswalk, 2020 CIP to 2018 SOC. NCES states this crosswalk reflects expert judgment rather than empirical placement data. Occupation to cluster: O*NET-SOC 2019, joined on onet_code. |
| Employers | hiring_flag at company × cluster × CBSA. Entry rating: badge_early_career. Core role: top10_occupation. Companies with an active corporate event are held back until re-rated. |
| Destinations | occupation_info.cluster_id_destination_1..3. Promotion split: promotion_retention, entry tier, matched metro size. Averaged unweighted across clusters in this group. |
| Pay | BLS OEWS May 2025, employment-weighted across SOCs. OEWS wages are indexed forward to Q1 2026 while employment counts remain May 2025. |
| Outlook | BLS Employment Projections 2024–34, growth and replacement openings reported separately. |
| Door | ai_expertise_impact, methodology version shown. Modal direction across clusters in this group. |
| Grouping | Occupation groupings are ours. Vendor cluster names for this group: [list]. |

That last row is not optional. We are overriding vendor labels and the page has to say so.

### 7.4 Feedback dock

Fixed bottom bar, four tap targets, no free text, no email required.

- Nine is too few
- Show pay per company
- Let me compare cities
- I don't trust the ratings

POST to `/api/feedback` with `{cip, zip, choice}`. No PII. This is the only thing on the page that produces a number we can act on in week one.

---

## 8. Copy rules

- Occupation names come from `display_group.display_name`. Never render `Sales Representatives — Advertising, Service, and Nontechnical Wholesale/Manufacturing Products` as a heading.
- Second person. "hire people with your degree," not "graduates of this program are employed by."
- No score out of 100. No letter grades. No "match percentage."
- Numbers get a unit and a scope. `$104,300` alone is wrong. `$104,300 entry pay, San Francisco metro` is right.
- Empty states are instructions, not apologies.

---

## 9. Build order

| Step | Deliverable | Gate |
|---|---|---|
| 1 | Ingest crosswalks and the 12/4/25 CSV. Build `cip_cluster`. | Hand-verify 11.0701 returns 26 clusters and 17 SOCs. |
| 2 | Seed `display_group` for the top 20 CIPs by IPEDS completions. | Zero unmapped clusters for those CIPs. |
| 3 | Employer query, dedup, ranking, thin-result handling. | Snapshot test on the fixture in §10. |
| 4 | Route, funnel, employer table, coverage note, feedback dock. | Ship here. No charts yet. |
| 5 | OEWS and EP joins. Destinations and promotion split. | Fallback chain verified on a suppressed small-metro cell. |
| 6 | Door section. Receipts panel. Metro comparison. | Legal sign-off on §7.2 string. |

Step 4 is a shippable product. Everything after it is enrichment.

---

## 10. Test fixture

CIP 11.0701, zip 94402, CBSA 41860.

Expected from the crosswalk chain, verified against the sample file:

- 17 SOC codes
- 32 O*NET codes
- 26 distinct `cluster_id`
- 4 display groups after §2.3 seeding, zero unmapped

Specific assertions:

| Assertion | Why |
|---|---|
| `15-1299` resolves to 9 distinct clusters | Catches SOC fan-out regressions |
| `15-1251.00` and `15-1252.00` both resolve to cluster 187 | Catches the reverse case, two SOCs into one cluster |
| OEWS join for display group 1 uses 6 distinct SOCs, not 6 clusters | Catches cluster-level wage averaging, the most likely silent bug |
| No `cluster_name` containing `\u00e2\u0080` | Catches the mojibake file being ingested by mistake |
| Employer list has no duplicate `company_uid` | Catches the §4.2 dedup failing |

Add a golden-file test on the full `FieldReport` object for this fixture. Any change to ranking or grouping should show up as a visible diff.

---

## 11. Known limits to write into the methodology page

1. The CIP-SOC crosswalk is expert judgment, not observed placement data. It answers "what could this degree lead to," not "where do these graduates go."
2. The cluster layer consolidates only 13% of O*NET occupations, so groupings on this page are largely ours.
3. Company ratings cover a few hundred firms. Coverage is not the labor market.
4. OEWS wage and employment vintages differ by one release.
5. Promotion rates are cluster-level and metro-size-level, not company-level. Two companies in the same cluster and metro show the same split.

Item 5 is the biggest gap between what the page implies and what the data supports. The copy must attach the promotion split to the field, never to a named employer.

# Data sources

Only these may appear in the game (CLAUDE.md section 6). Machine-readable copy: `src/data/facts.ts`.

| Fact | Status | Source | Primary source link (fetched and checked 2026-10-24) |
|---|---|---|---|
| Single-SPE crew design limit < 250 mSv | real | NASA | [NASA OCHMO-TB-020 radiation protection technical brief](https://www.nasa.gov/wp-content/uploads/2023/03/radiation-protection-technical-brief-ochmo.pdf): "short-term radiation exposure to solar particle events is limited to an effective dose of 250 mSv per event" |
| Career limit < 600 mSv | **proposed** | NASEM 2021 review | [National Academies news release, June 2021](https://www.nationalacademies.org/news/2021/06/nasa-should-update-astronaut-radiation-exposure-limits-improve-communication-of-cancer-risks): recommends NASA proceed with its *proposed* universal ~600 mSv career limit. **See the note below: a later NASA brief words it as a requirement.** The full NASEM report page on nap.edu: link TBD (not fetched). |
| Al/polyethylene shielding cuts SPE dose ~50%, GCR ~7% | real | NASA OCHMO brief | [NASA OCHMO-TB-020](https://www.nasa.gov/wp-content/uploads/2023/03/radiation-protection-technical-brief-ochmo.pdf): "average 50% reduction in dosage levels from SPE radiation ... only an average 7% reduction" for GCR |
| 10-20 cm water-equivalent storm shelters for SPEs | real | NASA OCHMO brief | [NASA OCHMO-TB-020](https://www.nasa.gov/wp-content/uploads/2023/03/radiation-protection-technical-brief-ochmo.pdf): +10 cm water equivalent for a 1-in-100-year event, +20 cm for 1-in-1000-year |
| NOAA S-scale: S1 = 10 pfu (>=10 MeV), x10 per level; S3+ EVA avoid exposure | real | NOAA SWPC | [NOAA Space Weather Scales](https://www.spaceweather.gov/noaa-scales-explanation): S1 = 10, then 10^2 ... 10^5 (flux of >=10 MeV particles); S3 "radiation hazard avoidance recommended for astronauts on EVA". The page does not print the unit "pfu"; the unit is NOAA's proton-flux unit used by the GOES data we fetch. |
| Curiosity RAD: ~0.67 mSv/day surface, ~1.8 mSv/day cruise | real | SwRI | [SwRI press release](https://www.swri.org/press-release/swri-scientists-publish-first-radiation-measurements-surface-mars): GCR dose equivalent 0.67 mSv/day (Aug 2012-Jun 2013) and 1.8 mSv/day on the journey to Mars |
| Artemis I: 90-degree rotation halved Van Allen belt dose rate | real | Artemis I paper (George et al., Nature 2024, doi 10.1038/s41586-024-07927-7) | [DLR news item on the Artemis I results](https://www.dlr.de/en/latest/news/2024/orion-spacecraft-radiation-protection-tested-initial-findings-from-artemis-i-moon-mission): "90-degree turn ... reduction in the radiation dose of 50 percent". The Nature paper page itself needed a login redirect, so it was not read: link TBD. |
| Moon 1.62 m/s^2, Mars 3.71 m/s^2 | general knowledge | - | - |

**Note for the team about the 600 mSv "proposed" label (please decide before the demo):** the NASA OCHMO brief linked above (Rev E, quoting NASA-STD-3001 Vol. 1 [V1 4030]) says total career dose "shall be less than 600 mSv". That suggests NASA may have adopted it after the 2021 NASEM review. We have not verified the adoption date or status, so the game still says "proposed" (the safe wording per CLAUDE.md), but it may be out of date. Check NASA-STD-3001 before presenting, or say "NASA's 600 mSv career limit (recommended by NASEM in 2021)".

**Game values (not real):** 12 s warning lead, dose peak rates, 0.1 storm-shelter factor, 1.5x dose scale, coin amounts.
All are in `src/game/tunables.ts`, tagged GAME VALUE.

**Live data:** NOAA SWPC `noaa-scales.json` and `integral-protons-1-day.json`. Saved real responses in `src/data/noaa-sample/` are the offline fallback.

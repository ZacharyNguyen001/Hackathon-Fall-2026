# Data sources

Only these may appear in the game (CLAUDE.md section 6). Machine-readable copy: `src/data/facts.ts`.

| Fact | Status | Source |
|---|---|---|
| Single-SPE crew design limit < 250 mSv | real | NASA |
| Career limit < 600 mSv | **proposed** | NASEM 2021 review |
| Al/polyethylene shielding cuts SPE dose ~50%, GCR ~7%; 10-20 cm water-equivalent shelters for SPEs | real | NASA OCHMO brief |
| NOAA S-scale: S1 = 10 pfu (>=10 MeV), x10 per level; S3+ EVA avoid exposure | real | NOAA SWPC |
| Curiosity RAD: ~0.67 mSv/day surface, ~1.8 mSv/day cruise | real | SwRI |
| Artemis I: 90-degree rotation halved Van Allen belt dose rate | real | Artemis I paper |
| Moon 1.62 m/s^2, Mars 3.71 m/s^2 | general knowledge | - |

**Game values (not real):** 12 s warning lead, dose peak rates, 0.1 storm-shelter factor, 1.5x dose scale, coin amounts.
All are in `src/game/tunables.ts`, tagged GAME VALUE.

**Live data:** NOAA SWPC `noaa-scales.json` and `integral-protons-1-day.json`. Saved real responses in `src/data/noaa-sample/` are the offline fallback.

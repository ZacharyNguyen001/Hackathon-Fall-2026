/** Real facts only (CLAUDE.md section 6). Fact cards may use nothing else. */
export interface Fact { id: string; text: string; source: string; status: 'real' | 'derived' | 'proposed' }

export const FACTS: Fact[] = [
  { id: 'spe-limit', status: 'real', source: 'NASA crew design limit', text: 'The crew design limit for a single solar particle event is under 250 mSv.' },
  { id: 'career', status: 'proposed', source: 'NASEM 2021 review of NASA proposal', text: 'NASA has proposed a career radiation limit of under 600 mSv. It is a proposal, not yet adopted.' },
  { id: 'shield', status: 'real', source: 'NASA OCHMO brief', text: 'Aluminum or polyethylene shielding cuts solar particle event dose by about 50%, but galactic cosmic rays by only about 7%.' },
  { id: 'water', status: 'real', source: 'NASA OCHMO brief', text: 'Storm shelters with about 10-20 cm of water-equivalent shielding are the answer to solar particle events.' },
  { id: 'sscale', status: 'real', source: 'NOAA SWPC', text: 'NOAA S1 begins at 10 pfu of 10 MeV protons, and each level is 10 times higher. At S3 and above, EVA astronauts should avoid exposure.' },
  { id: 'rad-surface', status: 'real', source: 'Curiosity RAD (SwRI)', text: 'Curiosity measured about 0.67 mSv per day on the Martian surface and about 1.8 mSv per day in cruise.' },
  { id: 'artemis-turn', status: 'real', source: 'Artemis I paper', text: 'On Artemis I, rotating the spacecraft 90 degrees cut the Van Allen belt dose rate about in half.' },
]

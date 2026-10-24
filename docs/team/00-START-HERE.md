# START HERE (everyone reads this first)

Deadline: **Sunday Oct 25, 12:00 PM CDT. No code changes after that, ever.**
Plan to stop coding around **10:30 AM Sunday** and feature-freeze **Saturday 11:59 PM**.

## Who does what
| Person | Task | Guide |
|---|---|---|
| Jaydon | Live NOAA data + ElevenLabs voice | `jaydon-noaa-elevenlabs.md` |
| Garri | Dust storm round + demo script | `garri-dust-storm-and-demo.md` |
| Zach | Sound effects (Moon and Mars) + merging pull requests | `zach-sound-effects.md` |
| Johnae | Saving coins on this device + all the art + the art loader | `johnae-coins-and-art.md` |

Claude is **not** writing more game code. Claude is your helper: it explains, reviews and fixes errors while *you* write and understand the code.

## 1. Set up your computer (once)
1. Install **Node 22.15 or newer** (check with `node --version`) and **Git**.
2. In a terminal:
   ```
   git clone https://github.com/ZacharyNguyen001/Hackathon-Fall-2026.git
   cd Hackathon-Fall-2026
   npm install
   npm run dev
   ```
3. Open the `localhost` link it prints. Click the game and play a round.
4. `npm run validate` checks types and runs the tests. **Run it before every commit.**

## 2. Git for beginners (so nobody overwrites anyone)
Never work directly on `main`. Every person works on their own **branch**.
```
git switch main
git pull                                  # get everyone's latest work
git switch -c yourname/feature            # make your branch, e.g. garri/dust-storm
# ...edit files...
npm run validate
git add -A
git commit -m "Short description of what you did"
git push -u origin yourname/feature
```
Then on GitHub click **Compare & pull request**. **Zach merges** pull requests (one at a time).
After someone else's work is merged, update your branch:
```
git switch main && git pull && git switch yourname/feature && git merge main
```
If Git says "merge conflict", don't panic: use the conflict prompt in section 6.

## 3. Who owns which file (this prevents conflicts)
| Shared file | Rule |
|---|---|
| `src/game/Game.ts` | Only add the small "hook" lines your guide lists. Put real logic in **your own new file**. |
| `src/game/tunables.ts` | Add your numbers at the **bottom** under a header like `// ---- Dust storm (Garri) ----`. |
| `src/audio/lines.ts` | Jaydon owns it. Others send him sentences. |
| `src/Play.tsx` | Only Johnae and Jaydon, only in the spots their guides name. |

Merge order (smallest first): Johnae's coins, Jaydon's NOAA, Garri's dust, Zach's sounds, Jaydon's voice, Johnae's art.

## 4. Rules that can disqualify us (CLAUDE.md section 0)
- **Only 2 outside services: NOAA and ElevenLabs.** No backend, no extra website services, no CDN fonts, no analytics.
- **No AI-made images, sprites, icons or logos. Ever.** (AI audio from ElevenLabs is allowed.)
- Every time Claude helps with code, add a line to `docs/AI_USAGE.md`: `| date-time | file | what Claude did | your name |`.
- **You must be able to explain every line you commit.** If you can't, ask Claude to explain it first.
- Never commit secrets. Keys go in `.env.bake.local` (git ignores it). Check: `git check-ignore -v .env.bake.local`.
- Every game number goes in `src/game/tunables.ts` tagged `GAME VALUE` or `REAL: source`.
- Only show real facts that appear in CLAUDE.md section 6 / `src/data/facts.ts`.

## 5. When you finish a step
1. `npm run validate` passes. 2. Play the game and test your feature. 3. Add the line to `docs/AI_USAGE.md`. 4. Commit, push, open a pull request.

## 6. Prompts you can paste into Claude
Replace the <angle brackets>.

**Start a step**
> Read CLAUDE.md and docs/team/<my-guide>.md. I'm a beginner. Do NOT write the whole feature. Help me with ONLY step <N>: first explain the plan in plain English, then show me the code in small pieces I can type myself, with comments. Keep rules in CLAUDE.md section 0. Then tell me what line to add to docs/AI_USAGE.md (my name is <name>).

**Understand code**
> Explain <file> to me line by line like I've never programmed. What does each function do and who calls it?

**Fix an error**
> I got this error when I ran <command>: <paste the whole error>. What does it mean in plain English, and what is the smallest fix?

**Merge conflict**
> I have a merge conflict in <file>. Here is the conflicted text: <paste>. Explain what each side is, and help me keep BOTH my change and my teammate's.

**Check before a pull request**
> Review my branch's changes (git diff main) for anything that breaks CLAUDE.md section 0 or that I can't explain. List problems; don't rewrite everything.

## 7. Open items (someone must do these)
- **Zach:** where the finished game is hosted (a static site: `npm run build` makes the `dist/` folder). Ask organizers it's OK. If you use GitHub Pages, a `base` setting is needed in `vite.config.ts`.
- **Everyone:** get the README template link from organizers; select the **ElevenLabs** track on Devpost by Sat 11:59 PM.
- **Zach:** before 12:00 Sunday, tag the final commit: `git tag submission && git push --tags`.

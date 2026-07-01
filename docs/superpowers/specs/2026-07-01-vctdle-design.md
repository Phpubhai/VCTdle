# VCTdle — Design Spec

**Date:** 2026-07-01
**Status:** Approved (data collected)

## 1. Overview
A browser-based daily-style guessing game in the spirit of Onepiecedle/Loldle, but for **VCT (Valorant Champions Tour) 2026 pro players**. The player types a pro's handle and receives colour-coded feedback across attribute columns until they guess the hidden player. Unlimited plays; a new random answer each round. Pure static site (HTML/CSS/JS), no build step, hostable on GitHub Pages/Netlify.

## 2. Data
- Source: **`players.json`** — 241 players across the four VCT 2026 international leagues (Americas 59, EMEA 58, Pacific 60, China 64), gathered from vlr.gg + Liquipedia.
- Each record:
  ```json
  {
    "handle": "aspas", "realName": "Erick Santos",
    "nationality": "Brazil", "age": 22,
    "team": "MIBR", "region": "Americas",
    "role": "Duelist", "igl": false, "signatureAgent": "Jett",
    "hasInternational": true, "hasRegional": true,
    "photoUrl": "https://owcdn.net/img/...png",
    "teamLogoUrl": "https://owcdn.net/img/...png"
  }
  ```
- Data quality notes: handles/teams/regions/nationalities are source-verified. `age` is null for some players. `role`/`signatureAgent`/`igl`/trophy flags are best-effort (verified for most, editable in the JSON). 209/241 have real headshots; the rest fall back to a silhouette placeholder.

## 3. Guess Columns & Feedback (Classic mode)
Feedback colours (Loldle/Onepiecedle style):
- 🟢 Green = exact match
- 🟡 Yellow = partial / close (see rules)
- 🔴 Red = no match

| Column | Type | Feedback rule |
|--------|------|---------------|
| Player (headshot) | — | shown on the guessed row; the answer to find |
| Nationality (flag) | categorical | green=same country; yellow=different country but **same region**; red=otherwise |
| Region | categorical | green=same; red=different (Americas/EMEA/Pacific/China) |
| Age | numeric | green=equal; red + arrow ▲ (answer older) / ▼ (answer younger); yellow if within ±1 |
| Team | categorical | green=same; red=different |
| Role | categorical | green=same; red=different (Duelist/Controller/Initiator/Sentinel/Flex) |
| IGL | boolean | green=same; red=different |
| Signature Agent | categorical | green=same; red=different |
| Intl title | boolean | green=same; red=different (won Masters/Champions) |
| Regional title | boolean | green=same; red=different (won Kickoff/Stage) |

## 4. Region Filter
Before/at any time, four toggle chips (Americas / EMEA / Pacific / China) restrict the **answer pool**. E.g. unchecking China means the random answer never comes from a China-league player. Guesses can still be any player; only the target is constrained. Default: all four on.

## 5. Gameplay Loop
1. Random target chosen from the filtered pool.
2. Autocomplete input of player handles (with team + headshot in dropdown).
3. On guess: append a row; each column animates to its feedback colour.
4. Unlimited guesses; a guess counter is shown.
5. On correct: reveal a player card (headshot, team logo, key facts) + "Play again" (new random target).
6. Stats (games won, current/best streak, guess distribution) persisted in `localStorage`.

## 6. Visual Design
- VCT/Valorant aesthetic: dark background, Valorant red (#ff4655) accents, clean grid.
- Assets: country flags via flagcdn.com; agent icons via valorant-api.com; team logos + player headshots from stored URLs; silhouette fallback for missing photos.
- Responsive; playable on mobile.

## 7. File Structure
```
demo/
├── index.html      structure
├── style.css       VCT theme
├── game.js         game logic + feedback engine
└── players.json    241-player dataset (already generated)
```

## 8. Out of Scope (v1)
- Other modes (Agent-only, blurred-photo, laugh) — Classic first.
- Daily single-answer / global sync — using unlimited random instead.
- Backend / leaderboard.

## 9. Future Ideas
- Add blurred-photo mode reusing `photoUrl`.
- "Yesterday's player" / daily seed option.
- Downloaded local asset copies if hotlinked images break.

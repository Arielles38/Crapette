# Crapette — Technical Specification (Engine-Agnostic)

Version: 1.0
Date: 2025-12-04

This document is an engine-agnostic technical specification for a mobile implementation of the two-player card game Crapette. It is written so you can implement the core in any language or framework in VS Code.

## Purpose

- Provide a canonical game state model and action protocol
- Define validation and deterministic behaviour (shuffle, replay)
- Describe networking primitives (REST + WebSocket) for multiplayer
- Specify AI interface, tests, and project layout for VS Code development

## Scope

- Single-player (local vs AI) and online 1v1 multiplayer
- Deterministic core rule engine, serializable state, replayable games
- Minimal backend for matchmaking and authoritative state sync (optional)

## Glossary

- GameState: Complete snapshot of the game at a point in time
- Action: A player-initiated operation (move, draw, end turn)
- Seq (sequence): Monotonic increment for state updates
- Seed: Integer used to deterministically shuffle deck

## Data Models (JSON-style)

Card

```json
{ "id": "AS", "rank": "A", "suit": "spades", "value": 1 }
```

PlayerState

```json
{
  "playerId": "p1",
  "name": "Alice",
  "hand": ["3H","7D"],
  "reserve": ["KD"],
  "connected": true,
  "score": 0
}
```

GameState

```json
{
  "gameId": "g-123",
  "seed": 123456789,
  "phase": "IN_PROGRESS",
  "turn": "p1",
  "players": [ /* PlayerState */ ],
  "piles": {
    "tableau": [["AS","2S"],[],...],
    "foundations": [[],[],[],[]],
    "reserve": {"p1": ["KD"],"p2": ["QC"]}
  },
  "history": [ /* Action */ ],
  "seq": 42,
  "lastUpdated": 1680000000000
}
```

Action (canonical)

```json
{
  "actionId": "a-1",
  "playerId": "p1",
  "type": "MOVE_CARD",
  "payload": { "from": {"pile":"tableau","index":2}, "to": {"pile":"foundation","index":0}, "cardId": "AS" },
  "seq": 12,
  "timestamp": 1670000000000
}
```

## State Machine

- Phases: `LOBBY` -> `STARTING` -> `IN_PROGRESS` -> `PAUSED` -> `FINISHED`
- Transitions:
  - LOBBY -> STARTING: all players ready
  - STARTING -> IN_PROGRESS: server deals using `seed`
  - IN_PROGRESS -> FINISHED: win condition met / resign
  - IN_PROGRESS -> PAUSED: disconnect or manual pause

Turn semantics

- `turn` field identifies active player. Some legal actions may not end the turn (depending on variant); the validator returns a `turnEnd` boolean.

## Deterministic shuffle & replay

- Server generates a cryptographically-secure `seed` at match start.
- Deck ordering = deterministicShuffle(seed). Clients reproduce deck from the same seed for replay.
- Store `seed` + `history` (action list) to replay full match.

## Validation & Action Application

Two-step pattern:

1. `validateAction(gameState, action)` -> { valid: bool, reason?:string }
2. `applyAction(gameState, action)` -> newGameState (immutable copy), events

Rules to validate (Crapette highlights):

- Source pile contains card(s) referenced and they are available (top-of-pile or allowed sequence)
- Destination pile accepts card(s) per foundation/tableau rules
- Player is acting on their turn (or action type allows off-turn, e.g., chat)
- Action adheres to atomicity: multi-part moves either fully apply or are rejected

If the server is authoritative it will run the validation and respond with an updated `SYNC` message broadcasting the new state and incremented `seq`.

## Networking API (Firebase-based)

Firebase Realtime Database + Cloud Functions (for lightweight prototype)

- **Authentication:** Firebase Auth (email/social login)
- **Matchmaking:** Cloud Function triggered on player availability; writes to Firebase Realtime DB `/matches/{matchId}`
- **Real-time sync:** Firebase Realtime Database listeners on match node; clients subscribe to `/matches/{matchId}` for state updates
- **Messaging:** Action messages written to `/matches/{matchId}/actions/{actionId}` with client-side timestamp

Key endpoints:

- POST /api/v1/auth/login (Firebase Auth)
- GET  /api/v1/match/available -> returns available matches
- POST /api/v1/match/join { matchId } -> joins player to match
- WebSocket-like: Real-time listeners on Firebase DB nodes

Flow (quickmatch via Firebase):

1. Player logs in via Firebase Auth
2. Cloud Function monitors `/players/{playerId}/seeking` = true
3. Matchmaker creates `/matches/{newMatchId}` and assigns both players
4. Firebase sends `SYNC` event with initial GameState and seed
5. Clients listen on `/matches/{matchId}` and write actions to `/matches/{matchId}/actions`
6. Firebase triggers server-side validation (Cloud Function) and broadcasts updated state

## Security (lean prototype)

- Use Firebase Auth for player identity (no custom tokens required for MVP)
- Database security rules: players can only write to their own match actions
- Use HTTPS for REST calls; Firebase Realtime DB uses TLS by default
- Keep Firebase API keys in `.env` file; add to `.gitignore`
- **Note:** Anti-cheat validation is NOT enforced server-side for this prototype. All moves are allowed; it is the opponent's responsibility to call "Crapette" if they observe an invalid move. See **Crapette Interrupt Mechanism** below.

## AI Interface

- Signature: `suggestAction(gameState, playerId, timeBudgetMs) -> Action | null`
- Requirements:
  - Always returns valid actions (validated by same validator)
  - Deterministic when seeded
  - Accepts timeBudget for search-based algorithms
- Implementation path:
  - Phase 1: rule-based heuristics (legal moves scored)
  - Phase 2: shallow search (minimax/MCTS) with heuristics

## Full Crapette Rules & Interrupt Mechanism

**Key rule: "Crapette"** — At any time, if an opponent observes that the current player has made an invalid move, the opponent may call "Crapette" to interrupt and flag the move as invalid.

- All moves are **allowed** to be made by the active player (no server-side validation blocks moves).
- If a move is flagged as invalid via Crapette, the move is **undone** and the active player loses their turn.
- Crapette call is time-limited (e.g., must be called within 5 seconds of the move).
- Valid Crapette calls result in score penalty for the active player (e.g., -10 points).
- False Crapette calls (move was legal) result in penalty for the caller (e.g., -10 points).

Rule validation (for Crapette checking):

- Foundation: ascending by rank, same suit, start with Ace
- Tableau: descending by rank, alternating colors (red/black)
- Reserve: only top card available
- Stock/discard: standard solitaire rules
- Multi-card moves from tableau to tableau allowed if sequence is valid

## Localization (i18n)

- Supported languages: **English** and **French**
- Language preference stored in player profile and local storage
- All UI strings, game messages, and rules explanations translated
- JSON i18n files: `/locales/en.json`, `/locales/fr.json`
- Example structure:
  ```json
  {
    "menu.play": "Play",
    "menu.settings": "Settings",
    "game.crapette": "Crapette!",
    "game.invalid_move": "Invalid move",
    "game.turn_p1": "Your turn",
    "game.turn_p2": "Opponent's turn"
  }
  ```
- Implement using a light i18n library (e.g., `i18next` for TypeScript, `gettext` for Python)

## Tests

- Unit tests:
  - deterministicShuffle(seed) produces stable order
  - validateAction covers all rule variants and edge-cases (for Crapette validation)
  - applyAction transitions produce expected GameState
- Integration tests:
  - Crapette interrupt flow: move made, opponent calls Crapette, move undone, turn lost
  - False Crapette: opponent calls Crapette on valid move, opponent penalized
  - Replayed history matches final state after starting from seed
  - Firebase listener sync: clients receive state updates in real-time
- Property tests (optional):
  - Random seeds + apply random actions -> state remains consistent
  - Replay from seed + history matches final state

Test tools per language:

- TypeScript: Jest + ts-jest
- Python: pytest + hypothesis

## Project Layout (VS Code)

Suggested minimal layout for a TypeScript core implementation in the repo root:

```
/src
  /core
    state.ts        # GameState types + helpers
    engine.ts       # validateAction, applyAction
    rules.ts        # Crapette rule implementations
  /ai
    ai.ts           # AI facade
  /firebase
    firebaseConfig.ts # Firebase setup + helper functions
    matchService.ts   # matchmaking + sync logic
  /locales
    en.json         # English strings
    fr.json         # French strings
  /i18n
    i18n.ts         # i18n configuration
  /tests
    core.test.ts
    crapette.test.ts # Crapette interrupt tests
README.md
TECH_SPEC.md
package.json
.env.example       # Firebase config template
```

If you prefer Python, replace `.ts` with `.py` and `package.json` with `pyproject.toml`.

## Asset Conventions (brief)

- Card naming: `rank_suit.png` (e.g. `A_spades.png` or `AS.png`)
- Resolutions: provide x1, x2, x3 variants or a single high-res atlas
- UI sprites: `icon_*.png`, size-specified in `ASSET_SPECS.md` (recommend 48/96/192 px baselines)

## CI/CD & Releases (outline)

- Use GitHub Actions:
  - `test` job runs unit tests on PRs
  - `build` job produces Android/iOS artifacts (if applicable)
  - `deploy` job uploads to TestFlight/Google Play internal tracks using `fastlane`
- Keep secrets in GitHub Secrets (API keys, keystores)

## Acceptance Criteria (MVP)

- Core rule engine validates and applies moves deterministically (for Crapette checking)
- Local single-player vs AI playable to completion
- Firebase multiplayer connectivity: players join matches and receive real-time state updates
- Crapette interrupt mechanic works: opponent can flag invalid move within time limit
- Language switching: UI, messages, and rules available in English and French
- GameState replay works from `seed` + `history`

## Implementation Notes & Recommendations

- Start by implementing the core `validateAction` and `applyAction` in isolation; write comprehensive unit tests first (these are critical for Crapette validation)
- Keep the engine deterministic and side-effect free (pure functions) so it can run on client and server
- For rapid prototyping in VS Code, implement core in TypeScript/Node — Firebase SDK is lightweight and easy to test locally
- Firebase Realtime DB is ideal for a lean prototype: no backend infrastructure to manage, scales automatically, built-in auth
- Implement i18n early; use JSON-based locale files so translations can be added/updated without code changes
- Test Crapette interrupt flows early with two-client simulations

## Example Message Schemas

- ACTION

```json
{ "type":"ACTION", "payload": { /* Action object */ } }
```

- SYNC

```json
{ "type":"SYNC", "payload": { "gameState": { /* ... */ }, "seq": 123 } }
```

- ERROR

```json
{ "type":"ERROR", "payload": { "code": 4001, "message": "Invalid move: card not on top" } }
```

## Next steps I can implement for you

- Option B: Scaffold a minimal TypeScript core (`/src/core`) with `validateAction`, `applyAction`, deterministic shuffle + unit tests.
- Option C: Create a small Node WebSocket server stub demonstrating handshake + SYNC/ACTION flows.

Tell me which of B or C you'd like next and your preferred language (TypeScript or Python) and I'll scaffold the code and tests in this repository.

---

File generated by assistant on 2025-12-04

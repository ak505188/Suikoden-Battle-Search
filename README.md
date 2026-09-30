# Suikoden Battle Search

Brute-force searches over Suikoden battles: try every combination of round inputs, find the
endings you want (a drop, an RNG position, level-up stats), and pick the fastest way to get them.
Built on the battle simulator in [suikoden-rng-lib](../Suikoden-RNG-lib) (`suikoden-rng-lib/battle`).

## Setup

Check this repo out next to `Suikoden-RNG-lib`, then:

```
npm install        # links ../Suikoden-RNG-lib as suikoden-rng-lib (file: dependency)
npm test
npm run search-check
```

Edits to the library show up here straight away (npm symlinks it).

## Usage

```js
import { Battle, Character, PlayerParty, EnemyParty, AREAS, RNG, ROUND_COMMANDS } from 'suikoden-rng-lib/battle';
import { bruteForce, ResultsDB } from 'suikoden-battle-search';

const { results, stats } = bruteForce(battle, {
  maxRounds: 2,
  commands: [ROUND_COMMANDS.RUN, ROUND_COMMANDS.FIGHT, ROUND_COMMANDS.FREE_WILL],
  filter: ({ candidates }) => candidates,          // narrow each member's actions per round
  finish: true,                                    // roll the drop and EXP before scoring
  score: b => ({ drop: b.result.drop?.name ?? null, rng: b.rng.getCount() }),
});
```

Each result is one distinct ending: `status`, `score`, `fights` and `frames` (its cheapest path),
`rounds` (that path, replayable with `battle.playTurn`), `pathCount` / `planCount` and `paths()`
(every path to it).

`scripts/bonbonSearch.js` is a full example and a template for new fights: it searches the 3 BonBon
Celadon Urn fight and saves every ending to `output/bonbon.db`:

```
node scripts/bonbonSearch.js
sqlite3 -header -column output/bonbon.db "
  SELECT json_extract(score, '$.rng') AS rng, fights, frames, summary FROM endings
  WHERE run_id = (SELECT MAX(id) FROM runs) AND json_extract(score, '$.drop') = 'Celadon urn'
  ORDER BY frames LIMIT 10"
```

The score is whatever the search's `score` returns, stored as JSON and queried with
`json_extract`. bonbonSearch's includes the drop, the battle-end RNG, the RNG after level-ups, every
member's level-up growths, HP and the Medicines left.

## How the search works

**Rounds, branched at each actor's turn.** Each round starts once per round-start choice
(`roundStarts` in the library: per member Defend or "decide at my turn", Unites, Run / Free Will),
then pauses at each party member's first dispatch tick and branches over the actions they could have
picked at round start (`Battle.chooseAction`). The ticks before a turn are simulated once for every
choice made at it. Defend and Unites have to be chosen at round start: Defend sets `defending` from
tick 0, and Unite partners are locked in together. A member who never gets a turn (down before it)
is never asked; their path slot is marked `unused`, and `planCount` counts the plans it stands for.

**Merging identical states.** After every round the battle's `stateKey()` (RNG, round count, Free
Will's gate, every combatant's HP / MP / statuses / flags / inventory) identifies its state; each
distinct state's future is searched once, and every path into it is kept as an edge. Endings merge
the same way. The result is a graph, so an ending can have millions of paths without storing them.

**Tie-breaks, not scores.** Among paths to the same ending, the main path is the cheapest: fewest
Fight rounds (each means inputting every member's action by hand), then fewest frames. That only
picks between equivalent paths; what counts as a good ending is the search's own `score`.

**Checked against a replay.** Every result's main path is replayed from the start before scoring,
and the search throws if it doesn't reach the recorded state, which would mean `stateKey` misses
some state.

**Free Will is always tried.** The library's default round commands are Fight and Free Will; Run
is opt-in (escapable fights only).

## Where things live

- **suikoden-rng-lib** owns how the game works: the engine (`Battle`, timings, enemy AI), cloning
  (including mid-round), `stateKey`, deferred actions, and what the player can input each round
  (`characterActions`, `roundStarts`, …).
- **This project** owns how to search: `src/BruteForce.js` (search, merging, path graph, results),
  `src/ResultsDB.js` (SQLite results, Node only), and the scripts.

## Checks

- `npm test`: the search against exhaustive plan enumeration, merging, `unused` slots, the
  database.
- `npm run search-check`: a full two-round BonBon search, every result and path hashed. An
  optimisation must leave the hash unchanged; update `EXPECTED_HASH` only for an intended change.

## Next

- **Edges on disk.** All paths are kept in memory until the end; a big search (5 members, items)
  peaks around 7 GB. Streaming edges and endings to SQLite during the search removes that ceiling
  and makes every ending's alternatives queryable.
- **Merging mid-round.** Plans still end as separate branches; merging identical states after the
  last party member's turn (not just between rounds) would cut the simulation further.
- **Workers.** Split round-1 states across threads; each worker rebuilds its states by replaying
  their paths from the start battle.

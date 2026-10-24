import { engineVersion } from './content.mjs';

export const commandCost = Object.freeze({ move: 1, shove: 2, brace: 1, wait: 0 });
export const directions = Object.freeze({ up: [0, -1], right: [1, 0], down: [0, 1], left: [-1, 0] });
export const courierColors = ['#d0fa26', '#ff4e8a', '#28cffa', '#ffae21'];
const arrows = { '^': 'up', '>': 'right', v: 'down', '<': 'left' };
const cell = position => `${position.x},${position.y}`;
const same = (first, second) => first.x === second.x && first.y === second.y;
const tile = (board, x, y) => board.tiles[y]?.[x] ?? null;
const stable = value => value && typeof value === 'object' ? Array.isArray(value) ? value.map(stable) : Object.fromEntries(Object.keys(value).sort().map(key => [key, stable(value[key])])) : value;
export const canonical = value => JSON.stringify(stable(value));

function text(value, label, maximum = 100) {
  if (typeof value !== 'string' || !value.trim() || value.length > maximum || /[\u0000-\u001f\u007f]/.test(value)) throw new Error(`${label} needs 1–${maximum} characters without control codes.`);
  return value.trim();
}
function integer(value, minimum, maximum, label) {
  if (!Number.isInteger(value) || value < minimum || value > maximum) throw new Error(`${label} is outside its supported range.`);
}
function fields(value, allowed, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).some(key => !allowed.includes(key))) throw new Error(`${label} contains unsupported fields.`);
}

/** Bounded arena validation also proves each dock can reach every cargo source without leaving the board. */
export function validateArena(board) {
  fields(board, ['id', 'title', 'description', 'tiles', 'docks', 'sources'], 'Arena');
  text(board.id, 'Arena ID', 80); text(board.title, 'Arena title', 100); text(board.description, 'Arena description', 500);
  if (!Array.isArray(board.tiles) || board.tiles.length < 5 || board.tiles.length > 13) throw new Error('An arena needs 5–13 rows.');
  const width = board.tiles[0]?.length;
  if (width < 5 || width > 13 || board.tiles.some(row => typeof row !== 'string' || row.length !== width || /[^.#^v<>x012]/.test(row))) throw new Error('Use 5–13 equal-width rows containing supported tiles.');
  if (!Array.isArray(board.docks) || board.docks.length !== 4 || !Array.isArray(board.sources) || board.sources.length < 1 || board.sources.length > 6) throw new Error('An arena needs four docks and 1–6 cargo sources.');
  const occupied = new Set();
  for (const point of [...board.docks, ...board.sources]) {
    fields(point, ['x', 'y'], 'Arena position'); integer(point.x, 0, width - 1, 'Column'); integer(point.y, 0, board.tiles.length - 1, 'Row');
    if (tile(board, point.x, point.y) !== '.' || occupied.has(cell(point))) throw new Error('Docks and cargo sources need distinct plain-floor cells.');
    occupied.add(cell(point));
  }
  for (const dock of board.docks) {
    const queue = [dock], reached = new Set([cell(dock)]);
    for (let index = 0; index < queue.length; index++) for (const [dx, dy] of Object.values(directions)) {
      const next = { x: queue[index].x + dx, y: queue[index].y + dy }, terrain = tile(board, next.x, next.y);
      if (terrain && terrain !== '#' && terrain !== 'x' && !reached.has(cell(next))) { reached.add(cell(next)); queue.push(next); }
    }
    if (board.sources.some(source => !reached.has(cell(source)))) throw new Error('Every dock must have a walkable route to every cargo source.');
  }
  if (canonical(board).length > 10000) throw new Error('The arena exceeds its portable size limit.');
  return board;
}

/** Exactly three commands fit a four-energy budget; a committed plan contains no client-supplied result. */
export function validatePlan(plan) {
  if (!Array.isArray(plan) || plan.length !== 3) throw new Error('Choose exactly three commands.');
  let energy = 0;
  const normalized = plan.map(command => {
    fields(command, ['kind', 'direction'], 'Command');
    if (!Object.hasOwn(commandCost, command.kind)) throw new Error('Choose step, shove, brace or wait.');
    const directed = command.kind === 'move' || command.kind === 'shove';
    if (directed ? !Object.hasOwn(directions, command.direction) : command.direction !== null && command.direction !== undefined && command.direction !== '') throw new Error('This command has an invalid direction.');
    energy += commandCost[command.kind];
    return { kind: command.kind, direction: directed ? command.direction : null };
  });
  if (energy > 4) throw new Error('Three commands may use at most four energy.');
  return normalized;
}
export const waitPlan = () => Array.from({ length: 3 }, () => ({ kind: 'wait', direction: null }));

/** Creates one deterministic match; all courier identities are explicitly supplied, never invented as online participants. */
export function createMatch(board, people, options = {}) {
  validateArena(board);
  if (!Array.isArray(people) || people.length < 1 || people.length > 4 || new Set(people.map(person => person.id)).size !== people.length) throw new Error('Use 1–4 distinct supplied courier identities.');
  const mode = options.mode ?? 'versus';
  if (!['solo', 'versus'].includes(mode) || mode === 'solo' && people.length !== 1 || mode === 'versus' && people.length < 2) throw new Error('Solo uses one courier; a live match needs 2–4 actual participants.');
  const limit = options.rounds ?? 6; integer(limit, 1, 12, 'Round limit');
  const state = {
    format: 1, engineVersion, board: structuredClone(board), mode, round: 1, roundLimit: limit, phase: 'planning',
    objective: { deliveries: options.deliveries ?? 1, maximumFalls: options.maximumFalls ?? 12 },
    players: people.map((person, index) => ({ id: text(person.id, 'Courier ID', 80), alias: text(person.alias, 'Courier alias', 24), seat: index, ...board.docks[index], score: 0, cargo: null, falls: 0, delivered: [] })),
    crates: [], nextCrate: 1, sourceCursor: 0, result: null
  };
  integer(state.objective.deliveries, 1, 12, 'Delivery target'); integer(state.objective.maximumFalls, 0, 50, 'Fall limit');
  replenish(state, []);
  return state;
}

function replenish(state, events) {
  const target = Math.min(3, state.board.sources.length);
  for (let tries = 0; state.crates.length + state.players.filter(player => player.cargo).length < target && tries < state.board.sources.length; tries++) {
    const source = state.board.sources[state.sourceCursor++ % state.board.sources.length];
    if (state.crates.some(crate => same(crate, source)) || state.players.some(player => same(player, source))) continue;
    const crate = { id: 'crate-' + state.nextCrate++, ...source }; state.crates.push(crate); events.push({ type: 'cargo-spawned', cargoId: crate.id, ...source });
  }
}

function drop(state, player, position, events) {
  if (!player.cargo) return;
  const cargo = player.cargo; player.cargo = null;
  const positions = [];
  for (let y = 0; y < state.board.tiles.length; y++) for (let x = 0; x < state.board.tiles[0].length; x++) if (tile(state.board, x, y) !== '#' && tile(state.board, x, y) !== 'x') positions.push({ x, y });
  positions.sort((first, second) => Math.abs(first.x - position.x) + Math.abs(first.y - position.y) - Math.abs(second.x - position.x) - Math.abs(second.y - position.y) || first.y - second.y || first.x - second.x);
  const destination = positions.find(point => !state.crates.some(crate => same(crate, point)));
  if (!destination) throw new Error('The bounded arena has no space for a dropped cargo.');
  state.crates.push({ id: cargo, ...destination }); events.push({ type: 'cargo-dropped', playerId: player.id, cargoId: cargo, ...destination });
}

function reset(state, player, events) {
  drop(state, player, { ...player }, events); player.falls++;
  const dock = state.board.docks[player.seat], queue = [dock], visited = new Set([cell(dock)]);
  for (let index = 0; index < queue.length; index++) {
    const point = queue[index];
    if (tile(state.board, point.x, point.y) === '.' && !state.players.some(other => other !== player && same(other, point))) { player.x = point.x; player.y = point.y; events.push({ type: 'recovered', playerId: player.id, ...point }); return; }
    for (const [dx, dy] of Object.values(directions)) { const next = { x: point.x + dx, y: point.y + dy }; if (tile(state.board, next.x, next.y) && tile(state.board, next.x, next.y) !== '#' && !visited.has(cell(next))) { visited.add(cell(next)); queue.push(next); } }
  }
  throw new Error('No recovery cell is available.');
}

function collect(state, events) {
  for (const player of state.players) {
    if (!player.cargo) { const index = state.crates.findIndex(crate => same(crate, player)); if (index >= 0) { player.cargo = state.crates[index].id; state.crates.splice(index, 1); events.push({ type: 'picked-up', playerId: player.id, cargoId: player.cargo }); } }
    if (player.cargo && same(player, state.board.docks[player.seat])) {
      if (state.players.some(other => other.delivered.includes(player.cargo))) throw new Error('A cargo cannot be delivered twice.');
      player.delivered.push(player.cargo); player.score = player.delivered.length; events.push({ type: 'delivered', playerId: player.id, cargoId: player.cargo, score: player.score }); player.cargo = null;
    }
  }
}

/** Resolves targets together: contested destinations, swaps and closed occupancy cycles stay put. */
function moveTogether(state, intents, events, type) {
  const moving = new Map(intents.map(intent => [intent.id, intent]));
  const targets = new Map();
  for (const intent of intents) { const key = cell(intent); if (!targets.has(key)) targets.set(key, []); targets.get(key).push(intent.id); if (tile(state.board, intent.x, intent.y) === '#') moving.delete(intent.id); }
  for (const ids of targets.values()) if (ids.length > 1) for (const id of ids) moving.delete(id);
  let changed = true;
  while (changed) {
    changed = false;
    for (const [id, intent] of moving) {
      const occupant = state.players.find(player => player.id !== id && same(player, intent));
      if (occupant && !moving.has(occupant.id)) { moving.delete(id); changed = true; continue; }
      const chain = [id]; let next = occupant;
      while (next && moving.has(next.id)) {
        if (chain.includes(next.id)) { for (const member of chain) if (moving.delete(member)) changed = true; break; }
        chain.push(next.id); const destination = moving.get(next.id); next = state.players.find(player => player.id !== next.id && same(player, destination));
      }
    }
  }
  for (const intent of intents) {
    const player = state.players.find(value => value.id === intent.id);
    if (moving.has(intent.id)) { const from = { x: player.x, y: player.y }; player.x = intent.x; player.y = intent.y; events.push({ type, playerId: player.id, from, to: { x: player.x, y: player.y } }); }
    else events.push({ type: 'blocked', playerId: player.id, reason: type === 'belt-move' ? 'Belt destination blocked or contested.' : 'Destination blocked, contested, or part of a closed swap.' });
  }
}

function shove(state, actor, direction, braced, events) {
  const [dx, dy] = directions[direction], target = { x: actor.x + dx, y: actor.y + dy };
  const victim = state.players.find(player => player.id !== actor.id && same(player, target));
  if (!victim) {
    const crate = state.crates.find(value => same(value, target)), destination = { x: target.x + dx, y: target.y + dy };
    if (crate && tile(state.board, destination.x, destination.y) && !['#', 'x'].includes(tile(state.board, destination.x, destination.y)) && !state.crates.some(value => same(value, destination))) { Object.assign(crate, destination); events.push({ type: 'cargo-shoved', playerId: actor.id, cargoId: crate.id, ...destination }); }
    else events.push({ type: 'shove-missed', playerId: actor.id });
    return;
  }
  const chain = [victim]; let destination;
  while (true) {
    const last = chain.at(-1); destination = { x: last.x + dx, y: last.y + dy };
    if (chain.some(player => braced.has(player.id)) || tile(state.board, destination.x, destination.y) === '#') { events.push({ type: 'shove-blocked', playerId: actor.id }); return; }
    const next = state.players.find(player => same(player, destination)); if (!next) break; chain.push(next); if (chain.length > 4) throw new Error('Invalid push chain.');
  }
  for (const player of chain.toReversed()) { const previous = { x: player.x, y: player.y }; drop(state, player, previous, events); player.x += dx; player.y += dy; events.push({ type: 'shoved', playerId: player.id, by: actor.id, from: previous, to: { x: player.x, y: player.y } }); }
}

function snapshot(state) { return { players: structuredClone(state.players), crates: structuredClone(state.crates) }; }

/** Pure round resolution. State is cloned; the same inputs produce the same events and result. */
export function resolveRound(original, plans) {
  validateState(original);
  if (original.phase !== 'planning') throw new Error('This match has finished.');
  const normalized = new Map();
  for (const player of original.players) normalized.set(player.id, validatePlan(plans[player.id] ?? waitPlan()));
  if (Object.keys(plans).some(id => !normalized.has(id))) throw new Error('A plan belongs to an unknown courier.');
  const state = structuredClone(original), replay = { round: state.round, starting: snapshot(state), plans: Object.fromEntries(normalized), frames: [] };
  for (let beat = 0; beat < 3; beat++) {
    const events = [], braced = new Set(state.players.filter(player => normalized.get(player.id)[beat].kind === 'brace').map(player => player.id));
    const offset = (state.round - 1 + beat) % state.players.length;
    const initiative = [...state.players.slice(offset), ...state.players.slice(0, offset)];
    for (const actor of initiative) { const command = normalized.get(actor.id)[beat]; if (command.kind === 'shove') shove(state, actor, command.direction, braced, events); }
    const moves = state.players.filter(player => normalized.get(player.id)[beat].kind === 'move').map(player => { const [dx, dy] = directions[normalized.get(player.id)[beat].direction]; return { id: player.id, x: player.x + dx, y: player.y + dy }; });
    moveTogether(state, moves, events, 'move'); collect(state, events);
    const belts = state.players.filter(player => !braced.has(player.id) && arrows[tile(state.board, player.x, player.y)]).map(player => { const [dx, dy] = directions[arrows[tile(state.board, player.x, player.y)]]; return { id: player.id, x: player.x + dx, y: player.y + dy }; });
    moveTogether(state, belts, events, 'belt-move');
    const absoluteBeat = (state.round - 1) * 3 + beat;
    for (const player of state.players) { const terrain = tile(state.board, player.x, player.y); if (terrain === null || terrain === 'x' || /^[012]$/.test(terrain) && Number(terrain) === absoluteBeat % 3) reset(state, player, events); }
    collect(state, events); replenish(state, events);
    replay.frames.push({ beat: beat + 1, initiative: initiative.map(player => player.id), ...snapshot(state), events });
  }
  const solo = state.players[0];
  if (state.mode === 'solo' && (solo.score >= state.objective.deliveries || solo.falls > state.objective.maximumFalls) || state.round >= state.roundLimit) {
    state.phase = 'finished'; const highest = Math.max(...state.players.map(player => player.score));
    state.result = { winners: state.mode === 'solo' ? solo.score >= state.objective.deliveries && solo.falls <= state.objective.maximumFalls ? [solo.id] : [] : state.players.filter(player => player.score === highest).map(player => player.id), scores: state.players.map(player => ({ id: player.id, score: player.score, falls: player.falls })), rounds: state.round };
  } else state.round++;
  validateState(state);
  return { state, replay };
}

/** Checks imported local state; live services accept commands only, never a client-provided state or score. */
export function validateState(state) {
  if (!state || state.format !== 1 || state.engineVersion !== engineVersion || !['planning', 'finished'].includes(state.phase)) throw new Error('Unsupported saved match format.');
  fields(state, ['format','engineVersion','board','mode','round','roundLimit','phase','objective','players','crates','nextCrate','sourceCursor','result'], 'Saved match');
  if (!['solo','versus'].includes(state.mode) || state.mode === 'solo' && state.players?.length !== 1 || state.mode === 'versus' && state.players?.length < 2) throw new Error('Invalid saved game mode.');
  validateArena(state.board); integer(state.round, 1, 12, 'Round'); integer(state.roundLimit, state.round, 12, 'Round limit');
  if (!Array.isArray(state.players) || state.players.length < 1 || state.players.length > 4 || new Set(state.players.map(player => player.id)).size !== state.players.length) throw new Error('Invalid saved couriers.');
  const positions = new Set(), cargoIds = new Set(), seats = new Set();
  for (const player of state.players) {
    fields(player, ['id','alias','seat','x','y','score','cargo','falls','delivered'], 'Saved courier');
    if (seats.has(player.seat) || player.cargo !== null && typeof player.cargo !== 'string') throw new Error('Invalid saved courier seat or cargo.'); seats.add(player.seat);
    text(player.id, 'Courier ID', 80); text(player.alias, 'Alias', 24); integer(player.seat, 0, 3, 'Courier seat'); integer(player.x, 0, state.board.tiles[0].length - 1, 'Courier column'); integer(player.y, 0, state.board.tiles.length - 1, 'Courier row'); integer(player.falls, 0, 100, 'Recoveries');
    if (tile(state.board, player.x, player.y) === '#' || positions.has(cell(player)) || !Array.isArray(player.delivered) || player.score !== player.delivered.length) throw new Error('Saved courier positions or deliveries are inconsistent.');
    positions.add(cell(player));
    for (const id of [...player.delivered, ...(player.cargo ? [player.cargo] : [])]) { if (typeof id !== 'string' || !/^crate-[1-9][0-9]{0,3}$/.test(id) || cargoIds.has(id)) throw new Error('A cargo identity was duplicated.'); cargoIds.add(id); }
  }
  if (!Array.isArray(state.crates) || state.crates.length > 6) throw new Error('Invalid saved cargo count.');
  const floor = new Set();
  for (const crate of state.crates) { integer(crate.x, 0, state.board.tiles[0].length - 1, 'Cargo column'); integer(crate.y, 0, state.board.tiles.length - 1, 'Cargo row'); if (tile(state.board, crate.x, crate.y) === '#' || floor.has(cell(crate)) || typeof crate.id !== 'string' || !/^crate-[1-9][0-9]{0,3}$/.test(crate.id) || tile(state.board, crate.x, crate.y) === 'x' || cargoIds.has(crate.id)) throw new Error('Saved cargo positions or identities are inconsistent.'); cargoIds.add(crate.id); floor.add(cell(crate)); }
  integer(state.nextCrate, 1, 1000, 'Cargo sequence');
  if ([...cargoIds].some(id => Number(id.slice(6)) >= state.nextCrate)) throw new Error('Saved cargo sequence is inconsistent.'); integer(state.sourceCursor, 0, 10000, 'Cargo source position');
  fields(state.objective, ['deliveries','maximumFalls'], 'Saved objective');
  integer(state.objective?.deliveries, 1, 12, 'Delivery target'); integer(state.objective?.maximumFalls, 0, 50, 'Fall limit');
  if(state.phase==='planning'&&state.result!==null)throw new Error('An unfinished match cannot contain a final result.');
  if(state.phase==='finished'){
    fields(state.result,['winners','scores','rounds'],'Saved result');
    const result=state.result;if(!Array.isArray(result.winners)||new Set(result.winners).size!==result.winners.length||result.winners.some(id=>!state.players.some(p=>p.id===id))||result.rounds!==state.round||!Array.isArray(result.scores)||canonical(result.scores)!==canonical(state.players.map(p=>({id:p.id,score:p.score,falls:p.falls}))))throw new Error('Saved result does not match its couriers.');
    const highest=Math.max(...state.players.map(p=>p.score)),solo=state.players[0],expected=state.mode==='solo'?(solo.score>=state.objective.deliveries&&solo.falls<=state.objective.maximumFalls?[solo.id]:[]):state.players.filter(p=>p.score===highest).map(p=>p.id);
    if(canonical(result.winners)!==canonical(expected))throw new Error('Saved winners do not match the final score.');
  }
  return state;
}

/** Board-only prediction explicitly assumes other couriers wait; no hidden committed plan is available to this function. */
export function preview(state, playerId, plan) {
  const actor = state.players.find(player => player.id === playerId); if (!actor) throw new Error('Choose your actual courier.');
  return resolveRound(state, { [playerId]: plan }).replay;
}



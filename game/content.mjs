export const engineVersion = '1.0.0';
const yard=(id,title,description,tiles,sources=[{x:3,y:3},{x:5,y:3},{x:4,y:3}])=>({id,title,description,tiles,docks:[{x:1,y:3},{x:7,y:3},{x:4,y:1},{x:4,y:5}],sources});
export const arenas=[
 yard('cross-dock','Cross Dock','Three central crates and two choke posts make the loading lane a shared risk.',['#########','#.......#','#...#...#','#.......#','#...#...#','#.......#','#########']),
 yard('switchback','Switchback Depot','Partition walls make the short line look safer than the long return.',['#########','#.......#','###.#.#.#','#.......#','#.#.#.###','#.......#','#########']),
 yard('belt-loop','Belt Loop','The outer conveyor loop can carry a courier past the turn they needed.',['#########','#..>....#','#.^.#v..#','#.......#','#..^#v..#','#....<..#','#########']),
 yard('pulse-room','Pulse Room','A row of timed shocks rewards choosing the beat as carefully as the route.',['#########','#.......#','#.0.#.2.#','#..1.2..#','#.1.#.0.#','#.......#','#########'],[{x:2,y:3},{x:6,y:3},{x:4,y:3}]),
 yard('glass-causeway','Glass Causeway','Side pits punish a careless shove; the narrow center remains passable.',['#########','#.......#','#.xx.xx.#','#.......#','#.xx.xx.#','#.......#','#########']),
 yard('crate-bazaar','Crate Bazaar','Six loading sources rotate supply. Emptying one aisle can refill another.',['#########','#.......#','#.......#','#.......#','#.......#','#.......#','#########'],[{x:3,y:3},{x:5,y:3},{x:2,y:2},{x:6,y:4},{x:2,y:4},{x:6,y:2}]),
 yard('crosswinds','Crosswinds','Opposing conveyor lanes turn a straight chase into a timing problem.',['#########','#.......#','#...#...#','#.>>.<<.#','#...#...#','#.......#','#########'],[{x:2,y:1},{x:6,y:5},{x:4,y:3}]),
 yard('pocket-locks','Pocket Locks','Cargo sits in open pockets around a pair of central walls. A shove may close the return path.',['#########','#.......#','#.#...#.#','#..#.#..#','#.#...#.#','#.......#','#########'],[{x:2,y:3},{x:6,y:3},{x:4,y:2}]),
 yard('night-shift','Night Shift','A central pulse changes the safe beat while quiet outer corridors remain available.',['#########','#.......#','#..0.2..#','#..1.1..#','#..2.0..#','#.......#','#########'],[{x:2,y:3},{x:6,y:3},{x:4,y:3}]),
 yard('double-helix','Double Helix','Parallel belts trade speed for control; the middle line is the contested alternative.',['#########','#.......#','#.>>>>v.#','#.......#','#.^<<<<.#','#.......#','#########']),
 yard('broken-ring','Broken Ring','A broken ring of pits leaves four gates and a tempting center crossing.',['#########','#.......#','#.x...x.#','#.......#','#.x...x.#','#.......#','#########'],[{x:2,y:3},{x:6,y:3},{x:4,y:3}]),
 yard('last-mile','Last Mile','The loading lane is easy to enter. Upper shocks and lower belts complicate an interception.',['#########','#.......#','#.0...2.#','#.......#','#.>...<.#','#.......#','#########'])
];
const contract=(id,title,arenaId,brief,hint,deliveries=1,rounds=6,maximumFalls=0)=>({id,title,arenaId,brief,hint,deliveries,rounds,maximumFalls});
export const contracts=[
 contract('first-freight','Your first freight','cross-dock','Bring one crate home. Your courier collects it automatically.','Two steps right reach the nearest source. Return to dock 1.',1,4),
 contract('double-dispatch','The second dispatch','cross-dock','The florist needs two separate crates before the yard closes.','A delivered crate is replaced at an open source. Keep the return route short.',2,6),
 contract('paper-route','Paper route','switchback','Deliver the print shop’s midnight paper without a recovery.','The center aisle remains open despite the partition walls.',1,4),
 contract('three-editions','Three editions','switchback','Three editions leave the same loading lane. No room for a fall.','Each round can continue a trip begun by the previous program.',3,8),
 contract('film-canister','Film canister','belt-loop','Return a festival film canister before it joins the outer conveyor.','The middle loading lane has no belts. Learn it before experimenting.',1,4),
 contract('loop-courier','Loop courier','belt-loop','Two crates, one courier, no rescue. Choose which belts are worth entering.','Brace stops a belt during that beat; it does not stop a later beat.',2,6),
 contract('quiet-beat','Quiet beat','pulse-room','Deliver the crate on the near side of the timed floor.','The nearest source is one step right. A shock checks only at the hazard phase.',1,3),
 contract('pulse-parcel','Pulse parcel','pulse-room','The conservatory needs three safe deliveries through the pulsing yard.','A short safe route can beat a dramatic risky one.',3,6),
 contract('glass-letter','The glass letter','glass-causeway','Bring the glass studio’s parcel home without a recovery.','The center aisle is plain floor. Pits are above and below it.',1,4),
 contract('fragile-freight','Fragile freight','glass-causeway','Make two deliveries while keeping the cargo out of the pits.','A shove spills cargo even when it does not cause a fall.',2,6),
 contract('bazaar-opening','Bazaar opening','crate-bazaar','Take one delivery before the six-source market begins to rotate.','The source two steps right is the closest opening cargo.',1,4),
 contract('changing-stock','Changing stock','crate-bazaar','Complete two deliveries as supply shifts to a different aisle.','After the first delivery, look at which sources actually hold crates.',2,8),
 contract('windward','Windward parcel','crosswinds','Collect the northern parcel and return without entering a conveyor.','Go up the left edge, then across the quiet top corridor.',1,6),
 contract('windbreak','Windbreak shift','crosswinds','Bring two northern parcels home; avoid the tempting central belts.','You may plan turns across round boundaries. Four energy is an allowance, not a target.',2,10),
 contract('pocket-ticket','Pocket ticket','pocket-locks','A crate sits only one step away in a wall pocket. Bring it home.','A two-command out-and-back trip fits in one program.',1,3),
 contract('pocket-run','Pocket run','pocket-locks','Make three pocket deliveries without a single recovery.','A wait can be useful when a full three-command program would overshoot.',3,5),
 contract('lamp-delivery','Lamp delivery','night-shift','Keep the theatre’s replacement lamp off the live shock floor.','The near source sits before the pulse strip.',1,3),
 contract('curtain-call','Curtain call','night-shift','Three lamp crates must reach the theatre before the sixth round.','Automatic pickup happens before hazards; plan where the beat ends.',3,6),
 contract('helix-mail','Helix mail','double-helix','Take one parcel through the straight channel between the belts.','The middle corridor is quiet, but other couriers can contest it online.',1,4),
 contract('return-address','Return address','double-helix','Two crates need the same return address. Finish before the sixth round.','A carried crate is visible to everyone. Use braces when a shove is likely.',2,6),
 contract('ring-message','Ring message','broken-ring','Carry a message through one of the broken ring’s gates.','The source one step right has a safe return.',1,3),
 contract('gatekeeper','Gatekeeper shift','broken-ring','Deliver three crates through the left gate without recovery.','The shortest route is not secret. Online, think about what a rival expects.',3,5),
 contract('last-light','Last light','last-mile','Deliver one final lantern before the yard closes.','Start with the central lane; inspect the peripheral hazards afterward.',1,4),
 contract('closing-time','Closing time','last-mile','Three final crates. Eight rounds. Keep every recovery off the report.','Deliveries count once per crate identity, and the source refills after a return.',3,8)
];
export function arenaById(id){const arena=arenas.find(value=>value.id===id);if(!arena)throw new Error('Choose a published arena.');return structuredClone(arena);}
export function contractById(id){const value=contracts.find(contract=>contract.id===id);if(!value)throw new Error('Choose a published solo contract.');return structuredClone(value);}
export function dailyContract(day=new Date().toISOString().slice(0,10)){if(!/^\d{4}-\d{2}-\d{2}$/.test(day))throw new Error('Use a UTC calendar date.');let seed=2166136261;for(const c of day)seed=Math.imul(seed^c.charCodeAt(0),16777619)>>>0;return{day,contractId:contracts[seed%contracts.length].id};}

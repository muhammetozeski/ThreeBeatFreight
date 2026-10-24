export const engineVersion = '1.0.0';

// Authored arenas are original game content. This first proof uses one arena;
// additional content is added only after the full solo/room loop is exercised.
export const arenas = [{
  id: 'cross-dock', title: 'Cross Dock', description: 'A shared loading lane. Your dock is home; the middle is disputed.',
  tiles: ['#########', '#.......#', '#...#...#', '#.......#', '#...#...#', '#.......#', '#########'],
  docks: [{ x: 1, y: 3 }, { x: 7, y: 3 }, { x: 4, y: 1 }, { x: 4, y: 5 }],
  sources: [{ x: 3, y: 3 }, { x: 5, y: 3 }, { x: 4, y: 3 }]
}];

export const contracts = [{
  id: 'first-freight', title: 'Your first freight', arenaId: 'cross-dock', rounds: 6,
  deliveries: 1, maximumFalls: 6,
  brief: 'Bring one crate back to your own dock. A crate is collected automatically when your courier reaches it.',
  hint: 'The nearest crate is two steps to your right. Return to the starting dock to deliver it.',
  medals: { gold: 2, silver: 3 }
}];

export function arenaById(id) {
  const value = arenas.find(arena => arena.id === id);
  if (!value) throw new Error('Choose an available arena.');
  return structuredClone(value);
}

export function contractById(id) {
  const value = contracts.find(contract => contract.id === id);
  if (!value) throw new Error('Choose an available solo contract.');
  return structuredClone(value);
}

import{resolveRound,waitPlan,directions,commandCost}from'./engine.mjs';
// A clearly labeled local opponent. It reads only public pre-round state, never the human program.
export function localRivalPlan(state,id){
 const actor=state.players.find(p=>p.id===id);if(!actor)throw new Error('Unknown local rival.');
 const options=[{kind:'wait',direction:null},{kind:'brace',direction:null},...Object.keys(directions).map(direction=>({kind:'move',direction}))];
 const candidates=[];for(const a of options)for(const b of options)for(const c of options)candidates.push([a,b,c]);
 for(let slot=0;slot<3;slot++)for(const direction of Object.keys(directions))for(const other of Object.keys(directions)){const plan=waitPlan();plan[slot]={kind:'shove',direction};plan[(slot+1)%3]={kind:'move',direction};plan[(slot+2)%3]={kind:'move',direction:other};candidates.push(plan);}
 let best=waitPlan(),bestScore=-Infinity;
 for(const plan of candidates){const result=resolveRound(state,{[id]:plan}),next=result.state.players.find(p=>p.id===id);const targets=next.cargo?[state.board.docks[next.seat]]:result.state.crates;const distance=targets.length?Math.min(...targets.map(point=>Math.abs(point.x-next.x)+Math.abs(point.y-next.y))):10;const score=(next.score-actor.score)*1000+(next.cargo?40:0)-distance*3-(next.falls-actor.falls)*100-plan.reduce((sum,c)=>sum+commandCost[c.kind],0)*.1;if(score>bestScore){bestScore=score;best=plan;}}
 return structuredClone(best);
}

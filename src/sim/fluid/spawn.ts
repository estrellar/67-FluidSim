import { SPHState } from "./state";
import { MAX_PARTICLES } from "./constants";


export function spawn(state:SPHState, x: number, y: number, vx: number, vy: number, lifetime: number) {
  if (state.activeCount >= MAX_PARTICLES) return;  // pool full, drop
  const i = state.activeCount++;
  state.positions[i*2] = x;
  state.positions[i*2 + 1] = y;
  state.velocities[i*2] = vx;
  state.velocities[i*2 + 1] = vy;
  state.ages[i] = 0;
  state.lifetimes[i] = lifetime;
}


export function despawn(state:SPHState){
  //despawn by consolidating particles that have not aged out
  let w = 0;
  for(let i = 0; i < state.activeCount; i++){
    if(state.ages[i] < state.lifetimes[i]){
      if(w !== i){
        state.positions[w*2] = state.positions[i*2];
        state.positions[w*2 + 1] = state.positions[i*2 + 1];
        state.velocities[w*2] = state.velocities[i*2];
        state.velocities[w*2 + 1] = state.velocities[i*2 + 1]
        state.ages[w] = state.ages[i];
        state.lifetimes[w] = state.lifetimes[i];
      }
      w++;
    }
  }
  state.activeCount = w;
}


//export function emitFromSkeleton(state: SPHState, activeCount: number)
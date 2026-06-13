import { rebuild } from "./fluid/neighbors";
import { params } from "./fluid/params";
import { computePressuresAndDensities } from "./fluid/pressdens";
import { relax } from "./fluid/relaxation";
import { despawn } from "./fluid/spawn";
import { SPHState } from "./fluid/state";
import { applyViscosity } from "./fluid/viscosity";

export function sim(state: SPHState, dt:number){
    const NUM_PARTICLES = state.activeCount

    rebuild(state.positions, NUM_PARTICLES);
    applyViscosity(state, dt);

    for(let i = 0; i < NUM_PARTICLES; i++){
        
        const xIdx = i*2, yIdx = i*2 + 1;

        state.velocities[yIdx] += params.gravity*dt;

        state.previousPositions[xIdx] = state.positions[xIdx];
        state.previousPositions[yIdx] = state.positions[yIdx];    
        
        state.positions[xIdx] += state.velocities[xIdx]*dt;
        state.positions[yIdx] += state.velocities[yIdx]*dt;
    }
    rebuild(state.positions, NUM_PARTICLES);
    computePressuresAndDensities(state);
    relax(state, dt*dt);
    
    //keep particles in boundaries and update velocities
    // from position changes
    for(let i = 0; i < NUM_PARTICLES; i++){
        const xIdx = i*2, yIdx = i*2 + 1;

        //clamp, clamp, clamp, clamp your hands
        if(state.positions[xIdx] < -1) state.positions[xIdx] = -1;
        else if(state.positions[xIdx] > 1) state.positions[xIdx] = 1;
        if(state.positions[yIdx] < -1) state.positions[yIdx] = -1;
        else if(state.positions[yIdx] > 1) state.positions[yIdx] = 1;

        state.velocities[xIdx] = (state.positions[xIdx] - state.previousPositions[xIdx]) / dt;
        state.velocities[yIdx] = (state.positions[yIdx] - state.previousPositions[yIdx]) / dt;

        state.ages[i] += dt;
    }

    despawn(state);
    
}

import { MAX_PARTICLES } from "./constants";
import { forEachNeighbor } from "./neighbors";
import { SPHState } from "./state";

//randomized indices to avoid bias from neighbor matches
const randomizedIndices = new Int32Array(MAX_PARTICLES);
for(let i  = 0; i < MAX_PARTICLES; i++){
    randomizedIndices[i] = i;
}
for(let k = MAX_PARTICLES - 1; k > 0; k--){
    const randomIdx = (Math.random() * (k + 1)) | 0;
    const tmp = randomizedIndices[k];
    randomizedIndices[k] = randomizedIndices[randomIdx];
    randomizedIndices[randomIdx] = tmp
}
export function relax(state: SPHState, dt2: number){
    for(let p = 0; p < state.activeCount; p++){
        const i = randomizedIndices[p];
        let accumX = 0, accumY = 0;
        forEachNeighbor(i, state.positions, (j, dx, dy, r, q) => {
            //relaxation on pairs of neighbor particles
            if(j <= i) return; //skip half the pairs
            const mag = dt2*((state.pressures[i] + state.pressures[j])*q 
                + (state.pressuresNear[i] + state.pressuresNear[j])*q*q);
            const displacementX = mag*(dx/r);
            const displacementY = mag*(dy/r);
            state.positions[j*2] += 0.5*displacementX;
            state.positions[j*2 + 1] += 0.5*displacementY;
            
            //accumulate displacement for each neighbor to avoid
            // working with displaced particle for each neighbor 
            accumX -= 0.5*displacementX;
            accumY -= 0.5*displacementY;
        })
        //apply summed displacements
        state.positions[i*2] += accumX;
        state.positions[i*2 + 1] += accumY;
    }
}
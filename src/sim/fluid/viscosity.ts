import { forEachNeighbor } from "./neighbors";
import { SPHState } from "./state";
import { params } from "./params";

export function applyViscosity(state: SPHState, dt: number){

    for(let i = 0; i < state.activeCount; i++){
        let accumX = 0;
        let accumY = 0;
        forEachNeighbor(i, state.positions, (j, dx, dy, r, q) => {
            if(j <= i) return;

            const invR = 1/r;
            const nx = dx*invR;
            const ny = dy*invR;

            const dvx = state.velocities[i*2] - state.velocities[j*2];
            const dvy = state.velocities[i*2 + 1] - state.velocities[j*2 + 1];
            const uRel = dvx*nx + dvy*ny;

            if(uRel <= 0)return;

            const impulse = dt*q*(params.viscAlhpa*uRel + params.viscBeta*uRel*uRel);

            const ix = impulse*nx;
            const iy = impulse*ny;

            state.velocities[j*2] += 0.5*ix;
            state.velocities[j*2+1] += 0.5*iy;

            accumX -= 0.5*ix;
            accumY -= 0.5*iy;
        });

        state.velocities[i*2] += accumX;
        state.velocities[i*2 + 1] += accumY;
    }
}
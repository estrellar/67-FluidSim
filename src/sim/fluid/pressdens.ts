import { forEachNeighbor } from "./neighbors";
import { params } from "./params";
import { SPHState } from "./state";

export function computePressuresAndDensities(state: SPHState){
    for(let i = 0; i < state.activeCount; i++){
        let rho = 0;
        let rhoNear = 0;
        forEachNeighbor(i, state.positions, (j, dx, dy, r, q) => {
            rho += q*q;
            rhoNear += q*q*q;
        });
        state.densities[i] = rho;
        state.densitiesNear[i] = rhoNear;
        state.pressures[i] = params.stiffness * (rho - params.restDensity);
        state.pressuresNear[i] = params.stiffnessNear * rhoNear;
    }
}
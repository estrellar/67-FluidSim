import { forEachNeighbor } from "./neighbors";
import { SPHState } from "./state";

/**
 * Double-density relaxation SPH,
 * as defined in Clavet et al.
 * https://www.ljll.fr/~frey/papers/levelsets/Clavet%20S.,%20Particle-based%20viscoelastic%20fluid%20simulation.pdf
 * In short, calculations for determining density
 * determined by neighbor particles while also preventing clustering
 * @param state - {SPHState}
 */
export function computeDensities(state: SPHState){
    for(let i = 0; i < state.activeCount; i++){
        let rho = 0;
        let rhoNear = 0;
        forEachNeighbor(i, state.positions, (j, dx, dy, r, q) => {
            rho += q*q;
            rhoNear += q*q*q;
        });
        state.densities[i] = rho;
        state.densitiesNear[i] = rhoNear;
    }
}
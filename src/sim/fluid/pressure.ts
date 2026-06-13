import {params } from "./params";
import { SPHState } from "./state";

export function computePressures(state: SPHState){
    for(let i = 0; i < state.activeCount; i++){
        state.pressures[i] = params.stiffness*(state.densities[i] - params.restDensity);
        state.pressuresNear[i] = state.pressures[i]*params.stiffnessNear;
    }
}
import { MAX_PARTICLES } from "./constants";


export interface SPHState {
    positions: Float32Array; //N*2
    previousPositions: Float32Array //N*2
    velocities: Float32Array; //N*2
    densities: Float32Array; //N
    densitiesNear: Float32Array; //N
    pressures: Float32Array; //N
    pressuresNear: Float32Array; //N
    ages: Float32Array; //N
    lifetimes: Float32Array;
    activeCount: number;
}




export function createSPHState(): SPHState{
    let state: SPHState = {
        positions: new Float32Array(MAX_PARTICLES*2),
        previousPositions: new Float32Array(MAX_PARTICLES * 2),
        velocities: new Float32Array(MAX_PARTICLES * 2),
        densities: new Float32Array(MAX_PARTICLES),
        densitiesNear: new Float32Array(MAX_PARTICLES),
        pressures: new Float32Array(MAX_PARTICLES),
        pressuresNear: new Float32Array(MAX_PARTICLES),
        ages: new Float32Array(MAX_PARTICLES),
        lifetimes: new Float32Array(MAX_PARTICLES),
        activeCount:0,
    }
    return state;
}
import {EPSILON_SQR, GRID_COUNT, GRID_SIZE, SMOOTHING_RADIUS } from "./constants";

/*************** PROPS ****************/
//mapping of particle positions into cell buckets
const bucketGrid: number[][][] = [];
for (let cx = 0; cx < GRID_COUNT; cx++) {
    bucketGrid[cx] = [];
    for (let cy = 0; cy < GRID_COUNT; cy++) {
        bucketGrid[cx][cy] = [];
    }
}
//precompute the clamped cell neighbors
type CellCoord = readonly [number, number];
const cellNeighbors: CellCoord[][][] = [];
for (let cx = 0; cx < GRID_COUNT; cx++) {
    cellNeighbors[cx] = [];
    for (let cy = 0; cy < GRID_COUNT; cy++) {
        const neighbors: CellCoord[] = [];
        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                const nx = cx + dx;
                const ny = cy + dy;
                if (nx >= 0 && nx < GRID_COUNT && ny >= 0 && ny < GRID_COUNT) {
                    neighbors.push([nx, ny]);
                }
            }
        }
    cellNeighbors[cx][cy] = neighbors;
    }
}

/****************** HELPERS ********************/
/**
 * Get cell coord [0, 2/GRID_SIZE) of position [-1.0, 1.0]
 * @param x - {number}
 * @returns number
 */
function worldToCell(x: number): number {
    const cell = Math.floor((x + 1.0) / GRID_SIZE);
    //clamping to min/max
    if (cell < 0) return 0;
    if (cell >= GRID_COUNT) return GRID_COUNT - 1;
    return cell;
}


/**
 * clear the cells of the current
 */
function clearCells():void{
    for(let row = 0; row < GRID_COUNT; row++){
         for(let col = 0; col < GRID_COUNT; col++){
            bucketGrid[row][col].length = 0;//empty instead of reallocating 
         }
    }
}

/****************** EXPORTS ******************/
/**
 * Bucket each grid into cells for neighbor lookup

 * @param positions - {Float32Array<ArrayBuffer>}
 * @param activeCount - {number}
 */
export function rebuild(positions: Float32Array, activeCount: number){
    clearCells();
    for(let i = 0; i < activeCount; i++){
        const cx = worldToCell(positions[i*2]);
        const cy = worldToCell(positions[i*2 + 1]);
        bucketGrid[cx][cy].push(i);
    }
}


/**
 * Iterator to get the neighbors of a partocular
 * and evoke a callback for each
 * @param particleIdx - {number}
 * @param positions - {Float32Array<ArrayBuffer>}
 * @param callback - {(candidateIdx: number, r: number) => void}
 */

export function forEachNeighbor(
    particleIdx: number, 
    positions: Float32Array,
    callback: (candidateIdx: number, dx: number, dy: number, r: number, q:number) => void
): void{
    //position of particle
    const particleX = positions[particleIdx*2];
    const particleY = positions[particleIdx*2 + 1];

    //cell coords
    const particleCx = worldToCell(particleX);
    const particleCy = worldToCell(particleY);
    //precomputed cells 
    const neighbors = cellNeighbors[particleCx][particleCy]
    //loop through neighbor cells
    for(let i = 0; i < neighbors.length; i++){
        const [cx, cy] = neighbors[i];
        const bucket = bucketGrid[cx][cy];
        //check if particle is neighborly
        for(let j = 0; j < bucket.length; j++){
            const candidateIdx = bucket[j];
            //you are not your neighbor
            if(candidateIdx === particleIdx) continue;
            
            const candidateX = positions[candidateIdx*2];
            const candidateY = positions[candidateIdx*2 + 1];
            
            //pythagorean radius check
            const dx = candidateX - particleX;
            const dy = candidateY - particleY;
            const rSqr = dx*dx + dy*dy;
            if(rSqr < EPSILON_SQR) continue;
            if(rSqr < SMOOTHING_RADIUS * SMOOTHING_RADIUS){
                //howdy-doody neighborino
                //on neighbor validation evoke callback
                const r = Math.sqrt(rSqr);
                callback(candidateIdx, dx, dy, r, 1 - r/SMOOTHING_RADIUS);
            }
        }
    }

}



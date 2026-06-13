//render domain split into grids
export const GRID_SIZE = 0.05;
//[-1, 1] range split into grids
export const GRID_COUNT = Math.ceil(2.0 / GRID_SIZE);

//radius for each particles influence on density and domain
export const SMOOTHING_RADIUS = 0.04;
//minimum difference required for neighbor distance calc
export const EPSILON_SQR = 1e-12;


export const MAX_PARTICLES = 3000;




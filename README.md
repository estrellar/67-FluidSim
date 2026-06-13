# Smoothed Particle Hydrodynamics (SPH)
This project partially implements SPH as defined in Particle-based Viscoelastic Fluid Simulation by [Clavet et al](https://www.ljll.fr/~frey/papers/levelsets/Clavet%20S.,%20Particle-based%20viscoelastic%20fluid%20simulation.pdf)


Each frame a particle does the following:
- apply gravity (tuned to the sim, not exactly -9.8Gs)
- apply viscosity (neighbor-influenced velocity)
- record particle position
- predict (tentative step in current direction)
- bucket (put particles into buckets for neighbor look-up)
- density (determine how "crowded" a particle is)
- pressure (crowded particles push out, sparse pull in, this gives surface tension)
- relax (pairs of nieghbor particles adjust positions)
- boudaries (just edge boundaries but any interactable object would calculate collisions here)
- derive (from the old positions and applied operations, move through velocity)
- age (all particles increment age. Happy Birthday!)
- despawn (Ahh entropy, even particles die)


# Game
⁶🤷‍♂️⁷
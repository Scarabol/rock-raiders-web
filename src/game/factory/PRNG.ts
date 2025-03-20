import { SeededRandomGenerator } from '../../core/SeededRandomGenerator'
import { VERBOSE } from '../../params'

export class PRNG {
    static readonly terrain: SeededRandomGenerator = new SeededRandomGenerator()
    static readonly movement: SeededRandomGenerator = new SeededRandomGenerator()
    static readonly damage: SeededRandomGenerator = new SeededRandomGenerator()
    static readonly animation: SeededRandomGenerator = new SeededRandomGenerator()
    static readonly nerp: SeededRandomGenerator = new SeededRandomGenerator()

    static readonly unsafe: SeededRandomGenerator = new SeededRandomGenerator().setSeed(Math.random().toString().substring(2))

    static setSeed(masterSeed: string) {
        console.log(`Seeding random generators with master seed "${masterSeed}"`)
        const master = new SeededRandomGenerator().setSeed(masterSeed)
        const terrainSeed = master.random().toString() // Changing order breaks determinism!
        if (VERBOSE) console.log('random terrain seed', terrainSeed)
        this.terrain.setSeed(terrainSeed)
        const movementSeed = master.random().toString() // Changing order breaks determinism!
        if (VERBOSE) console.log('random movement seed', movementSeed)
        this.movement.setSeed(movementSeed)
        const damageSeed = master.random().toString() // Changing order breaks determinism!
        if (VERBOSE) console.log('random damage seed', damageSeed)
        this.damage.setSeed(damageSeed)
        const animationSeed = master.random().toString() // Changing order breaks determinism!
        if (VERBOSE) console.log('random animation seed', animationSeed)
        this.animation.setSeed(animationSeed)
        const nerpSeed = master.random().toString() // Changing order breaks determinism!
        if (VERBOSE) console.log('random nerp seed', nerpSeed)
        this.nerp.setSeed(nerpSeed)
    }
}

import { LevelConfData } from './LevelLoader'
import { EntityType } from './model/EntityType'
import { NerpScript } from '../nerp/NerpScript'
import { LevelObjectiveTextEntry } from '../resource/fileparser/ObjectiveTextParser'
import { GameConfig } from '../cfg/GameConfig'
import { LevelRewardConfig, ObjectiveImageCfg } from '../cfg/LevelsCfg'
import { ObjectListEntryCfg } from '../cfg/ObjectListEntryCfg'
import { DEV_MODE } from '../params'
import { SeededRandomGenerator } from '../core/SeededRandomGenerator'

function generateCave(prng, width, height, crystalsMin, crystalsMax, oresMax) {
    if (width < 15 || height < 15) {
        throw new Error('Width and height must be at least 15.')
    }

    const wallDensity = 0.60
    const iterations = 3

    // Initialize the predugMap with walls (0)
    let predugMap = Array.from({length: height}, () => Array(width).fill(0))

    // Create cavern randomly based on wall density
    const wallMargin = 6
    for (let y = wallMargin; y < height - wallMargin; y++) {
        for (let x = wallMargin; x < width - wallMargin; x++) {
            predugMap[y][x] = prng.random() < wallDensity ? 0 : 2 // 0 = wall, 2 = ground
        }
    }

    // Smooth the cave structure
    for (let i = 0; i < iterations; i++) {
        predugMap = smoothCave(predugMap)
    }

    // Pick random start position
    const grounds = []
    const walls = []
    const startMargin = 7
    for (let y = startMargin; y < height - startMargin; y++) {
        for (let x = startMargin; x < width - startMargin; x++) {
            if (predugMap[y][x] === 2) {
                grounds.push({x, y})
            } else {
                walls.push({x, y})
            }
        }
    }
    let startPosition = prng.sample(grounds)

    // Perform BFS to mark connected hidden grounds (2s) as exposed (1s)
    floodFill(predugMap, startPosition.x, startPosition.y)

    // Initialize terrainMap to track durability of walls
    let terrainMap = Array.from({length: height}, () => Array(width).fill(1))

    // Randomly assign durability to walls
    for (let y = wallMargin; y < height - wallMargin; y++) {
        for (let x = wallMargin; x < width - wallMargin; x++) {
            if (predugMap[y][x] === 0) {
                let rand = prng.random()
                if (rand < 0.15) terrainMap[y][x] = 2
                else if (rand < 0.50) terrainMap[y][x] = 3
                else if (rand < 0.75) terrainMap[y][x] = 4
            }
        }
    }

    // Initialize cryOreMap and fill with resources
    let cryOreMap = Array.from({length: height}, () => Array(width).fill(0))

    if (crystalsMax < crystalsMin) throw new Error(`Invalid number of crystals given; ${crystalsMax} < ${crystalsMin}`)
    const numCrystals = crystalsMin + prng.randInt(crystalsMax - crystalsMin)
    for (let c = 0; c < numCrystals; c++) {
        const targetWall = prng.sample(walls)
        if (!targetWall) throw new Error('No wall to place crystal')
        const prev = cryOreMap[targetWall.y][targetWall.x]
        cryOreMap[targetWall.y][targetWall.x] = prev > 0 ? prev + 2 : 1
    }

    function findEmptyWall(walls) {
        for (let t = 0; t < 20; t++) {
            const result = prng.sample(walls)
            if (cryOreMap[result.y][result.x] === 0) return result
        }
        throw new Error('Could not find empty wall to place ores')
    }

    if (oresMax < 0) throw new Error('Invalid number of ores given')
    for (let c = 0; c < oresMax; c++) {
        const targetWall = findEmptyWall(walls)
        cryOreMap[targetWall.y][targetWall.x] += 2
    }

    // Add challenges to the map
    // FIXME Add emerge map
    // FIXME Add erosion map and lava streams
    // FIXME Add slugs
    // FIXME Add bats and sleeping rockies

    return {
        terrainMap,
        startPosition,
        predugMap,
        cryOreMap,
        mapWidth: width,
        mapHeight: height
    }
}

function smoothCave(map) {
    const newMap = map.map(arr => arr.slice())
    for (let y = 1; y < map.length - 1; y++) {
        for (let x = 1; x < map[0].length - 1; x++) {
            let wallCount = 0
            // Count walls around the current cell
            for (let ny = -1; ny <= 1; ny++) {
                for (let nx = -1; nx <= 1; nx++) {
                    if (map[y + ny][x + nx] === 0) wallCount++
                }
            }
            if (wallCount > 4) {
                newMap[y][x] = 0 // Set to wall
            } else {
                newMap[y][x] = 2 // Keep as ground
            }
        }
    }
    return newMap
}

function floodFill(map, x, y) {
    // Use a queue for BFS
    const queue = [[x, y]]
    while (queue.length > 0) {
        const [cx, cy] = queue.shift()
        if (map[cy][cx] === 2) {
            map[cy][cx] = 1; // Mark as traversable
            // Check 4 possible directions
            [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy]) => {
                const nx = cx + dx, ny = cy + dy
                if (map[ny] && map[ny][nx] === 2) {
                    queue.push([nx, ny])
                }
            })
        }
    }
}

export class LevelGen {
    static fromSeed(seed: string): LevelConfData {
        console.log(`Generating level from seed "${seed}"`)
        const prng = new SeededRandomGenerator().setSeed(seed)

        const objectiveImageCfg = new ObjectiveImageCfg()
        objectiveImageCfg.filename = 'Interface/BriefingPanel/BriefingPanel.bmp'
        objectiveImageCfg.x = 76
        objectiveImageCfg.y = 100
        const cave = generateCave(prng, 50, 50, 15, 50, 100)

        // Display the cave structure
        // console.log('Terrain Map:')
        // console.log(cave.terrainMap.map(row => row.join(' ')).join('\n'))
        // console.log('Start Position:', cave.startPosition)
        // console.log('Predug Map:')
        // console.log(cave.predugMap.map(row => row.join(' ')).join('\n'))
        // console.log('Cry Ore Map:')
        // console.log(cave.cryOreMap.map(row => row.join(' ')).join('\n'))

        const objectList = new Map<string, ObjectListEntryCfg>()
        objectList.set('Object1', {
            type: 'TVCamera',
            xPos: cave.startPosition.x, // TODO Move camera back to actual start
            yPos: cave.startPosition.y,
            // xPos: Math.round(cave.mapWidth / 2),
            // yPos: Math.round(cave.mapHeight / 2),
            heading: 0,
        })
        objectList.set('Object2', {
            type: 'Toolstation',
            xPos: cave.startPosition.x + 0.5,
            yPos: cave.startPosition.y + 0.5,
            heading: 90 * prng.randInt(3),
        })
        return {
            blockPointersMap: undefined,
            cryOreMap: cave.cryOreMap,
            disableEndTeleport: DEV_MODE,
            disableStartTeleport: true,
            emergeCreature: EntityType.ROCK_MONSTER,
            emergeMap: undefined,
            emergeTimeOutMs: 0,
            erodeErodeTimeMs: 0,
            erodeLockTimeMs: 0,
            erodeMap: undefined,
            erodeTriggerTimeMs: 0,
            fallinMap: undefined,
            fallinMultiplier: 0,
            fogColor: [110, 110, 155].map((c) => Math.round(c / 255)) as [number, number, number],
            fullName: `Level from seed ${seed}`,
            generateSpiders: false,
            levelName: 'levelseed',
            mapHeight: cave.mapHeight,
            mapWidth: cave.mapWidth,
            nerpMessages: [],
            nerpScript: new NerpScript(),
            noMultiSelect: false,
            objectList: objectList,
            objectiveImage: objectiveImageCfg,
            objectiveTextCfg: new LevelObjectiveTextEntry(),
            oxygenRate: 0,
            pathMap: undefined,
            predugMap: cave.predugMap,
            priorities: [],
            reward: new LevelRewardConfig(),
            rockFallStyle: GameConfig.instance.rockFallStyles['rock'],
            roofTexture: 'World/WorldTextures/rockroof.bmp',
            surfaceMap: undefined,
            terrainMap: cave.terrainMap,
            textureBasename: 'World/WorldTextures/RockSplit/Rock',
            video: ''
        }
    }
}

import { ConfigSetFromRecord } from './Configurable'
import { CfgEntry } from './CfgEntry'

export class MiscObjectsCfg implements ConfigSetFromRecord {
    boulder: string = ''
    pusher: string = ''
    freezer: string = ''
    boulderExplode: string = ''
    boulderExplodeIce: string = ''
    laserShot: string = ''
    smashPath: string = ''
    crystal: string = ''
    dynamite: string = ''
    ore: string = ''
    processedOre: string = ''
    barrier: string = ''
    explosion: string = ''
    electricFence: string = ''
    electricFenceStud: string = ''
    shortElectricFenceBeam: string = ''
    longElectricFenceBeam: string = ''
    spiderWeb: string = ''
    pillar: string = ''
    rechargeSparkle: string = ''
    miniTeleportUp: string = ''
    oohScary: string = ''
    lazerHit: string = ''
    pusherHit: string = ''
    freezerHit: string = ''
    iceCube: string = ''
    pathDust: string = ''
    lavaErosionSmoke1: string = ''
    lavaErosionSmoke2: string = ''
    lavaErosionSmoke3: string = ''
    lavaErosionSmoke4: string = ''
    birdScarer: string = ''
    upgradeEffect: string = ''

    setFromRecord(cfgValue: CfgEntry): this {
        this.boulder = cfgValue.getValue('Boulder').toFileName()
        this.pusher = cfgValue.getValue('Pusher').toFileName()
        this.freezer = cfgValue.getValue('Freezer').toFileName()
        this.boulderExplode = cfgValue.getValue('BoulderExplode').toFileName()
        this.boulderExplodeIce = cfgValue.getValue('BoulderExplodeIce').toFileName()
        this.laserShot = cfgValue.getValue('LaserShot').toFileName()
        this.smashPath = cfgValue.getValue('SmashPath').toFileName()
        this.crystal = cfgValue.getValue('Crystal').toFileName()
        this.dynamite = cfgValue.getValue('Dynamite').toFileName()
        this.ore = cfgValue.getValue('Ore').toFileName()
        this.processedOre = cfgValue.getValue('ProcessedOre').toFileName()
        this.barrier = cfgValue.getValue('Barrier').toFileName()
        this.explosion = cfgValue.getValue('Explosion').toFileName()
        this.electricFence = cfgValue.getValue('ElectricFence').toFileName()
        this.electricFenceStud = cfgValue.getValue('ElectricFenceStud').toFileName()
        this.shortElectricFenceBeam = cfgValue.getValue('ShortElectricFenceBeam').toFileName()
        this.longElectricFenceBeam = cfgValue.getValue('LongElectricFenceBeam').toFileName()
        this.spiderWeb = cfgValue.getValue('SpiderWeb').toFileName()
        this.pillar = cfgValue.getValue('Pillar').toFileName()
        this.rechargeSparkle = cfgValue.getValue('RechargeSparkle').toFileName()
        this.miniTeleportUp = cfgValue.getValue('MiniTeleportUp').toFileName()
        this.oohScary = cfgValue.getValue('OohScary').toFileName()
        this.lazerHit = cfgValue.getValue('LazerHit').toFileName()
        this.pusherHit = cfgValue.getValue('PusherHit').toFileName()
        this.freezerHit = cfgValue.getValue('FreezerHit').toFileName()
        this.iceCube = cfgValue.getValue('IceCube').toFileName()
        this.pathDust = cfgValue.getValue('PathDust').toFileName()
        this.lavaErosionSmoke1 = cfgValue.getValue('LavaErosionSmoke1').toFileName()
        this.lavaErosionSmoke2 = cfgValue.getValue('LavaErosionSmoke2').toFileName()
        this.lavaErosionSmoke3 = cfgValue.getValue('LavaErosionSmoke3').toFileName()
        this.lavaErosionSmoke4 = cfgValue.getValue('LavaErosionSmoke4').toFileName()
        this.birdScarer = cfgValue.getValue('BirdScarer').toFileName()
        this.upgradeEffect = cfgValue.getValue('UpgradeEffect').toFileName()
        return this
    }
}

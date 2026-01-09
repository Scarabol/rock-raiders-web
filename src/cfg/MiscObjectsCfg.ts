import { CfgEntry } from './CfgEntry'

export class MiscObjectsCfg {
    [s: string]: string

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

    static setFromList(cfg: MiscObjectsCfg, cfgValue: CfgEntry): void {
        cfg.boulder = cfgValue.getValue('Boulder').toFileName()
        cfg.pusher = cfgValue.getValue('Pusher').toFileName()
        cfg.freezer = cfgValue.getValue('Freezer').toFileName()
        cfg.boulderExplode = cfgValue.getValue('BoulderExplode').toFileName()
        cfg.boulderExplodeIce = cfgValue.getValue('BoulderExplodeIce').toFileName()
        cfg.laserShot = cfgValue.getValue('LaserShot').toFileName()
        cfg.smashPath = cfgValue.getValue('SmashPath').toFileName()
        cfg.crystal = cfgValue.getValue('Crystal').toFileName()
        cfg.dynamite = cfgValue.getValue('Dynamite').toFileName()
        cfg.ore = cfgValue.getValue('Ore').toFileName()
        cfg.processedOre = cfgValue.getValue('ProcessedOre').toFileName()
        cfg.barrier = cfgValue.getValue('Barrier').toFileName()
        cfg.explosion = cfgValue.getValue('Explosion').toFileName()
        cfg.electricFence = cfgValue.getValue('ElectricFence').toFileName()
        cfg.electricFenceStud = cfgValue.getValue('ElectricFenceStud').toFileName()
        cfg.shortElectricFenceBeam = cfgValue.getValue('ShortElectricFenceBeam').toFileName()
        cfg.longElectricFenceBeam = cfgValue.getValue('LongElectricFenceBeam').toFileName()
        cfg.spiderWeb = cfgValue.getValue('SpiderWeb').toFileName()
        cfg.pillar = cfgValue.getValue('Pillar').toFileName()
        cfg.rechargeSparkle = cfgValue.getValue('RechargeSparkle').toFileName()
        cfg.miniTeleportUp = cfgValue.getValue('MiniTeleportUp').toFileName()
        cfg.oohScary = cfgValue.getValue('OohScary').toFileName()
        cfg.lazerHit = cfgValue.getValue('LazerHit').toFileName()
        cfg.pusherHit = cfgValue.getValue('PusherHit').toFileName()
        cfg.freezerHit = cfgValue.getValue('FreezerHit').toFileName()
        cfg.iceCube = cfgValue.getValue('IceCube').toFileName()
        cfg.pathDust = cfgValue.getValue('PathDust').toFileName()
        cfg.lavaErosionSmoke1 = cfgValue.getValue('LavaErosionSmoke1').toFileName()
        cfg.lavaErosionSmoke2 = cfgValue.getValue('LavaErosionSmoke2').toFileName()
        cfg.lavaErosionSmoke3 = cfgValue.getValue('LavaErosionSmoke3').toFileName()
        cfg.lavaErosionSmoke4 = cfgValue.getValue('LavaErosionSmoke4').toFileName()
        cfg.birdScarer = cfgValue.getValue('BirdScarer').toFileName()
        cfg.upgradeEffect = cfgValue.getValue('UpgradeEffect').toFileName()
    }
}

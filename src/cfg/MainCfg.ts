import { Rect } from '../core/Rect'
import { ConfigSetFromRecord } from './Configurable'
import { CfgEntry } from './CfgEntry'

export class MainCfg implements ConfigSetFromRecord {
    creditsTextFile: string = ''
    creditsBackAVI: string = ''
    loadScreen: string = ''
    progressBar: string = ''
    progressWindow: Rect = new Rect()
    loadingText: string = ''
    nextButton: string = ''
    nextButtonPos: { x: number, y: number } = {x: 0, y: 0}
    backButton: string = ''
    backButtonPos: { x: number, y: number } = {x: 0, y: 0}
    backArrow: string = ''
    buildingUpgradeCostOre: number = 0
    buildingUpgradeCostStuds: number = 0
    textPauseTimeMs = 0 // Time in seconds that the Text_ messages last.
    startLevel: string = ''
    tutorialStartLevel: string = ''
    ambientRGB: [r: number, g: number, b: number] = [0, 0, 0]
    powerCrystalRGB: [r: number, g: number, b: number] = [0, 0, 0]
    unpoweredCrystalRGB: [r: number, g: number, b: number] = [0, 0, 0]
    minDist: number = 0.0 // minimum camera distance
    maxDist: number = 0.0 // maximum camera distance
    minTilt: number = 0.0
    maxTilt: number = 0.0
    CameraSpeed: number = 0.0
    DynamiteDamageRadius: number = 0.0
    DynamiteMaxDamage: number = 0.0
    rrAvi = ''
    missionBriefingText: string = ''
    missionCompletedText: string = ''
    missionFailedText: string = ''
    tutorialIcon: string = ''

    setFromRecord(cfgValue: CfgEntry): this {
        this.creditsTextFile = cfgValue.getValue('CreditsTextFile').toFileName()
        this.creditsBackAVI = cfgValue.getValue('CreditsBackAVI').toFileName()
        this.loadScreen = cfgValue.getValue('LoadScreen').toFileName()
        this.progressBar = cfgValue.getValue('ProgressBar').toFileName()
        // XXX Find better edge-case handling: "ProgressWindow" starts with "R:" instead of numbers
        const rectVal = cfgValue.getValue('ProgressWindow').toArray(':', 2)[1]
        this.progressWindow = Rect.fromArray(rectVal.toArray(',', 4).map((v) => v.toNumber()))
        this.loadingText = cfgValue.getValue('LoadingText').toLabel()
        this.nextButton = cfgValue.getValue('NextButton640x480').toFileName()
        this.nextButtonPos = cfgValue.getValue('NextButtonPos640x480').toPos(',')
        this.backButton = cfgValue.getValue('BackButton640x480').toFileName()
        this.backButtonPos = cfgValue.getValue('BackButtonPos640x480').toPos(',')
        this.backArrow = cfgValue.getValue('BackArrow').toFileName()
        this.buildingUpgradeCostOre = cfgValue.getValue('BuildingUpgradeCostOre').toNumber()
        this.buildingUpgradeCostStuds = cfgValue.getValue('BuildingUpgradeCostStuds').toNumber()
        this.textPauseTimeMs = Math.round(cfgValue.getValue('TextPauseTime').toNumber() * 1000)
        this.startLevel = cfgValue.getValue('StartLevel').toLevelReference()
        this.tutorialStartLevel = cfgValue.getValue('TutorialStartLevel').toLevelReference()
        this.ambientRGB = cfgValue.getValue('AmbientRGB').toRGB()
        this.powerCrystalRGB = cfgValue.getValue('PowerCrystalRGB').toRGB()
        this.unpoweredCrystalRGB = cfgValue.getValue('UnpoweredCrystalRGB').toRGB()
        this.minDist = cfgValue.getValue('MinDist').toNumber()
        this.maxDist = cfgValue.getValue('MaxDist').toNumber()
        this.minTilt = cfgValue.getValue('MinTilt').toNumber()
        this.maxTilt = cfgValue.getValue('MaxTilt').toNumber()
        this.CameraSpeed = cfgValue.getValue('CameraSpeed').toNumber()
        this.DynamiteDamageRadius = cfgValue.getValue('DynamiteDamageRadius').toNumber()
        this.DynamiteMaxDamage = cfgValue.getValue('DynamiteMaxDamage').toNumber()
        this.rrAvi = cfgValue.getValue('RrAvi').toFileName()
        this.missionBriefingText = cfgValue.getValue('MissionBriefingText').toLabel()
        this.missionCompletedText = cfgValue.getValue('MissionCompletedText').toLabel()
        this.missionFailedText = cfgValue.getValue('MissionFailedText').toLabel()
        this.tutorialIcon = cfgValue.getValue('TutorialIcon').toFileName()
        return this
    }
}

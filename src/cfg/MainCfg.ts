import { BaseConfig } from './BaseConfig'
import { Rect } from '../core/Rect'

export class MainCfg extends BaseConfig {
    // TextureUsage = 3145728
    creditsTextFile: string = 'Credits.txt'
    creditsBackAVI: string = 'AVI/Loop.avi'
    loadScreen: string = 'Languages/Loading.bmp'
    // ShutdownScreen = Languages/ShutDown.bmp
    progressBar: string = 'Interface/FrontEnd/gradient.bmp'
    progressWindow: Rect = new Rect(142, 450, 353, 9)
    loadingText: string = 'Lade'
    // SharedTextures = World/Shared
    // SharedObjects = World/Shared
    nextButton640x480: string = 'Interface/MessagePanel/OKButton.bmp'
    nextButtonPos640x480: number[] = [380, 447]
    backButton640x480: string = 'Interface/MessagePanel/repeat.bmp'
    backButtonPos640x480: number[] = [380, 462]
    backArrow: string = 'Interface/MessagePanel/BackButton.bmp'
    // WallProMeshes = TRUE
    // DynamicPM = FALSE
    // HPBlocks = 20
    buildingUpgradeCostOre: number = 5
    buildingUpgradeCostStuds: number = 1
    textPauseTimeMs = 3000 // Time in seconds that the Text_ messages last.
    // RubbleCoef = 10
    startLevel: string = 'Tutorial01'
    tutorialStartLevel: string = 'MoveTuto_01'
    // Quality = Gouraud
    // Dither = TRUE
    // Filter = YES
    // Blend = FALSE
    // Sort = FALSE
    // MipMap = TRUE
    // LinearMipMap = TRUE
    // MusicOn = FALSE
    // SoundOn = TRUE
    // CDStartTrack = 2
    // CDTracks = 3
    // TopSpotRGB = 127:127:127
    // TrackSpotRGB = 000:255:000
    ambientRGB: [r: number, g: number, b: number] = [10, 10, 10]
    // FPLightRGB = 127:127:127
    powerCrystalRGB: [r: number, g: number, b: number] = [0, 1, 0]
    unpoweredCrystalRGB: [r: number, g: number, b: number] = [1, 0, 1]
    // ToolTipRGB = 000:100:000
    minDist = 150.0 // minimum camera distance
    maxDist = 250.0 // maximum camera distance
    minTilt = 0.0
    maxTilt = 60.0
    CameraSpeed = 7.0
    // CameraDropOff = 0.5
    // CameraAcceleration = 0.4
    // MouseScrollIndent = 4
    // MouseScrollBorder = 3
    // TVClipDist = 800.0
    // FPClipBlocks = 14
    // HighPolyRange = 60.0f
    // MedPolyRange = 100.0f
    // DisplayAdvisor = TRUE
    // OnlyBuildOnPaths = TRUE
    // AlwaysRockFall = TRUE
    // SelectionArrow = arrow.bmp
    // MinEnergyForEat = 25.0
    DynamiteDamageRadius = 75.0
    DynamiteMaxDamage = 150.0
    // BirdScarerRadius = 100.0
    // StartMessage = Rock_Raiders
    // Version = V.0.121
    // StreamNERPSSpeach = TRUE
    // FrontEnd = TRUE
    // LoseFocusAndPause = TRUE
    // DynamiteRadius = 400.0
    // ShowDebugToolTips = FALSE
    // AllowDebugKeys = FALSE
    // AllowEditMode = FALSE
    // DontPlayAvis = FALSE
    // RRAvi = avi/intro.avi
    // Avi = avi/lmi640.avi
    // DDILogo = Languages/DDI_Logo.bmp
    // DDILogoTime = 4.0
    // HelpWindowOn = TRUE
    // MinDistFor3DSoundsOnTopView = 80.0
    // MaxDistFor3DSounds = 380.0
    // RollOffFor3DSounds = 3
    // RenameReplace = Rock_Raider
    missionBriefingText: string = 'Einsatzbesprechung'
    missionCompletedText: string = 'Einsatz erfolgreich!'
    missionFailedText: string = 'Einsatz beendet'
    tutorialIcon: string = 'Interface/Tutorial/Arrow01.bmp'

    assignValue(objKey: string, unifiedKey: string, cfgValue: any): boolean {
        if (unifiedKey === 'ProgressWindow'.toLowerCase()) {
            // cfgValue[0] = 'R' // XXX What is it good for?
            this.progressWindow = Rect.fromArray(cfgValue[1])
            return true
        } else if (unifiedKey === 'TextPauseTime'.toLowerCase()) {
            this.textPauseTimeMs = Math.round(cfgValue * 1000)
        } else if (unifiedKey === 'PowerCrystalRGB'.toLowerCase()) {
            this.powerCrystalRGB = cfgValue.map((n: number) => n / 255)
            return true
        } else if (unifiedKey === 'UnpoweredCrystalRGB'.toLowerCase()) {
            this.unpoweredCrystalRGB = cfgValue.map((n: number) => n / 255)
            return true
        }
        return super.assignValue(objKey, unifiedKey, cfgValue)
    }
}

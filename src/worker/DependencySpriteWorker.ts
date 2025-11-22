import { TypedWorkerThreaded } from './TypedWorker'
import { AbstractWorkerSystem } from './AbstractWorkerSystem'
import { SpriteImage } from '../core/Sprite'
import { EntityType } from '../game/model/EntityType'
import { createContext, imgDataToCanvas } from '../core/ImageHelper'
import { EntityDependencyChecked } from '../cfg/GameConfig'
import { BitmapFont, BitmapFontData } from '../core/BitmapFont'

export const enum DependencySpriteWorkerRequestType {
    SETUP = 1, // start with 1 for truthiness safety
    CREATE_SPRITE,
}

export interface DependencySpriteWorkerSetupRequest {
    type: DependencySpriteWorkerRequestType.SETUP
    upgradeNames: string[]
    tooltipFontData: BitmapFontData
    plusSignImgData: ImageData
    equalSignImgData: ImageData
    interfaceImageData: Map<string, [ImageData, ImageData]>
    interfaceBuildImageData: Map<string, [ImageData, ImageData]>
}

export interface DependencySpriteWorkerCreateSpriteRequest {
    type: DependencySpriteWorkerRequestType.CREATE_SPRITE
    dependencies: EntityDependencyChecked[]
}

export type DependencySpriteWorkerRequest = DependencySpriteWorkerSetupRequest | DependencySpriteWorkerCreateSpriteRequest

export interface DependencySpriteWorkerResponse {
    dependencyImage?: ImageData
}

export class DependencySpriteSystem extends AbstractWorkerSystem<DependencySpriteWorkerRequest, DependencySpriteWorkerResponse> {
    readonly interfaceImages: Map<string, [SpriteImage, SpriteImage]> = new Map()
    readonly interfaceBuildImages: Map<string, [SpriteImage, SpriteImage]> = new Map()
    upgradeNames?: string[]
    tooltipFont: BitmapFont | undefined
    plusSignImg: SpriteImage | undefined
    equalsSignImg: SpriteImage | undefined

    onMessageFromFrontend(workerRequestHash: string, request: DependencySpriteWorkerRequest): void {
        switch (request.type) {
            case DependencySpriteWorkerRequestType.SETUP:
                this.upgradeNames = request.upgradeNames
                this.tooltipFont = new BitmapFont(request.tooltipFontData)
                this.plusSignImg = imgDataToCanvas(request.plusSignImgData)
                this.equalsSignImg = imgDataToCanvas(request.equalSignImgData)
                request.interfaceImageData.forEach((imgData, key) => this.interfaceImages
                    .set(key.toLowerCase(), [imgDataToCanvas(imgData[0]), imgDataToCanvas(imgData[1])]))
                request.interfaceBuildImageData.forEach((imgData, key) => this.interfaceBuildImages
                    .set(key.toLowerCase(), [imgDataToCanvas(imgData[0]), imgDataToCanvas(imgData[1])]))
                this.sendResponse(workerRequestHash, {})
                break
            case DependencySpriteWorkerRequestType.CREATE_SPRITE:
                const upgradeNames = this.upgradeNames
                const tooltipFont = this.tooltipFont
                const plusSignImg = this.plusSignImg
                const equalsSignImg = this.equalsSignImg
                if (!upgradeNames || !tooltipFont || !plusSignImg || !equalsSignImg) {
                    console.error('Dependency sprite worker not yet setup', upgradeNames, tooltipFont, plusSignImg, equalsSignImg)
                    this.sendResponse(workerRequestHash, {})
                    return
                }
                let totalWidth = 0
                let totalHeight = 0
                const deps = request.dependencies.map((dep) => {
                    let depImages: [SpriteImage, SpriteImage] | undefined
                    if (dep.entityType === EntityType.PILOT) {
                        depImages = this.interfaceImages.get('Interface_MenuItem_TeleportMan'.toLowerCase()) // TODO Improve config parsing and use specific key here
                    } else {
                        depImages = this.interfaceBuildImages.get(dep.itemKey.toLowerCase()) // TODO Improve config parsing and use specific key here
                    }
                    if (!Array.isArray(depImages) || depImages.length !== 2) throw new Error(`Unexpected dependency images array (${depImages})`)
                    const depImg = dep.isOk ? depImages[0] : depImages[1]
                    totalWidth += depImg.width
                    totalHeight = Math.max(totalHeight, depImg.height)
                    return {img: depImg, level: dep.minLevel}
                })
                totalWidth += plusSignImg.width * (deps.length - 1)
                totalWidth += equalsSignImg.width * 2
                const dependencySprite = createContext(totalWidth, totalHeight)
                let posX = 0
                deps.forEach((s, index) => {
                    dependencySprite.drawImage(s.img, posX, (totalHeight - s.img.height) / 2)
                    if (s.level) {
                        const upgradeName = upgradeNames[s.level - 1]
                        if (upgradeName) {
                            const minLevelImg = tooltipFont.createTextImage(upgradeName)
                            if (minLevelImg) dependencySprite.drawImage(minLevelImg, posX + 3, (totalHeight - s.img.height) / 2 + 3)
                        }
                    }
                    posX += s.img.width
                    const signImg = index === deps.length - 1 ? equalsSignImg : plusSignImg
                    dependencySprite.drawImage(signImg, posX, (totalHeight - signImg.height) / 2)
                    posX += signImg.width
                })
                this.sendResponse(workerRequestHash, {dependencyImage: dependencySprite.getImageData(0, 0, dependencySprite.canvas.width, dependencySprite.canvas.height)})
                break
        }
    }
}

const worker: Worker = self as any
new DependencySpriteSystem(new TypedWorkerThreaded(worker))

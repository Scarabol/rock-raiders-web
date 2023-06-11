import { TypedWorkerThreaded } from './TypedWorker'
import { AbstractWorkerSystem } from './AbstractWorkerSystem'
import { SpriteImage } from '../core/Sprite'
import { EntityType } from '../game/model/EntityType'
import { createContext, imgDataToContext } from '../core/ImageHelper'
import { EntityDependencyChecked } from '../cfg/GameConfig'
import { BitmapFont, BitmapFontData } from '../core/BitmapFont'

export enum DependencySpriteWorkerRequestType {
    SETUP = 1, // start with 1 for truthiness safety
    CREATE_SPRITE,
}

export class DependencySpriteWorkerRequest {
    type: DependencySpriteWorkerRequestType
    dependencies?: EntityDependencyChecked[]
    upgradeNames?: string[]
    tooltipFontData?: BitmapFontData
    plusSignImgData?: ImageData
    equalSignImgData?: ImageData
    interfaceImageData?: Map<string, ImageData[]>
    interfaceBuildImageData?: Map<string, ImageData[]>
}

export class DependencySpriteWorkerResponse {
    dependencyImage: ImageData
}

export class DependencySpriteSystem extends AbstractWorkerSystem<DependencySpriteWorkerRequest, DependencySpriteWorkerResponse> {
    readonly interfaceImages: Map<string, SpriteImage[]> = new Map()
    readonly interfaceBuildImages: Map<string, SpriteImage[]> = new Map()
    upgradeNames: string[]
    tooltipFont: BitmapFont
    plusSignImg: SpriteImage
    equalsSignImg: SpriteImage

    onMessageFromFrontend(workerRequestHash: string, request: DependencySpriteWorkerRequest): void {
        if (!request) return // TODO all worker receive the same messages
        switch (request.type) {
            case DependencySpriteWorkerRequestType.SETUP:
                this.upgradeNames = request.upgradeNames
                this.tooltipFont = new BitmapFont(request.tooltipFontData)
                this.plusSignImg = imgDataToContext(request.plusSignImgData).canvas
                this.equalsSignImg = imgDataToContext(request.equalSignImgData).canvas
                request.interfaceImageData.forEach((imgData, key) => this.interfaceImages
                    .set(key.toLowerCase(), imgData.map((imgData) => imgDataToContext(imgData).canvas)))
                request.interfaceBuildImageData.forEach((imgData, key) => this.interfaceBuildImages
                    .set(key.toLowerCase(), imgData.map((imgData) => imgDataToContext(imgData).canvas)))
                this.sendResponse(workerRequestHash, null)
                break
            case DependencySpriteWorkerRequestType.CREATE_SPRITE:
                let totalWidth = 0
                let totalHeight = 0
                const deps = request.dependencies.map((dep) => {
                    let depImages: SpriteImage[]
                    if (dep.entityType === EntityType.PILOT) {
                        depImages = this.interfaceImages.get('Interface_MenuItem_TeleportMan'.toLowerCase())
                    } else {
                        depImages = this.interfaceBuildImages.get(dep.itemKey.toLowerCase())
                    }
                    const depImg = dep.isOk ? depImages[0] : depImages[1]
                    totalWidth += depImg.width
                    totalHeight = Math.max(totalHeight, depImg.height)
                    return {img: depImg, level: dep.minLevel}
                })
                totalWidth += this.plusSignImg.width * (deps.length - 1)
                totalWidth += this.equalsSignImg.width * 2
                const dependencySprite = createContext(totalWidth, totalHeight)
                let posX = 0
                deps.forEach((s, index) => {
                    dependencySprite.drawImage(s.img, posX, (totalHeight - s.img.height) / 2)
                    if (s.level) {
                        const upgradeName = this.upgradeNames[s.level - 1]
                        if (upgradeName) {
                            const minLevelImg = this.tooltipFont.createTextImage(upgradeName)
                            dependencySprite.drawImage(minLevelImg, posX + 3, (totalHeight - s.img.height) / 2 + 3)
                        }
                    }
                    posX += s.img.width
                    const signImg = index === deps.length - 1 ? this.equalsSignImg : this.plusSignImg
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

import { ObjectiveImageCfg } from '../../cfg/LevelsCfg'
import { SpriteContext, SpriteImage } from '../../core/Sprite'
import { BaseElement } from '../base/BaseElement'
import { Button } from '../base/Button'
import { Panel } from '../base/Panel'
import { BriefingPanelCfg } from './BriefingPanelCfg'
import { SetSpaceToContinueEvent, ShowMissionAdvisorEvent, ShowMissionBriefingEvent } from '../../event/LocalEvents'
import { ResourceManager } from '../../resource/ResourceManager'
import { BitmapFontWorkerPool } from '../../worker/BitmapFontWorkerPool'
import { SoundManager } from '../../audio/SoundManager'
import { EventBroker } from '../../event/EventBroker'

export class BriefingPanel extends Panel {
    cfg: BriefingPanelCfg = null
    imgTitle: SpriteImage = null
    titleRelX: number = 0
    titleRelY: number = 0
    btnNext: Button = null
    btnBack: Button = null
    imgBack: SpriteImage = null
    imgParagraphList: SpriteImage[] = []
    paragraph: number = 0
    objectiveParagraphs: string[] = []
    objectiveSfxName: string = ''
    objectiveSfx: AudioBufferSourceNode = null
    onContinueMission: () => any = () => console.log('Start mission')

    constructor(parent: BaseElement) {
        super(parent)
        this.cfg = new BriefingPanelCfg()
        this.onClick = () => this.nextParagraph() // fallback for touch displays without keyboard like mobile browsers
        this.titleRelX = this.cfg.titleWindow.x + this.cfg.titleWindow.w / 2
        this.titleRelY = this.cfg.titleWindow.y
        this.btnNext = this.addChild(new Button(this, this.cfg.nextButtonCfg))
        this.btnNext.onClick = () => this.nextParagraph()
        this.btnBack = this.addChild(new Button(this, this.cfg.backButtonCfg))
        this.btnBack.onClick = () => this.prevParagraph()
        this.hidden = true
    }

    reset() {
        super.reset()
        this.hidden = true
        this.setParagraph(0)
        this.objectiveSfxName = ''
    }

    setup(dialogTitle: string, objectiveText: string, objectiveBackImgCfg: ObjectiveImageCfg, objectiveSfx: string) {
        this.imgBack = ResourceManager.getImageOrNull(objectiveBackImgCfg.filename)
        this.relX = this.xIn = objectiveBackImgCfg.x
        this.relY = this.yIn = objectiveBackImgCfg.y
        this.width = this.imgBack.width
        this.height = this.imgBack.height
        this.updatePosition()
        this.objectiveParagraphs = objectiveText?.split('\\a') || []
        this.objectiveSfxName = objectiveSfx
        BitmapFontWorkerPool.instance.createTextImage(this.cfg.titleFontName, dialogTitle).then((textImage) => {
            this.imgTitle = textImage
            this.notifyRedraw()
        })
        Promise.all(this.objectiveParagraphs.map((txt) => {
            return BitmapFontWorkerPool.instance.createTextImage(this.cfg.textFontName, txt, this.cfg.textWindow.w, false)
        })).then((textImages) => {
            this.imgParagraphList = textImages
            this.notifyRedraw()
        })
    }

    setParagraph(paragraph: number) {
        if (paragraph < 0) return
        if (paragraph > 0 && paragraph > this.objectiveParagraphs.length - 1) {
            this.objectiveSfx?.stop()
            this.onContinueMission()
            return
        }
        this.paragraph = paragraph
        this.btnNext.hidden = this.paragraph >= this.objectiveParagraphs.length - 1
        this.btnBack.hidden = this.paragraph < 1
        this.notifyRedraw()
    }

    nextParagraph() {
        this.setParagraph(this.paragraph + 1)
    }

    prevParagraph() {
        this.setParagraph(this.paragraph - 1)
    }

    show() {
        super.show()
        this.setParagraph(0)
        if (this.objectiveSfxName) {
            this.objectiveSfx = SoundManager.playSound(this.objectiveSfxName, false)
            this.objectiveSfx.addEventListener('ended', () => EventBroker.publish(new ShowMissionAdvisorEvent(false)))
        }
        this.btnNext.hidden = this.paragraph >= this.objectiveParagraphs.length - 1
        this.btnBack.hidden = this.paragraph < 1
        this.publishEvent(new SetSpaceToContinueEvent(true))
        this.publishEvent(new ShowMissionBriefingEvent(true))
    }

    hide() {
        super.hide()
        this.objectiveSfx?.stop()
        this.publishEvent(new SetSpaceToContinueEvent(false))
        this.publishEvent(new ShowMissionBriefingEvent(false))
    }

    onRedraw(context: SpriteContext) {
        if (this.hidden) return
        if (this.imgBack) context.drawImage(this.imgBack, this.x, this.y)
        if (this.imgTitle) context.drawImage(this.imgTitle, Math.round(this.x + this.titleRelX - this.imgTitle.width / 2), this.y + this.titleRelY)
        const imgParagraph = this.imgParagraphList[this.paragraph]
        if (imgParagraph) context.drawImage(imgParagraph, this.x + this.cfg.textWindow.x, this.y + this.cfg.textWindow.y)
        super.onRedraw(context)
    }
}

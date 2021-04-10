import { Panel } from '../base/Panel'
import { ResourceManager } from '../../../resource/ResourceManager'
import { Button } from '../base/Button'
import { BriefingPanelCfg } from '../../../cfg/BriefingPanelCfg'
import { MessagePanel } from '../messagepanel/MessagePanel'
import { ObjectiveImageCfg } from '../../../cfg/ObjectiveImageCfg'

export class BriefingPanel extends Panel {

    messagePanel: MessagePanel
    cfg: BriefingPanelCfg = null
    imgTitle: HTMLCanvasElement = null
    titleRelX: number = 0
    titleRelY: number = 0
    btnNext: Button = null
    btnBack: Button = null
    imgBack: HTMLCanvasElement = null
    imgParagraph: HTMLCanvasElement[] = []
    paragraph: number = 0

    constructor(cfg: BriefingPanelCfg) {
        super()
        this.cfg = cfg
        this.imgTitle = cfg.titleFont.createTextImage(cfg.title)
        this.titleRelX = cfg.titleWindow.x + (cfg.titleWindow.w - this.imgTitle.width) / 2
        this.titleRelY = cfg.titleWindow.y
        this.btnNext = this.addChild(new Button(this, cfg.nextButtonCfg))
        this.btnNext.onClick = () => this.nextParagraph()
        this.btnBack = this.addChild(new Button(this, cfg.backButtonCfg))
        this.btnBack.onClick = () => this.prevParagraph()
        this.hidden = true
    }

    setup(objectiveText: string, objectiveBackImgCfg: ObjectiveImageCfg) {
        this.imgBack = ResourceManager.getImageOrNull(objectiveBackImgCfg.filename)
        this.relX = objectiveBackImgCfg.x
        this.relY = objectiveBackImgCfg.y
        this.width = this.imgBack.width
        this.height = this.imgBack.height
        this.updatePosition()
        this.imgParagraph = objectiveText.split('\\a').map(txt => this.cfg.textFont.createTextImage(txt, this.cfg.textWindow.w, false))
    }

    setParagraph(paragraph: number) {
        if (paragraph < 0) return
        if (paragraph > this.imgParagraph.length - 1) {
            this.hide()
            this.notifyRedraw()
            return
        }
        this.paragraph = paragraph
        this.btnNext.hidden = this.paragraph >= this.imgParagraph.length - 1
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
        this.btnNext.hidden = this.paragraph >= this.imgParagraph.length - 1
        this.btnBack.hidden = this.paragraph < 1
        this.messagePanel?.setMessage(this.messagePanel.msgSpaceToContinue, 0)
    }

    hide() {
        super.hide()
        this.messagePanel?.unsetMessage(this.messagePanel.msgSpaceToContinue)
    }

    onRedraw(context: CanvasRenderingContext2D) {
        if (this.hidden) return
        if (this.imgBack) context.drawImage(this.imgBack, this.x, this.y)
        if (this.imgTitle) context.drawImage(this.imgTitle, this.x + this.titleRelX, this.y + this.titleRelY)
        if (this.imgParagraph && this.imgParagraph[this.paragraph]) context.drawImage(this.imgParagraph[this.paragraph], this.x + this.cfg.textWindow.x, this.y + this.cfg.textWindow.y)
        super.onRedraw(context)
    }

}

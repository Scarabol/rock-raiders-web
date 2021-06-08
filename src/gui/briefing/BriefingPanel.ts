import { ObjectiveImageCfg } from '../../cfg/ObjectiveImageCfg'
import { BaseElement } from '../base/BaseElement'
import { Button } from '../base/Button'
import { Panel } from '../base/Panel'
import { GuiResourceCache } from '../GuiResourceCache'
import { BriefingPanelCfg } from './BriefingPanelCfg'

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
    imgParagraph: SpriteImage = null
    onSetSpaceToContinue: (state: boolean) => any = (state: boolean) => console.log('Message: press space to continue = ' + state)
    onStartMission: () => any = () => console.log('Start mission')

    constructor(parent: BaseElement) {
        super(parent)
        this.cfg = new BriefingPanelCfg()
        this.imgTitle = this.cfg.titleFont.createTextImage(this.cfg.title)
        this.titleRelX = this.cfg.titleWindow.x + (this.cfg.titleWindow.w - this.imgTitle.width) / 2
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
    }

    setup(objectiveText: string, objectiveBackImgCfg: ObjectiveImageCfg) {
        this.imgBack = GuiResourceCache.getImageOrNull(objectiveBackImgCfg.filename)
        this.relX = this.xIn = objectiveBackImgCfg.x
        this.relY = this.yIn = objectiveBackImgCfg.y
        this.width = this.imgBack.width
        this.height = this.imgBack.height
        this.updatePosition()
        this.imgParagraphList = objectiveText.split('\\a').map(txt => this.cfg.textFont.createTextImage(txt, this.cfg.textWindow.w, false))
    }

    setParagraph(paragraph: number) {
        if (paragraph < 0) return
        if (paragraph > this.imgParagraphList.length - 1) {
            this.onStartMission()
            return
        }
        this.paragraph = paragraph
        this.imgParagraph = this.imgParagraphList[this.paragraph]
        this.btnNext.hidden = this.paragraph >= this.imgParagraphList.length - 1
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
        this.btnNext.hidden = this.paragraph >= this.imgParagraphList.length - 1
        this.btnBack.hidden = this.paragraph < 1
        this.onSetSpaceToContinue(true)
    }

    hide() {
        super.hide()
        this.onSetSpaceToContinue(false)
    }

    onRedraw(context: SpriteContext) {
        if (this.hidden) return
        if (this.imgBack) context.drawImage(this.imgBack, this.x, this.y)
        if (this.imgTitle) context.drawImage(this.imgTitle, this.x + this.titleRelX, this.y + this.titleRelY)
        if (this.imgParagraph) context.drawImage(this.imgParagraph, this.x + this.cfg.textWindow.x, this.y + this.cfg.textWindow.y)
        super.onRedraw(context)
    }

}

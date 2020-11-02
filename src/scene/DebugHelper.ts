const Stats = require('stats.js');

export class DebugHelper {

    stats;

    constructor() {
        this.stats = new Stats();
        this.stats.setMode(0); // 0: fps, 1: ms

        this.stats.domElement.style.position = 'absolute';
        this.stats.domElement.style.left = '0px';
        this.stats.domElement.style.top = '0px';

        document.body.appendChild(this.stats.domElement);
        this.hide();
    }

    show() {
        this.stats.domElement.style.visibility = 'visible';
    }

    hide() {
        this.stats.domElement.style.visibility = 'hidden';
    }

    renderStart() {
        this.stats.begin();
    }

    renderDone() {
        this.stats.end();
    }

}

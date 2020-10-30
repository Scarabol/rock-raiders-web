import {GameEvent} from "./EventBus";
import {SurfaceType} from "../model/map/SurfaceType";

export class LocalEvent extends GameEvent {

    constructor(eventKey: string) {
        super(eventKey);
        this.isLocal = true;
    }

}

export class SurfaceSelectedEvent extends LocalEvent {

    static eventKey: string = 'surface.selected';

    type: SurfaceType;

    constructor(type: SurfaceType) {
        super(SurfaceSelectedEvent.eventKey);
        this.type = type;
    }

}

export class SurfaceDeselectEvent extends LocalEvent {

    static eventKey: string = 'surface.deselect';

    constructor() {
        super(SurfaceDeselectEvent.eventKey);
    }

}
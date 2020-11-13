import { AnimSubObj } from './AnimSubObj';

export class AnimClip {

    looping: boolean = false;
    transcoef: number = 1;
    firstFrame: number = null;
    lastFrame: number = null;
    framesPerSecond: number = null;
    bodies: AnimSubObj[] = [];

}

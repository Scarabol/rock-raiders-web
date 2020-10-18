import { createDummyImage } from '../../core/ImageHelper';
import { WadLoader } from '../../core/wad/WadLoader';
import { getFilename } from '../../core/Util';
import { Texture } from 'three/src/textures/Texture';
import { RGBFormat } from 'three/src/constants';
import * as THREE from 'three';

export class ResourceManager {

    wadLoader: WadLoader;
    images = {};
    textures = {};
    configuration = {};
    maps = {};
    sounds = {};
    objectLists = {};
    nerps = [];
    nerpMessages = [];
    fonts = [];
    entity = [];

    initialAssets = [
        ['wad0nerp', 'Levels', 'nerpnrn.h'], // included by other nrn scripts

        // main menu resources // TODO load from config
        ['wad0bmp', 'Interface/FrontEnd/MenuBGpic.bmp'], // main menu background
        ['wad0font', 'Interface/FrontEnd/Menu_Font_LO.bmp'], // main menu font
        ['wad0font', 'Interface/FrontEnd/Menu_Font_HI.bmp'], // (highlighted) main menu font
        ['wad0font', 'Interface/Fonts/Font5_Hi.bmp'],
        ['wad0bmp', 'Interface/Frontend/LP_Normal.bmp'], // back button in level select view
        ['wad0bmp', 'Interface/Frontend/LP_Glow.bmp'], // back button in level select view (hovered)
        ['wad0bmp', 'Interface/Frontend/LP_Dull.bmp'], // back button in level select view (pressed)
        ['wad0alpha', 'Interface/Frontend/LowerPanel.bmp'], // lower panel in level select view
        ['wad0bmp', 'Interface/Frontend/SaveLoad.bmp'],

        // level images // TODO load from config
        ['wad0bmp', 'Interface/LEVELPICKER/Levelpick.bmp'], // level select menu background
        ['wad0bmp', 'Interface/LEVELPICKER/LevelpickT.bmp'], // tutorial level select menu background

        // pointers/cursors // TODO load main menu cursor with loading screen and change cursor there
        ['wad0alpha', 'Interface/Pointers/Aclosed.bmp'],
    ];

    constructor() {
        this.wadLoader = new WadLoader(this);
    }

    getImage(imageName) {
        if (!imageName || imageName.length === 0) {
            throw 'imageName must not be undefined, null or empty - was ' + imageName;
        } else {
            const lImageName = imageName.toLowerCase();
            if (!(lImageName in this.images) || this.images[lImageName] === undefined || this.images[lImageName] === null) {
                console.error('Image \'' + imageName + '\' unknown! Using placeholder image instead');
                this.images[lImageName] = createDummyImage(64, 64);
            }
            return this.images[lImageName];
        }
    }

    getTexture(textureName) {
        if (!textureName || textureName.length === 0) {
            throw 'textureName must not be undefined, null or empty - was ' + textureName;
        } else {
            const lTextureName = textureName.toLowerCase();
            if (!(lTextureName in this.textures) || this.textures[lTextureName] === undefined || this.textures[lTextureName] === null) {
                const lSharedTextureName = 'world/shared/' + getFilename(lTextureName);
                if (!(lSharedTextureName in this.textures) || this.textures[lSharedTextureName] === undefined || this.textures[lSharedTextureName] === null) {
                    console.error('Texture \'' + textureName + '\' (' + lTextureName + ', ' + lSharedTextureName + ') unknown! Using placeholder texture instead');
                    this.textures[lTextureName] = new Texture(createDummyImage(64, 64).canvas);
                    this.textures[lTextureName].format = RGBFormat;
                    this.textures[lTextureName].wrapS = THREE.RepeatWrapping;
                    this.textures[lTextureName].wrapT = THREE.RepeatWrapping;
                    this.textures[lTextureName].minFilter = THREE.NearestFilter;
                    this.textures[lTextureName].magFilter = THREE.NearestFilter;
                    this.textures[lTextureName].needsUpdate = true;
                    return this.textures[lTextureName];
                }
                return this.textures[lSharedTextureName];
            }
            return this.textures[lTextureName];
        }
    }

}

import { createDummyImage } from '../../core/ImageHelper';
import { WadLoader } from '../../core/wad/WadLoader';
import { getFilename } from '../../core/Util';
import { Texture } from 'three/src/textures/Texture';
import { RGBFormat } from 'three/src/constants';
import * as THREE from 'three';
import { AnimationEntityType } from '../model/entity/AnimEntity';

export class ResourceManager {

    static wadLoader: WadLoader = new WadLoader();
    static images = {};
    static textures = {};
    static configuration = {};
    static maps = {};
    static sounds = {};
    static objectLists = {};
    static nerps = [];
    static nerpMessages = [];
    static fonts = [];
    static entity: AnimationEntityType[] = [];

    static initialAssets = [
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

    static getImage(imageName) {
        if (!imageName || imageName.length === 0) {
            throw 'imageName must not be undefined, null or empty - was ' + imageName;
        } else {
            const lImageName = imageName.toLowerCase();
            if (!(lImageName in ResourceManager.images) || ResourceManager.images[lImageName] === undefined || ResourceManager.images[lImageName] === null) {
                console.error('Image \'' + imageName + '\' unknown! Using placeholder image instead');
                ResourceManager.images[lImageName] = createDummyImage(64, 64);
            }
            return ResourceManager.images[lImageName];
        }
    }

    static getTexture(textureName) {
        if (!textureName || textureName.length === 0) {
            throw 'textureName must not be undefined, null or empty - was ' + textureName;
        } else {
            let texture: Texture;
            const lTextureName = textureName.toLowerCase();
            if (!(lTextureName in ResourceManager.textures) || ResourceManager.textures[lTextureName] === undefined || ResourceManager.textures[lTextureName] === null) {
                const lSharedTextureName = 'world/shared/' + getFilename(lTextureName);
                if (!(lSharedTextureName in ResourceManager.textures) || ResourceManager.textures[lSharedTextureName] === undefined || ResourceManager.textures[lSharedTextureName] === null) {
                    console.error('Texture \'' + textureName + '\' (' + lTextureName + ', ' + lSharedTextureName + ') unknown! Using placeholder texture instead');
                    ResourceManager.textures[lTextureName] = new Texture(createDummyImage(64, 64).canvas);
                    ResourceManager.textures[lTextureName].format = RGBFormat;
                    ResourceManager.textures[lTextureName].wrapS = THREE.RepeatWrapping;
                    ResourceManager.textures[lTextureName].wrapT = THREE.RepeatWrapping;
                    ResourceManager.textures[lTextureName].minFilter = THREE.NearestFilter;
                    ResourceManager.textures[lTextureName].magFilter = THREE.NearestFilter;
                    ResourceManager.textures[lTextureName].needsUpdate = true;
                    texture = ResourceManager.textures[lTextureName];
                } else {
                    texture = ResourceManager.textures[lSharedTextureName];
                }
            } else {
                texture = ResourceManager.textures[lTextureName];
            }
            return texture;
        }
    }

}

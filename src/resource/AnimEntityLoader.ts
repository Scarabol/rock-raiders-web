import { getPath, iGet } from '../core/Util'
import { AnimationEntityType } from '../game/model/anim/AnimationEntityType'
import { AnimClip } from '../game/model/anim/AnimClip'
import { SceneManager } from '../game/SceneManager'
import { LWOLoader } from './LWOLoader'
import { LWSCLoader } from './LWSCLoader'
import { ResourceManager } from './ResourceManager'

export class AnimEntityLoader {

    static loadModels(aeFilename: string, cfgRoot: any, verbose: boolean = false): AnimationEntityType {
        const path = getPath(aeFilename)
        const entityType = new AnimationEntityType()
        Object.keys(cfgRoot).forEach((rootKey: string) => {
            const value = cfgRoot[rootKey]
            if (rootKey.equalsIgnoreCase('CarryNullName')) {
                entityType.carryNullName = value
            } else if (rootKey.equalsIgnoreCase('Shape')) {
                if (verbose) console.warn('TODO Derive buildings shape from this value') // XXX derive buildings surfaces shape from this value
            } else if (rootKey.equalsIgnoreCase('DepositNullName')) {
                entityType.depositNullName = value
            } else if (rootKey.equalsIgnoreCase('ToolNullName')) {
                entityType.toolNullName = value
            } else if (rootKey.equalsIgnoreCase('CameraFlipDir')) {
                // XXX what is this? flip upside down when hanging from rm?
            } else if (rootKey.equalsIgnoreCase('HighPoly')) {
                Object.keys(value).forEach((key) => {
                    const polyKey = key.startsWith('!') ? key.slice(1) : key
                    const lwoBuffer = ResourceManager.getResource(path + value[key] + '.lwo')
                    entityType.highPolyBodies.set(polyKey.toLowerCase(), SceneManager.registerMesh(new LWOLoader(path, verbose).parse(lwoBuffer)))
                })
            } else if (rootKey.equalsIgnoreCase('MediumPoly')) {
                // TODO implement medium poly parsing
            } else if (rootKey.equalsIgnoreCase('LowPoly')) {
                // TODO implement low poly parsing
            } else if (rootKey.equalsIgnoreCase('FPPoly')) {
                // TODO implement first person poly parsing
            } else if (rootKey.equalsIgnoreCase('Activities')) {
                entityType.animations = this.parseAnimations(value, cfgRoot, path, verbose)
            } else if (rootKey.match(/level\d\d\d\d/i)) {
                // TODO geo dome has upgrade defined at root level without Upgrades group
            } else if (verbose && !value['lwsfile']) {
                console.warn('Unhandled animated entity key found: ' + rootKey, value)
            }
        })
        // TODO for each animation clip find the given names above and map to a poly body part
        return entityType
    }

    private static parseAnimations(value, root, path: string, verbose: boolean): Map<string, AnimClip> {
        const animations = new Map<string, AnimClip>()
        Object.keys(value).forEach((activity) => {
            try {
                let keyname = iGet(value, activity)
                const act: { file: string, transcoef: number, lwsfile: boolean, animation: AnimClip, keyname: string } = iGet(root, keyname)
                const file = iGet(act, 'FILE')
                const isLws = iGet(act, 'LWSFILE') === true
                const transcoef = iGet(act, 'TRANSCOEF')
                const looping = iGet(act, 'LOOPING') === true
                if (isLws) {
                    const content = ResourceManager.getResource(path + file + '.lws')
                    const animation = new LWSCLoader(path, verbose).parse(content)
                    animation.looping = looping
                    animation.transcoef = transcoef ? Number(transcoef) : 1
                    animations.set(activity.toLowerCase(), animation)
                } else {
                    console.error('Found activity which is not an LWS file')
                }
            } catch (e) {
                console.error(e)
                console.log(root)
                console.log(value)
                console.log(activity)
            }
        })
        return animations
    }

}

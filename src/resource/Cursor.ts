// noinspection SpellCheckingInspection
export const CURSOR = {
    BLANK: 'blank',
    STANDARD: 'standard',
    DRILL: 'drill',
    CANT_DRILL: 'cantdrill',
    CLEAR: 'clear',
    GO: 'go',
    CANT_GO: 'cantgo',
    TELEPORT: 'teleport',
    CANT_TELEPORT: 'cantteleport',
    REINFORCE: 'reinforce',
    CANT_REINFORCE: 'cantreinforce',
    SELECTED: 'selected',
    RADAR_PAN: 'radarpan',
    TRACK_OBJECT: 'trackobject',
    ZOOM: 'zoom',
    CANT_ZOOM: 'cantzoom',
    HELP: 'help',
    CANT_HELP: 'canthelp',
    PUT_DOWN: 'putdown',
    GET_IN: 'getin',
    GET_OUT: 'getout',
    OKAY: 'okay',
    NOT_OKAY: 'notokay',
    CAN_BUILD: 'canbuild',
    CANNOT_BUILD: 'cannotbuild',
    DYNAMITE: 'dynamite',
    CANT_DYNAMITE: 'cantdynamite',
    PICK_UP: 'pickup',
    CANT_PICK_UP: 'cantpickup',
    PICK_UP_ORE: 'pickupore',
    MAN_CANT_DIG: 'mancantdig',
    VEHICLE_CANT_DIG: 'vehiclecantdig',
    MAN_DIG: 'mandig',
    VEHICLE_DIG: 'vehicledig',
    MAN_CANT_PICKUP: 'mancantpickup',
    VEHICLE_CANT_PICKUP: 'vehiclecantpickup',
    MAN_PICKUP: 'manpickup',
    VEHICLE_PICKUP: 'vehiclepickup',
    MAN_CANT_GO: 'mancantgo',
    VEHICLECANTGO: 'vehiclecantgo',
    MAN_GO: 'mango',
    VEHICLE_GO: 'vehiclego',
    MAN_CLEAR: 'manclear',
    VEHICLE_CLEAR: 'vehicleclear',
    SURFACE_TYPE_IMMOVABLE: 'surfacetypeimmovable',
    SURFACE_TYPE_HARD: 'surfacetypehard',
    SURFACE_TYPE_MEDIUM: 'surfacetypemedium',
    SURFACE_TYPE_LOOSE: 'surfacetypeloose',
    SURFACE_TYPE_SOIL: 'surfacetypesoil',
    SURFACE_TYPE_ORESEAM: 'surfacetypeoreseam',
    SURFACE_TYPE_CRYSTALSEAM: 'surfacetypecrystalseam',
    SURFACE_TYPE_RECHARGESEAM: 'surfacetyperechargeseam',
} as const
export type Cursor = typeof CURSOR[keyof typeof CURSOR]

export namespace Cursor {
    export function fromString(value: string): Cursor {
        const cursor = Object.values(CURSOR).find((v) => v === value)
        if (!cursor) throw new Error(`Given value "${value}" is not a known cursor`)
        return cursor
    }
}

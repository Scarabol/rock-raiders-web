// noinspection JSUnusedGlobalSymbols
export const MOUSE_BUTTON = {
    none: -1,
    main: 0,
    middle: 1,
    secondary: 2,
} as const
export type MouseButtonType = typeof MOUSE_BUTTON[keyof typeof MOUSE_BUTTON];

export const POINTER_EVENT = {
    move: 1,
    down: 2,
    up: 3,
    leave: 4,
} as const
export type PointerEventType = typeof POINTER_EVENT[keyof typeof POINTER_EVENT];

export const KEY_EVENT = {
    down: 1,
    up: 2,
} as const
export type KeyEventType = typeof KEY_EVENT[keyof typeof KEY_EVENT];

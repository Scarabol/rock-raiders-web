export * from './Array'
export * from './Map'
export * from './Primitive'

export const HTML_GAME_CONTAINER = document.getElementById('game-container')!
export const HTML_GAME_CANVAS_CONTAINER = document.getElementById('game-canvas-container')!

declare global {
    interface Window {
        nerpDebugToggle: () => void;
    }
}

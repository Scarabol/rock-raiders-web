export enum WorkerMessageType {
    // wad worker
    MSG,
    CFG,
    CACHE_MISS,
    SFX,
    ASSET,
    DONE,

    // gui/scene worker
    INIT,
    CANVAS,
    RESET,
    EVENT_POINTER,
    EVENT_KEY,
    EVENT_WHEEL,
    RESPONSE_EVENT,
    OVERLAY_SETUP,
    SPACE_TO_CONINUE,
    SHOW_OPTIONS,
    GAME_ABORT,
    GAME_RESTART,
    GAME_EVENT,
}

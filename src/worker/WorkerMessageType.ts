export enum WorkerMessageType {
    // wad worker
    MSG,
    CFG,
    CACHE_MISS,
    SFX,
    ASSET,
    DOWNLOAD_PROGRESS,
    DONE,

    // map renderer worker
    RESPONSE_MAP_RENDERER,
    MAP_RENDERER_INIT,
    MAP_RENDER_TERRAIN,
    MAP_RENDER_SURFACE,
    MAP_RENDER_ENTITIES,
}

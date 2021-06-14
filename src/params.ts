export const DEV_MODE = process.env.WEBPACK_MODE === 'development'
export const ASSET_CACHE_DB_NAME = 'RockRaidersWeb'
export const JOB_SCHEDULE_INTERVAL = 1000 // milliseconds
export const CHECK_CLEAR_RUBBLE_INTERVAL = 5000 // milliseconds
export const CHECK_SPAWN_RAIDER_TIMER = 1000 // milliseconds
export const MAX_RAIDER_BASE = 12
export const MAX_RAIDER_REQUEST = 9
export const ADDITIONAL_RAIDER_PER_SUPPORT = 10
export const PANEL_ANIMATION_MULTIPLIER = 3
export const HEIGHT_MULTIPLIER = 0.1
export const SEQUENCE_TEXTURE_INTERVAL_MS = 1000 / 5
export const KEY_PAN_SPEED = 20
export const SPIDER_SLIP_RANGE_SQ = 49
export const ITEM_ACTION_RANGE_SQ = 49
export const UPDATE_INTERVAL_MS = Math.round(1000 / 30)

// native constants (do not change)

export const SPRITE_RESOLUTION_WIDTH = 640
export const SPRITE_RESOLUTION_HEIGHT = 480
export const TILESIZE = 40
export const NATIVE_FRAMERATE = 30
export const NATIVE_UPDATE_INTERVAL = 1000 / NATIVE_FRAMERATE

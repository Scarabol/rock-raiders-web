export const DEV_MODE = process.env.WEBPACK_MODE === 'development'
export const WAD_CACHE_DB_NAME = 'RockRaidersWeb'
export const JOB_SCHEDULE_INTERVAL = 1000 // milliseconds
export const CHECK_CLEARRUBBLE_INTERVAL = 5000 // milliseconds
export const JOB_ACTION_RANGE = 7
export const CHECK_SPANW_RAIDER_TIMER = 1000 // milliseconds
export const MAX_RAIDER_BASE = 12
export const MAX_RAIDER_REQUEST = 9
export const ADDITIONAL_RAIDER_PER_SUPPORT = 10
export const UPDATE_OXYGEN_TIMER = 5000 // milliseconds
export const PANEL_ANIMATION_MULTIPLIER = 3
export const HEIGHT_MULTIPLER = 0.1
export const SEQUENCE_TEXTURE_FRAMERATE = 5
export const KEY_PAN_SPEED = 20

// native constants (do not change)

export const SPRITE_RESOLUTION_WIDTH = 640
export const SPRITE_RESOLUTION_HEIGHT = 480
export const TILESIZE = 40
export const NATIVE_FRAMERATE = 30
export const NATIVE_UPDATE_INTERVAL = 1000 / NATIVE_FRAMERATE

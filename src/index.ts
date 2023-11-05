import { DEV_MODE } from './params'

if (DEV_MODE) console.warn('DEV MODE ACTIVE')
console.log(`Rock Raider Web v${APP_VERSION}`)

console.time('Total asset loading time')

import('three')
import('./main')

import '../site/main.css'
import { DEV_MODE } from './params'
import { DebugHelper } from './screen/DebugHelper'

if (!DEV_MODE) DebugHelper.intersectConsoleLogging()
else console.warn('DEV MODE ACTIVE')
console.log(`Rock Raider Web v${APP_VERSION}`)

console.time('Total asset loading time')

import('three')
import('./app').then((app) => app.start())

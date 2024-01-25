import '../site/main.css'
import './core'
import { DEV_MODE } from './params'
import { DebugHelper } from './screen/DebugHelper'

if (DEV_MODE) console.warn('DEV MODE ACTIVE')
else DebugHelper.intersectConsoleLogging()
console.log(`Rock Raider Web v${APP_VERSION}`)

import('./app').then((app) => app.start())

import 'bootstrap/dist/css/bootstrap.min.css'
import './main.css'

require(/* webpackPreload: true */ '../src/core')
import(/* webpackPreload: true */ './github/github-box')
import(/* webpackPreload: true */ './modal/WadFileSelectionModal')
import(/* webpackPreload: true */ './clearcache/ClearCacheButton')
import(/* webpackPreload: true */ '../src/main')

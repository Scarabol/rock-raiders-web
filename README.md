# Rock Raiders Web

Rock Raiders Web is an experiment aimed at recreating Rock Raiders PC game (1999) using browser based technologies.

**Enjoy!**

<a href="https://github.com/Scarabol/rock-raiders-web/blob/dev/screenshots/2021-04-02%2001.png?raw=true">
<img src="https://github.com/Scarabol/rock-raiders-web/blob/dev/screenshots/2021-04-02%2001.png?raw=true" width="360" alt="Screenshot">
</a>
<a href="https://github.com/Scarabol/rock-raiders-web/blob/dev/screenshots/2021-04-02%2002.png?raw=true">
<img src="https://github.com/Scarabol/rock-raiders-web/blob/dev/screenshots/2021-04-02%2002.png?raw=true" width="360" alt="Screenshot">
</a>

<a href="https://github.com/Scarabol/rock-raiders-web/blob/dev/screenshots/2021-04-02%2003.png?raw=true">
<img src="https://github.com/Scarabol/rock-raiders-web/blob/dev/screenshots/2021-04-02%2003.png?raw=true" width="360" alt="Screenshot">
</a>
<a href="https://github.com/Scarabol/rock-raiders-web/blob/dev/screenshots/2021-04-02%2004.png?raw=true">
<img src="https://github.com/Scarabol/rock-raiders-web/blob/dev/screenshots/2021-04-02%2004.png?raw=true" width="360" alt="Screenshot">
</a>

<a href="https://github.com/Scarabol/rock-raiders-web/blob/dev/screenshots/2021-07-05%2001.png?raw=true">
<img src="https://github.com/Scarabol/rock-raiders-web/blob/dev/screenshots/2021-07-05%2001.png?raw=true" width="360" alt="Screenshot">
</a>
<a href="https://github.com/Scarabol/rock-raiders-web/blob/dev/screenshots/2021-07-05%2002.png?raw=true">
<img src="https://github.com/Scarabol/rock-raiders-web/blob/dev/screenshots/2021-07-05%2002.png?raw=true" width="360" alt="Screenshot">
</a>

<a href="https://github.com/Scarabol/rock-raiders-web/blob/dev/screenshots/2022-03-20%2001.png?raw=true">
<img src="https://github.com/Scarabol/rock-raiders-web/blob/dev/screenshots/2022-03-20%2001.png?raw=true" width="360" alt="Screenshot">
</a>
<a href="https://github.com/Scarabol/rock-raiders-web/blob/dev/screenshots/2022-03-20%2002.png?raw=true">
<img src="https://github.com/Scarabol/rock-raiders-web/blob/dev/screenshots/2022-03-20%2002.png?raw=true" width="360" alt="Screenshot">
</a>
<a href="https://github.com/Scarabol/rock-raiders-web/blob/dev/screenshots/2022-03-20%2003.png?raw=true">
<img src="https://github.com/Scarabol/rock-raiders-web/blob/dev/screenshots/2022-03-20%2003.png?raw=true" width="360" alt="Screenshot">
</a>
<a href="https://github.com/Scarabol/rock-raiders-web/blob/dev/screenshots/2022-03-20%2004.png?raw=true">
<img src="https://github.com/Scarabol/rock-raiders-web/blob/dev/screenshots/2022-03-20%2004.png?raw=true" width="360" alt="Screenshot">
</a>

## Development Roadmap

### v0.7.0 - Rockies, Slugs And Damage

- switch all raider with weapon from work to defend
- let raider in defend mode target any known slug or rock monster
- make raider flee from nearby monsters
- add spawn timer for slugs, only one slug per hole
- make slugs look for nearby reachable buildings or fences to leech energy
- spawn a depleted energy crystal, when slug leeched energy
- wake up rock monsters, when raider are near or by big bangs
- reset emerge rock monster trigger from walls with EmergeTimeOut from config
- make monster attack any nearby buildings
- make monster create bolder and throw at buildings
- show lightning beam between electric fences
- show ElectricFenceStud between electric fences and buildings
- make rock monster crumble when reaching a fence or lightning
- make rock monster pick up nearby raider and shake them upside down
- make rock monster punch vehicles passing by and vehicle break boulders
- Raider get tired while carrying and eat at barracks

### v0.8.0 - Late game features

- First-Person and shoulder camera
- Geologists and scanner
- Background music and soundtrack
- Tutorial levels and helper features
- Show FLT mini-figure animation with mission briefing
- Add screen shake for exploding dynamites
- Add all work sounds for all jobs
- Show loading screen when starting a level
- Add rockfall transition when switching in main menu
- Show misc anim LavaErosionSmoke over lava
- Add water and lava animation (texture UV coords tearing)
- Change cursor to X when over disabled IconPanelButtons
- Unlock levels only after linked levels are completed
- Move camera with click on mini map and show camera view area as wireframe
- Use same team for all missions and add names to raiders
- Auto switch from portrait to landscape mode in fullscreen
- Refactor job system to allow multi-carry jobs for vehicles
- Large Cat not usable to carry vehicles in Level 19
- Add surface type tooltips for map panel
- Render last selected entity with rotating camera in radar panel
- Add magnet cursor to map panel to track entities

### v0.9.0 - Polishing

- Fix all remaining bugs

## Known Issues

### Nice to have

- Scared raider should ignore all jobs like movement
- Inverted corner surfaces are treated as discovered and slug holes are revealed there
- Add rotation speed to entities and play turnLeft, turnRight animations
- Clear job from surface, if dynamite cannot reach target
- Use long press on mobile browser to emulate right click
- Do not allow touch events to move scene camera while build mode selection is active
- Camera can get stuck on mobile browsers when using multiple pointer gestures
- Rendering issue on mobile with icon panel and mission briefing, clearing rect seems to small
- Hardware cursor on priority panel cannot move along with prioritization, because browser won't allow cursor position manipulation

### Cosmetics

- Show health number in vehicle tooltip
- Play vehicle SFX when tooltip is shown
- Mesh texture not shown for lava rockies
- Make tooltips stay on screen and follow cursor
- Numbers above ticking dynamite are not shown correctly sometimes
- Two buttons in priority list can be hovered/pressed/released at the same time

## Technical Debt

- Uplift configuration parsing into loading process for type safety and error resilience
- Move three.js rendering to separate worker (blocked until [worker support for audio](https://github.com/WebAudio/web-audio-api/issues/2423) is solved, so [AudioContext](https://github.com/mrdoob/three.js/blob/master/src/audio/AudioContext.js) does not need _window_ anymore)

## Development

To start development environment, please take the following steps:

```bash
git clone https://github.com/scarabol/rock-raiders-web.git
cd rock-raiders-web
npm install
npm run dev
```

## Credits

### Related Projects

* [Rock Raiders Remake](https://github.com/rystills/rock-raiders-remake) - another web based 2D clone
* [toolstore.io](https://github.com/marcbizal/toolstore-io) - web based WAD file handling
* [RRU](https://www.rockraidersunited.com/) - Game and mods community

### Technical Stuff

* [three.js](https://github.com/mrdoob/three.js) - Web based 3D Engine
* [IDB-Keyval](https://github.com/jakearchibald/idb-keyval) - Indexed cache handling helper

### Media

* [YouTube walkthrough](https://www.youtube.com/watch?v=2jQ93-cdJeY) - Nice walkthrough with many details

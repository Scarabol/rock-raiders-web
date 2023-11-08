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

### v0.8.0 - Late game features

- Refactor job system to allow multi-carry jobs for vehicles
- Raider get tired while carrying and eat at barracks

- Add surface type tooltips for map panel
- Add magnet cursor to map panel to track entities
- Move camera with click on radar map panel
- Show camera view area as wireframe on radar map panel
- Add first-person and shoulder camera

- Add screen shake for exploding dynamites
- Show loading screen when starting a level
- Show FLT mini-figure animation with mission briefing
- Change cursor to X and play sound when click on gui layer is not consumed

### v0.9.0 - Polishing

- Tutorial levels and helper features
- Use same team for all missions and add names to raiders
- Auto switch from portrait to landscape mode in fullscreen
- Background music and soundtrack (needs files from ISO-File)
- Fix all remaining bugs

### v1.0.0 - Final Release

- Unlock levels only after linked levels are completed (see XXX)

## Known Issues

### Important

- Forbidding collection of ores or crystals stops building projects too
- Vehicles can get stuck in toolstations, needs vehicle behavior
- Mark start and end tile in path finding always as accessible to make entering water vehicles and drilling easier, also frees raider stuck on lava
- Large Cat not usable to carry vehicles in Level 19
- Damage and blow up buildings with lava erosion
- Make idle raider leave lava fields

### Nice to have

- Save game state in browser cache to allow reload
- Add rotation speed to entities and play turnLeft, turnRight animations
- Do not allow touch events to move scene camera while build mode selection is active
- Hardware cursor on priority panel cannot move along with prioritization, because browser won't allow cursor position manipulation

### Cosmetics

- Missing rockfall animation when switching in main menu
- Sparkles over recharge seam have wrong offset and rotation in Level 24 and Level 13
- Lava rockies texture not using correct UV coordinates
- Show health percentage in vehicle tooltip as power
- Make tooltips stay on screen and follow cursor
- Play vehicle SFX when tooltip is shown
- Orange smoke column above lava tiles missing
- Water and lava animation missing, might use texture UV coords tearing
- Raider scene entity position/rotation not correct when thrown by rocky
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

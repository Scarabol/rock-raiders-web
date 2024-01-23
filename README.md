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
<a href="https://github.com/Scarabol/rock-raiders-web/blob/dev/screenshots/2023-10-26%2001.png?raw=true">
<img src="https://github.com/Scarabol/rock-raiders-web/blob/dev/screenshots/2023-10-26%2001.png?raw=true" width="360" alt="Screenshot">
</a>
<a href="https://github.com/Scarabol/rock-raiders-web/blob/dev/screenshots/2023-10-31%2001.png?raw=true">
<img src="https://github.com/Scarabol/rock-raiders-web/blob/dev/screenshots/2023-10-31%2001.png?raw=true" width="360" alt="Screenshot">
</a>

## Development Roadmap

### v0.8.0 - Late game features

- Add magnet cursor to map panel to track entities
- Move camera with click on radar map panel
- Show camera view area as wireframe on radar map panel

- Add first-person and shoulder camera
- Implement laser shooting for turrets and mobile lasers

### v0.9.0 - Polishing

- Tutorial levels and helper features
- Use same team for all missions and add names to raiders
- Auto switch from portrait to landscape mode in fullscreen
- Background music and soundtrack (needs files from ISO-File)
- Fix all remaining bugs

### v1.0.0 - Final Release

- Unlock levels only after linked levels are completed (see XXX)
- Start random level picks only unlocked and prefers unranked levels, never picks tuts

## Known Issues

### Important

- Lava erosion seems to slow or not working in Level 23 and others
- Forbidding collection of ores or crystals stops building projects too
- Level is not marked as failed even if too many crystals are missing
- Separate UI components to support other screen ratios then 4:3
- FPS histogram sometimes not rendered on debug layer
- Mark start and end tile in path finding always as accessible to make entering water vehicles and drilling easier, also frees raider stuck on lava
- Large Cat not usable to carry vehicles in Level 19
- Damage and blow up buildings with lava erosion
- Make idle raider leave lava fields

### Nice to have

- Geologists do not scan when placed in vehicles
- Allow raider in alarm mode to be moved by player
- Add rotation speed to entities and play turnLeft, turnRight animations
- Save complete game state in browser cache to allow reload
- Hardware cursor on priority panel cannot move along with prioritization, because browser won't allow cursor position manipulation
- Add level reference to URL for easier reloading, check if game is unlocked when not in dev mode
- Add option to read savegames from URL

### Cosmetics

- No click sound for save-/load-game-buttons in main menu
- No sirene sound when alarm mode is enabled
- Electric fences may show small beam into nowhere
- Digger vehicles have big offset to wall when drilling
- Lava rockies texture not using correct UV coordinates
- Show health percentage in vehicle tooltip as power
- Play vehicle SFX when tooltip is shown
- Orange smoke column above lava tiles missing
- Water and lava animation missing, might use texture UV coords tearing
- Geo-dome scanner range does not match with animated circle on map view
- Raider scene entity position/rotation not correct when thrown by rocky
- Numbers above ticking dynamite are not shown correctly sometimes
- Two buttons in priority list can be hovered/pressed/released at the same time
- Roof mesh is not added as ceiling to scene
- Play mission briefing SFX when briefing is shown on level start
- Use pro-meshes to render high-detail walls in first person and shoulder view
- Shining around buildings teleported in is shown with offset
- Medium raider meshes seem to have wrong normal vectors and shown with holes
- Bats don't appear in flocks

## Technical Debt

- Improve type safety for job system with separate sets for each fulfiller type
- Introduce async UI load functions to make sure all assets are ready before showing UI and avoid unnecessary re-renders on start
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
* [Reddit Community](https://www.reddit.com/r/Rockraiders/) - Subreddit

### Technical Stuff

* [three.js](https://github.com/mrdoob/three.js) - Web based 3D Engine
* [IDB-Keyval](https://github.com/jakearchibald/idb-keyval) - Indexed cache handling helper

### Media

* [YouTube walkthrough](https://www.youtube.com/watch?v=2jQ93-cdJeY) - Nice walkthrough with many details

### Support This Project

This project is meant to be work of passion without any commercial intentions.

<a href="https://www.buymeacoffee.com/Scarabol" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" style="height: 60px !important;width: 217px !important;" ></a>

# Rock Raiders Web

Rock Raiders Web is an experiment aimed at recreating Rock Raiders PC game (1999) using browser based technologies.

**Enjoy!**

<a href="https://github.com/Scarabol/rock-raiders-web/blob/test/screenshots/2021-04-02%2001.png?raw=true">
<img src="https://github.com/Scarabol/rock-raiders-web/blob/test/screenshots/2021-04-02%2001.png?raw=true" width="360" alt="Screenshot">
</a>
<a href="https://github.com/Scarabol/rock-raiders-web/blob/test/screenshots/2021-04-02%2002.png?raw=true">
<img src="https://github.com/Scarabol/rock-raiders-web/blob/test/screenshots/2021-04-02%2002.png?raw=true" width="360" alt="Screenshot">
</a>

<a href="https://github.com/Scarabol/rock-raiders-web/blob/test/screenshots/2021-04-02%2003.png?raw=true">
<img src="https://github.com/Scarabol/rock-raiders-web/blob/test/screenshots/2021-04-02%2003.png?raw=true" width="360" alt="Screenshot">
</a>
<a href="https://github.com/Scarabol/rock-raiders-web/blob/test/screenshots/2021-04-02%2004.png?raw=true">
<img src="https://github.com/Scarabol/rock-raiders-web/blob/test/screenshots/2021-04-02%2004.png?raw=true" width="360" alt="Screenshot">
</a>

<a href="https://github.com/Scarabol/rock-raiders-web/blob/test/screenshots/2021-07-05%2001.png?raw=true">
<img src="https://github.com/Scarabol/rock-raiders-web/blob/test/screenshots/2021-07-05%2001.png?raw=true" width="360" alt="Screenshot">
</a>
<a href="https://github.com/Scarabol/rock-raiders-web/blob/test/screenshots/2021-07-05%2002.png?raw=true">
<img src="https://github.com/Scarabol/rock-raiders-web/blob/test/screenshots/2021-07-05%2002.png?raw=true" width="360" alt="Screenshot">
</a>

## Development Roadmap

### Vehicles (v0.5.x)

- Refactor job system to allow multi-carry jobs
- Refactor upgrade system and make vehicles upgradeable
- Take some screenshots with vehicles

### Near (v0.6.0)

- turn all lights red, when alarm mode is active
- switch all raider with weapon from work to defend
- let raider in defend mode target any known slug or rock monster
- add spawn timer for slugs, only one slug per hole
- make slugs look for nearby reachable buildings or fences to leech energy
- spawn a depleted energy crystal, when slug leeched energy
- wake up rock monsters, when raider are near or by big bangs
- show health bar over raider, monster and buildings, when health changes
- beam up raider or buildings when health is too low
- emerge rock monster by timer from walls
- make monster attack any nearby powered buildings
- make monster create bolder and throw at buildings
- show lightning between electric fences
- show ElectricFenceStud between electric fences and buildings
- make rock monster crumble when reaching a fence or lightning
- make rock monster pick up nearby raider and shake them upside down
- make rock monster punch vehicles passing by

### Mid (v0.7.0)

- Bricks and brick refinery
- Level score shown and level unlocking
- Save and load
- First-Person and shoulder camera

### Far (v0.8.0)

- Background music and soundtrack
- Show moving entities in radar panel (raider, monster, vehicles, collectables)
- Geologists and scanner
- Tutorial levels

### Polishing (v0.9.0)

- Fix all remaining bugs

## Known Bugs

### Important

- Lava erosion not implemented (test with level 14)
- Dynamite can not be spawned, if demolition exists, but no toolstation level 2
- Walker digger never completes to drill down hard rock
- When level is quit by player diggables are always shown as 0%
- Ore and Crystals are shown at 100% even though there was plenty left (in rubble and walls)
- Percent of raider shown in reward screen not compared to oxygen rate and therefore always too low

### Nice to have

- Dependency tooltips for buildings/vehicles not shown
- Camera can glitch through terrain
- Provide resources explicit to workers with messaging
- Add rotation speed to entities and play turnLeft, turnRight animations
- Large digger and walker digger moving into wall for drilling
- Beamup animation sequence missing on successful level end
- Explosion sound for dynamite is very quiet
- Screen shake missing for exploding dynamites

### Cosmetics

- Cursor may not react on targeted object
- Adapt building placement marker to surface shape
- Add water and lava animation (texture UV coords tearing)
- Selection layer has bad performance and behaves funny when hovering GUI
- Change cursor to X when over disabled IconPanelButtons
- Add captain flh animation to mission briefing
- Seams do not show tear down progress while drilling
- Driver may sit wrong way around on vehicle
- Arrows not shown on power station flaps
- Numbers above dynamite not shown as sprite (same issue as with sleeping rockies?)
- Level 11 spams console with unreachable jobs
- Work sounds missing for most of the jobs
- Show loading screen when starting a level
- Two buttons in priority list can be hovered/pressed/released at the same time

## Technical Debt

- Uplift configuration parsing into loading process for type safety and error resilience
- Make animated meshes cloneable and move their creation into ResourceManager within loading screen for performance
- Make AnimClip cloneable (requires separation too, because classes mixes state and type of animations)
- Cleanup meshes and scene after level ends (currently leaks resources)
- Move threejs rendering to separate worker

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

* [Youtube walkthrough](https://www.youtube.com/watch?v=2jQ93-cdJeY) - Nice walkthrough with many details

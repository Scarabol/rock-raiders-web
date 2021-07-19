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

### Near (v0.6.0)

- Alarm mode and shooting
- Rock-Monsters and Slugs
- Damage, show health bar and teleport at bad health

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

- Wait for all raiders/vehicles/ores/crystals to leave building site, before spawning in

### Nice to have

- Dependency tooltips for buildings/vehicles not shown
- Camera can glitch through terrain and zoom in/out infinitely
- Provide resources explicit to workers with messaging
- Add rotation speed to entities and play turnLeft, turnRight animations

### Cosmetics

- Cursor may not react on targeted object
- Adapt building placement marker to surface shape
- Add water and lava animation (texture UV coords tearing)
- Selection layer has bad performance and behaves funny when hovering GUI
- Use given wheel radius to rotate wheels while moving vehicles
- ElectricFenceStud missing between fences and fence and building
- Change cursor to X when over disabled IconPanelButtons
- Add captain flh animation to mission briefing
- Tooltip SFX sounds not working for priority panel
- Seams get not teared down while drilling
- Driver may sit wrong way around on vehicle
- Yellow arrows not shown on power station flaps

## Technical Debt

- Uplift configuration parsing into loading process for type safety and error resilience
- Make animated meshes cloneable and move their creation into ResourceManager within loading screen for performance
- Make AnimClip cloneable (requires separation too, because classes mixes state and type of animations)
- Cleanup meshes and scene after level ends (currently leaks resources)
- Refactor BuildingEntities and VehicleEntities, no actual typing needed
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

### Other Rock Raider Projects

* [Rock Raiders Remake](https://github.com/rystills/rock-raiders-remake) - another web based 2D clone
* [toolstore.io](https://github.com/marcbizal/toolstore-io) - web based WAD file handling
* [RRU](https://www.rockraidersunited.com/) - Game and mods community

### Technical Stuff

* [three.js](https://github.com/mrdoob/three.js) - Web based 3D Engine
* [IDB-Keyval](https://github.com/jakearchibald/idb-keyval) - Indexed cache handling helper

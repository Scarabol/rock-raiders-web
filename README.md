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

### Vehicles Milestone (v0.5.0)

- Auto train raider to man vehicles
- Raider sometimes sitting wrong way around in vehicles
- Make vehicles work
- Activity of upgrades should be synced (for example walker diggers engines)

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

- GunStation mesh not loaded correctly missing turret part (test with level 18)
- Surface discovery has very bad performance (test with level 20 and level 17)
- Wait for all raiders/vehicles/ores/crystals to leave building site, before spawning in
- Raiders not spawned in Level 01 when restarted from Level 03
- Level24 cannot be loaded, because collapsing surface needs terrain, which is not yet initialized

### Nice to have

- Dependency tooltips for buildings/vehicles not shown
- Camera can glitch through terrain and zoom in/out infinitely
- GUI not shown when game start paused by debugger
- Provide resources explicit to workers with messaging
- Add rotation speed to entities and play turnLeft, turnRight animations

### Cosmetics

- Cursor does not (always) react on targeted object
- Adapt building placement marker to surface shape
- Add water and lava animation (texture UV coords tearing)
- Selection layer has bad performance and behaves funny when hovering GUI
- Shovel and drilling cursor shown even if selected entities cannot do the job
- Use given wheel radius to rotate wheels while moving vehicles
- ElectricFenceStud missing between fences and fence and building
- Change cursor to X when over disabled IconPanelButtons
- Add captain flh animation to mission briefing
- Add no-power-thunderbolt to buildings that are switched on, but without power supply
- Add greenish priority panel button hover frame
- Tooltip SFX sounds not working for priority panel
- Seams get not teared down while drilling
- Ring on drills rendered as flat plate instead of helix

## Technical Debt

- Uplift configuration parsing into loading process for type safety and error resilience
- Make animated meshes cloneable and move their creation into ResourceManager within loading screen for performance
- Make AnimClip cloneable (requires separation too, because classes mixes state and type of animations)
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

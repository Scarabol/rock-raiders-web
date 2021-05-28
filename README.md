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

## Development Roadmap

### Vehicles Milestone (v0.5.0)

- Introduce waiting lists for vehicles
- Add pricing for vehicles
- Add range checks to jobs, such that raider mount vehicles earlier and place down materials on buildings sites earlier (better check position of material)
- Remove default driver skill from raiders
- Auto train raider to man vehicles
- Make raider unselectable as driver
- Implement beam up for vehicles

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

## Known Bugs

### Important

- make game pausable and actually pause in escape screen (also fixes elapsed game time)
- GunStation mesh not loaded correctly missing turret part (test with level 18)
- Surface discovery has very bad performance (test with level 20 and level 17)
- Wait for all raiders/vehicles/ores/crystals to leave building site, before spawning in
- Raiders not spawned in Level 01 when restarted from Level 03
- Level24 cannot be loaded, because collapsing surface needs terrain, which is not yet initialized
- Refactor power management introduce power grid class

### Nice to have

- Dependency tooltips for buildings/vehicles not shown
- Camera can glitch through terrain and zoom in/out infinitely
- GUI not shown when game start paused by debugger
- Provide resources explicit to workers with messaging
- Least prioritized task is shown outside of panel on level start
- Fallins can origin from surfaces that are not reinforcable (see Level05)
- Add rotation speed to entities and play turnLeft, turnRight animations

### Cosmetics

- Cursor does not (always) react on targeted object
- Adapt building placement marker to surface shape
- Add water and lava animation (texture UV coords tearing)
- Selection layer has bad performance and behaves funny when GUI is hovered
- Shovel and drilling cursor shown even if selected entities cannot do the job
- Use given wheel radius to rotate wheels while moving vehicles
- ElectricFenceStud missing between fences and fence and building
- Change cursor to X when over disabled IconPanelButtons
- Add captain flh animation to mission briefing
- Fallins can happen outside of visible area (at least hide the info message)
- Add no-power-thunderbolt to buildings that are switched on, but without power supply
- Add greenish priority panel button hover frame
- Tooltip SFX sounds not working for priority panel

## Technical Debt

- Move threejs rendering to separate worker

## Development

To start development environment, please take the following steps:

```bash
git clone https://github.com/scarabol/rock-raiders-web.git
cd rock-raiders-web
npm install
npm run dev
```

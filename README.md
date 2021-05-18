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

### Near

- Radar map and geologists
- Camera controls panel
- Alarm mode and shooting

### Mid

- Rock-Monsters and Slugs
- Damage, show health bar and teleport at bad health
- Bricks and brick refinery
- Level score shown and level unlocking

### Far

- Save and load
- First-Person and shoulder camera
- Background music and soundtrack
- Tutorial levels

## Known Bugs

### Important

- make game pausable and actually pause in escape screen (also fixes elapsed game time)
- GunStation mesh not loaded correctly missing turret part (test with level 18)
- Surface discovery has very bad performance
- Wait for all raiders/vehicles/ores/crystals to leave building site, before spawning in
- Clear rubble job not working as expected
- Raiders not spawned in Level 01 when restarted from Level 03

### Nice to have

- Dependency tooltips for buildings/vehicles not shown
- Camera can glitch through terrain and zoom in/out infinitely
- GUI not shown when game start paused by debugger
- Provide resources explicit to workers with messaging
- Least prioritized task is shown outside of panel on level start

### Cosmetics

- Cursor does not (always) react on targeted object
- Adapt building placement marker to surface shape
- Add water and lava animation
- Selection layer has bad performance and behaves funny when GUI is hovered
- Shovel and drilling cursor shown even if selected entities cannot do the job

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

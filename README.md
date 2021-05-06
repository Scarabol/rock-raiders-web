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

- Vehicles (Land, Air, Sea)
- Sounds and music
- Radar map and geologists
- Camera controls (keyboard, panel)

### Mid

- Alarm mode and shooting
- Rock-Monsters and Slugs
- Damage, show health bar and teleport at bad health
- Bricks and brick refinery

### Far

- Level score shown and level unlocking
- Save and load
- First-Person and shoulder camera
- Tutorial levels

## Known Bugs

### Important

- make game pausable and actually pause in escape screen (also fixes elapsed game time)
- GunStation mesh not loaded correctly missing turret part
- Surface discovery has very bad performance
- Teleport up for docks turning water into land (test with level 11)
- Power path of docks is showing on water surface in level 11
- ObjectListLoader throwing errors in Level 11

### Nice to have

- Requirements tooltip for buildings/vehicles not shown
- When scene is disposed animation interval must be canceled
- Camera can glitch through terrain and zoom in/out infinitely
- Wait for all raiders/vehicles/ores/crystals to leave building site, before spawning in
- Fix barriers placed outside of building site
- Fix camera position and angle on level start

### Cosmetics

- No tooltips
- Cursor does not (always) react on targeted object
- Adapt building placement marker to surface shape
- Fix blueish teleport in frame not shown on surface
- Add water and lava animation

## Technical Debt

- Epic: move threejs rendering to separate worker
- Epic: move GUI rendering to separate worker

## Development

To start development environment, please take the following steps:

```bash
git clone https://github.com/scarabol/rock-raiders-web.git
cd rock-raiders-web
npm install
npm run dev
```

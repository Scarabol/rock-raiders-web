# Rock Raiders Web
Rock Raiders Web is an experiment aimed at recreating Rock Raiders PC game (1999) using browser based technologies.

**Enjoy!**

## Screenshots
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
- Work priority order screen
- Info messages
- Escape screen
- Mission briefing
- Options screen
- Raider Training
- Spiders, Bats

### Mid
- Carry energy crystals to power stations
- Electric fences and power consumption/outage
- Air consumption and production
- Brick refinery
- All other buildings
- Damage
- Teleport up on demand or at bad health
- Vehicles
- Raider commands (eat, board, pickup, drop, grab, train...)
- Radar map

### Far
- Alarm mode and shooting
- Monsters
- Sounds and music
- Level score shown and level unlocking
- Save and load
- First-Person and shoulder camera
- Tutorial levels

## Known Bugs

### Important
- Right click commands raider and moves camera too
- Drilling time not related to material
- Reward screen not reset

### Nice to have
- Requirements tooltip for buildings/vehicles not shown
- When scene is disposed animation interval must be canceled
- Camera can glitch through terrain and zoom in/out infinitely
- Scene should be rendered in its own worker (thread)

### Cosmetics
- Requested number of raiders not shown in icon panel
- No tooltips
- Cursor does not react on targeted object
- Loading screen does not resize with window

## Development
To start development environment, please follow the following steps:

```bash
git clone https://github.com/scarabol/rock-raiders-web.git
cd rock-raiders-web
npm install
npm run dev
```

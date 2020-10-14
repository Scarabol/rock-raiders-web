import { LoadingScreen } from './screen/LoadingScreen';
import { ResourceManager } from './game/engine/ResourceManager';
import { MainMenuScreen } from './screen/MainMenuScreen';
import { GameScreen } from './game/GameScreen';
import { RewardScreen } from './screen/RewardScreen';
import { EventManager } from './game/engine/EventManager';

// setup basic game engine structure

const resMgr = new ResourceManager();
const eventMgr = new EventManager();
const loadingScreen = new LoadingScreen(resMgr, eventMgr);
const mainMenuScreen = new MainMenuScreen(resMgr, eventMgr);
const gameScreen = new GameScreen(resMgr, eventMgr);
const rewardScreen = new RewardScreen(resMgr, eventMgr);

// link all components with callbacks

loadingScreen.onResourcesLoaded = () => {
    mainMenuScreen.showMainMenu();
    // mainMenuScreen.selectLevel('Level05'); // FIXME directly start level for debugging
};
mainMenuScreen.onLevelSelected = (levelName) => {
    gameScreen.startLevel(levelName);
};
gameScreen.onLevelEnd = (gameResult) => {
    rewardScreen.showReward(gameResult);
};
rewardScreen.onContinue = mainMenuScreen.showLevelSelection;

// start the game engine with loading resources

loadingScreen.startLoading();

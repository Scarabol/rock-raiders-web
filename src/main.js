import { LoadingScreen } from './gui/menu/LoadingScreen';
import { ResourceManager } from './core/ResourceManager';


const resMgr = new ResourceManager();
const loadingScreen = new LoadingScreen(resMgr);
const mainMenuScreen = new MainMenuScreen(resMgr);
const gameScreen = new GameScreen(resMgr);
const rewardScreen = new RewardScreen(resMgr);
// FIXME register screens for onresize


loadingScreen.onResourcesLoaded = mainMenuScreen.showMainMenu;
mainMenuScreen.onLevelSelected = (levelConf) => {
    gameScreen.startLevel(levelConf);
};
gameScreen.onLevelEnd = (gameResult) => {
    rewardScreen.showReward(gameResult);
}
rewardScreen.onContinue = mainMenuScreen.showLevelSelection;


loadingScreen.startLoading();

// startWithCachedFiles(() => {
//     loadingCanvas.style.visibility = 'hidden';
//     // FIXME load/create level
//     const sceneMgr = new SceneManager();
//     sceneMgr.startRendering();
// });

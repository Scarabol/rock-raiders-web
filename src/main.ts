import { ResourceManager } from './resource/ResourceManager';
import { LoadingScreen } from './screen/LoadingScreen';
import { MainMenuScreen } from './screen/MainMenuScreen';
import { GameScreen } from './screen/GameScreen';
import { RewardScreen } from './screen/RewardScreen';

// define constants

export const JOB_SCHEDULE_INTERVAL = 1000; // milliseconds
export const JOB_ACTION_RANGE = 5;
export const CHECK_SPANW_RAIDER_TIMER = 1000; // milliseconds
export const RAIDER_SPEED = 2.0;
export const MAX_RAIDER_BASE = 12;
export const ADDITIONAL_RAIDER_PER_SUPPORT = 10;

export const PANEL_ANIMATION_MULTIPLIER = 3;
export const HEIGHT_MULTIPLER = 0.05;

// native constants (do not change)

export const SPRITE_RESOLUTION_WIDTH = 640;
export const SPRITE_RESOLUTION_HEIGHT = 480;
export const TILESIZE = 40;
export const NATIVE_FRAMERATE = 30;

// setup and link all components

const loadingScreen = new LoadingScreen();

ResourceManager.onMessage = (msg: string) => {
    loadingScreen.setLoadingMessage(msg);
};
ResourceManager.onInitialLoad = (totalResources: number) => {
    loadingScreen.enableGraphicMode(totalResources);
};
ResourceManager.onAssetLoaded = (assetIndex: number) => {
    loadingScreen.onAssetLoaded(assetIndex);
};
ResourceManager.onLoadDone = () => {
    // complete setup
    const mainMenuScreen = new MainMenuScreen();
    const gameScreen = new GameScreen();
    const rewardScreen = new RewardScreen();

    mainMenuScreen.onLevelSelected = (levelName) => {
        gameScreen.startLevel(levelName);
    };
    gameScreen.onLevelEnd = (gameResult) => {
        rewardScreen.showReward(gameResult);
    };
    rewardScreen.onContinue = mainMenuScreen.showLevelSelection;

    // setup complete
    loadingScreen.hide();
    mainMenuScreen.showMainMenu();
};

// start the game engine with loading resources

loadingScreen.show();
ResourceManager.startLoading('./LegoRR0.wad', './LegoRR1.wad'); // TODO use input elements to define URLs

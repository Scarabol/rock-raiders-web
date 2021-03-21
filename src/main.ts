import { ResourceManager } from './resource/ResourceManager';
import { LoadingScreen } from './screen/LoadingScreen';
import { MainMenuScreen } from './screen/MainMenuScreen';
import { GameScreen } from './screen/GameScreen';
import { RewardScreen } from './screen/RewardScreen';
import { GameState } from './game/model/GameState';
import { Modal } from 'bootstrap';

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
// TODO strip modal from HTML and make it a dynamically loaded tsx component with sass compiled bootstrap css
const wadfileSelectModal = new Modal(document.getElementById('wadfiles_select_modal'), {
    backdrop: 'static',
    keyboard: false
});
const btnStartFile = document.getElementById('button-start-file') as HTMLButtonElement;
btnStartFile.addEventListener('click', () => {
    btnStartFile.disabled = true;
    const wad0File = URL.createObjectURL((document.getElementById('wad0-file') as HTMLInputElement).files[0]);
    const wad1File = URL.createObjectURL((document.getElementById('wad1-file') as HTMLInputElement).files[0]);
    ResourceManager.startLoadingFromUrl(wad0File, wad1File);
});
const btnStartUrl = document.getElementById('button-start-url') as HTMLButtonElement;
btnStartUrl.addEventListener('click', () => {
    btnStartUrl.disabled = true;
    const wad0Url = (document.getElementById('wad0-url') as HTMLInputElement).value;
    const wda1Url = (document.getElementById('wad1-url') as HTMLInputElement).value;
    ResourceManager.startLoadingFromUrl(wad0Url, wda1Url);
});

ResourceManager.onMessage = (msg: string) => {
    loadingScreen.setLoadingMessage(msg);
};
ResourceManager.onCacheMissed = () => {
    wadfileSelectModal.show();
};
ResourceManager.onInitialLoad = (totalResources: number) => {
    wadfileSelectModal.hide();
    loadingScreen.enableGraphicMode(totalResources);
};
ResourceManager.onAssetLoaded = (assetIndex: number) => {
    loadingScreen.setLoadingState(assetIndex);
};
ResourceManager.onLoadDone = () => {
    // complete setup
    const mainMenuScreen = new MainMenuScreen();
    const gameScreen = new GameScreen();
    const rewardScreen = new RewardScreen();

    mainMenuScreen.onLevelSelected = (levelName) => {
        gameScreen.startLevel(levelName);
    };
    gameScreen.onLevelEnd = () => {
        gameScreen.hide();
        rewardScreen.show();
    };
    rewardScreen.onAdvance = () => {
        GameState.reset();
        mainMenuScreen.showLevelSelection();
    };

    // setup complete
    loadingScreen.hide();
    mainMenuScreen.showMainMenu();
    // mainMenuScreen.selectLevel('Level01');
    // mainMenuScreen.selectLevel('Level05');
    // mainMenuScreen.selectLevel('Level09');
    // rewardScreen.show();
};

// start the game engine with loading resources

loadingScreen.show();
ResourceManager.startLoadingFromCache();

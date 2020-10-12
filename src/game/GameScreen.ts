import { BaseScreen } from '../gui/BaseScreen';

class GameScreen extends BaseScreen {

    onLevelEnd;

    startLevel(levelName) {
        console.log('Starting level ' + levelName);
    }

}

export { GameScreen };

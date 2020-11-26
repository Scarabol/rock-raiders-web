/** Function documentation mostly copied from the following URLs
 *
 * https://kb.rockraidersunited.com/User:Jessietail/NERPs_reference
 * https://web.archive.org/web/20131206122442/http://rru-stuff.org/nerpfuncs.html
 * https://kb.rockraidersunited.com/NERPs_documentation#Labels
 *
 */
import { GameResultState, GameState } from '../game/model/GameState';
import { Building } from '../game/model/entity/building/Building';

export class NerpRunner {

    debug = false;
    onLevelComplete: () => any = null;

    registers = new Array(8).fill(0);
    timers = new Array(4).fill(0);
    scriptLines = []; // contains humand readable script strings
    statements = []; // contains parsed statements for execution
    macros = {};
    labels = {};
    halted = false;
    programCounter = 0;
    messages = [];
    // more state variables and switches
    messagePermit = null;

    constructor(debug = false) {
        this.debug = debug;
    }

    /**
     * Internally used to validate and parse a register number.
     * @param register
     * @return {number}
     */
    checkRegister(register) {
        const num = parseInt(register);
        if (isNaN(num) || num < 0 || num > this.registers.length) throw 'Invalid register (' + register + ') provided';
        return num;
    }

    /**
     * Internally used to validate and parse a value before setting or adding it with a register.
     * @param value
     * @return {number}
     */
    checkRegisterValue(value) {
        const num = parseInt(value);
        if (isNaN(num)) throw 'Invalid register value (' + value + ') provided';
        return num;
    }

    /**
     * Gets the value currently stored in the given register, internally used to handle all registers with one method.
     * @param register the register to read
     * @return {number} returns the value currently stored in the register
     */
    getR(register) {
        register = this.checkRegister(register);
        return this.registers[register];
    }

    /**
     * Sets the given value for the given register, internally used to handle all registers with one method.
     * @param register the register to set
     * @param value the value to set for the given register
     */
    setR(register, value) {
        register = this.checkRegister(register);
        value = this.checkRegisterValue(value);
        this.registers[register] = value;
    }

    /**
     * Adds the given value to the given register, internally used to handle all registers with one method.
     * @param register the register to add to
     * @param value the value to add to the given register
     */
    addR(register, value) {
        register = this.checkRegister(register);
        value = this.checkRegisterValue(value);
        this.registers[register] += value;
    }

    /**
     * Set the respective timer to the given numerical value. Units are in milliseconds.
     * @param timer
     * @param value
     */
    setTimer(timer, value) {
        const num = parseInt(value);
        if (isNaN(num)) throw 'Can\'t set timer to NaN value: ' + value;
        this.timers[timer] = new Date().getTime() + num;
    }

    /**
     * Gets the value of the respective timer. Units are in milliseconds.
     * @param timer
     * @return {number}
     */
    getTimer(timer) {
        return new Date().getTime() - this.timers[timer];
    }

    /**
     * End the level successfully and show the score screen.
     */
    setLevelCompleted() {
        this.halted = true;
        GameState.resultState = GameResultState.COMPLETE;
        this.onLevelComplete();
    }

    /**
     * End the level as failure and show the score screen.
     */
    setLevelFail() {
        this.halted = true;
        GameState.resultState = GameResultState.FAILED;
        this.onLevelComplete();
    }

    /**
     * Sets tutorial flags
     * @param value a bitmask to set flags with
     */
    setTutorialFlags(value) {
        // TODO implement tutorial flags
        // seems like value must be interpreted bitwise and sets a certain flag on each bit
        // seen so far:
        // 0 = 0x00 allow any click anywhere anytime
        // 3 = 0x11 disallow invalid clicks
        // 4095 = 0x111111111111 set all flags? (seen in Tutorial01 level)
    }

    /**
     * This is used to make messages come up/not come up.
     * @param messagesAllowed
     */
    setMessagePermit(messagesAllowed) {
        this.messagePermit = !messagesAllowed;
    }

    setBuildingsUpgradeLevel(typeName, level) {
        console.error('Buildings upgrade level not yet implemented'); // TODO implement this
        // buildings.filter(b => b.type === typeName).forEach(b => b.upgradeLevel = level);
    }

    setToolStoreLevel(level) {
        this.setBuildingsUpgradeLevel(Building.TOOLSTATION, level);
    }

    setTeleportPadLevel(level) {
        this.setBuildingsUpgradeLevel(Building.TELEPORT_PAD, level);
    }

    setPowerStationLevel(level) {
        this.setBuildingsUpgradeLevel(Building.POWER_STATION, level);
    }

    setBarracksLevel(level) {
        this.setBuildingsUpgradeLevel(Building.SUPPORT, level);
    }

    /**
     * Gets the number of tool stores currently built. NOT the total ever built.
     * @return {number}
     */
    getToolStoresBuilt() {
        return GameState.getBuildingsByType(Building.TOOLSTATION).length;
    }

    /**
     * Gets the number of minifigures on the level. TODO it is NOT tested if this ignores minifigures in hidden caverns
     * @return {number}
     */
    getMinifiguresOnLevel() {
        return GameState.raiders.length;
    }

    /**
     * Gets the number of crystals currently stored.
     * @return {number}
     */
    getCrystalsCurrentlyStored() {
        return GameState.numCrystal;
    }

    getObjectiveSwitch() {
        // TODO implement this
        return 0;
    }

    setMessageTimerValues(arg1, arg2, arg3) {
        // TODO implement this
    }

    getMessageTimer() {
        return 0; // TODO return remaining amount of time needed to fully play WAV message
    }

    cameraUnlock() {
        // TODO implement this
    }

    setMessage(messageNumber, arrowDisabled) {
        if (!this.messagePermit) {
            return;
        }
        const msg = this.messages[messageNumber];
        // TODO show message to user
        console.log(msg.txt);
        // msg.snd resides in sounds/streamed/ which is currently not loaded :(
    }

    setCameraGotoTutorial(arg1) {
        // TODO implement this
    }

    getTutorialBlockIsGround(arg1) {
        // TODO implement this
        return 0;
    }

    getTutorialBlockIsPath(arg1) {
        // TODO implement this
        return 0;
    }

    getOxygenLevel() {
        // TODO implement this
        return 100;
    }

    getObjectiveShowing() {
        // TODO implement this
        return false;
    }

    addPoweredCrystals() {
        // TODO implement this
    }

    disallowAll() {
        // TODO implement this
    }

    getPoweredPowerStationsBuilt() {
        return GameState.getBuildingsByType(Building.POWER_STATION).filter((b) => b.isPowered()).length;
    }

    getPoweredBarracksBuilt() {
        return GameState.getBuildingsByType(Building.SUPPORT).filter((b) => b.isPowered()).length;
    }

    getRecordObjectAtTutorial() {
        // TODO implement this
    }

    getHiddenObjectsFound() {
        // TODO implement this
        return 0;
    }

    callMethod(methodName, methodArgs) {
        if (methodName === 'Stop') {
            throw 'Stop';
        } else if (methodName === 'TRUE') {
            return true;
        } else if (methodName === 'FALSE') {
            return false;
        }
        const setRegisterMatch = methodName.match(/^SetR([0-7])$/);
        if (setRegisterMatch) {
            return this.setR(setRegisterMatch[1], methodArgs[0]);
        }
        const addRegisterMatch = methodName.match(/^AddR([0-7])$/);
        if (addRegisterMatch) {
            return this.addR(addRegisterMatch[1], methodArgs[0]);
        }
        const getRegisterMatch = methodName.match(/^GetR([0-7])$/);
        if (getRegisterMatch) {
            return this.getR(getRegisterMatch[1]);
        }
        const setTimerMatch = methodName.match(/^SetTimer([0-3])$/);
        if (setTimerMatch) {
            return this.setTimer(setTimerMatch[1], methodArgs[0]);
        }
        const getTimerMatch = methodName.match(/^GetTimer([0-3])$/);
        if (getTimerMatch) {
            return this.getTimer(getTimerMatch[1]);
        }
        const lMethodName = methodName.toLowerCase();
        for (const memberName in this) {
            // noinspection JSUnfilteredForInLoop
            if (memberName.toLowerCase() === lMethodName) {
                // @ts-ignore
                // noinspection JSUnfilteredForInLoop
                return this[memberName].apply(this, methodArgs);
            }
        }
        throw 'Undefined method: ' + methodName;
    }

    conditional(left, right) {
        const conditionResult = this.executeStatement(left);
        if (this.debug) {
            console.log('Condition evaluated to ' + conditionResult);
        }
        if (conditionResult) {
            this.executeStatement(right);
        }
    }

    executeStatement(expression) {
        if (expression.invoke) {
            const argValues = expression.invoke !== 'conditional' ? expression.args.map(e => this.executeStatement(e)) : expression.args;
            const result = this.callMethod(expression.invoke, argValues);
            if (result !== undefined && this.debug) {
                console.log('Method returned: ' + result);
            }
            return result;
        } else if (expression.comparator) {
            const left = this.executeStatement(expression.left);
            const right = this.executeStatement(expression.right);
            if (expression.comparator === '=') {
                return left === right;
            } else if (expression.comparator === '!=') {
                return left !== right;
            } else if (expression.comparator === '<') {
                return left < right;
            } else if (expression.comparator === '>') {
                return left > right;
            } else {
                console.log(expression);
                throw 'Unknown comparator: ' + expression.comparator;
            }
        } else if (!isNaN(expression)) { // just a number
            return expression;
        } else if (expression.jump) {
            this.programCounter = this.labels[expression.jump];
            if (this.programCounter === undefined) {
                throw 'Label \'' + expression.jump + '\' is unknown!';
            }
            if (this.debug) {
                console.log('Jumping to label \'' + expression.jump + '\' in line ' + this.programCounter);
            }
        } else {
            console.log(expression);
            throw 'Unknown expression: ' + expression;
        }
    }

    execute(debug = false) {
        this.debug = debug;
        if (this.halted) return;
        try {
            if (this.debug) {
                console.log('Executing following script\n' + this.scriptLines.join('\n'));
                console.log('Registers: ' + this.registers);
            }
            for (this.programCounter = 0; this.programCounter < this.statements.length; this.programCounter++) {
                const statement = this.statements[this.programCounter];
                if (this.debug) {
                    console.log(this.scriptLines[this.programCounter]);
                    console.log(statement);
                }
                if (!statement.label) { // do nothing for label markers
                    this.executeStatement(statement);
                }
            }
        } catch (e) {
            if (e === 'Stop') {
                return;
            }
            console.log(e);
            console.error('FATAL ERROR! Script execution failed! You can NOT win anymore!');
            this.halted = true;
            debugger;
            throw e;
        }
    }

}
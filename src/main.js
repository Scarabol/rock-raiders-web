import { FileLoader } from 'three';
import { CfgFileParser } from './core/CfgFileParser';

const cfgLoader = new FileLoader();
cfgLoader.responseType = 'arraybuffer';
cfgLoader.load('./LegoRR1/lego.cfg', (content) => {
    // console.log(content);
    // console.log(typeof content);
    const cfgParser = new CfgFileParser();
    cfgParser.parse(new Uint8Array(content));
});

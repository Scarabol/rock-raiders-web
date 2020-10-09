import { FileLoader } from 'three';
import { CfgFileParser } from './core/CfgFileParser';

const cfgLoader = new FileLoader();
cfgLoader.responseType = 'arraybuffer';
cfgLoader.load('./LegoRR1/lego.cfg', (content) => {
    // console.log(content);
    // console.log(typeof content);
    const cfgParser = new CfgFileParser();
    const result = cfgParser.parse(new Uint8Array(content));
    const legoCfg = result['Lego*'];
    console.log(legoCfg);
});

import { FileLoader } from "three";

const wadLoader = new FileLoader();
wadLoader.load('./LegoRR1/lego.cfg', (content) => {
    console.log(content);
    console.log(typeof content);
});

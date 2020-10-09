/**
 * @author Marcus-Bizal https://github.com/marcbizal
 *
 * This loader loads LWO2 files exported from LW6.
 *
 * Support
 *  -
 */

import * as THREE from 'three';

function BitmapLoader(manager) {
    this.manager = (manager !== undefined) ? manager : THREE.DefaultLoadingManager;
    this.path = "";
}

BitmapLoader.prototype = {

    LITTLE_ENDIAN: true,

    constructor: BitmapLoader,

    load: function (path, onLoad, onProgress, onError) {
        this.path = this.fixPath(path);

        const scope = this;
        const loader = new THREE.FileLoader(scope.manager);
        loader.setResponseType('arraybuffer');
        loader.load(path, function (buffer) {
            onLoad(scope.parse(buffer));
        }, onProgress, onError);

    },

    fixPath: function (path) { // TODO move to utils
        return path.replace(/\//g, "\\"); // convert forward slashes to backslashes.
    },

    getFilename: function (path) { // TODO move to utils
        return path.substring(path.lastIndexOf('\\') + 1);
    },

    parseHeader(view, cursor, definition) {
        const header = {
            bfType: undefined,
            biClrUsed: undefined,
            biHeight: 0,
            biWidth: 0
        };
        for (let i = 0; i < definition.length; i++) {
            let field = definition[i];
            switch (field.size) {
                case 2:
                    header[field.name] = view.getUint16(cursor, this.LITTLE_ENDIAN);
                    break;
                case 4:
                    header[field.name] = view.getUint32(cursor, this.LITTLE_ENDIAN);
                    break;
                default:
                    console.error("THREE.BitmapLoader.parseHeader: Field size of " + field.size + " is not supported at this time.");
                    return null;
            }
            cursor += field.size;
        }

        return header;
    },

    parse: function (buffer) {
        try {
            // console.time('BMP Parse');
            const view = new DataView(buffer);
            let cursor = 0;

            const BM_MAGIC = 0x4D42;

            const BMP_FILEHEADER_SIZE = 14;
            const BMP_FILEHEADER = [
                { name: "bfType", size: 2 },
                { name: "bfSize", size: 4 },
                { name: "bfReserved1", size: 2 },
                { name: "bfReserved2", size: 2 },
                { name: "bfOffBits", size: 4 }
            ];

            const BMP_IMAGEHEADER_SIZE = 40;
            const BMP_IMAGEHEADER = [
                { name: "biSize", size: 4 },
                { name: "biWidth", size: 4 },
                { name: "biHeight", size: 4 },
                { name: "biPlanes", size: 2 },
                { name: "biBitCount", size: 2 },
                { name: "biCompression", size: 4 },
                { name: "biSizeImage", size: 4 },
                { name: "biXPelsPerMeter", size: 4 },
                { name: "biYPelsPerMeter", size: 4 },
                { name: "biClrUsed", size: 4 },
                { name: "biClrImportant", size: 4 },
            ];

            const fileHeader = this.parseHeader(view, cursor, BMP_FILEHEADER);
            cursor += BMP_FILEHEADER_SIZE;

            if (fileHeader.bfType !== BM_MAGIC) {
                console.warn("THREE.BitMapLoader.parse: File is not supported; Falling back...");
                let fallback = new THREE.TextureLoader();

                return fallback.load(this.path);
            }

            if (this.getFilename(this.path)[0] !== 'A') {
                // console.warn("THREE.BitMapLoader.parse: BitMap has no alpha; Falling back..."); // TODO is this worth a warning?
                // FIXME black is alpha?!
                let fallback = new THREE.TextureLoader();

                return fallback.load(this.path);
            }

            const imageHeader = this.parseHeader(view, cursor, BMP_IMAGEHEADER);
            cursor += BMP_IMAGEHEADER_SIZE;

            const colorTable = new Uint8Array(imageHeader.biClrUsed * 3);

            let dataOffset = 0;
            let tableOffset = 0;
            for (let i = 0; i <= imageHeader.biClrUsed; i++) {
                dataOffset = i * 4;
                tableOffset = i * 3;

                let r = view.getUint8(cursor + dataOffset + 2);
                let g = view.getUint8(cursor + dataOffset + 1);
                let b = view.getUint8(cursor + dataOffset);

                //console.log("rgb(" + r + ", " + g + ", " + b + ")");

                colorTable[tableOffset] = r;
                colorTable[tableOffset + 1] = g;
                colorTable[tableOffset + 2] = b;
            }

            cursor += imageHeader.biClrUsed * 4;

            const imageData = new Uint8Array(imageHeader.biHeight * imageHeader.biWidth * 4);
            const key = this.getFilename(this.path).substring(1, 4);
            console.log(key);

            let pixelOffset = 0;
            for (let y = 0; y < imageHeader.biHeight; y++) {
                for (let x = 0; x < imageHeader.biWidth; x++) {
                    pixelOffset = (y * imageHeader.biWidth) - 1 + x;
                    const index = view.getUint8(cursor + pixelOffset);
                    if (index === key) {
                        imageData[(pixelOffset * 4) + 3] = 0;
                    } else {
                        imageData[pixelOffset * 4] = colorTable[index * 3];
                        imageData[(pixelOffset * 4) + 1] = colorTable[(index * 3) + 1];
                        imageData[(pixelOffset * 4) + 2] = colorTable[(index * 3) + 2];
                        imageData[(pixelOffset * 4) + 3] = 255;
                    }
                }
            }

            const texture = new THREE.DataTexture(imageData, imageHeader.biWidth, imageHeader.biHeight, THREE.RGBAFormat, THREE.UnsignedByteType, THREE.UVMapping);
            texture.needsUpdate = true;

            return texture;
        } finally {
            // console.timeEnd('BMP Parse');
        }
    }
};

export { BitmapLoader };

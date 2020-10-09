/**
 * @author Marcus-Bizal https://github.com/marcbizal
 *
 * This loader loads LWOB files exported from LW6.
 *
 * Support
 *  -
 */

import * as THREE from 'three';
import { BitmapLoader } from "./BitmapLoader";

// HEADER SPEC //
const LWO_MAGIC = 0x4C574F42; // "LWOB"
const OFF_MAGIC = 8;

/********************/
/* TYPE SIZES START */
/********************/

const ID4_SIZE = 4;
const I1_SIZE = 1;
const I2_SIZE = 2;
const I4_SIZE = 4;
const F4_SIZE = 4;

const COL4_SIZE = 4;
const VEC12_SIZE = 12;
const IP2_SIZE = 2;
const FP4_SIZE = 4;
const DEG4_SIZE = 4;

/********************/
/*  TYPE SIZES END  */
/********************/

/*********************/
/* CHUNK TYPES START */
/*********************/

const LWO_FORM = 0x464F524D;
const LWO_PNTS = 0x504E5453;
const LWO_SFRS = 0x53524653;
const LWO_POLS = 0x504F4C53;
const LWO_CRVS = 0x43525653;
const LWO_PCHS = 0x50434853;
const LWO_SURF = 0x53555246;

const CHUNK_HEADER_SIZE = 8;
const SUBCHUNK_HEADER_SIZE = 6;

/*********************/
/*  CHUNK TYPES END  */
/*********************/

/**************************/
/* SURF DEFINITIONS START */
/**************************/

/**************************/
/* SURF DEFINITIONS START */
/**************************/

const SURF_COLR = 0x434F4C52;
const SURF_FLAG = 0x464C4147;

// Base Shading Values (Fixed Point)
const SURF_LUMI = 0x4C554D49;
const SURF_DIFF = 0x44494646;
const SURF_SPEC = 0x53504543;
const SURF_REFL = 0x5245464C;
const SURF_TRAN = 0x5452414E;

// Base Shading Values (Floating Point)
const SURF_VLUM = 0x564C554D;
const SURF_VDIF = 0x56444946;
const SURF_VSPC = 0x56535043;
const SURF_VRFL = 0x5646524C;
const SURF_VTRN = 0x5654524E;

const SURF_GLOS = 0x474C4F53;
const SURF_RFLT = 0x52464C54;
const SURF_RIMG = 0x52494D47;
const SURF_RIND = 0x52494E44;
const SURF_EDGE = 0x45444745;
const SURF_SMAN = 0x534D414E;

/**************************/
/*  SURF DEFINITIONS END  */
/**************************/

/*****************************/
/* TEXTURE DEFINITIONS START */
/*****************************/

// Start of Definition
const SURF_CTEX = 0x43544558;
const SURF_DTEX = 0x44544558;
const SURF_STEX = 0x53544558;
const SURF_RTEX = 0x52544558;
const SURF_TTEX = 0x54544558;
const SURF_LTEX = 0x4C544558;
const SURF_BTEX = 0x42544558;

// Flags
const SURF_TFLG = 0x54464C47;

// Location and Size
const SURF_TSIZ = 0x5453495A;
const SURF_TCTR = 0x54435452;
const SURF_TFAL = 0x5446414C;
const SURF_TVEL = 0x5456454C;

// Color
const SURF_TCLR = 0x54434C52;

// Value
const SURF_TVAL = 0x54434C52;

// Bump Amplitude
const SURF_TAMP = 0x54414D50;

// Image Map
const SURF_TIMG = 0x54494D47;

// Image Alpha
const SURF_TALP = 0x54414C50;

// Image Wrap Options
const SURF_TWRP = 0x54575250;

// Antialiasing Strength
const SURF_TAAS = 0x54414153;

// Texture Opacity
const SURF_TOPC = 0x544F5043;

/*****************************/
/*  TEXTURE DEFINITIONS END  */
/*****************************/

/*************************/
/* FLAG DEFINITION START */
/*************************/

const LUMINOUS_BIT = 1;
const OUTLINE_BIT = 2;
const SMOOTHING_BIT = 4;
const COLORHIGHLIGHTS_BIT = 8;
const COLORFILTER_BIT = 16;
const OPAQUEEDGE_BIT = 32;
const TRANSPARENTEDGE_BIT = 64;
const SHARPTERMINATOR_BIT = 128;
const DOUBLESIDED_BIT = 256;
const ADDITIVE_BIT = 512;
const SHADOWALPHA_BIT = 1024;

/*************************/
/*  FLAG DEFINITION END  */
/*************************/

/*************************/
/* TFLG DEFINITION START */
/*************************/

const XAXIS_BIT = 1;
const YAXIS_BIT = 2;
const ZAXIS_BIT = 4;
const WORLDCOORDS_BIT = 8;
const NEGATIVEIMAGE_BIT = 16;
const PIXELBLENDING_BIT = 32;
const ANTIALIASING_BIT = 64;

/*************************/
/*  TFLG DEFINITION END  */

/*************************/

function getVector3AtOffset(view, offset) {
    let vector = new THREE.Vector3();
    vector.x = view.getFloat32(offset);
    vector.y = view.getFloat32(offset + F4_SIZE);
    vector.z = view.getFloat32(offset + (F4_SIZE * 2));
    return vector;
}

function getFilename(path) {
    return path.substring(path.lastIndexOf('\\') + 1).toLowerCase();
}

function getFilepath(path) {
    return path.substring(0, path.lastIndexOf('\\') + 1);
}

function planarMapUVS(geometry, vertices, uvs, indices, materialIndex, size, center, flags) {
    // Check to ensure that one of the flags is set, if not throw an error.
    const mask = XAXIS_BIT | YAXIS_BIT | ZAXIS_BIT;
    if (flags & mask) {
        for (let group of geometry.groups) {
            if (group.materialIndex !== materialIndex) continue;

            for (let i = group.start; i < group.start + group.count; i++) {

                let vertexIndex = indices[i] * 3;
                let x = vertices[vertexIndex] - center.x;
                let y = vertices[vertexIndex + 1] - center.y;
                let z = vertices[vertexIndex + 2] - center.z;

                let uvIndex = indices[i] * 2;
                let u = 0;
                let v = 0;

                if (flags & XAXIS_BIT) {
                    u = z / size.z + 0.5;
                    v = y / size.y + 0.5;
                } else if (flags & YAXIS_BIT) {
                    u = x / size.x + 0.5;
                    v = z / size.z + 0.5;
                } else if (flags & ZAXIS_BIT) {
                    u = x / size.x + 0.5;
                    v = y / size.y + 0.5;
                }

                uvs[uvIndex] = u;
                uvs[uvIndex + 1] = v;
            }
        }
    } else {
        // console.warn("THREE.LWO2Loader.planarMapUVS: No axis bit is set!"); // TODO what is this about
    }
}

function LWOLoader(manager) {

    this.manager = manager !== undefined ? manager : THREE.DefaultLoadingManager;
    this.path = "";
    this.materials = [];
    this.geometry = new THREE.BufferGeometry();
    this.vertices = null;
    this.indices = null;
    this.uvs = null;

}

LWOLoader.prototype = {

    COUNTER_CLOCKWISE: false,

    constructor: LWOLoader,

    load: function (url, onLoad, onProgress, onError) {
        this.path = url.replace(/\//g, "\\"); // convert forward slashes to backslashes.
        const scope = this;
        const loader = new THREE.FileLoader(scope.manager);
        loader.setResponseType('arraybuffer');
        loader.load(url, function (buffer) {
            onLoad(scope.parse(buffer));
        }, onProgress, onError);
    },

    parsePoints: function (view, chunkOffset, chunkSize) {
        if (chunkSize % VEC12_SIZE !== 0) {
            console.error('THREE.LWO2Loader.parse: F12 does not evenly divide into chunk size (' + chunkSize + '). Possible corruption.');
            return;
        }

        let numVertices = (chunkSize / F4_SIZE) / 3;
        this.vertices = new Float32Array(numVertices * 3);
        this.uvs = new Float32Array(numVertices * 2);

        for (let i = 0; i < numVertices; i++) {
            let vertexIndex = i * 3;
            let vertexOffset = vertexIndex * F4_SIZE;
            this.vertices[vertexIndex] = view.getFloat32(chunkOffset + vertexOffset); 				// x
            this.vertices[vertexIndex + 1] = view.getFloat32(chunkOffset + vertexOffset + F4_SIZE); 	// y
            this.vertices[vertexIndex + 2] = view.getFloat32(chunkOffset + vertexOffset + (F4_SIZE * 2)); 	// z
        }
    },

    parseSurfaceNames: function (buffer, chunkOffset, chunkSize) {
        let textChunk = new TextDecoder().decode(new Uint8Array(buffer, chunkOffset, chunkSize));
        let surfaceNames = textChunk.split('\0').filter(function (s) {
            return s !== '';
        });

        for (let i = 0; i < surfaceNames.length; i++) {
            let new_material = new THREE.MeshPhongMaterial();
            new_material.name = surfaceNames[i];

            this.materials.push(new_material);
        }

    },

    parsePolygons: function (view, chunkOffset, chunkSize) {
        // Gather some initial data so that we can get the proper size
        let totalNumIndices = 0;
        let offset = 0;
        while (offset < chunkSize) {
            const numIndices = view.getInt16(chunkOffset + offset);
            const materialIndex = view.getInt16(chunkOffset + offset + 2 + (numIndices * 2));

            this.geometry.addGroup(totalNumIndices, (numIndices - 2) * 3, materialIndex - 1);

            totalNumIndices += (numIndices - 2) * 3;
            offset += 4 + (numIndices * 2);
        }

        offset = 0;
        let currentIndex = 0;
        this.indices = new Uint16Array(totalNumIndices);
        while (offset < chunkSize) {
            let numIndices = view.getInt16(chunkOffset + offset);

            offset += 2;

            let faceIndices = new Int16Array(numIndices);
            for (let i = 0; i <= numIndices; i++) {
                faceIndices[i] = view.getInt16(chunkOffset + offset + (i * 2));
            }

            for (let i = 0; i < numIndices - 2; i++) {
                if (this.COUNTER_CLOCKWISE) {
                    this.indices[currentIndex++] = faceIndices[0];
                    this.indices[currentIndex++] = faceIndices[i + 2];
                    this.indices[currentIndex++] = faceIndices[i + 1];
                } else {
                    this.indices[currentIndex++] = faceIndices[0];
                    this.indices[currentIndex++] = faceIndices[i + 1];
                    this.indices[currentIndex++] = faceIndices[i + 2];
                }
            }

            offset += 2 + (numIndices * 2);
        }
    },

    parseSurface(view, buffer, chunkOffset, chunkSize) {
        let offset = 0;
        while (view.getUint8(chunkOffset + offset) !== 0) offset++;

        let materialName = new TextDecoder().decode(new Uint8Array(buffer, chunkOffset, offset));
        let materialIndex = -1;
        let material = null;

        let textureFlags = 0;
        let textureSize = new THREE.Vector3(0, 0, 0);
        let textureCenter = new THREE.Vector3(0, 0, 0);
        // let textureFalloff = new THREE.Vector3(0, 0, 0);
        // let textureVelocity = new THREE.Vector3(0, 0, 0);

        for (let i = 0; i < this.materials.length; i++) {
            if (this.materials[i].name === materialName) {
                materialIndex = i;
                material = this.materials[i];
            }
        }

        if (!material) {
            console.error('THREE.LWO2Loader.parse: Surface in SURF chunk does not exist in SRFS');
            return;
        }

        while (offset < chunkSize) {
            const subchunkOffset = chunkOffset + offset;
            if (view.getUint8(subchunkOffset) === 0) {
                offset++;
            } else {
                const subchunkType = view.getInt32(subchunkOffset);
                const subchunkSize = view.getInt16(subchunkOffset + ID4_SIZE);

                switch (subchunkType) {
                    case SURF_COLR:
                        const colorArray = [];
                        for (let i = 0; i < 4; i++) {
                            colorArray.push(view.getUint8(subchunkOffset + SUBCHUNK_HEADER_SIZE + i) / 255);
                        }
                        material.color = new THREE.Color().fromArray(colorArray);
                        break;
                    case SURF_FLAG:
                        const flags = view.getUint16(subchunkOffset + SUBCHUNK_HEADER_SIZE);
                        break;
                    case SURF_LUMI:
                        var luminosity = view.getInt16(subchunkOffset + SUBCHUNK_HEADER_SIZE) / 255;
                        break;
                    case SURF_DIFF:
                        var diffuse = view.getInt16(subchunkOffset + SUBCHUNK_HEADER_SIZE) / 255;
                        break;
                    case SURF_SPEC:
                        var specular = view.getInt16(subchunkOffset + SUBCHUNK_HEADER_SIZE) / 255;
                        material.specular = material.color.multiplyScalar(specular);
                        break;
                    case SURF_REFL:
                        let reflection = 0;
                        if (reflection === SURF_VRFL) {
                            reflection = view.getFloat32(subchunkOffset + SUBCHUNK_HEADER_SIZE);
                        } else {
                            reflection = view.getInt16(subchunkOffset + SUBCHUNK_HEADER_SIZE) / 255;
                        }
                        // material.reflectivity = reflection;
                        break;
                    case SURF_TRAN:
                    case SURF_VTRN:
                        let transparency = 0;
                        if (subchunkType === SURF_VTRN) {
                            transparency = view.getFloat32(subchunkOffset + SUBCHUNK_HEADER_SIZE);
                        } else {
                            transparency = view.getInt16(subchunkOffset + SUBCHUNK_HEADER_SIZE) / 255;
                        }
                        material.opacity = 1 - transparency;
                        if (transparency > 0) material.transparent = true;
                        break;
                    case SURF_VLUM:
                        var luminosity = view.getFloat32(subchunkOffset + SUBCHUNK_HEADER_SIZE);
                        break;
                    case SURF_VDIF:
                        var diffuse = view.getFloat32(subchunkOffset + SUBCHUNK_HEADER_SIZE);
                        break;
                    case SURF_VSPC:
                        var specular = view.getFloat32(subchunkOffset + SUBCHUNK_HEADER_SIZE);
                        // material.specular = material.color.multiplyScalar(specular);
                        break;
                    case SURF_TFLG:
                        textureFlags = view.getUint16(subchunkOffset + SUBCHUNK_HEADER_SIZE);
                        break;
                    case SURF_TSIZ:
                        textureSize = getVector3AtOffset(view, subchunkOffset + SUBCHUNK_HEADER_SIZE);
                        break;
                    case SURF_TCTR:
                        textureCenter = getVector3AtOffset(view, subchunkOffset + SUBCHUNK_HEADER_SIZE);
                        break;
                    case SURF_TIMG:
                        let texturePath = new TextDecoder().decode(new Uint8Array(buffer, subchunkOffset + SUBCHUNK_HEADER_SIZE, subchunkSize));
                        while (texturePath.slice(-1) === '\0') texturePath = texturePath.slice(0, texturePath.length - 1);
                        if (texturePath === '(none)') break; // TODO create fake texture?
                        let textureName = getFilename(texturePath);
                        const currentPath = getFilepath(this.path);
                        const filePath = currentPath + textureName;

                        // instantiate a loader
                        let loader = new BitmapLoader();

                    function onTextureLoad(texture) {
                        if (texture.image) {
                            // const alphaCanvas = document.createElement('canvas');
                            // alphaCanvas.width = texture.image.width;
                            // alphaCanvas.height = texture.image.height;
                            // const ctx = alphaCanvas.getContext('2d');
                            // ctx.fillStyle = '#fff';
                            // ctx.drawImage(texture.image, 0, 0);
                            // const textureData = ctx.getImageData(0, 0, alphaCanvas.width, alphaCanvas.height);
                            // for (let c = 0; c < textureData.length; c += 4) {
                            //     console.log(textureData[c]);
                            //     if (textureData[c] !== 0 || textureData[c + 1] !== 0 || textureData[c + 2] !== 0) {
                            //         textureData[c] = 0;
                            //         textureData[c + 1] = 0;
                            //         textureData[c + 2] = 0;
                            //     }
                            // }
                            // ctx.putImageData(textureData, 0, 0);
                            // material.alphaMap = new THREE.CanvasTexture(alphaCanvas);
                            // // TODO set transparent, alphaTest
                            // material.transparent = true;
                            // material.alphaTest = 0.5;
                        } else if (textureName[0] === 'A') {
                            material.transparent = true;
                            material.alphaTest = 0.5;
                            // } else {
                            //     console.log('Texture has no alpha');
                            //     debugger;
                        }

                        material.color = new THREE.Color(0xffffff); // TODO actually color is defined above
                        material.map = texture;
                        material.map.wrapS = THREE.RepeatWrapping;
                        material.map.wrapT = THREE.RepeatWrapping;
                        material.map.minFilter = THREE.NearestFilter;
                        material.map.magFilter = THREE.NearestFilter;
                        material.needsUpdate = true;
                    }

                        loader.load(filePath, onTextureLoad, undefined, function onError() {
                            console.log('Failed loading file ' + filePath + ' trying world shared folder');
                            loader.load("LegoRR0/world/shared/" + textureName, onTextureLoad);
                        });

                        break;
                    default:
                    // console.warn('Found unrecognised SURF subchunk type ' + new TextDecoder().decode(new Uint8Array(buffer, subchunkOffset, ID4_SIZE)) + ' at ' + subchunkOffset + '; length ' + subchunkSize);
                }

                offset += SUBCHUNK_HEADER_SIZE + subchunkSize;
            }
        }

        planarMapUVS(this.geometry, this.vertices, this.uvs, this.indices, materialIndex, textureSize, textureCenter, textureFlags);
    },

    parse: function (buffer) {
        const view = new DataView(buffer);

        if (view.getUint32(0) !== LWO_FORM) {
            console.error('THREE.LWO2Loader.parse: Cannot find header.');
            return;
        }

        const fileSize = view.getUint32(ID4_SIZE);
        if (fileSize + CHUNK_HEADER_SIZE !== view.byteLength) {
            console.warn('THREE.LWO2Loader.parse: Discrepancy between size in header (' + (fileSize + CHUNK_HEADER_SIZE) + ' bytes) and actual size (' + view.byteLength + ' bytes).')
        }

        let magicOffset = ID4_SIZE + I4_SIZE;
        if (view.getUint32(magicOffset) !== LWO_MAGIC) {
            const magic = new TextDecoder().decode(new Uint8Array(buffer, magicOffset, ID4_SIZE));
            console.error('THREE.LWO2Loader.parse: Invalid magic ID (' + magic + ') in LWO header.');
            return;
        }

        let cursor = 12;
        while (cursor < view.byteLength) {
            // Skip null byte padding
            if (view.getUint8(cursor) === 0) {
                cursor++;
            } else {
                const chunkType = view.getInt32(cursor);
                const chunkSize = view.getInt32(cursor + ID4_SIZE);

                cursor += CHUNK_HEADER_SIZE;

                switch (chunkType) {
                    case LWO_PNTS:
                        this.parsePoints(view, cursor, chunkSize);
                        break;
                    case LWO_SFRS:
                        this.parseSurfaceNames(buffer, cursor, chunkSize);
                        break;
                    case LWO_POLS:
                        this.parsePolygons(view, cursor, chunkSize);
                        break;
                    case LWO_SURF:
                        this.parseSurface(view, buffer, cursor, chunkSize);
                        break;
                    default:
                        console.warn('Found unrecognised chunk type ' + new TextDecoder().decode(new Uint8Array(buffer, cursor - CHUNK_HEADER_SIZE, ID4_SIZE)) + ' at ' + cursor);
                }

                cursor += chunkSize;
            }

        }

        this.geometry.setAttribute('position', new THREE.BufferAttribute(this.vertices, 3));
        this.geometry.setAttribute('uv', new THREE.BufferAttribute(this.uvs, 2));
        this.geometry.setIndex(new THREE.BufferAttribute(this.indices, 1));
        this.geometry.computeVertexNormals();

        return new THREE.Mesh(this.geometry, this.materials);
    }
};

export { LWOLoader };

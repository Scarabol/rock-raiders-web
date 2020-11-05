import { encodeChar } from '../EncodingHelper';

/**
 * Handles the extraction of single files from a bigger WAD data blob
 */
export class WadFile {

    buffer: Int8Array = null;
    entries = [];
    fLength = [];
    fStart = [];

    /**
     * Validate and parse the given data object as binary blob of a WAD file
     * @param data binary blob
     * @param debug enable/disable debug output while parsing
     */
    parseWadFile(data, debug = false) {
        const dataView = new DataView(data);
        this.buffer = new Int8Array(data);
        let pos = 0;
        if (String.fromCharCode.apply(null, this.buffer.slice(pos, 4)) !== 'WWAD') {
            throw 'Invalid WAD0 file provided';
        }
        if (debug) {
            console.log('WAD0 file seems legit');
        }
        pos = 4;
        const numberOfEntries = dataView.getInt32(pos, true);
        if (debug) {
            console.log(numberOfEntries);
        }
        pos = 8;

        // const wad = new WadHandler(buffer);

        let bufferStart = pos;
        for (let i = 0; i < numberOfEntries; pos++) {
            if (this.buffer[pos] === 0) {
                this.entries[i] = String.fromCharCode.apply(null, this.buffer.slice(bufferStart, pos)).replace(/\\/g, '/').toLowerCase();
                bufferStart = pos + 1;
                i++;
            }
        }

        if (debug) {
            console.log(this.entries);
        }

        for (let i = 0; i < numberOfEntries; pos++) {
            if (this.buffer[pos] === 0) {
                bufferStart = pos + 1;
                i++;
            }
        }

        if (debug) {
            console.log('Offset after absolute original names is ' + pos);
        }

        for (let i = 0; i < numberOfEntries; i++) {
            this.fLength[i] = dataView.getInt32(pos + 8, true);
            this.fStart[i] = dataView.getInt32(pos + 12, true);
            pos += 16;
        }

        if (debug) {
            console.log(this.fLength);
            console.log(this.fStart);
        }
    }

    getEntryBlob(entryName): Blob {
        return new Blob([this.getEntryBuffer(entryName)], {'type': 'image/bmp'});
    }

    /**
     * Returns the entries content by name extracted from the managed WAD file
     * @param entryName Entry name to be extracted
     * @returns {string} Returns the local object url to the extracted data
     */
    getEntryUrl(entryName): string {
        return URL.createObjectURL(this.getEntryBlob(entryName));
    }

    /**
     * Returns the entries content extracted by name from the managed WAD file
     * @param entryName Entry name to be extracted
     * @returns {Uint8Array} Returns the content as Uint8Array
     */
    getEntryData(entryName): Uint8Array {
        return new Uint8Array(this.getEntryBuffer(entryName));
    }

    /**
     * Returns the entries content as text extracted by name from the managed WAD file
     * @param entryName Entry name to be extracted
     * @returns {string} Returns the content as String
     */
    getEntryText(entryName): string {
        return new TextDecoder().decode(this.getEntryBuffer(entryName).map(c => encodeChar(c)));
    }

    /**
     * Returns the entries content by name extracted from the managed WAD file
     * @param entryName Entry name to be extracted
     * @returns {Int8Array} Returns the content as buffer slice
     */
    getEntryBuffer(entryName): Int8Array {
        const lEntryName = entryName.toLowerCase();
        for (let i = 0; i < this.entries.length; i++) {
            if (this.entries[i] === lEntryName) {
                return this.buffer.slice(this.fStart[i], this.fStart[i] + this.fLength[i]);
            }
        }
        throw 'Entry \'' + entryName + '\' not found in WAD file';
    }

    filterEntryNames(regexStr) {
        const regex = new RegExp(regexStr.toLowerCase());
        const result = [];
        for (let c = 0; c < this.entries.length; c++) {
            const entry = this.entries[c];
            if (entry.toLowerCase().match(regex)) {
                result.push(entry);
            }
        }
        return result;
    }

}

/**
 * creates a new context with the specified dimensions.
 * @param width: the desired width of the new context
 * @param height: the desired height of the new context
 * @returns RenderingContext the newly created canvas
 */
function createContext(width, height) {
    if (width < 1 || height < 1) {
        console.error('Can\'t create context with size ' + width + ' x ' + height);
        return createDummyImage(64, 64);
    }
    const canvas = document.createElement('canvas');
    canvas.setAttribute('width', width);
    canvas.setAttribute('height', height);
    const context = canvas.getContext('2d');
    context.width = width;
    context.height = height;
    return context;
}

/**
 * This method is intended to increase stability by providing an (ugly) placeholder image in case the right one is missing
 * @param width: expected width of the original image
 * @param height: expected height of the original image
 */
function createDummyImage(width, height) {
    const result = createContext(width, height);
    for (let y = 0; y < height; y += 16) {
        for (let x = 0; x < width; x += 16) {
            if (x / 16 % 2 === y / 16 % 2) {
                result.fillStyle = 'rgb(0,255,255)';
            } else {
                result.fillStyle = 'rgb(255,0,255)';
            }
            result.fillRect(x, y, 16, 16);
        }
    }
    return result.canvas;
}

export { createContext, createDummyImage };

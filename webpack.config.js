const config = {
    mode: 'development',
    entry: './src/main.js',
    output: {
        filename: './app.bundle.js',
        sourceMapFilename: './app.bundle.js.map',
    },
    devServer: {
        watchContentBase: true,
    },
    devtool: "source-map",
};

module.exports = config;

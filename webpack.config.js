const config = {
    mode: 'development',
    entry: './src/main.js',
    output: {
        filename: './app.bundle.js',
    },
    devServer: {
        watchContentBase: true,
    },
};

module.exports = config;

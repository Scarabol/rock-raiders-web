const config = {
    mode: 'development',
    entry: './src/main.ts',
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            },
        ],
    },
    resolve: {
        extensions: ['.ts', '.js'],
    },
    output: {
        filename: './app.bundle.js',
        sourceMapFilename: './app.bundle.js.map',
    },
    devtool: 'source-map',
};

module.exports = config;

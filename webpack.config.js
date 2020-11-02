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
            {
                test: /\.worker\.js$/,
                loader: 'worker-loader',
            },
        ],
    },
    resolve: {
        extensions: ['.ts', '.js'],
    },
    devtool: 'source-map',
};

module.exports = config;

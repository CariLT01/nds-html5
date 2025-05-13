// webpack.config.js
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
    entry: {
        main: './src/js/main.ts',
        worker: "./src/js/game/engine/physics.worker.ts",  // Entry point for the worker
    },
    output: {
        publicPath: 'auto', // or set it to a specific URL
        filename: '[name].[contenthash].js', // e.g., main.bundle.js, admin.bundle.js
        path: path.resolve(__dirname, 'out/dist'),
        clean: true,
        publicPath: '',
        globalObject: 'this',       // make sure Workers see `self` not undefined
    },
    resolve: {
        extensions: ['.ts', '.js'],
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            },
            {
                test: /\.(jpg|jpeg|png|gif|bmp|tiff)$/i, // Match image files
                type: 'asset/resource',  // Use Webpack's built-in asset resource handling
            },
        ],
    },
    mode: 'production', // change to 'production' for minified output
    cache: {
        type: 'filesystem',  // Can also be 'memory' for faster but less persistent cache
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: './src/html/index.html',  // Path to your HTML template
            scriptLoading: 'module' // <-- This is the key
        }),
    ],
    experiments: {
        // Enables native Web Worker support
        topLevelAwait: true
    }
};
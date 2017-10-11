const path = require('path');
const webpack = require('webpack');

module.exports = {
    entry: {
        app: './src/js/app.js'
    },
    output: {
        filename: '[name].bundle.js',
        path: path.resolve(__dirname, 'assets')
    },
    plugins: [
        new webpack.ProvidePlugin({
            $: 'jquery',
            jQuery: 'jquery',
            'window.jQuery': 'jquery',
            Popper: ['popper.js', 'default']
        })
    ],
    module: {
        rules: [
            {
                test: /\.(scss)$/,
                use: [{
                    loader: 'style-loader'
                }, {
                    loader: 'css-loader'
                }, {
                    loader: 'postcss-loader'
                }, {
                    loader: 'sass-loader'
                }]
            }, {
                test: /\.js$/,
                exclude: /(node_modules)/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['es2017']
                    }
                }
            }, {
                test: /\.(woff|woff2|eot|ttf|otf)$/,
                use: [
                    'url-loader?name=fonts'
                ]
            }
        ]
    }
};

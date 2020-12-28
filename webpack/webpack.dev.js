const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');

module.exports = merge(common, {
    mode: 'development',
    devtool: 'inline-source-map',
    output: {
        filename: `${common.output.filename.replace(".js","-dev.js")}`
    },
    devServer: {
        contentBase: './dist'
    }
});

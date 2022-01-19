// https://www.npmjs.com/package/terser-webpack-plugin
// https://github.com/webpack-contrib/terser-webpack-plugin#remove-comments
// https://webpack.js.org/plugins/terser-webpack-plugin/
// https://github.com/terser/terser
// https://stackoverflow.com/questions/54660674/more-extensive-mangling-terser-webpack-plugin
const {merge} = require('webpack-merge');
const common = require('./webpack.common.js');
const TerserPlugin = require("terser-webpack-plugin");

module.exports = merge(common, {
    mode: 'production',
    // https://webpack.js.org/configuration/devtool/
    devtool: 'nosources-source-map',
    optimization: {
        nodeEnv: 'production',
        minimize: true,
        minimizer: [
            new TerserPlugin(  {
                include: common.output.filename,
                extractComments: false,
                terserOptions: {
                    format: {
                        comments: true
                    },
                    ecma: undefined,
                    warnings: false,
                    parse: {},
                    compress: {},
                    mangle: true,
                    module: false,
                    toplevel: false,
                    nameCache: null,
                    ie8: false,
                    keep_classnames: false,
                    keep_fnames: false,
                    safari10: false,
                }
            }),
        ],
    }
});

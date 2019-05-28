const path = require('path');

module.exports = {
  entry: './src/main.ts',
  devtool: 'inline-source-map',
  module: {
    rules: [
      {
        test: /\.(glsl|vert|frag)$/, loader: "shader-loader",
        include: [
          path.resolve(__dirname, "src/shaders")
        ],
      },
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/
      }
    ]
  },
  resolve: {
    extensions: ['.js', '.ts', '.vs', '.fs', '.glsl']
  },
  optimization: {
    minimize: false
  },
  output: {
    path: `${__dirname}/dist/js/`,
    publicPath: 'js/',
    filename: 'topograph.js'
  },
  mode: 'development',
  devServer: {
    contentBase: [`${__dirname}/dist`, `${__dirname}/static/`, `${__dirname}/static/css`],
    // open: true,
    port: 4000,
    disableHostCheck: true,
    watchContentBase: true
  }
};

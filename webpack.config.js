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
    extensions: ['.ts', '.vs', '.fs', '.glsl']
  },
  output: {
    library: 'topograph',
    filename: 'topograph.js',
    path: path.resolve(__dirname, 'dist')
  },
  mode: 'development'
};

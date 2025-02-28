const path = require('path');

module.exports = {
  entry: './src/index.ts',
  output: {
    filename: 'index.mjs',
    path: path.join(__dirname, 'dist'),
  },
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
    extensions: ['.tsx', '.ts', '.js'],
  },
  target: 'webworker',
  mode: 'production',
};
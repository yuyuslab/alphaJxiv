const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
  mode: 'development', // Change to 'production' for production builds
  // Your project has multiple entry points. List them all here.
  entry: {
    'service-worker': './src/service-worker.js',
    sidepanel: './src/sidepanel.js',
    content: './src/content.js',
    offscreen: './src/offscreen.js',
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    // The [name] placeholder will be replaced by the entry key (e.g., 'service-worker.js')
    filename: '[name].js', 
  },
  resolve: {
    // This allows you to import '.mjs' files without specifying the extension
    extensions: ['.mjs', '.js'], 
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        // Copy all necessary static files from src to dist
        { from: 'src/manifest.json', to: 'manifest.json' },
        { from: 'src/sidepanel.html', to: 'sidepanel.html' },
        { from: 'src/sidepanel.css', to: 'sidepanel.css' },
        { from: 'src/offscreen.html', to: 'offscreen.html' },
        { from: 'src/alphaJxiv_icon.png', to: 'alphaJxiv_icon.png' },
      ],
    }),
  ],
  // This is needed to handle the .mjs files from Firebase
  module: {
    rules: [
      {
        test: /\.m?js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env']
          }
        }
      }
    ]
  },
  // Add this to avoid an eval-related CSP error in development
  devtool: 'cheap-module-source-map',
};
const webpack = require('webpack');
const merge = require('webpack-merge');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const ReactRefreshWebpackPlugin = require('@pmmmwh/react-refresh-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const path = require('path');
const rimraf = require('rimraf');

const NODE_ENV = process.env.NODE_ENV || 'development';
const isDevelopment = NODE_ENV === 'development';

const paths = {
  src: path.join(__dirname, 'src/client'),
  html: path.join(__dirname, 'src/client/index.html'),
  temp: path.join(__dirname, '_build'),
  dist: path.join(__dirname, 'dist'),
  node_modules: path.join(__dirname, 'node_modules'),
};

class PostBuildPlugin {
  apply(compiler) {
    compiler.hooks.done.tap('PostBuildPlugin', () => {
      rimraf(paths.temp, () => console.log(`Removed ${paths.temp}`));
    });
  }
}

const common = {
  entry: ['core-js', 'regenerator-runtime/runtime', path.join(paths.src, 'index.js')],
  output: {
    filename: isDevelopment ? 'bundle.js' : '[name].[contenthash].js',
    path: paths.dist,
    publicPath: '/',
  },
  resolve: {
    modules: [paths.src, paths.node_modules],
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        use: [
          {
            loader: 'babel-loader',
            options: {
              cacheDirectory: true,
            },
          },
        ],
        exclude: paths.node_modules,
      },
      {
        test: /\.css$/,
        use: [
          isDevelopment ? 'style-loader' : MiniCssExtractPlugin.loader,
          'css-loader',
        ],
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: paths.html,
    }),
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(NODE_ENV),
    }),
  ],
};

const development = {
  mode: 'development',
  devtool: 'source-map',
  devServer: {
    hot: true,
    host: 'localhost',
    historyApiFallback: true,
    port: 8080,
    proxy: [
      {
        context: ['/api'], // Specify the context to proxy
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
    ],
  },
  performance: {
    hints: false,
  },
  plugins: [
    new webpack.HotModuleReplacementPlugin(),
    new ReactRefreshWebpackPlugin(),
  ],
};

const production = {
  mode: 'production',
  plugins: [
    new CleanWebpackPlugin(),
    new MiniCssExtractPlugin(),
    new PostBuildPlugin(),
  ],
};

module.exports = isDevelopment ? merge(common, development) : merge(common, production);

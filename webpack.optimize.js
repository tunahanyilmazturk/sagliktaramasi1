// Webpack optimization configuration for production

const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');
const CompressionPlugin = require('compression-webpack-plugin');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

module.exports = {
  optimization: {
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        // Vendor chunk
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
          priority: 10,
        },
        // Charts chunk (heavy library)
        charts: {
          test: /[\\/]node_modules[\\/](recharts|d3)[\\/]/,
          name: 'charts',
          chunks: 'all',
          priority: 20,
        },
        // UI library chunk
        ui: {
          test: /[\\/]node_modules[\\/](@headlessui|@heroicons|lucide-react)[\\/]/,
          name: 'ui',
          chunks: 'all',
          priority: 15,
        },
        // Common chunk
        common: {
          name: 'common',
          minChunks: 2,
          chunks: 'all',
          priority: 5,
          reuseExistingChunk: true,
        },
      },
    },
    runtimeChunk: 'single',
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          compress: {
            drop_console: true, // Remove console.log in production
            drop_debugger: true,
            pure_funcs: ['console.log', 'console.info', 'console.debug'],
          },
          mangle: {
            safari10: true,
          },
          format: {
            comments: false,
          },
        },
        extractComments: false,
      }),
    ],
  },
  plugins: [
    // Gzip compression
    new CompressionPlugin({
      algorithm: 'gzip',
      test: /\.(js|css|html|svg)$/,
      threshold: 8192,
      minRatio: 0.8,
    }),
    
    // Brotli compression (better than gzip)
    new CompressionPlugin({
      filename: '[path][base].br',
      algorithm: 'brotliCompress',
      test: /\.(js|css|html|svg)$/,
      threshold: 8192,
      minRatio: 0.8,
      compressionOptions: {
        level: 11,
      },
    }),
    
    // Bundle analyzer (analyze with npm run analyze)
    process.env.ANALYZE && new BundleAnalyzerPlugin({
      analyzerMode: 'static',
      openAnalyzer: false,
      reportFilename: path.resolve(__dirname, '../dist/bundle-report.html'),
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      // Resolve to smaller libraries
      'react': 'preact/compat',
      'react-dom': 'preact/compat',
      // Use production builds
      'moment': 'moment/min/moment.min.js',
      'lodash-es': 'lodash-es/lodash.min.js',
    },
  },
  module: {
    rules: [
      {
        test: /\.(jpe?g|png|gif|webp)$/i,
        type: 'asset',
        parser: {
          dataUrlCondition: {
            maxSize: 8 * 1024, // 8kb
          },
        },
        generator: {
          filename: 'images/[name].[hash][ext]',
        },
      },
      {
        test: /\.svg$/i,
        oneOf: [
          {
            // For .svg?import
            resourceQuery: /import/,
            use: ['@svgr/webpack'],
          },
          {
            // For regular .svg
            type: 'asset',
            parser: {
              dataUrlCondition: {
                maxSize: 4 * 1024, // 4kb
              },
            },
          },
        ],
      },
    ],
  },
};

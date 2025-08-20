const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
const CompressionPlugin = require('compression-webpack-plugin');
const { GenerateSW } = require('workbox-webpack-plugin');
const zlib = require('zlib');

module.exports = (env, argv) => {
  const isProduction = argv && argv.mode === 'production';
  const shouldAnalyze = env && env.analyze;

  return {
    entry: './src/index.js',
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: isProduction ? '[name].[contenthash:8].js' : '[name].js',
      chunkFilename: isProduction ? '[name].[contenthash:8].chunk.js' : '[name].chunk.js',
      assetModuleFilename: 'assets/[name].[contenthash:8][ext]',
      clean: true,
      publicPath: '/'
    },
    module: {
      rules: [
        {
          test: /\.js$/,
          exclude: [
            /node_modules/,
            /tests\//,
            /server\//,
            /scripts\//,
            /deploy\//,
            /tmp\//,
            /\.test\.js$/,
            /\.spec\.js$/
          ],
          use: {
            loader: 'babel-loader',
            options: {
              presets: ['@babel/preset-env']
            }
          }
        },
        {
          test: /\.css$/i,
          use: isProduction 
            ? [MiniCssExtractPlugin.loader, 'css-loader']
            : ['style-loader', 'css-loader']
        },
        {
          test: /\.(png|svg|jpg|jpeg|gif|glb|gltf|obj|mtl)$/i,
          type: 'asset/resource'
        },
        {
          test: /\.(woff2?|ttf|eot|otf)$/i, type: 'asset/resource'
        },
        {
          test: /\.(wasm|ktx2|basis)$/i, type: 'asset/resource'
        },
        // Exclude non-JavaScript files from processing
        {
          test: /\.(md|html|ps1|sh|zip|log|csv|json|txt|xml|yaml|yml|toml|ini|conf|config|dockerfile|gitignore|editorconfig|browserslist|babelrc|eslintrc|prettierrc|jestrc|webpackrc|rolluprc|viterc|tsconfig|jsconfig|package-lock|yarn-lock|npm-shrinkwrap)$/i,
          type: 'asset/resource',
          exclude: /node_modules/
        },
        // Exclude HTML files from processing to avoid __webpack_exports__ issues
        {
          test: /\.html$/,
          type: 'asset/resource',
          exclude: [/node_modules/, path.resolve(__dirname, 'public')]
        }
      ]
    },
    plugins: [
      new HtmlWebpackPlugin({
        // Read the template content directly to avoid HtmlWebpackPlugin's
        // template evaluation step which can attempt to execute embedded
        // scripts and fail with __webpack_exports__ errors in some cases.
        templateContent: require('fs').readFileSync(path.resolve(__dirname, 'public', 'index.html'), 'utf8'),
        title: 'Anatomical 3D Viewer',
        inject: true,
        scriptLoading: 'blocking',
        templateParameters: {},
        minify: isProduction ? {
          removeComments: true,
          collapseWhitespace: true,
          removeRedundantAttributes: true,
          useShortDoctype: true,
          removeEmptyAttributes: true,
          removeStyleLinkTypeAttributes: true,
          keepClosingSlash: true,
          minifyJS: false, // Disable JS minification to avoid __webpack_exports__ issues
          minifyCSS: true,
          minifyURLs: true
        } : false
      }),
      ...(isProduction ? [
        new MiniCssExtractPlugin({
          filename: '[name].[contenthash:8].css',
          chunkFilename: '[name].[contenthash:8].chunk.css'
        }),

        // Brotli (zlib nativo)
        new CompressionPlugin({
          filename: '[path][base].br',
          algorithm: 'brotliCompress',
          test: /\.(js|css|html|svg|json|glb|gltf)$/,
          compressionOptions: {
            params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 11 },
          },
          threshold: 10240,
          minRatio: 0.8,
          deleteOriginalAssets: false,
        }),
    
        // Gzip
        new CompressionPlugin({
          filename: '[path][base].gz',
          algorithm: 'gzip',
          test: /\.(js|css|html|svg|json|glb|gltf)$/,
          threshold: 8192,
          minRatio: 0.8
        }),

        // Genera sw.js (y borra public/sw.js para no duplicar)
        new GenerateSW({
          swDest: 'sw.js',
          clientsClaim: true,
          skipWaiting: true,
          runtimeCaching: [
            {
              urlPattern: /\.(?:png|jpg|jpeg|svg|webp|glb|gltf)$/,
              handler: 'CacheFirst',
              options: {
                cacheName: 'images-and-models',
                expiration: {
                  maxEntries: 100,
                  maxAgeSeconds: 30 * 24 * 60 * 60 // 30 días
                }
              }
            },
            {
              urlPattern: /^https:\/\/api\./,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'api-cache',
                expiration: {
                  maxEntries: 50,
                  maxAgeSeconds: 5 * 60 // 5 minutos
                }
              }
            }
          ]
        })
      ] : []),
      ...(shouldAnalyze ? [new BundleAnalyzerPlugin()] : [])
    ],
    devServer: {
      static: {
        directory: path.join(__dirname, 'public'),
      },
      compress: true,
      port: 3000,
      hot: true,
      open: true,
      historyApiFallback: {
        index: '/index.html',
        disableDotRule: true, // permite rutas con puntos (p.ej. /viewer/v1.0)
        // evita que el fallback capture assets, SW, manifest o tu API
        rewrites: [
          { from: /^\/(assets|icons|fonts|draco|basis)\//, to: ctx => ctx.parsedUrl.pathname },
          { from: /^\/(sw\.js|manifest\.(?:json|webmanifest))$/, to: ctx => ctx.parsedUrl.pathname },
          { from: /^\/api\/.*$/, to: ctx => ctx.parsedUrl.pathname }
        ]
      }
    },
    optimization: {
      minimize: isProduction,
      minimizer: [
        new TerserPlugin({
          terserOptions: {
            compress: {
              drop_console: isProduction,
              drop_debugger: isProduction,
              pure_funcs: isProduction ? ['console.log', 'console.info', 'console.debug'] : [],
              passes: 2
            },
            format: {
              comments: false
            },
            mangle: {
              safari10: true
            }
          },
          extractComments: false,
          parallel: true
        }),
        new CssMinimizerPlugin({
          minimizerOptions: {
            preset: [
              'default',
              {
                discardComments: { removeAll: true },
                normalizeWhitespace: true,
                colormin: true,
                convertValues: true,
                discardDuplicates: true,
                discardEmpty: true,
                mergeRules: true,
                minifyFontValues: true,
                minifySelectors: true
              }
            ]
          }
        })
      ],
      splitChunks: {
        chunks: 'all',
        minSize: 20000,
        maxSize: 244000,
        maxAsyncRequests: 30,
        maxInitialRequests: 30,
        cacheGroups: {
          default: {
            minChunks: 2,
            priority: -20,
            reuseExistingChunk: true
          },
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            priority: -10,
            chunks: 'all',
            enforce: true
          },
          threejs: {
            test: /[\\/]node_modules[\\/]three[\\/]/,
            name: 'threejs',
            priority: 10,
            chunks: 'all',
            enforce: true,
            maxSize: 200000
          },
          // Separate chunk for lazy-loaded components
          lazy: {
            test: /[\\/]src[\\/](PerformanceManager|ErrorHandler|CacheManager|APIManager|ZoomManager|ProgressIndicator)\.js$/,
            name: 'lazy-components',
            priority: 5,
            chunks: 'async',
            enforce: true
          },
          // Core components that are always needed
          core: {
            test: /[\\/]src[\\/](AnatomicalRenderer|AnatomyManager|UIManager|InteractionController|ModelLoader)\.js$/,
            name: 'core',
            priority: 15,
            chunks: 'all',
            enforce: true
          },
          common: {
            name: 'common',
            minChunks: 2,
            priority: -5,
            chunks: 'all',
            reuseExistingChunk: true
          }
        }
      },
      runtimeChunk: {
        name: 'runtime'
      },
      usedExports: true,
      sideEffects: false,
      // Enable module concatenation for better tree shaking
      concatenateModules: isProduction,
      // Enable aggressive splitting for better caching
      ...(isProduction && {
        moduleIds: 'deterministic',
        chunkIds: 'deterministic'
      })
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
        '@assets': path.resolve(__dirname, 'assets')
      },
      fallback: {
        // Node.js core modules - provide polyfills or set to false
        'path': false,
        'fs': false,
        'util': false,
        'zlib': false,
        'crypto': false,
        'stream': false,
        'os': false,
        'querystring': false,
        'child_process': false,
        'net': false,
        'tls': false,
        'assert': false,
        'vm': false,
        'tty': false,
        'dns': false,
        'worker_threads': false,
        'async_hooks': false,
        'inspector': false,
        'readline': false,
        'module': false,
        'url': false,
        'http': false,
        'https': false,
        'buffer': false,
        'events': false,
        'punycode': false,
        'string_decoder': false,
        'timers': false,
        'constants': false,
        'domain': false,
        'cluster': false,
        'repl': false,
        'v8': false,
        'perf_hooks': false,
        'trace_events': false,
        'wasi': false
      }
    },
    devServer: {
      // Serve assets folder as static files
      static: [
        {
          directory: path.join(__dirname, 'public'),
          publicPath: '/'
        },
        {
          directory: path.join(__dirname, 'assets'),
          publicPath: '/assets'
        }
      ],
      hot: true,
      port: 3000,
      open: false,
      historyApiFallback: true,
      compress: true,
      client: {
        overlay: {
          errors: true,
          warnings: false
        }
      }
    }
  };
};
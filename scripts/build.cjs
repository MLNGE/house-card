const esbuild = require('esbuild');
const packageJson = require('../package.json');

esbuild.buildSync({
    entryPoints: ['src/index.js'],
    bundle: true,
    format: 'esm',
    target: 'es2020',
    outfile: 'house-card.js',
    legalComments: 'none',
    banner: {
        js: `/*! House Card @version ${packageJson.version} */`
    }
});

import { build as esbuild } from 'esbuild';
import fs from 'fs-extra';
import chokidar from 'chokidar';
import cpy from 'cpy';
import { zip as zipFolder } from 'zip-a-folder';
import { ESLint } from 'eslint';

const buildJavascript = async () => {
  console.log('buildJavascript');
  return esbuild({
    sourcemap: 'inline',
    logLevel: 'info',
    bundle: true,
    outdir: 'dist',
    entryPoints: [
      'src/background.js',
      'src/options.js',
      'src/hot-reload.js',
    ],
  }).catch(() => {});
};

const copyImages = async () => {
  console.log('Copy Images');
  return cpy('src/images', 'dist');
};

const copyStatics = async () => {
  console.log('Copy Static Files');
  const statics = [
    'manifest.json',
    'src/options.html',
    'src/options.css',
    'src/bootstrap.min.css',
    'src/prism.css',
    'cdn/*'
  ];
  statics.forEach((file) => console.log(`  ${file}`));
  return cpy(statics, 'dist');
};

async function clean() {
  console.log('clean dist');
  return fs.removeSync('dist');
}

async function build() {
  console.log('\nBuild Started -------------');
  console.time('\nBuild Done in');
  await clean();

  await Promise.all([
    runLint(),
    buildJavascript(),
    copyImages(),
    copyStatics(),
  ]);
  console.timeEnd('\nBuild Done in');

  const date = new Date().toISOString().substring(11, 19);
  console.log(`\nFinished at ${date}`);
}

async function runLint() {
  // 1. Create an instance.
  const eslint = new ESLint();

  // 2. Lint files.
  const results = await eslint.lintFiles(['src/**/*.js']);

  // 3. Format the results.
  const formatter = await eslint.loadFormatter('stylish');
  const resultText = formatter.format(results);

  // 4. Output it.
  console.log(resultText);
}

async function watch() {
  build();

  // One-liner for current directory
  chokidar.watch('src/*').on('change', async (path) => {
    console.log('\nFile changed:');
    console.log(` ${path}`);
    await build();
  });
}

function run() {
  const command = process.argv.slice(2);
  console.log('command: ', command);
  const commands = { build, watch };

  commands[command]?.();
}

run();
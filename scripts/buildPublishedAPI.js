/*
 * Copyright 2020 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

const tempy = require('tempy');
const fs = require('fs-extra');
const packageJSON = require('../package.json');
const path = require('path');
const glob = require('fast-glob');
const spawn = require('cross-spawn');
let yargs = require('yargs');


let argv = yargs
  .option('verbose', {alias: 'v', type: 'boolean'})
  .option('output', {alias: 'o', type: 'string'})
  .argv;

build().catch(err => {
  console.error(err.stack);
  process.exit(1);
});

/**
 * Building this will run the docs builder using the apiCheck pipeline in .parcelrc
 * This will generate json containing the visible (API/exposed) type definitions for each package
 * This is run against a downloaded copy of the last published version of each package into a temporary directory and build there
 */
async function build() {
  let distDir = argv.output ?? path.join(__dirname, '..', 'dist', argv.output ?? 'base-api');
  // if we already have a directory with a built dist, remove it so we can write cleanly into it at the end
  fs.removeSync(distDir);
  // Create a temp directory to build the site in
  let dir = tempy.directory();
  console.log(`Building published api into ${dir}...`);

  // Generate a package.json containing just what we need to build the website
  let pkg = {
    name: 'react-spectrum-monorepo',
    version: '0.0.0',
    private: true,
    workspaces: [
      'packages/*/*'
    ],
    devDependencies: Object.fromEntries(
      Object.entries(packageJSON.devDependencies)
        .filter(([name]) =>
          name.startsWith('@parcel') ||
          name === 'parcel' ||
          name.startsWith('@spectrum-css') ||
          name.startsWith('postcss') ||
          name.startsWith('@adobe') ||
          name === 'react' ||
          name === 'react-dom' ||
          name === 'tailwindcss' ||
          name === 'typescript'
        )
    ),
    dependencies: {},
    resolutions: packageJSON.resolutions,
    browserslist: packageJSON.browserslist,
    scripts: {
      build: 'yarn parcel build packages/@react-spectrum/actiongroup'
    }
  };

  // create a package.json without any of our packages as dependencies, so they
  // aren't reinstalled
  let cleanPkg = {
    name: 'react-spectrum-monorepo',
    version: '0.0.0',
    private: true,
    workspaces: [
      'packages/*/*'
    ],
    devDependencies: Object.fromEntries(
      Object.entries(packageJSON.devDependencies)
        .filter(([name]) =>
          name.startsWith('@parcel') ||
          name === 'parcel' ||
          name.startsWith('@spectrum-css') ||
          name.startsWith('postcss') ||
          name.startsWith('@adobe') ||
          name === 'react' ||
          name === 'react-dom' ||
          name === 'typescript'
        )
    ),
    dependencies: {},
    resolutions: packageJSON.resolutions,
    browserslist: packageJSON.browserslist,
    scripts: {
      build: 'yarn parcel build packages/@react-spectrum/actiongroup'
    }
  };

  console.log('add packages to download from npm');
  // Add dependencies on each published package to the package.json, and
  // copy the docs from the current package into the temp dir.
  let packagesDir = path.join(__dirname, '..', 'packages');
  let packages = glob.sync('*/**/package.json', {cwd: packagesDir, ignore: ['**/node_modules/**']});
  async function addDeps() {
    let promises = [];
    for (let p of packages) {
      let promise = new Promise((resolve, reject) => {
        fs.readFile(path.join(packagesDir, p), 'utf8').then(async (contents) => {
          let json = JSON.parse(contents);
          if (!json.private && json.name !== '@adobe/react-spectrum') {
            try {
              // this npm view will fail if the package isn't on npm
              // otherwise we want to check if there is any version that isn't a nightly
              let results = JSON.parse(await run('npm', ['view', json.name, 'versions', '--json']));
              if (results.some(version => !version.includes('nightly'))) {
                pkg.dependencies[json.name] = 'latest';
                console.log('added', json.name);
              }
            } catch (e) {
              // continue
            }
          }
          resolve();
        });
      });
      promises.push(promise);
    }
    return Promise.all(promises);
  }

  await addDeps();
  pkg.devDependencies['babel-plugin-transform-glob-import'] = '*';
  cleanPkg.devDependencies['babel-plugin-transform-glob-import'] = '*';

  fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify(pkg, false, 2));
  fs.copySync(path.join(__dirname, '..', '.yarn'), path.join(dir, '.yarn'));
  fs.copySync(path.join(__dirname, '..', '.yarnrc.yml'), path.join(dir, '.yarnrc.yml'));

  // Install dependencies from npm
  console.log('install our latest packages from npm');
  await run('yarn', ['install', '--no-immutable'], {cwd: dir, stdio: 'inherit'});

  fs.writeFileSync(path.join(dir, 'babel.config.json'), `{
    "plugins": [
      "transform-glob-import"
    ]
  }`);

  // Copy necessary code and configuration over
  fs.copySync(path.join(__dirname, '..', 'yarn.lock'), path.join(dir, 'yarn.lock'));
  fs.copySync(path.join(__dirname, '..', 'packages', 'dev'), path.join(dir, 'packages', 'dev'));
  fs.removeSync(path.join(dir, 'packages', 'dev', 'docs'));
  fs.copySync(path.join(__dirname, '..', 'packages', '@adobe', 'spectrum-css-temp'), path.join(dir, 'packages', '@adobe', 'spectrum-css-temp'));
  fs.copySync(path.join(__dirname, '..', '.parcelrc'), path.join(dir, '.parcelrc'));
  fs.copySync(path.join(__dirname, '..', 'postcss.config.js'), path.join(dir, 'postcss.config.js'));
  fs.copySync(path.join(__dirname, '..', 'lib'), path.join(dir, 'lib'));
  fs.copySync(path.join(__dirname, '..', 'CONTRIBUTING.md'), path.join(dir, 'CONTRIBUTING.md'));

  // Copy package.json for each package into docs dir so we can find the correct version numbers
  console.log('moving over from node_modules');
  for (let p of packages) {
    if (p === 'react-stately' || p === 'react-aria' || p === 'react-aria-components' || p === 'tailwindcss-react-aria-components') {
      continue;
    }
    if (!p.includes('spectrum-css') && !p.includes('example-theme') && fs.existsSync(path.join(dir, 'node_modules', p))) {
      fs.moveSync(path.join(dir, 'node_modules', path.dirname(p)), path.join(dir, 'packages', path.dirname(p)));
      fs.removeSync(path.join(dir, 'packages', path.dirname(p), 'dist'));
      let json = JSON.parse(fs.readFileSync(path.join(dir, 'packages', p)), 'utf8');
      if (!p.includes('@react-types')) {
        delete json.types;
      }
      delete json.main;
      delete json.module;
      delete json.devDependencies;
      json.apiCheck = 'dist/api.json';
      json.targets = {
        apiCheck: {}
      };
      fs.writeFileSync(path.join(dir, 'packages', p), JSON.stringify(json, false, 2));
    }
  }

  // link all our packages
  fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify(cleanPkg, false, 2));
  fs.removeSync(path.join(dir, 'packages', 'dev', 'docs', 'node_modules'));
  console.log('linking packages');
  await run('yarn', ['constraints', '--fix'], {cwd: dir, stdio: 'inherit'});
  await run('yarn', ['--no-immutable'], {cwd: dir, stdio: 'inherit'});

  // Build the website
  console.log('building api files');
  await run('yarn', ['parcel', 'build', 'packages/react-aria-components', 'packages/@react-{spectrum,aria,stately}/*/', 'packages/@internationalized/{message,string,date,number}', '--target', 'apiCheck'], {cwd: dir, stdio: 'inherit'});

  // Copy the build back into dist, and delete the temp dir.
  // dev/docs/node_modules has some react spectrum components, we don't want those, and i couldn't figure out how to not build them
  // it probably means two different versions, so there may be a bug lurking here
  fs.removeSync(path.join(dir, 'packages', 'dev'));
  fs.removeSync(path.join(dir, 'packages', '@react-spectrum', 'button', 'node_modules'));
  fs.copySync(path.join(dir, 'packages'), distDir);
  fs.removeSync(dir);
}

function run(cmd, args, opts) {
  return new Promise((resolve, reject) => {
    let child = spawn(cmd, args, opts);
    let result = '';
    child.stdout?.on('data', function(data) {
      result += data.toString();
    });
    child.on('error', reject);
    child.on('close', (code) => {
      if (code !== 0) {
        reject(new Error('Child process failed'));
        return;
      }

      resolve(result);
    });
  });
}

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
const semver = require('semver');
const spawn = require('cross-spawn');
const spawnSync = require('child_process').spawnSync;

build().catch(err => {
  console.error(err.stack);
  process.exit(1);
});

async function build() {
  let publicUrlFlag = process.argv[2] ? `--public-url ${process.argv[2]}` : '';
  // Create a temp directory to build the site in
  let dir = tempy.directory();
  console.log(`Building into ${dir}...`);

  // Generate a package.json containing just what we need to build the website
  let gitHash = spawnSync('git', ['rev-parse', '--short', 'HEAD']).stdout.toString().trim();
  let pkg = {
    name: 'rsp-website',
    version: '0.0.0',
    private: true,
    workspaces: [
      'packages/@internationalized/string-compiler',
      'packages/dev/*',
      'packages/@adobe/spectrum-css-temp'
    ],
    packageManager: 'yarn@4.2.2',
    devDependencies: Object.fromEntries(
      Object.entries(packageJSON.devDependencies)
        .filter(([name]) =>
          name.startsWith('@parcel') ||
          name === 'parcel' ||
          name.startsWith('@spectrum-css') ||
          name.startsWith('postcss') ||
          name === 'sharp' ||
          name === 'recast' ||
          name === 'framer-motion' ||
          name === 'tailwindcss-animate' ||
          name === 'tailwindcss' ||
          name === 'autoprefixer' ||
          name === 'lucide-react' ||
          name === 'tailwind-variants' ||
          name === 'react' ||
          name === 'react-dom' ||
          name === 'typescript'
        )
    ),
    dependencies: {
      '@adobe/react-spectrum': 'latest',
      '@react-aria/example-theme': 'latest',
      'react-aria': 'latest',
      'react-stately': 'latest',
      'react-aria-components': 'latest',
      'tailwindcss-react-aria-components': 'latest',
      '@spectrum-icons/illustrations': 'latest',
      '@react-spectrum/autocomplete': 'latest'
    },
    resolutions: packageJSON.resolutions,
    browserslist: packageJSON.browserslist,
    scripts: {
      // Add a public url if provided via arg (for verdaccio prod doc website build since we want a commit hash)
      build: `DOCS_ENV=production PARCEL_WORKER_BACKEND=process GIT_HASH=${gitHash} parcel build 'docs/*/*/docs/*.mdx' 'docs/react-aria-components/docs/**/*.mdx' 'packages/dev/docs/pages/**/*.mdx' ${publicUrlFlag}`
    },
    '@parcel/transformer-css': packageJSON['@parcel/transformer-css']
  };

  // Add dependencies on each published package to the package.json, and
  // copy the docs from the current package into the temp dir.
  let packagesDir = path.join(__dirname, '..', 'packages');
  let packages = glob.sync('*/*/package.json', {cwd: packagesDir}).concat('react-aria-components/package.json');
  for (let p of packages) {
    let json = JSON.parse(fs.readFileSync(path.join(packagesDir, p), 'utf8'));
    if (!json.private && json.name !== '@adobe/react-spectrum') {
      let docsDir = path.join(packagesDir, path.dirname(p), 'docs');
      let hasDocs = false;
      if (fs.existsSync(docsDir)) {
        let contents = fs.readdirSync(docsDir);
        for (let file of contents) {
          let docFile = path.join(docsDir, file);
          let destFile = path.join(dir, 'docs', json.name, 'docs', file);
          if (file.endsWith('.mdx')) {
            // Skip mdx files with an after_version key that is <= to the current package version.
            let contents = fs.readFileSync(docFile, 'utf8');
            let m = contents.match(/after_version:\s*(.*)/);
            if (!m || semver.gt(json.version, m[1])) {
              fs.copySync(docFile, destFile);
              hasDocs = true;
            }
          } else {
            fs.copySync(docFile, destFile);
          }
        }
      }

      if (hasDocs) {
        pkg.dependencies[json.name] = 'latest';
      }
    }
  }
  // Add test-utils to the dependencies because it doesn't have a docs dir, but is used in other docs pages
  pkg.dependencies['@react-spectrum/test-utils'] = 'latest';

  fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify(pkg, false, 2));

  // Copy necessary code and configuration over
  fs.copySync(path.join(__dirname, '..', 'packages', 'dev'), path.join(dir, 'packages', 'dev'));
  fs.copySync(path.join(__dirname, '..', 'packages', '@internationalized', 'string-compiler'), path.join(dir, 'packages', '@internationalized', 'string-compiler'));
  fs.copySync(path.join(__dirname, '..', 'packages', '@adobe', 'spectrum-css-temp'), path.join(dir, 'packages', '@adobe', 'spectrum-css-temp'));
  fs.copySync(path.join(__dirname, '..', '.parcelrc'), path.join(dir, '.parcelrc'));
  fs.copySync(path.join(__dirname, '..', 'postcss.config.js'), path.join(dir, 'postcss.config.js'));
  fs.copySync(path.join(__dirname, '..', 'lib'), path.join(dir, 'lib'));
  fs.copySync(path.join(__dirname, '..', 'CONTRIBUTING.md'), path.join(dir, 'CONTRIBUTING.md'));
  fs.copySync(path.join(__dirname, '..', '.browserslistrc'), path.join(dir, '.browserslistrc'));
  fs.copySync(path.join(__dirname, '..', 'starters'), path.join(dir, 'starters'));
  fs.copySync(path.join(__dirname, '..', '.yarn'), path.join(dir, '.yarn'));
  fs.copySync(path.join(__dirname, '..', '.yarnrc.yml'), path.join(dir, '.yarnrc.yml'));

  // Delete mdx files from dev/docs that shouldn't go out yet.
  let devPkg = JSON.parse(fs.readFileSync(path.join(dir, 'packages/dev/docs/package.json'), 'utf8'));
  for (let file of glob.sync('packages/dev/docs/pages/**/*.mdx', {cwd: dir})) {
    let contents = fs.readFileSync(path.join(dir, file), 'utf8');
    let m = contents.match(/after_version:\s*(.*)/);
    if (m && !semver.gt(devPkg.version, m[1])) {
      fs.removeSync(path.join(dir, file));
    }
  }

  // Install dependencies from npm
  await run('yarn', ['--no-immutable'], {cwd: dir, stdio: 'inherit'});

  // Copy package.json for each package into docs dir so we can find the correct version numbers
  for (let p of packages) {
    if (fs.existsSync(path.join(dir, 'node_modules', p))) {
      fs.copySync(path.join(dir, 'node_modules', p), path.join(dir, 'docs', p));
    }
  }

  // Patch react-aria-components package.json for example CSS.
  let p = path.join(dir, 'docs', 'react-aria-components', 'package.json');
  let json = JSON.parse(fs.readFileSync(p));
  json.sideEffects = ['*.css'];
  fs.writeFileSync(p, JSON.stringify(json, false, 2));

  // Build the website
  await run('yarn', ['build'], {cwd: dir, stdio: 'inherit'});

  // Copy the build back into dist, and delete the temp dir.
  fs.copySync(path.join(dir, 'dist'), path.join(__dirname, '..', 'dist', 'production', 'docs'));
  fs.removeSync(dir);
}

function run(cmd, args, opts) {
  return new Promise((resolve, reject) => {
    let child = spawn(cmd, args, opts);
    child.on('error', reject);
    child.on('close', code => {
      if (code !== 0) {
        reject(new Error('Child process failed'));
        return;
      }

      resolve();
    });
  });
}

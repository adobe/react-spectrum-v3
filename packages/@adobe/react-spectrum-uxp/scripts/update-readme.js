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

let fs = require('fs');
let packageJson = require('../package.json');

/***
 * Updates the table of components in README.md with the versions from the package.json.
 *
 * Example: `node update-readme.js`
 */
function updateReadme() {
  let packages = new Map(
    Object.keys(packageJson.dependencies).reduce((context, packageName) => {
      if (packageName.startsWith('@react-spectrum/')) {
        context.push([packageName, packageJson.dependencies[packageName]]);
      }
      return context;
    }, [])
  );

  let readmeContent = fs.readFileSync('README.md', 'utf-8');

  for (let [packageName, packageVersion] of packages) {
    const versionRegex = new RegExp(`\\| (${packageName}[ ]+)\\| ([^ ]+)[ ]+\\|`);
    readmeContent = readmeContent.replace(versionRegex, `| $1| ${packageVersion.padEnd(15, ' ')}|`);
  }

  fs.writeFileSync('README.md', readmeContent, 'utf-8');
}

updateReadme();

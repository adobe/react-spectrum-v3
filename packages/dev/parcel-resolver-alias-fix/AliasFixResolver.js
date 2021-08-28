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

const {Resolver} = require('@parcel/plugin');
const path = require('path');

// const {Console} = require('console');
// const console = new Console(process.stdout, process.stdin);

async function getPackage(fs, file) {
  let parent = path.dirname(file);
  if (parent === file) {
    return [];
  }
  let check = path.join(parent, 'package.json');
  if (fs.existsSync(check)) {
    return [parent, JSON.parse((await fs.readFile(check)).toString())];
  }
  return getPackage(fs, parent);
}

//  this resolver just finds the "alias" entries in the closest package.json from the entryRoot.
//  it then resolves to those alias locations relative to the entryRoot package directory.
//  that *SHOULD* work already and it seems to in the most recent versions of parcel 2.
//  unfortunately, react-spectrum is stuck on an older version of parcel 2
//  due to some post-css related issues within the dependencies.
//  once react-spectrum is upgraded to a more recent version of 2 then this resolver can go away.
//  and the .parcelrc file can be deleted as well. 
module.exports = new Resolver({

  async resolve(args) {
    let {options, filePath} = args;

    if (this.alias == null) {
      // console.log("FS", Object.keys(options.inputFS));
      let [root, pkg] = await getPackage(options.inputFS, options.entryRoot);
      this.root = root;
      this.alias = pkg && pkg.alias ? pkg.alias : {};
    }

    let alias = this.alias[filePath];
    // we only fix relative alias's the others should work by default so we ignore.
    // we also ignore .stories. for the following reason:
    //  we want to alias "@react-spectrum/button" to "@react-spectrum-uxp/button"
    //  BUT that will also alias sub items like "@react-spectrum/button/stories/ActionButton.stories.tsx"
    //  we do NOT want that, we want them to load from original location in "@react-spectrum/button/stories..."
    //  So we skip them.
    // if (filePath.indexOf('.stories.') > 0 || filePath.indexOf("Button") > 0) {
    //   console.log("------> " + filePath + " : " + dependency.sourcePath + " " + dependency.target);
    // }
    if (alias && alias.startsWith('.') && alias.indexOf('.stories.') < 0) {
      // console.log("Found Alias: " + filePath);
      return {filePath: path.join(this.root, alias)};
    }
    return null;
  }
});

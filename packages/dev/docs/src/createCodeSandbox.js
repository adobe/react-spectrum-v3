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

let indexHTML = `<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
  <meta name="theme-color" content="#000000">
  <!--
      manifest.json provides metadata used when your web app is added to the
      homescreen on Android. See https://developers.google.com/web/fundamentals/engage-and-retain/web-app-manifest/
    -->
  <link rel="manifest" href="%PUBLIC_URL%/manifest.json">
  <link rel="shortcut icon" href="%PUBLIC_URL%/favicon.ico">
  <!--
      Notice the use of %PUBLIC_URL% in the tags above.
      It will be replaced with the URL of the \`public\` folder during the build.
      Only files inside the \`public\` folder can be referenced from the HTML.

      Unlike "/favicon.ico" or "favicon.ico", "%PUBLIC_URL%/favicon.ico" will
      work correctly both with client-side routing and a non-root public URL.
      Learn how to configure a non-root public URL by running \`npm run build\`.
    -->
  <title>React App</title>
</head>

<body>
  <style>
    body {
      min-height: 100vh;
      margin: 0;
    }
    #root,
    #root > div {
      min-height: 100vh;
    }
  </style>
  <noscript>
    You need to enable JavaScript to run this app.
  </noscript>
  <div id="root"></div>
  <!--
      This HTML file is a template.
      If you open it directly in the browser, you will see an empty page.

      You can add webfonts, meta tags, or analytics to this file.
      The build step will place the bundled scripts into the <body> tag.

      To begin the development, run \`npm start\` or \`yarn start\`.
      To create a production bundle, use \`npm run build\` or \`yarn build\`.
    -->
</body>

</html>`;

let indexJS = `import React from "react";
import ReactDOM from "react-dom";
import { Provider, defaultTheme } from "@adobe/react-spectrum";

import Example from "./Example";

const rootElement = document.getElementById("root");
ReactDOM.render(
  <Provider theme={defaultTheme}>
    <Example />
  </Provider>,
  rootElement
);
`;

export function createCodeSandbox(e) {
  let exampleTitle = document.querySelector('h1').textContent;
  let exampleCode = e.target.parentNode.parentNode.querySelector('.source').textContent;
  let pageImports =  e.target.closest('.example').getAttribute('data-imports');
  let importsRegex = /import ((?:.|\n)*?) from (['"].*?['"]);?/g;
  let packageInfo = e.target.closest('article').querySelector('tbody').childNodes;
  let packageName = packageInfo[0].innerText.split('add ')[1];
  let packageVersion = packageInfo[1].innerText.split('\t')[1];
  let isPreRelease = packageVersion.includes('-alpha.') || packageVersion.includes('-beta.') || packageVersion.includes('-rc.');

  let importMap = {
    '@react-spectrum': new Set(),
    '@react-stately': new Set(),
    '@react-aria': new Set(),
    ...(isPreRelease && {[packageName]: new Set()})
  };

  // Remove imports from example and add to page's imports
  exampleCode = exampleCode.replace(importsRegex, (m, _, s) => {
    pageImports += m;
    return '';
  });

  pageImports.replace(importsRegex, (m, _, s) => {
    let importGroup = _.replace(/[{}\s]/g, '').split(',');
    importGroup.forEach(i => {
      // For now, we'll include any import if the name is present. This could give some false positives, but it should ensure no missing imports.
      if (exampleCode.includes(i)) {
        // If pre-release, use the indivdual package.
        if (isPreRelease && packageName === s.slice(1, -1)) {
          importMap[packageName]?.add(i);
        } else {
          let currentPackage = s.substring(1, s.indexOf('/'));
          if (currentPackage === '@spectrum-icons') {
            // If icon, use indivdual package
            importMap[s.slice(1, -1)] = new Set([i]);
          } else {
            importMap[currentPackage]?.add(i);
          }
        }
      }
    });
  });

  // Build imports section
  let imports = importMap['@react-spectrum'].size > 0 ? `import { ${[...importMap['@react-spectrum']].join(', ')} } from '@adobe/react-spectrum';` + '\n' : '';
  imports += importMap['@react-stately'].size > 0 ? `import { ${[...importMap['@react-stately']].join(', ')} } from 'react-stately';` + '\n' : '';
  imports += importMap['@react-aria'].size > 0 ? `import { ${[...importMap['@react-aria']].join(', ')} } from 'react-aria';` + '\n' : '';
  imports += isPreRelease && importMap[packageName].size > 0 ? `import { ${[...importMap[packageName]].join(', ')} } from '${packageName}';` + '\n' : '';
  [...Object.keys(importMap).filter(p => p.startsWith('@spectrum-icons'))].forEach(p => imports += `import ${[...importMap[p]][0]} from '${p}';` + '\n');
  
  // Add render if needed, put imports at top, and export component.
  if (/^\s*function (.|\n)*}\s*$/.test(exampleCode)) {
    exampleCode = `import React from 'react';
${imports}
export default ${exampleCode}
`;
  } else {
    let nonRenderCode = exampleCode.replace(/^(<(.|\n)*>)$/m, () => '');
    exampleCode = exampleCode.replace(nonRenderCode, '').trim();
    nonRenderCode = nonRenderCode.trim();
    nonRenderCode = nonRenderCode.length > 0 ? '\n' + nonRenderCode + '\n' : '';
    exampleCode = exampleCode.replaceAll('\n', '\n    ');
    exampleCode = `import React from 'react';
${imports}${nonRenderCode}
export default function Example() {
  return (
    ${exampleCode}
  );
}
`;
  }

  fetch('https://codesandbox.io/api/v1/sandboxes/define?json=1', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json'
    },
    body: JSON.stringify({
      files: {
        'package.json': {
          content: {
            name: `${exampleTitle} Example - React Spectrum`, // TODO: Include a subtitle for components with more than one example
            main: 'index.js',
            dependencies: {
              react: 'latest',
              'react-dom': 'latest',
              'react-scripts': 'latest',
              '@adobe/react-spectrum': 'latest',
              ...(importMap['@react-stately'].size > 0 && {'react-stately': 'latest'}),
              ...(importMap['@react-aria'].size > 0 && {'react-aria': 'latest'}),
              ...(Object.keys(importMap).some(p => p.startsWith('@spectrum-icons/illustrations')) && {'@spectrum-icons/illustrations': 'latest'}),
              ...(Object.keys(importMap).some(p => p.startsWith('@spectrum-icons/workflow')) && {'@spectrum-icons/workflow': 'latest'}),
              ...(Object.keys(importMap).some(p => p.startsWith('@spectrum-icons/ui')) && {'@spectrum-icons/ui': 'latest'}),
              ...(importMap[packageName]?.size > 0 && {[packageName]: packageVersion})
            },
            devDependencies: {
              '@babel/runtime': 'latest',
              'typescript': 'latest'
            },
            'scripts': {
              'start': 'react-scripts start',
              'build': 'react-scripts build',
              'test': 'react-scripts test --env=jsdom',
              'eject': 'react-scripts eject'
            },
            browserslist: ['>0.2%', 'not dead', 'not ie <= 11', 'not op_mini all']
          }
        },
        'Example.js': {
          content: exampleCode
        },
        'index.js': {
          content: indexJS
        },
        'index.html': {
          content: indexHTML
        }
      }
    })
  })
  .then((x) => x.json())
  .then((data) =>
    window.open(`https://codesandbox.io/s/${data.sandbox_id}?file=/Example.js`, '_blank')
  );
}

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

const {Transformer} = require('@parcel/plugin');
const mdx = require('@mdx-js/mdx');
const flatMap = require('unist-util-flatmap');
const treeSitter = require('remark-tree-sitter');
const {fragmentUnWrap, fragmentWrap} = require('./MDXFragments');
const frontmatter = require('remark-frontmatter');
const slug = require('remark-slug');
const util = require('mdast-util-toc');
const yaml = require('js-yaml');
const prettier = require('prettier');
const {parse} = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const t = require('@babel/types');

const IMPORT_MAPPINGS = {
  '@react-spectrum/theme-default': {
    theme: 'defaultTheme'
  },
  '@react-spectrum/theme-dark': {
    theme: 'darkTheme'
  }
};

module.exports = new Transformer({
  async transform({asset, options}) {
    let exampleCode = [];
    let exampleImports = [];
    let assetPackage = await asset.getPackage();
    let preReleaseParts = assetPackage.version.match(/(alpha)|(beta)|(rc)/);
    let preRelease = preReleaseParts ? preReleaseParts[0] : '';
    const extractExamples = () => (tree, file) => (
      flatMap(tree, node => {
        if (node.type === 'code') {
          let [meta, ...options] = (node.meta || '').split(' ');
          if (meta === 'import') {
            exampleCode.push(node.value);
            exampleImports.push(node.value);
            node.meta = null;
            return [];
          }

          if (meta === 'example' || meta === 'snippet') {
            let id = `example-${exampleCode.length}`;

            // TODO: Parsing code with regex is bad. Replace with babel transform or something.
            let code = node.value;
            code = code.replace(/import ((?:.|\n)*?) from (['"].*?['"]);?/g, (m, _, s) => {
              if (s.slice(1, -1) !== 'your-component-library') {
                exampleCode.push(m);
                exampleImports.push(m);
              }
              return '';
            });

            let provider = 'ExampleProvider';
            if (options.includes('themeSwitcher=true')) {
              exampleCode.push('import {ExampleThemeSwitcher} from "@react-spectrum/docs/src/ExampleThemeSwitcher";\n');
              provider = 'ExampleThemeSwitcher';
            }

            if (!options.includes('render=false')) {
              if (/^\s*function (.|\n)*}\s*$/.test(code)) {
                let name = code.match(/^\s*function (.*?)\s*\(/)[1];
                code = `${code}\nReactDOM.render(<${provider}><${name} /></${provider}>, document.getElementById("${id}"));`;
              } else if (/^<(.|\n)*>$/m.test(code)) {
                code = code.replace(/^(<(.|\n)*>)$/m, `ReactDOM.render(<${provider}>$1</${provider}>, document.getElementById("${id}"));`);
              }
            }

            if (!options.includes('export=true')) {
              code = `(function() {\n${code}\n})();`;
            }

            exampleCode.push(code);

            if (options.includes('render=false')) {
              node.meta = null;
              return transformExample(node, preRelease);
            }

            if (meta === 'snippet') {
              node.meta = null;
              return [
                {
                  type: 'jsx',
                  value: `<div id="${id}" />`
                }
              ];
            }

            // We'd like to exclude certain sections of the code from being rendered on the page, but they need to be there to actually
            // execute. So, you can wrap that section in a ///- begin collapse -/// ... ///- end collapse -/// block to mark it.
            node.value = node.value.replace(/\n*\/\/\/- begin collapse -\/\/\/(.|\n)*?\/\/\/- end collapse -\/\/\//g, () => '').trim();
            node.meta = 'example';

            return [
              ...transformExample(node, preRelease),
              {
                type: 'jsx',
                value: `<div id="${id}" />`
              }
            ];
          }

          if (node.lang === 'css') {
            return [
              ...responsiveCode(node),
              {
                type: 'jsx',
                value: '<style>{`' + node.value + '`}</style>'
              }
            ];
          }

          return transformExample(node, preRelease);
        }

        return [node];
      })
    );

    let toc = [];
    let title = '';
    let category = '';
    let keywords = [];
    let description = '';
    let date = '';
    let author = '';
    let image = '';
    let order;
    const extractToc = (options) => {
      const settings = options || {};
      const depth = settings.maxDepth || 6;
      const tight = settings.tight;
      const skip = settings.skip;

      function transformer(node) {
        let fullToc = util(node, {
          maxDepth: depth,
          tight: tight,
          skip: skip
        }).map;

        /**
         * Go from complex structure that the mdx plugin renders from to a simpler one
         * it starts as an array because we start with the h2's not h1.
         * @example [{id, textContent, children: [{id, textContent, children: ...}, ...]}, ...]
         */
        function treeConverter(tree, first = false) {
          let newTree = {};
          if (tree.type === 'list') {
            return tree.children.map(treeNode => treeConverter(treeNode));
          } else if (tree.type === 'listItem') {
            let [name, nodes] = tree.children;
            newTree.children = [];
            if (nodes) {
              newTree.children = treeConverter(nodes);
            }
            newTree.id = name.children[0].url.split('#').pop();
            newTree.textContent = name.children[0].children[0].value;
          }
          return newTree;
        }

        // Sometimes pages do not have any notable md structure -- just jsx
        if (fullToc) {
          toc = treeConverter(fullToc || {}, true);
          title = toc[0].textContent;
          toc = toc[0].children;
        }

        // Piggy back here to grab additional metadata.
        let metadata = node.children.find(c => c.type === 'yaml');
        if (metadata) {
          let yamlData = yaml.safeLoad(metadata.value);
          // title defined in yaml data will override
          title = yamlData.title || title;
          category = yamlData.category || '';
          keywords = yamlData.keywords || [];
          description = yamlData.description || '';
          date = yamlData.date || '';
          author = yamlData.author || '';
          order = yamlData.order;
          if (yamlData.image) {
            image = asset.addDependency({
              moduleSpecifier: yamlData.image,
              isURL: true
            });
          }
        }

        return node;
      }

      return transformer;
    };

    /**
     * Adds an `example` class to `pre` tags followed by examples.
     * This allows us to remove the bottom rounded corners, but only when
     * there is a rendered example below.
     */
    function wrapExamples() {
      return (tree) => (
        flatMap(tree, node => {
          if (node.tagName === 'pre' && node.children && node.children.length > 0 && node.children[0].tagName === 'code' && node.children[0].properties.metastring) {
            node.properties.className = node.children[0].properties.metastring.split(' ');
            node.properties['data-imports'] = exampleImports.join('/n');
          }

          return [node];
        })
      );
    }

    const compiled = await mdx(await asset.getCode(), {
      remarkPlugins: [
        slug,
        extractToc,
        extractExamples,
        fragmentWrap,
        [frontmatter, {type: 'yaml', anywhere: true, marker: '-'}],
        [
          treeSitter,
          {
            grammarPackages: [
              '@atom-languages/language-typescript',
              '@atom-languages/language-css'
            ]
          }
        ],
        fragmentUnWrap
      ],
      rehypePlugins: [
        wrapExamples
      ]
    });

    asset.type = 'jsx';
    asset.setCode(`/* @jsx mdx */
    import React from 'react';
    import { mdx } from '@mdx-js/react'
    ${compiled}
    `);
    asset.meta.toc = toc;
    asset.meta.title = title;
    asset.meta.category = category;
    asset.meta.description = description;
    asset.meta.keywords = keywords;
    asset.meta.date = date;
    asset.meta.author = author;
    asset.meta.image = image;
    asset.meta.order = order;
    asset.meta.isMDX = true;
    asset.meta.preRelease = preRelease;
    asset.isSplittable = false;

    // Generate the client bundle. We always need the client script,
    // and the docs script when there's a TOC or an example on the page.
    let clientBundle = 'import \'@react-spectrum/docs/src/client\';\n';
    if (toc.length || exampleCode.length > 0) {
      clientBundle += 'import \'@react-spectrum/docs/src/docs\';\n';
    }

    // Add example code collected from the MDX.
    if (exampleCode.length > 0) {
      clientBundle += `import React from 'react';
import ReactDOM from 'react-dom';
import {Example as ExampleProvider} from '@react-spectrum/docs/src/ThemeSwitcher';
${exampleCode.join('\n')}
export default {};
`;
    }

    let assets = [
      asset,
      {
        type: 'jsx',
        content: clientBundle,
        uniqueKey: 'client',
        isSplittable: true,
        env: {
          // We have to override all of the environment options to ensure this doesn't inherit
          // anything from the parent asset, whose environment is set below.
          context: 'browser',
          engines: asset.env.engines,
          outputFormat: asset.env.scopeHoist ? 'esmodule' : 'global',
          includeNodeModules: asset.env.includeNodeModules,
          scopeHoist: asset.env.scopeHoist,
          minify: asset.env.minify
        },
        meta: {
          isMDX: false
        }
      }
    ];

    // Add a dependency on the client bundle. It should not inherit its entry status from the page,
    // and should always be placed in a separate bundle.
    asset.addDependency({
      moduleSpecifier: 'client',
      isEntry: false,
      isIsolated: true
    });

    // Override the environment of the page bundle. It will run in node as part of the SSG optimizer.
    asset.setEnvironment({
      context: 'node',
      engines: {
        node: process.versions.node,
        browsers: asset.env.engines.browsers
      },
      outputFormat: 'commonjs',
      includeNodeModules: {
        // These don't need to be bundled.
        react: false,
        'react-dom': false,
        'intl-messageformat': false,
        'globals-docs': false,
        lowlight: false,
        scheduler: false,
        'markdown-to-jsx': false,
        'prop-types': false
      },
      scopeHoist: false,
      minify: false
    });

    return assets;
  }
});

function transformExample(node, preRelease) {
  if (node.lang !== 'tsx') {
    return responsiveCode(node);
  }

  if (/^<(.|\n)*>$/m.test(node.value)) {
    node.value = node.value.replace(/^(<(.|\n)*>)$/m, '<WRAPPER>$1</WRAPPER>');
  }

  let ast = parse(node.value, {
    sourceType: 'module',
    plugins: ['jsx', 'typescript']
  });

  /* Replace individual package imports in the code
   * with monorepo imports if building for production and not a pre-release
   */
  if (process.env.DOCS_ENV === 'production' && !preRelease) {
    let specifiers = [];
    let last;

    traverse(ast, {
      ImportDeclaration(path) {
        if (path.node.source.value.startsWith('@react-spectrum') && !(node.meta && node.meta.split(' ').includes('keepIndividualImports'))) {
          let mapping = IMPORT_MAPPINGS[path.node.source.value];
          for (let specifier of path.node.specifiers) {
            let mapped = mapping && mapping[specifier.imported.name];
            if (mapped && specifier.local.name === specifier.imported.name) {
              path.scope.rename(specifier.local.name, mapped);
              specifiers.push(mapped);
            } else {
              specifiers.push(specifier.imported.name);
            }
          }

          last = path.node;
          path.remove();
        }
      },
      Statement(path) {
        path.skip();
      },
      Program: {
        exit(path) {
          if (specifiers.length > 0) {
            let literal =  t.stringLiteral('@adobe/react-spectrum');
            literal.raw = "'@adobe/react-spectrum'";

            let decl = t.importDeclaration(
              specifiers.map(s => t.importSpecifier(t.identifier(s), t.identifier(s))),
              literal
            );

            decl.loc = last.loc;
            decl.start = last.start;
            decl.end = last.end;

            path.unshiftContainer('body', [decl]);
          }
        }
      }
    });
  }

  return responsiveCode(node, ast);
}

function responsiveCode(node, ast) {
  if (!node.lang) {
    return [node];
  }

  let large = {
    ...node,
    meta: node.meta ? `${node.meta} large` : 'large',
    value: formatCode(node, node.value, ast, 80)
  };

  let medium = {
    ...node,
    meta: node.meta ? `${node.meta} medium` : 'medium',
    value: formatCode(node, large.value, ast, 60)
  };

  let small = {
    ...node,
    meta: node.meta ? `${node.meta} small` : 'small',
    value: formatCode(node, medium.value, ast, 25)
  };

  return [
    large,
    medium,
    small
  ];
}

function formatCode(node, code, ast, printWidth = 80) {
  if (!ast && code.split('\n').every(line => line.length <= printWidth)) {
    return code;
  }

  let parser = node.lang === 'css' ? 'css' : 'babel-ts';
  if (ast) {
    parser = () => ast;
  }

  let res = prettier.format(node.value, {
    parser,
    singleQuote: true,
    jsxBracketSameLine: true,
    bracketSpacing: false,
    trailingComma: 'none',
    printWidth
  });

  return res.replace(/^<WRAPPER>((?:.|\n)*)<\/WRAPPER>;?\s*$/m, (str, contents) =>
    contents.replace(/^\s{2}/gm, '').trim()
  );
}

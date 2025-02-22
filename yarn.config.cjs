// @ts-check

/** @type {import('@yarnpkg/types')} */
const {defineConfig} = require('@yarnpkg/types');
/**
 * @typedef {import('@yarnpkg/types').Yarn.Constraints.Workspace} Workspace
 * @typedef {import('@yarnpkg/types').Yarn.Constraints.Dependency} Dependency
 */

/**
 * This rule will enforce that a workspace MUST depend on the same version of
 * a dependency as the one used by the other workspaces.
 *
 * @param {Context} context
 */
function enforceConsistentDependenciesAcrossTheProject({Yarn}) {
  // enforce react/react-dom version
  for (const dependency of Yarn.dependencies()) {
    if (dependency.type === 'peerDependencies') {
      if (dependency.ident === 'react' || dependency.ident === 'react-dom') {
        if (dependency.workspace.ident === 'storybook-builder-parcel') {
          dependency.update('*');
        } else if (dependency.workspace.ident === '@react-spectrum/s2' || dependency.workspace.ident === '@react-spectrum/codemods') {
          dependency.update('^18.0.0 || ^19.0.0-rc.1');
        } else {
          dependency.update('^16.8.0 || ^17.0.0-rc.1 || ^18.0.0 || ^19.0.0-rc.1');
        }
      }
    }

    // for (const otherDependency of Yarn.dependencies({ident: dependency.ident})) {
    //   if (otherDependency.type === `peerDependencies`)
    //     continue;
    //
    //   // useful, however, i haven't quite made it relaxed enough
    //   // dependency.update(otherDependency.range);
    // }
  }

  // enforce swc helpers version, spectrum-css-temp, and where they are placed in the package.json
  for (const workspace of Yarn.workspaces()) {
    if (isPublishing(workspace)
      // should these be included in the requirement?
      && workspace.ident !== '@adobe/react-spectrum'
      && workspace.ident !== 'react-aria'
      && workspace.ident !== 'react-stately'
      && workspace.ident !== '@internationalized/string-compiler'
      && workspace.ident !== 'tailwindcss-react-aria-components'
      && workspace.ident !== '@react-spectrum/s2'
      && workspace.manifest.rsp?.type !== 'cli'
    ) {

      workspace.set('dependencies.@swc/helpers', '^0.5.0');
      workspace.set('dependencies.@adobe/spectrum-css-temp');
      if (workspace.ident.startsWith('@react-spectrum') && !workspace.ident.endsWith('/utils')) {
        workspace.set('devDependencies.@adobe/spectrum-css-temp', '3.0.0-alpha.1');
      }
      // these should not be in dependencies, but should be in dev or peer
      // can't change the error message, but the package knows if it even needs it
      if (!workspace.ident.startsWith('@react-spectrum/test-utils-internal')) {
        workspace.set('dependencies.@react-spectrum/test-utils');
        workspace.set('dependencies.react');
        workspace.set('dependencies.react-dom');
      }
    }
  }
}

/** @param {Context} context */
function enforceNonPrivateDependencies({Yarn}) {
  // enforce that public packages do not depend on private packages
  for (const workspace of Yarn.workspaces()) {
    if (workspace.manifest.private) {
      for (const dependency of Yarn.dependencies({ident: workspace.ident})) {
        if (dependency.type !== 'devDependencies' && !dependency.workspace.manifest.private) {
          dependency.workspace.set('private', true);
          workspace.set('private', false);
        }
      }
    }
  }
}

/** @param {Context} context */
function enforceNoCircularDependencies({Yarn}) {
  // enforce that there are no circular dependencies between our packages
  function addDep(workspace, seen = new Set()) {
    if (seen.has(workspace.ident)) {
      let arr = [...seen];
      let index = arr.indexOf(workspace.ident);
      // ok for pkg to depend on itself
      if (arr.slice(index).length > 1) {
        // better to error the constraints early for this for a more meaningful error message
        throw new Error(`Circular dependency detected: ${arr.slice(index).join(' -> ')} -> ${workspace.ident}`);
      } else {
        return;
      }
    }

    seen.add(workspace.ident);

    for (let d of Yarn.dependencies({ident: workspace.ident})) {
      addDep(d.workspace, seen);
    }

    seen.delete(workspace.ident);
  }


  for (const workspace of Yarn.workspaces()) {
    addDep(workspace);
  }
}

/** @param {Dependency} dependency */
function isOurPackage(dependency) {
  let name = dependency.ident;
  return name.includes('@react-spectrum')
    || name.includes('@react-aria')
    || name.includes('@react-stately')
    || name.includes('@react-types')
    || name.includes('@internationalized')
    || name.includes('@spectrum-icons')
    || name.startsWith('react-aria-components')
    || name.startsWith('tailwindcss-react-aria-components')
    || name.startsWith('react-aria')
    || name.startsWith('react-stately');
}

/** @param {Context} context */
function enforceWorkspaceDependencies({Yarn}) {
  for (const dependency of Yarn.dependencies()) {
    if (dependency.type === 'peerDependencies') {continue;}

    for (const otherDependency of Yarn.dependencies({ident: dependency.ident})) {
      if (otherDependency.type === 'peerDependencies') {continue;}

      if (isOurPackage(dependency)) {
        // change back to workspaces:^ when we're ready for yarn to handle versioning
        // don't check for consistency on our own packages because they can individually version and we don't bump EVERY package because of one change
        // dependency.update(otherDependency.range);
      }
    }
  }
}

/** @param {Context} context */
function enforceCSS({Yarn}) {
  for (const workspace of Yarn.workspaces()) {
    let name = workspace.ident;
    if (!name.startsWith('@react-spectrum/docs')
      && !name.startsWith('@react-spectrum/test-utils')
      && name.startsWith('@react-spectrum')
      && workspace.pkg.dependencies?.has('@adobe/spectrum-css-temp')) {

      workspace.set('targets', {
        main: {includeNodeModules: ['@adobe/spectrum-css-temp']},
        module: {includeNodeModules: ['@adobe/spectrum-css-temp']}
      });
    }
  }
}

/** @param {Workspace} workspace */
function isPublishing(workspace) {
  let name = workspace.ident;
  // should allowlist instead? workspace.manifest.private?
  return !name.includes('@react-types')
    && !name.includes('@spectrum-icons')
    && !name.includes('@react-aria/example-theme')
    && !name.includes('@react-spectrum/style-macro-s1')
    && !name.includes('@react-spectrum/docs')
    && !name.includes('parcel')
    && !name.includes('@adobe/spectrum-css-temp')
    && !name.includes('css-module-types')
    && !name.includes('eslint')
    && !name.includes('optimize-locales-plugin')
    && name !== 'react-spectrum-monorepo';
}

/** @param {Context} context */
function enforcePublishing({Yarn}) {
  // make sure fields required for publishing have been set
  for (const workspace of Yarn.workspaces()) {
    let name = workspace.ident;
    if (isPublishing(workspace) || (workspace.manifest.rsp?.type === 'cli' && !workspace.manifest.private)) {
      if (name.startsWith('@react-spectrum')) {
        workspace.set('license', 'Apache-2.0');
      }
      if (!workspace.manifest.private) {
        workspace.set('publishConfig', {access: 'public'});
      }
      workspace.set('repository', {
        type: 'git',
        url: name.startsWith('@internationalized/date') ?
          'https://github.com/adobe/react-spectrum/tree/main/packages/@internationalized/date'
          : 'https://github.com/adobe/react-spectrum'
      });
    }
  }
}

function setExtension(filepath, ext = '.js') {
  if (!filepath) {
    return;
  }
  return filepath.replace(/\.[a-zA-Z0-9]*$/, ext);
}

/** @param {Context} context */
function enforceExports({Yarn}) {
  // make sure build fields are correctly set
  for (const workspace of Yarn.workspaces()) {
    let name = workspace.ident;
    if (isPublishing(workspace) && workspace.manifest.rsp?.type !== 'cli') {
      let moduleExt = name === '@react-spectrum/s2' ? '.mjs' : '.js';
      let cjsExt = name === '@react-spectrum/s2' ? '.cjs' : '.js';
      if (workspace.manifest.main) {
        workspace.set('main', setExtension(workspace.manifest.main, cjsExt));
      } else {
        workspace.set('main', setExtension('dist/main.js', cjsExt));
      }

      if (
        name !== '@internationalized/string-compiler' &&
        name !== 'tailwindcss-react-aria-components'
      ) {
        workspace.set('module', setExtension('dist/module.js', moduleExt));
      }

      let exportsRequire = workspace.manifest?.exports?.require;
      let exportsImport = workspace.manifest?.exports?.import;
      if (workspace.manifest.exports?.['.']) {
        for (let key in workspace.manifest.exports) {
          if (workspace.manifest.exports[key]) {
            let subExportsRequire = workspace.manifest.exports[key].require;
            workspace.set(`exports["${key}"].require`, setExtension(subExportsRequire, cjsExt));
            let subExportsImport = workspace.manifest.exports[key].import;
            workspace.set(`exports["${key}"].import`, setExtension(subExportsImport, '.mjs'));
          }
        }
      } else {
        workspace.set('exports.require', setExtension(exportsRequire, cjsExt));
        workspace.set('exports.import', setExtension(exportsImport, '.mjs'));
      }

      if ((!workspace.manifest.types || !workspace.manifest.types.endsWith('.d.ts'))) {
        workspace.set('types', 'dist/types.d.ts');
      }

      if (name !== '@adobe/react-spectrum' && name !== 'react-aria' && name !== 'react-stately' && name !== '@internationalized/string-compiler' && name !== 'tailwindcss-react-aria-components') {
        workspace.set('source', 'src/index.ts');
      }

      if (name !== '@adobe/react-spectrum' && name !== 'react-aria' && name !== 'react-stately' && name !== '@internationalized/string-compiler' && name !== 'tailwindcss-react-aria-components') {
        if (!workspace.manifest.files || (!workspace.manifest.files.includes('dist') && !workspace.manifest.files.includes('src'))) {
          workspace.set('files', [...workspace.manifest.files || [], 'dist', 'src']);
        } else if (!workspace.manifest.files.includes('dist')) {
          workspace.set('files', [...workspace.manifest.files, 'dist']);
        } else if (!workspace.manifest.files.includes('src')) {
          workspace.set('files', [...workspace.manifest.files, 'src']);
        }
      }

      // better to do in enforceCSS? it doesn't match the set of packages handled
      if (name !== 'react-aria-components') {
        if (name.includes('@react-spectrum') || name.includes('@react-aria/visually-hidden')) {
          workspace.set('sideEffects', ['*.css']);
        } else {
          workspace.set('sideEffects', false);
        }
      }
    }
  }
}

module.exports = defineConfig({
  constraints: async ctx => {
    enforceWorkspaceDependencies(ctx);
    enforceConsistentDependenciesAcrossTheProject(ctx);
    enforceCSS(ctx);
    enforcePublishing(ctx);
    enforceExports(ctx);
    enforceNonPrivateDependencies(ctx);
    enforceNoCircularDependencies(ctx);
  }
});

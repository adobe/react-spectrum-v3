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

const {Packager} = require('@parcel/plugin');
const v8 = require('v8');

module.exports = new Packager({
  async package({bundle, bundleGraph, options}) {
    let promises = [];
    bundle.traverseAssets(asset => {
      promises.push(parse(asset));
    });

    let nodes = {};

    let code = new Map(await Promise.all(promises));
    let cache = new Map();
    try {
      var result = processAsset(bundle.getEntryAssets()[0]);
    } catch (err) {
      console.log(err.stack);
    }

    function processAsset(asset) {
      if (cache.has(asset.id)) {
        return cache.get(asset.id);
      }

      let res = {};
      cache.set(asset.id, res);
      _processAsset(asset, res);
      return res;
    }

    function _processAsset(asset, res) {
      let obj = processCode(asset, code.get(asset.id));
      for (let [exported] of asset.symbols) {
        let {asset: resolvedAsset, exportSymbol} = bundleGraph.getSymbolResolution(asset, exported);
        let processed = resolvedAsset.id === asset.id ? obj : processAsset(resolvedAsset);

        if (exportSymbol === '*') {
          Object.assign(res, processed);
        } else {
          // Re-exported with different name (e.g. export {useGridCell as useTableCell})
          if (exportSymbol !== exported) {
            let clone = {...processed[exportSymbol]};
            clone.name = exported;
            res[exported] = clone;
          } else {
            res[exported] = processed[exportSymbol];
          }
        }
      }

      let deps = bundleGraph.getDependencies(asset);
      for (let dep of deps) {
        let wildcard = dep.symbols.get('*');
        if (wildcard && wildcard.local === '*') {
          let resolved = bundleGraph.getResolvedAsset(dep, bundle);
          Object.assign(res, processAsset(resolved));
        }
      }
    }

    function processCode(asset, obj) {
      let application;
      let paramStack = [];
      let keyStack = [];
      let fn = (t, k) => {
        if (t && t.type === 'reference') {
          let dep = bundleGraph.getDependencies(asset).find(d => d.specifier === t.specifier && !bundleGraph.isDependencySkipped(d));
          let res = bundleGraph.getResolvedAsset(dep, bundle);
          let result = res ? processAsset(res)[t.imported] : null;
          if (result) {
            t = result;
          } else {
            return {
              type: 'identifier',
              name: t.local
            };
          }
        }

        if (t && t.type === 'application') {
          application = t.typeParameters.map(item => fn(item, 'typeParameters'));
        }

        let hasParams = false;
        if (t && (t.type === 'alias' || t.type === 'interface') && t.typeParameters && application && shouldMerge(t, k, keyStack)) {
          let params = Object.assign({}, paramStack[paramStack.length - 1]);
          t.typeParameters.forEach((p, i) => {
            let v = application[i] || p.default;
            params[p.name] = v;
          });
          paramStack.push(params);
          // so we don't replace the type parameters in the extended interface
          application = null;
          hasParams = true;
        } else if (t && (t.type === 'alias' || t.type === 'interface' || t.type === 'component') && t.typeParameters && keyStack.length === 0) {
          // If we are at a root export, replace type parameters with constraints if possible.
          // Seeing `DateValue` (as in `T extends DateValue`) is nicer than just `T`.
          let typeParameters = t.typeParameters.map(item => fn(item, 'typeParameters'));
          let params = Object.assign({}, paramStack[paramStack.length - 1]);
          typeParameters.forEach(p => {
            if (!params[p.name] && p.constraint) {
              params[p.name] = p.constraint;
            }
          });
          paramStack.push(params);
          hasParams = true;
        }

        keyStack.push(k);
        t = recurse(t, fn);
        keyStack.pop();

        if (hasParams) {
          paramStack.pop();
        }

        let params = paramStack[paramStack.length - 1];
        if (t && t.type === 'application') {
          application = null;
          if (k === 'props') {
            return t.base;
          }
        }

        if (t && t.type === 'identifier' && t.name === 'Omit' && application) {
          return omit(application[0], application[1], nodes);
        }

        if (t && t.type === 'identifier' && t.name === 'Pick' && application) {
          // NOTE: `pick()` as well as `omit()` above incur some side effects:
          // For example, if you go to http://localhost:1234/react-aria/useTextField.html#anatomy
          // and click the link 'TextFieldIntrinsicElements', the popover will show 'any' instead of 'Pick' if it is processed by `pick()` function here.
          // i.e., `keyof Pick<IntrinsicHTMLElements, 'input' | 'textarea'>` becomes `keyof any<IntrinsicHTMLElements, 'input' | 'textarea'>`
          return pick(application[0], application[1], nodes);
        }

        if (t && t.type === 'identifier' && params && params[t.name]) {
          return params[t.name];
        }

        if (t && t.type === 'interface') {
          let merged = mergeInterface(t);
          if (!nodes[t.id]) {
            nodes[t.id] = merged;
          }

          if (shouldMerge(t, k, keyStack)) {
            return merged;
          }

          // Otherwise return a type link.
          return {
            type: 'link',
            id: t.id
          };
        }

        if (t && t.type === 'alias') {
          if (k === 'props') {
            return t.value;
          }

          if (!nodes[t.id]) {
            nodes[t.id] = t;
          }

          return {
            type: 'link',
            id: t.id
          };
        }

        if (t && t.type === 'keyof') {
          if (t.keyof.type === 'interface') {
            return {
              type: 'union',
              elements: Object.keys(t.keyof.properties).map(key => ({
                type: 'string',
                value: key
              }))
            };
          }
        }

        return t;
      };

      return walk(obj, fn);
    }

    let links = {};
    walkLinks(result);

    function walkLinks(obj) {
      let fn = (t) => {
        // don't follow the link if it's already in links, that's circular
        if (t && t.type === 'link' && !links[t.id]) {
          links[t.id] = nodes[t.id];
          recurse(nodes[t.id], fn);
        }

        if (t != null) {
          return recurse(t, fn);
        }
      };

      for (let k in obj) {
        fn(obj[k]);
      }
    }

    return {contents: JSON.stringify({exports: result, links}, false, 2)};
  }
});

function shouldMerge(t, k, keyStack) {
  if (t && (t.type === 'alias' || t.type === 'interface')) {
    // Return merged interface if the parent is a component or an interface we're extending.
    if (t.type === 'interface' && (!k || k === 'props' || k === 'extends' || k === 'keyof')) {
      return true;
    }

    // If the key is "base", then it came from a generic type application, so we need to
    // check one level above. If that was a component or extended interface, return the
    // merged interface.
    let lastKey = keyStack[keyStack.length - 1];
    if (k === 'base' && (lastKey === 'props' || lastKey === 'extends')) {
      return true;
    }
  }

  return false;
}

async function parse(asset) {
  let buffer = await asset.getBuffer();
  return [asset.id, v8.deserialize(buffer)];
}
// cache things in pre-visit order so the references exist
const circularSymbol = Symbol('circular');
function walk(obj, fn) {
  let res = {};
  for (let k in obj) {
    res[k] = fn(obj[k], null);
  }

  return res;
}

function recurse(obj, fn) {
  if (obj[circularSymbol]) {
    return {
      type: 'link',
      id: obj.id
    };
  }
  obj[circularSymbol] = true;
  let res = visitChildren(obj, fn);
  obj[circularSymbol] = false;
  return res;
}

function visitChildren(obj, fn) {
  let properties = null;
  switch (obj.type) {
    case 'any':
    case 'null':
    case 'undefined':
    case 'void':
    case 'unknown':
    case 'never':
    case 'this':
    case 'symbol':
    case 'identifier':
    case 'string':
    case 'number':
    case 'boolean':
    case 'link':
    case 'reference':
      return obj;
    case 'union':
      return {
        type: 'union',
        elements: obj.elements.map(i => fn(i, 'elements'))
      };
    case 'intersection':
      return {
        type: 'intersection',
        types: obj.types.map(i => fn(i, 'types'))
      };
    case 'application':
      return {
        type: 'application',
        base: fn(obj.base, 'base'),
        typeParameters: obj.typeParameters.map(i => fn(i, 'typeParameters'))
      };
    case 'typeOperator':
      return {
        type: 'typeOperator',
        operator: obj.operator,
        value: fn(obj.value, 'value')
      };
    case 'parameter':
      return {
        type: 'parameter',
        name: obj.name,
        value: fn(obj.value, 'value'),
        optional: obj.optional,
        rest: obj.rest,
        description: obj.description
      };
    case 'property':
      return {
        type: 'property',
        name: obj.name,
        indexType: obj.indexType ? fn(obj.indexType, 'indexType') : null,
        value: fn(obj.value, 'value'),
        optional: obj.optional,
        description: obj.description,
        access: obj.access,
        selector: obj.selector,
        default: obj.default
      };
    case 'method':
      return {
        type: 'method',
        name: obj.name,
        value: fn(obj.value, 'value'),
        optional: obj.optional,
        access: obj.access,
        description: obj.description,
        default: obj.default,
        static: obj.static,
        abstract: obj.abstract
      };
    case 'alias':
      return {
        type: 'alias',
        id: obj.id,
        name: obj.name,
        value: fn(obj.value, 'value'),
        typeParameters: obj.typeParameters.map(i => fn(i, 'typeParameters')),
        description: obj.description,
        access: obj.access
      };
    case 'function':
      return {
        type: 'function',
        id: obj.id,
        name: obj.name,
        parameters: obj.parameters.map(i => fn(i, 'parameters')),
        return: fn(obj.return, 'return'),
        typeParameters: obj.typeParameters.map(i => fn(i, 'typeParameters')),
        description: obj.description,
        access: obj.access
      };
    case 'interface':
      properties = {...obj.properties};
      for (let key in obj.properties) {
        properties[key] = fn(obj.properties[key], key);
      }
      return {
        type: 'interface',
        id: obj.id,
        name: obj.name,
        extends: obj.extends.map(i => fn(i, 'extends')),
        properties,
        typeParameters: obj.typeParameters.map(i => fn(i, 'typeParameters')),
        description: obj.description,
        access: obj.access
      };
    case 'object':
      if (obj.properties) {
        properties = {...obj.properties};
        for (let key in obj.properties) {
          properties[key] = fn(obj.properties[key], key);
        }
      }
      return {
        type: 'object',
        properties,
        description: obj.description,
        access: obj.access
      };
    case 'array':
      return {
        type: 'array',
        elementType: fn(obj.elementType, 'elementType')
      };
    case 'tuple':
    case 'template':
      return {
        type: obj.type,
        elements: obj.elements.map(i => fn(i, 'elements'))
      };
    case 'typeParameter':
      return {
        type: 'typeParameter',
        name: obj.name,
        constraint: obj.constraint ? fn(obj.constraint, 'constraint') : null,
        default: obj.default ? fn(obj.default, 'default') : null
      };
    case 'component':
      return {
        type: 'component',
        id: obj.id,
        name: obj.name,
        props: obj.props ? fn(obj.props, 'props') : null,
        typeParameters: obj.typeParameters.map(i => fn(i, 'typeParameters')),
        ref: obj.ref ? fn(obj.ref, 'ref') : null,
        description: obj.description,
        access: obj.access
      };
    case 'conditional':
      return {
        type: 'conditional',
        checkType: fn(obj.checkType, 'checkType'),
        extendsType: fn(obj.extendsType, 'extendsType'),
        trueType: fn(obj.trueType, 'trueType'),
        falseType: fn(obj.falseType, 'falseType')
      };
    case 'indexedAccess':
      return {
        type: 'indexedAccess',
        objectType: fn(obj.objectType, 'objectType'),
        indexType: fn(obj.indexType, 'indexType')
      };
    case 'keyof':
      return {
        type: 'keyof',
        keyof: fn(obj.keyof, 'keyof')
      };
    default:
      console.log('Unknown type in DocsPackager: ' + obj.type, obj);
      return obj;
  }
}

function mergeInterface(obj) {
  if (obj.type === 'application') {
    obj = obj.base;
  } else if (obj.type === 'alias') {
    obj = obj.value;
  }

  let properties = {};
  let exts = [];
  if (obj.type === 'interface') {
    merge(properties, obj.properties);

    for (let ext of obj.extends) {
      if (!ext) {
        // temp workaround for ErrorBoundary extends React.Component which isn't being included right now for some reason
        console.log('ext should not be null', obj);
        continue;
      }
      let merged = mergeInterface(ext);
      if (merged.type === 'interface') {
        merge(properties, merged.properties);
      } else {
        exts.push(merged);
      }
    }
  } else {
    return obj;
  }

  return {
    type: 'interface',
    id: obj.id,
    name: obj.name,
    properties,
    typeParameters: obj.typeParameters,
    extends: exts,
    description: obj.description
  };
}

function merge(a, b) {
  for (let key in b) {
    if (!Object.prototype.hasOwnProperty.call(a, key)) {
      a[key] = b[key];
    }
  }
}

function omit(obj, toOmit, nodes) {
  obj = resolveValue(obj, nodes);

  if (obj.type === 'interface' || obj.type === 'object') {
    let keys = new Set();
    if (toOmit.type === 'string' && toOmit.value) {
      keys.add(toOmit.value);
    } else if (toOmit.type === 'union') {
      for (let e of toOmit.elements) {
        if (e.type === 'string' && e.value) {
          keys.add(e.value);
        }
      }
    }

    if (keys.size === 0) {
      return obj;
    }

    let properties = {};
    for (let key in obj.properties) {
      if (!keys.has(key)) {
        properties[key] = obj.properties[key];
      }
    }

    return {
      ...obj,
      properties
    };
  }

  return obj;
}

// Exactly the same as `omit()` above except for `keys.has(key)` instead of `!keys.has(key)`.
function pick(obj, toPick, nodes) {
  obj = resolveValue(obj, nodes);

  if (obj.type === 'interface' || obj.type === 'object') {
    let keys = new Set();
    if (toPick.type === 'string' && toPick.value) {
      keys.add(toPick.value);
    } else if (toPick.type === 'union') {
      for (let e of toPick.elements) {
        if (e.type === 'string' && e.value) {
          keys.add(e.value);
        }
      }
    }

    if (keys.size === 0) {
      return obj;
    }

    let properties = {};
    for (let key in obj.properties) {
      if (keys.has(key)) {
        properties[key] = obj.properties[key];
      }
    }

    return {
      ...obj,
      properties
    };
  }

  return obj;
}

function resolveValue(obj, nodes) {
  if (obj.type === 'link') {
    return resolveValue(nodes[obj.id], nodes);
  }

  if (obj.type === 'application') {
    return resolveValue(obj.base, nodes);
  }

  if (obj.type === 'alias') {
    return resolveValue(obj.value, nodes);
  }

  return obj;
}

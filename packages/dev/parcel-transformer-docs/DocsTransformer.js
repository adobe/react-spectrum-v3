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
const {parse} = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const t = require('@babel/types');
const doctrine = require('doctrine');
const v8 = require('v8');


module.exports = new Transformer({
  async transform({asset, options}) {
    let nodeCache = new Map();
    if (asset.type === 'json') {
      return [asset];
    }

    let code = await asset.getCode();
    let ast = parse(code, {
      filename: this.name,
      allowReturnOutsideFunction: true,
      strictMode: false,
      sourceType: 'module',
      plugins: ['classProperties', 'exportDefaultFrom', 'exportNamespaceFrom', 'dynamicImport', 'typescript', 'jsx', 'classPrivateProperties', 'classPrivateMethods', 'importAttributes']
    });

    let exports = {};

    asset.symbols.ensure();
    asset.symbols.set('*', `$${asset.id}$exports`);
    asset.isBundleSplittable = false;

    traverse(ast, {
      ExportNamedDeclaration(path) {
        if (path.node.source) {
          let symbols = new Map();
          for (let specifier of path.node.specifiers) {
            symbols.set(specifier.local.name, {local: specifier.exported.name});
            asset.symbols.set(specifier.exported.name, specifier.exported.name);
          }

          asset.addDependency({
            specifier: path.node.source.value,
            specifierType: 'esm',
            symbols,
            pipeline: 'docs-json'
          });
        } else if (path.node.declaration) {
          if (t.isIdentifier(path.node.declaration.id)) {
            let name = path.node.declaration.id.name;
            asset.symbols.set(name, name);
            let prev = exports[name];
            let val = processExport(path.get('declaration'));
            if (val) {
              exports[name] = val;
              if (!exports[name].description && prev?.description) {
                exports[name].description = prev.description;
              }
            }
          } else {
            let identifiers = t.getBindingIdentifiers(path.node.declaration);
            for (let [index, id] of Object.keys(identifiers).entries()) {
              exports[identifiers[id].name] = processExport(path.get('declaration.declarations')[index]);
              asset.symbols.set(identifiers[id].name, identifiers[id].name);
            }
          }
        } else if (path.node.specifiers.length > 0) {
          for (let specifier of path.node.specifiers) {
            let binding = path.scope.getBinding(specifier.local.name);
            if (binding) {
              let value = processExport(binding.path);
              if (value.name) {
                value.name = specifier.exported.name;
              }
              exports[specifier.exported.name] = value;
              asset.symbols.set(specifier.exported.name, specifier.local.name);
            }
          }
        }
      },

      ExportAllDeclaration(path) {
        asset.addDependency({
          specifier: path.node.source.value,
          specifierType: 'esm',
          symbols: new Map([['*', {local: '*'}]]),
          pipeline: 'docs-json'
        });
      },

      ExportDefaultDeclaration(path) {

      }
    });

    function processPath(path, node) {
      if (path.isTSParenthesizedType()) {
        return processExport(path.get('typeAnnotation'), node);
      }
      if (path.isTSAsExpression()) {
        // not sure why I can't pass typeAnnotation instead
        return processExport(path.get('expression'), node);
      }
      if (path.isVariableDeclarator()) {
        if (!path.node.init) {
          node.id = `${asset.filePath}:${path.node.id.name}`;
          node.name = path.node.id.name;
          return Object.assign(node, {type: 'any'});
        }

        let docs = getJSDocs(path.parentPath);
        processExport(path.get('init'), node);
        addDocs(node, docs);
        if (node.type === 'interface' || node.type === 'component') {
          node.id = `${asset.filePath}:${path.node.id.name}`;
          node.name = path.node.id.name;
        }
        return node;
      }

      if (isReactForwardRef(path)) {
        return processExport(path.get('arguments.0'), node);
      }

      if (isCollectionComponent(path)) {
        return processExport(path.get('arguments.1'), node);
      }

      if (path.isClassDeclaration()) {
        let properties = {};
        for (let propertyPath of path.get('body.body')) {
          let property = processExport(propertyPath);
          if (property) {
            properties[property.name] = property;
          } else {
            console.log('UNKNOWN PROPERTY', propertyPath.node);
          }
        }

        let exts = path.node.superClass ? [processExport(path.get('superClass'))] : [];
        let docs = getJSDocs(path);

        return Object.assign(node, addDocs({
          type: 'interface',
          id: `${asset.filePath}:${path.node.id.name}`,
          name: path.node.id.name,
          extends: exts,
          properties,
          typeParameters: path.node.typeParameters ? path.get('typeParameters.params').map(p => processExport(p)) : []
        }, docs));
      }

      if (path.isClassProperty()) {
        let name = t.isStringLiteral(path.node.key) ? path.node.key.value : path.node.key.name;
        let docs = getJSDocs(path);
        return Object.assign(node, addDocs({
          type: 'property',
          name,
          value: path.node.typeAnnotation
            ? processExport(path.get('typeAnnotation.typeAnnotation'))
            : {type: 'any'},
          optional: path.node.optional || false,
          access: path.node.accessibility
        }, docs));
      }

      if (path.isObjectExpression()) {
        let properties = {};
        for (let propertyPath of path.get('properties')) {
          let property = processExport(propertyPath);
          if (property) {
            properties[property.name] = property;
          } else {
            console.log('UNKNOWN PROPERTY', propertyPath.node);
          }
        }

        return Object.assign(node, {
          type: 'interface',
          extends: [],
          properties,
          typeParameters: []
        });
      }

      if (path.isObjectProperty()) {
        let name = t.isStringLiteral(path.node.key) ? path.node.key.value : path.node.key.name;
        let docs = getJSDocs(path);
        return Object.assign(node, addDocs({
          type: 'property',
          name,
          value: processExport(path.get('value')),
          optional: false
        }, docs));
      }

      if (path.isClassMethod() || path.isTSDeclareMethod() || path.isObjectMethod()) {
        // not sure why isTSDeclareMethod isn't a recognized method, can't find documentation on it either, but it works and that's the type
        // it seems to be mostly abstract class methods that comes through as this?
        let name = t.isStringLiteral(path.node.key) ? path.node.key.value : path.node.key.name;
        let docs = getJSDocs(path);

        let value;
        if (path.node.kind === 'get') {
          value = path.node.returnType
            ? processExport(path.get('returnType.typeAnnotation'))
            : {type: 'any'};
        } else if (path.node.kind === 'set') {
          value = path.node.params[0] && path.node.params[0].typeAnnotation
            ? processExport(path.get('params.0.typeAnnotation.typeAnnotation'))
            : {type: 'any'};
        } else {
          value = {
            type: 'function',
            parameters: path.get('params').map(processParameter),
            return: path.node.returnType
              ? processExport(path.get('returnType.typeAnnotation'))
              : {type: 'void'},
            typeParameters: path.node.typeParameters
              ? path.get('typeParameters.params').map(p => processExport(p))
              : []
          };
        }

        return Object.assign(node, addDocs({
          type: value.type === 'function' ? 'method' : 'property',
          name,
          value,
          access: path.node.accessibility,
          static: path.node.static,
          abstract: path.node.abstract
        }, docs));
      }

      if (path.isFunction() || path.isTSDeclareFunction()) {
        if (isReactComponent(path)) {
          let props = path.node.params[0];
          let ref = path.node.params[1];
          let docs = getJSDocs(path);
          return Object.assign(node, {
            type: 'component',
            id: path.node.id ? `${asset.filePath}:${path.node.id.name}` : null,
            name: path.node.id ? path.node.id.name : null,
            props: props && props.typeAnnotation
              ? processExport(path.get('params.0.typeAnnotation.typeAnnotation'))
              : null,
            typeParameters: path.node.typeParameters
              ? path.get('typeParameters.params').map(p => processExport(p))
              : [],
            ref: ref && ref.typeAnnotation
              ? processExport(path.get('params.1.typeAnnotation.typeAnnotation'))
              : null,
            description: docs.description || null
          });
        } else {
          let docs = getJSDocs(path);
          return Object.assign(node, addDocs({
            type: 'function',
            id: path.node.id ? `${asset.filePath}:${path.node.id.name}` : null,
            name: path.node.id ? path.node.id.name : null,
            parameters: path.get('params').map(processParameter),
            return: path.node.returnType
              ? processExport(path.get('returnType.typeAnnotation'))
              : {type: 'any'},
            typeParameters: path.node.typeParameters
              ? path.get('typeParameters.params').map(p => processExport(p))
              : []
          }, docs));
        }
      }

      if (path.isTSTypeReference()) {
        if (path.node.typeParameters) {
          let base = processExport(path.get('typeName'));
          let typeParameters = path.get('typeParameters.params').map(p => processExport(p));
          return Object.assign(node, {
            type: 'application',
            base,
            typeParameters
          });
        }

        let base = processExport(path.get('typeName'), node);
        return base;
      }

      if (path.isTSQualifiedName()) {
        let left = processExport(path.get('left'));
        if (left) {
          if (left.type === 'interface' || left.type === 'object') {
            let property = left.properties[path.node.right.name];
            if (property) {
              return property.value;
            }
          }

          if (left.name === undefined) {
            return Object.assign(node, {
              type: 'identifier',
              name: path.node.left.name + '.' + path.node.right.name
            });
          }
          return Object.assign(node, {
            type: 'identifier',
            name: left.name + '.' + path.node.right.name
          });
        }
      }

      if (path.isImportSpecifier()) {
        asset.addDependency({
          specifier: path.parent.source.value,
          specifierType: 'esm',
          symbols: new Map([[path.node.imported.name, {local: path.node.local.name}]]),
          pipeline: 'docs-json'
        });

        return Object.assign(node, {
          type: 'reference',
          local: path.node.local.name,
          imported: path.node.imported.name,
          specifier: path.parent.source.value
        });
      }

      if (path.isTSTypeAliasDeclaration()) {
        let docs = getJSDocs(path);
        return Object.assign(node, {
          type: 'alias',
          id: `${asset.filePath}:${path.node.id.name}`,
          name: path.node.id.name,
          value: processExport(path.get('typeAnnotation')),
          typeParameters: path.node.typeParameters ? path.get('typeParameters.params').map(p => processExport(p)) : [],
          description: docs.description || null,
          access: docs.access
        });
      }

      if (path.isTSMappedType()) {
        return Object.assign(node, {
          type: 'mapped',
          readonly: path.node.readonly,
          typeParameter: {
            ...processExport(path.get('typeParameter')),
            isMappedType: true
          },
          typeAnnotation: processExport(path.get('typeAnnotation'))
        });
      }

      if (path.isTSInterfaceDeclaration()) {
        let properties = {};
        for (let propertyPath of path.get('body.body')) {
          let property = processExport(propertyPath);
          if (property) {
            let prev = properties[property.name];
            if (!property.description && prev?.description) {
              property.description = prev.description;
            }
            properties[property.name] = property;
          } else {
            console.log('UNKNOWN PROPERTY interface declaration', propertyPath.node);
          }
        }

        let exts = path.node.extends ? path.get('extends').map(e => processExport(e)) : [];
        let docs = getJSDocs(path);

        return Object.assign(node, addDocs({
          type: 'interface',
          id: `${asset.filePath}:${path.node.id.name}`,
          name: path.node.id.name,
          extends: exts,
          properties,
          typeParameters: path.node.typeParameters ? path.get('typeParameters.params').map(p => processExport(p)) : []
        }, docs));
      }

      if (path.isTSTypeLiteral()) {
        let properties = {};
        for (let member of path.get('members')) {
          let property = processExport(member);
          if (property) {
            properties[property.name] = property;
          } else {
            console.log('UNKNOWN PROPERTY (type literal)', member.node);
          }
        }

        return Object.assign(node, {
          type: 'object',
          properties
        });
      }

      if (path.isTSTypeOperator()) {
        return Object.assign(node, {
          type: 'typeOperator',
          operator: path.node.operator,
          value: processExport(path.get('typeAnnotation'))
        });
      }

      if (path.isTSThisType()) {
        return Object.assign(node, {
          type: 'this'
        });
      }

      if (path.isTSPropertySignature()) {
        let name;
        if (t.isStringLiteral(path.node.key)) {
          name = path.node.key.value;
        } else if (t.isNumericLiteral(path.node.key)) {
          name = String(path.node.key.value);
        } else if (t.isIdentifier(path.node.key)) {
          name = path.node.key.name;
        } else {
          console.log('Unknown key', path.node.key);
          name = 'unknown';
        }

        let docs = getJSDocs(path);
        let value = processExport(path.get('typeAnnotation.typeAnnotation'));
        return Object.assign(node, addDocs({
          type: 'property',
          name,
          value,
          optional: path.node.optional || false
        }, docs));
      }

      if (path.isTSMethodSignature()) {
        let name = t.isStringLiteral(path.node.key) ? path.node.key.value : path.node.key.name;
        let docs = getJSDocs(path);
        return Object.assign(node, addDocs({
          type: 'method',
          name,
          value: {
            type: 'function',
            parameters: path.get('parameters').map(processParameter),
            return: path.node.typeAnnotation
              ? processExport(path.get('typeAnnotation.typeAnnotation'))
              : {type: 'any'},
            typeParameters: path.node.typeParameters
              ? path.get('typeParameters.params').map(p => processExport(p))
              : []
          }
        }, docs));
      }

      if (path.isTSIndexSignature()) {
        let name = path.node.parameters[0].name;
        let docs = getJSDocs(path);
        return Object.assign(node, addDocs({
          type: 'property',
          name,
          indexType: processExport(path.get('parameters.0.typeAnnotation.typeAnnotation')),
          value: processExport(path.get('typeAnnotation.typeAnnotation'))
        }, docs));
      }

      if (path.isTSExpressionWithTypeArguments()) {
        if (path.node.typeParameters) {
          return Object.assign(node, {
            type: 'application',
            base: processExport(path.get('expression')),
            typeParameters: path.get('typeParameters.params').map(p => processExport(p))
          });
        }

        return processExport(path.get('expression'), node);
      }

      if (path.isIdentifier()) {
        let binding = path.scope.getBinding(path.node.name);
        if (!binding) {
          return Object.assign(node, {
            type: 'identifier',
            name: path.node.name
          });
        }
        let bindings = processExport(binding.path, node);
        return bindings;
      }

      if (path.isTSSymbolKeyword()) {
        return Object.assign(node, {type: 'symbol'});
      }

      if (path.isTSBooleanKeyword()) {
        return Object.assign(node, {type: 'boolean'});
      }

      if (path.isTSStringKeyword()) {
        return Object.assign(node, {type: 'string'});
      }

      if (path.isTSNumberKeyword()) {
        return Object.assign(node, {type: 'number'});
      }

      if (path.isTSAnyKeyword()) {
        return Object.assign(node, {
          id: path.node.id ? `${asset.filePath}:${path.node.id.name}` : null,
          name: path.node.id ? path.node.id.name : null,
          type: 'any'
        });
      }

      if (path.isTSNullKeyword()) {
        return Object.assign(node, {type: 'null'});
      }

      if (path.isTSUndefinedKeyword()) {
        return Object.assign(node, {type: 'undefined'});
      }

      if (path.isTSVoidKeyword()) {
        return Object.assign(node, {type: 'void'});
      }

      if (path.isTSObjectKeyword()) {
        return Object.assign(node, {type: 'object'}); // ???
      }

      if (path.isTSUnknownKeyword()) {
        return Object.assign(node, {type: 'unknown'});
      }

      if (path.isTSNeverKeyword()) {
        return Object.assign(node, {type: 'never'});
      }

      if (path.isTSArrayType()) {
        return Object.assign(node, {
          type: 'array',
          elementType: processExport(path.get('elementType'))
        });
      }

      if (path.isTSUnionType()) {
        return Object.assign(node, {
          type: 'union',
          elements: path.get('types').map(t => processExport(t))
        });
      }

      if (path.isTSLiteralType()) {
        if (t.isTemplateLiteral(path.node.literal)) {
          let expressions = path.get('literal.expressions').map(e => processExport(e));
          let elements = [];
          let i = 0;
          for (let q of path.node.literal.quasis) {
            if (q.value.raw) {
              elements.push({
                type: 'string',
                value: q.value.raw
              });
            }

            if (!q.tail) {
              elements.push(expressions[i++]);
            }
          }

          return Object.assign(node, {
            type: 'template',
            elements
          });
        }

        return Object.assign(node, {
          type: typeof path.node.literal.value,
          value: path.node.literal.value
        });
      }

      if (path.isTSFunctionType() || path.isTSConstructorType()) {
        return Object.assign(node, {
          type: 'function',
          parameters: path.get('parameters').map(processParameter),
          return: path.node.typeAnnotation ? processExport(path.get('typeAnnotation.typeAnnotation')) : {type: 'any'},
          typeParameters: path.node.typeParameters ? path.get('typeParameters.params').map(p => processExport(p)) : []
        });
      }

      if (path.isTSIntersectionType()) {
        return Object.assign(node, {
          type: 'intersection',
          types: path.get('types').map(p => processExport(p))
        });
      }

      if (path.isTSTypeParameter()) {
        return Object.assign(node, {
          type: 'typeParameter',
          name: path.node.name,
          constraint: path.node.constraint ? processExport(path.get('constraint')) : null,
          default: path.node.default ? processExport(path.get('default')) : null
        });
      }

      if (path.isTSTupleType()) {
        return Object.assign(node, {
          type: 'tuple',
          elements: path.get('elementTypes').map(t => processExport(t))
        });
      }

      if (path.isTSTypeOperator() && path.node.operator === 'keyof') {
        return Object.assign(node, {
          type: 'keyof',
          keyof: processExport(path.get('typeAnnotation'))
        });
      }

      if (path.isTSConditionalType()) {
        return Object.assign(node, {
          type: 'conditional',
          checkType: processExport(path.get('checkType')),
          extendsType: processExport(path.get('extendsType')),
          trueType: processExport(path.get('trueType')),
          falseType: processExport(path.get('falseType'))
        });
      }

      if (path.isTSModuleDeclaration()) {
        // TODO: decide how we want to display something from a Global namespace
        return Object.assign(node, {type: 'any'});
      }

      if (path.isTSIndexedAccessType()) {
        return Object.assign(node, {
          type: 'indexedAccess',
          objectType: processExport(path.get('objectType')),
          indexType: processExport(path.get('indexType'))
        });
      }

      console.log('UNKNOWN TYPE', path.node.type);
      return Object.assign(node, {type: 'any'});
    }

    function processParameter(p) {
      if (p.isAssignmentPattern()) {
        p = p.get('left');
      }

      return {
        type: 'parameter',
        name: p.isRestElement() ? p.node.argument.name : p.node.name,
        value: p.node.typeAnnotation ? processExport(p.get('typeAnnotation.typeAnnotation')) : {type: 'any'},
        optional: p.node.optional,
        rest: p.isRestElement()
      };
    }

    function processExport(path, node = {}) {
      if (nodeCache.has(path)) {
        return nodeCache.get(path);
      } else {
        nodeCache.set(path, node);
        return processPath(path, node);
      }
    }

    function isReactForwardRef(path) {
      return isReactCall(path, 'forwardRef') || (path.isCallExpression() && path.get('callee').isIdentifier({name: 'createHideableComponent'}));
    }

    function isCollectionComponent(path) {
      return path.isCallExpression() && t.isIdentifier(path.node.callee) && (
        path.node.callee.name === 'createLeafComponent' ||
        path.node.callee.name === 'createBranchComponent'
      );
    }

    function isReactCall(path, name, module = 'react') {
      if (!path.isCallExpression()) {
        return false;
      }

      let callee = path.node.callee;
      let calleePath = path.get('callee');
      if (t.isTSAsExpression(callee)) {
        callee = callee.expression;
        calleePath = calleePath.get('expression');
      }

      if (!t.isMemberExpression(callee)) {
        return calleePath.referencesImport(module, name);
      }

      if (calleePath.get('object').referencesImport(module, 'default')) {
        return t.isIdentifier(callee.property, {name});
      }

      return false;
    }

    function isReactComponent(path) {
      if (path.isFunction()) {
        let returnType = path.node.returnType?.typeAnnotation;
        if (isJSXElementType(returnType)) {
          return true;
        }

        if (returnType && t.isTSUnionType(returnType) && returnType.types.some(isJSXElementType)) {
          return true;
        }

        let returnsJSX = false;
        path.traverse({
          ReturnStatement(path) {
            let ret = path.node.argument;
            if (t.isJSXElement(ret) || t.isJSXFragment(ret) || isReactCall(path.get('argument'), 'cloneElement') || isReactCall(path.get('argument'), 'createPortal', 'react-dom')) {
              returnsJSX = true;
            }
          }
        });

        return returnsJSX;
      }

      // TODO: classes

      return false;
    }

    function isJSXElementType(returnType) {
      return returnType &&
        t.isTSTypeReference(returnType) &&
        t.isTSQualifiedName(returnType.typeName) &&
        t.isIdentifier(returnType.typeName.left, {name: 'JSX'}) &&
        t.isIdentifier(returnType.typeName.right, {name: 'Element'});
    }

    function getJSDocs(path) {
      let comments = getDocComments(path);
      if (comments) {
        let parsed = doctrine.parse(comments, {
          // have doctrine itself remove the comment asterisks from content
          unwrap: true,
          // enable parsing of optional parameters in brackets, JSDoc3 style
          sloppy: true,
          // `recoverable: true` is the only way to get error information out
          recoverable: true
        });

        let result = {
          description: parsed.description
        };

        for (let tag of parsed.tags) {
          if (tag.title === 'default') {
            result.default = tag.description;
          } else if (tag.title === 'access') {
            result.access = tag.description;
          } else if (tag.title === 'private' || tag.title === 'deprecated') {
            result.access = 'private';
          } else if (tag.title === 'protected') {
            result.access = 'protected';
          } else if (tag.title === 'public') {
            result.access = 'public';
          } else if (tag.title === 'return' || tag.title === 'returns') {
            result.return = tag.description;
          } else if (tag.title === 'param') {
            if (!result.params) {
              result.params = {};
            }

            result.params[tag.name] = tag.description;
          } else if (tag.title === 'selector') {
            result.selector = tag.description;
          }
        }

        return result;
      }

      return {};
    }

    function getDocComments(path) {
      if (path.node.leadingComments) {
        return path.node.leadingComments.filter(isJSDocComment).map(c => c.value).join('\n');
      }

      if (path.parentPath.isExportDeclaration() && path.parent.leadingComments) {
        return path.parent.leadingComments.filter(isJSDocComment).map(c => c.value).join('\n');
      }

      return null;
    }

    function isJSDocComment(comment) {
      const asterisks = comment.value.match(/^(\*+)/);
      return (
        comment.type === 'CommentBlock' && asterisks && asterisks[1].length === 1
      );
    }

    function addDocs(value, docs) {
      if (!value) {
        return value;
      }

      if (docs.description) {
        value.description = docs.description;
      }

      if (docs.access) {
        value.access = docs.access;
      }

      if (docs.selector) {
        value.selector = docs.selector;
      }

      if (value.type === 'property' || value.type === 'method') {
        value.default = docs.default || value.default || null;
        if (value.value && value.value.type === 'function') {
          addFunctionDocs(value.value, docs);
        }
      }

      if (value.type === 'function') {
        addFunctionDocs(value, docs);
      }

      return value;
    }

    function addFunctionDocs(value, docs) {
      let params = docs.params || {};
      for (let param of value.parameters) {
        param.description = params[param.name] || param.description || null;
      }

      if (value.return) {
        value.return.description = docs.return || value.return.description || null;
      }
    }

    asset.type = 'json';
    let buffer = v8.serialize(exports);
    asset.setBuffer(buffer);
    return [asset];
  }
});

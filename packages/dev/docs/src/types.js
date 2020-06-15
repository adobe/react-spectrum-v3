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

import Asterisk from '@spectrum-icons/workflow/Asterisk';
import {getAnchorProps, getUsedLinks} from './utils';
import {getDoc} from 'globals-docs';
import linkStyle from '@adobe/spectrum-css-temp/components/link/vars.css';
import Lowlight from 'react-lowlight';
import Markdown from 'markdown-to-jsx';
import React, {useContext} from 'react';
import styles from './docs.css';
import tableStyles from '@adobe/spectrum-css-temp/components/table/vars.css';
import typographyStyles from '@adobe/spectrum-css-temp/components/typography/vars.css';

const DOC_LINKS = {
  'React.Component': 'https://reactjs.org/docs/react-component.html',
  ReactElement: 'https://reactjs.org/docs/rendering-elements.html',
  ReactNode: 'https://reactjs.org/docs/rendering-elements.html',
  Generator: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Generator',
  Iterator: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols',
  Iterable: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols',
  DataTransfer: 'https://developer.mozilla.org/en-US/docs/Web/API/DataTransfer',
  CSSProperties: 'https://reactjs.org/docs/dom-elements.html#style',
  'Intl.NumberFormat': 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat',
  'Intl.NumberFormatOptions': 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat/NumberFormat',
  'Intl.DateTimeFormat': 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat',
  'Intl.DateTimeFormatOptions': 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat/DateTimeFormat',
  'Intl.Collator': 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/Collator',
  'Intl.CollatorOptions': 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/Collator/Collator',
  'AbortSignal': 'https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal',
  'Key': 'https://reactjs.org/docs/lists-and-keys.html'
};

export const TypeContext = React.createContext();
export const LinkContext = React.createContext();

export function Type({type}) {
  let links = useContext(TypeContext);

  if (!type) {
    return null;
  }

  switch (type.type) {
    case 'any':
    case 'null':
    case 'undefined':
    case 'void':
    case 'unknown':
      return <Keyword {...type} />;
    case 'identifier':
      return <Identifier {...type} />;
    case 'string':
      if (type.value) {
        return <StringLiteral {...type} />;
      }

      return <Keyword {...type} />;
    case 'number':
      if (type.value) {
        return <NumberLiteral {...type} />;
      }

      return <Keyword {...type} />;
    case 'boolean':
      if (type.value) {
        return <BooleanLiteral {...type} />;
      }

      return <Keyword {...type} />;
    case 'union':
      return <UnionType {...type} />;
    case 'intersection':
      return <IntersectionType {...type} />;
    case 'application':
      return <TypeApplication {...type} />;
    case 'function':
      return <FunctionType {...type} />;
    case 'parameter':
      return <Parameter {...type} />;
    case 'link':
      return <LinkType {...type} />;
    case 'interface':
      return <InterfaceType {...type} />;
    case 'object':
      if (type.properties) {
        return <ObjectType {...type} />;
      }

      return <Keyword {...type} />;
    case 'alias':
      return <code className={typographyStyles['spectrum-Code4']}><Type type={type.value} /></code>;
    case 'array':
      return <ArrayType {...type} />;
    case 'tuple':
      return <TupleType {...type} />;
    case 'typeParameter':
      return <TypeParameter {...type} />;
    case 'component': {
      let props = type.props;
      if (props.type === 'application') {
        props = props.base;
      }
      if (props.type === 'link') {
        props = links[props.id];
      }
      return <Type type={{...props, description: type.description}} />;
    }
    default:
      console.log('no render component for TYPE', type);
      return null;
  }
}

function StringLiteral({value}) {
  return <span className="token hljs-string">{`'${value.replace(/'/, '\\\'')}'`}</span>;
}

function NumberLiteral({value}) {
  return <span className="token hljs-number">{'' + value}</span>;
}

function BooleanLiteral({value}) {
  return <span className="token hljs-literal">{'' + value}</span>;
}

function Keyword({type}) {
  let link = getDoc(type);
  if (link) {
    return <a href={link} className={`${styles.colorLink} token hljs-keyword`} rel="noreferrer" target="_blank">{type}</a>;
  }

  return <span className="token hljs-keyword">{type}</span>;
}

function Identifier({name}) {
  let link = getDoc(name) || DOC_LINKS[name];
  if (link) {
    return <a href={link} className={`${styles.colorLink} token hljs-name`} rel="noreferrer" target="_blank">{name}</a>;
  }

  return <span className="token hljs-name">{name}</span>;
}

const IndentContext = React.createContext({small: '', large: ''});

export function Indent({params, open, close, children, alwaysIndent}) {
  let {small, large} = useContext(IndentContext);

  if (params.length === 0) {
    open = <span className="token punctuation">{open}</span>;
    close = <span className="token punctuation">{close}</span>;
  } else if (params.length > 2 || alwaysIndent) {
    // Always indent.
    open =  <span className="token punctuation">{open.trimEnd() + '\n' + large + '  '}</span>;
    close =  <span className="token punctuation">{'\n' + large + close.trimStart()}</span>;
    large += '  ';
    small += '  ';
  } else {
    // Indent on small screens. Don't indent on large screens.
    open = (
      <>
        <span className="token punctuation small">{open.trimEnd() + '\n' + small + '  '}</span>
        <span className="token punctuation large">{open}</span>
      </>
    );

    close = (
      <>
        <span className="token punctuation small">{'\n' + small + close.trimStart()}</span>
        <span className="token punctuation large">{close}</span>
      </>
    );

    small += '  ';
  }

  return (
    <IndentContext.Provider value={{small, large, alwaysIndent}}>
      {open}
      {children}
      {close}
    </IndentContext.Provider>
  );
}

export function JoinList({elements, joiner, minIndent = 2, newlineBefore, neverIndent}) {
  let {small, large, alwaysIndent} = useContext(IndentContext);

  let contents;
  if (neverIndent || (elements.length <= minIndent && small.length === 0)) {
    contents = joiner;
  } else if (elements.length > minIndent || alwaysIndent) {
    // Always indent.
    if (newlineBefore) {
      large += '  ';
      small += '  ';
    }

    contents = newlineBefore
      ? '\n' + large + joiner.trimStart()
      : joiner.trimEnd() + '\n' + large;
  } else {
    // Indent on small screens. Don't indent on large screens.
    if (newlineBefore) {
      small += '  ';
    }

    let indented = newlineBefore
      ? '\n' + small + joiner.trimStart()
      : joiner.trimEnd() + '\n' + small;

    contents = (
      <>
        <span className="small">{indented}</span>
        <span className="large">{joiner}</span>
      </>
    );
  }

  return elements
    .filter(Boolean)
    .reduce((acc, v, i) => [
      ...acc,
      <span
        className="token punctuation"
        key={`join${v.name || v.raw}${i}`}>
        {contents}
      </span>,
      <IndentContext.Provider
        value={{small, large, alwaysIndent}}
        key={`type${v.name || v.raw}${i}`}>
        <Type type={v} />
      </IndentContext.Provider>
    ], []).slice(1);
}

function UnionType({elements}) {
  return <JoinList elements={elements} joiner={' |\u00a0'} newlineBefore />;
}

function IntersectionType({types}) {
  return <JoinList elements={types} joiner={' &\u00a0'} newlineBefore />;
}

function TypeApplication({base, typeParameters}) {
  return (
    <>
      <Type type={base} />
      <TypeParameters typeParameters={typeParameters} />
    </>
  );
}

export function TypeParameters({typeParameters}) {
  if (typeParameters.length === 0) {
    return null;
  }

  return (
    <>
      <span className="token punctuation">&lt;</span>
      <JoinList elements={typeParameters} joiner=", " neverIndent />
      <span className="token punctuation">&gt;</span>
    </>
  );
}

function TypeParameter({name, default: defaultType}) {
  return (
    <>
      <span className="token hljs-name">{name}</span>
      {defaultType &&
        <>
          <span className="token punctuation">{' = '}</span>
          <Type type={defaultType} />
        </>
      }
    </>
  );
}

function FunctionType({name, parameters, return: returnType, typeParameters, rest}) {
  return (
    <>
      {name && <span className="token hljs-function">{name}</span>}
      <TypeParameters typeParameters={typeParameters} />
      <Indent params={parameters} open="(" close=")">
        <JoinList elements={parameters} joiner=", " />
      </Indent>
      <span className="token punctuation">{name ? ': ' : ' => '}</span>
      <Type type={returnType} />
    </>
  );
}

function Parameter({name, value, default: defaultValue, rest}) {
  return (
    <>
      {rest && <span className="token punctuation">...</span>}
      <span className="token hljs-attr">{name}</span>
      {value &&
        <>
          <span className="token punctuation">: </span>
          <Type type={value} />
        </>
      }
      {defaultValue &&
        <>
          <span className="token punctuation"> = </span>
          <span dangerouslySetInnerHTML={{__html: defaultValue}} />
        </>
      }
    </>
  );
}

export function LinkProvider({children}) {
  let links = new Map();
  return (
    <LinkContext.Provider value={links}>
      {children}
      <LinkRenderer />
    </LinkContext.Provider>
  );
}

export function LinkRenderer() {
  let links = useContext(LinkContext);
  return [...links.values()].map(({type, links}) => (
    <section key={type.id} id={type.id} data-title={type.name} hidden>
      {type.description && <Markdown options={{forceBlock: true, overrides: {a: {component: SpectrumLink}}}} className={styles['type-description']}>{type.description}</Markdown>}
      <TypeContext.Provider value={links}>
        {type.type === 'interface' || type.type === 'alias' || type.type === 'component'
          ? <Type type={type} />
          : <code className={`${typographyStyles['spectrum-Code4']}`}><Type type={type} /></code>
        }
      </TypeContext.Provider>
    </section>
  ));
}

export function LinkType({id}) {
  let links = useContext(TypeContext) || {};
  let registered = useContext(LinkContext);
  let value = links[id];
  if (!value) {
    return null;
  }

  registered.set(id, {type: value, links});

  let used = getUsedLinks(value, links);
  for (let id in used) {
    registered.set(id, {type: used[id], links});
  }

  return <a href={'#' + id} data-link={id} className={`${styles.colorLink} token hljs-name`}>{value.name}</a>;
}

function SpectrumLink({href, children, title}) {
  return <a className={linkStyle['spectrum-Link']} href={href} title={title} {...getAnchorProps(href)}>{children}</a>;
}

export function renderHTMLfromMarkdown(description) {
  if (description) {
    const options = {forceInline: true, overrides: {a: {component: SpectrumLink}}};
    return <Markdown options={options}>{description}</Markdown>;
  }
  return '';
}

export function InterfaceType({description, properties: props, showRequired, showDefault}) {
  let properties = Object.values(props).filter(prop => prop.type === 'property' && prop.access !== 'private' && prop.access !== 'protected');
  let methods = Object.values(props).filter(prop => prop.type === 'method' && prop.access !== 'private' && prop.access !== 'protected');

  // Default to showing required indicators if some properties are optional but not all.
  showRequired = showRequired || (!properties.every(p => p.optional) && !properties.every(p => !p.optional));

  // Show default values by default if any of the properties have one defined.
  showDefault = showDefault || properties.some(p => !!p.default);

  // Sort props so required ones are shown first.
  if (showRequired) {
    properties.sort((a, b) => {
      if (!a.optional && b.optional) {
        return -1;
      }

      if (a.optional && !b.optional) {
        return 1;
      }

      return 0;
    });
  }

  return (
    <>
      {methods.length > 0 && properties.length > 0 &&
        <h3 className={typographyStyles['spectrum-Heading4']}>Properties</h3>
      }
      {properties.length > 0 &&
        <table className={`${tableStyles['spectrum-Table']} ${tableStyles['spectrum-Table--quiet']} ${styles.propTable}`}>
          <thead>
            <tr>
              <td className={tableStyles['spectrum-Table-headCell']}>Name</td>
              <td className={tableStyles['spectrum-Table-headCell']} style={{'width': '30%'}}>Type</td>
              {showDefault && <td className={tableStyles['spectrum-Table-headCell']}>Default</td>}
              <td className={tableStyles['spectrum-Table-headCell']} style={{'width': '40%'}}>Description</td>
            </tr>
          </thead>
          <tbody className={tableStyles['spectrum-Table-body']}>
            {properties.map((prop, index) => (
              <tr key={index} className={tableStyles['spectrum-Table-row']}>
                <td className={tableStyles['spectrum-Table-cell']} data-column="Name">
                  <code className={`${typographyStyles['spectrum-Code4']}`}>
                    <span className="token hljs-attr">{prop.name}</span>
                  </code>
                  {!prop.optional && showRequired
                    ? <Asterisk size="XXS" UNSAFE_className={styles.requiredIcon} alt="Required" />
                    : null
                  }
                </td>
                <td className={tableStyles['spectrum-Table-cell']} data-column="Type">
                  <code className={typographyStyles['spectrum-Code4']}>
                    <Type type={prop.value} />
                  </code>
                </td>
                {showDefault &&
                  <td className={`${tableStyles['spectrum-Table-cell']} ${!prop.default ? styles.noDefault : ''}`} data-column="Default">
                    {prop.default
                      ? <Lowlight language="js" value={prop.default} inline className={typographyStyles['spectrum-Code4']} />
                      : '—'
                    }
                  </td>
                }
                <td className={tableStyles['spectrum-Table-cell']}>{renderHTMLfromMarkdown(prop.description)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      }
      {methods.length > 0 && properties.length > 0 &&
        <h3 className={typographyStyles['spectrum-Heading4']}>Methods</h3>
      }
      {methods.length > 0 &&
        <table className={`${tableStyles['spectrum-Table']} ${tableStyles['spectrum-Table--quiet']} ${styles.propTable} ${styles.methodTable}`}>
          <thead>
            <tr>
              <td className={tableStyles['spectrum-Table-headCell']}>Method</td>
              <td className={tableStyles['spectrum-Table-headCell']}>Description</td>
            </tr>
          </thead>
          <tbody className={tableStyles['spectrum-Table-body']}>
            {methods.map((prop, index) => (
              <tr key={index} className={tableStyles['spectrum-Table-row']}>
                <td className={tableStyles['spectrum-Table-cell']} data-column="Name">
                  <code className={`${typographyStyles['spectrum-Code4']}`}>
                    <span className="token hljs-function">{prop.name}</span>
                    <TypeParameters typeParameters={prop.value.typeParameters} />
                    <Indent params={prop.value.parameters} open="(" close=")">
                      <JoinList elements={prop.value.parameters} joiner=", " />
                    </Indent>
                    <span className="token punctuation">{': '}</span>
                    <Type type={prop.value.return} />
                  </code>
                </td>
                <td className={tableStyles['spectrum-Table-cell']}>{renderHTMLfromMarkdown(prop.description)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      }
    </>
  );
}

function ObjectType({properties, exact}) {
  const startObject = <span className="token punctuation">{exact ? '{|' : '{'}</span>;
  const endObject = <span className="token punctuation">{exact ? '|}' : '}'}</span>;
  return (
    <>
      {startObject}
      {Object.values(properties).map((property, i, arr) => {
        let token = 'hljs-attr';
        let k = property.name;
        // https://mathiasbynens.be/notes/javascript-identifiers-es6
        if (!/^[$_\p{ID_Start}][$_\u{200C}\u{200D}\p{ID_Continue}]+$/u.test(property.key)) {
          k = `'${property.name}'`;
          token = 'hljs-string';
        }

        let optional = property.optional;
        let value = property.value;

        // Special handling for methods
        if (value && value.type === 'function' && !optional && token === 'method') {
          return (
            <div key={property.key} style={{paddingLeft: '1.5em'}}>
              <span className="token hljs-attr">{k}</span>
              <span className="token punctuation">(</span>
              <JoinList elements={value.parameters} joiner=", " />
              <span className="token punctuation">)</span>
              <span className="token punctuation">{': '}</span>
              <Type type={value.return} />
              {i < arr.length - 1 ? ',' : ''}
            </div>
          );
        }

        let punc = optional ? '?: ' : ': ';
        return (
          <div key={property.key} style={{paddingLeft: '1.5em'}}>
            {property.indexType && <span className="token punctuation">[</span>}
            <span className={`token ${token}`}>{k}</span>
            {property.indexType && <span className="token punctuation">{': '}</span>}
            {property.indexType && <Type type={property.indexType} />}
            {property.indexType && <span className="token punctuation">]</span>}
            <span className="token punctuation">{punc}</span>
            <Type type={value} />
            {i < arr.length - 1 ? ',' : ''}
          </div>
        );
      })}
      {endObject}
    </>
  );
}

function ArrayType({elementType}) {
  return (
    <>
      <Type type={elementType} />
      <span className="token punctuation">[]</span>
    </>
  );
}

function TupleType({elements}) {
  return (
    <>
      <Indent params={elements} alwaysIndent open="[" close="]">
        <JoinList elements={elements} joiner=", " alwaysIndent />
      </Indent>
    </>
  );
}

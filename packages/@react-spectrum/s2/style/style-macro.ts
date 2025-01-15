/*
 * Copyright 2024 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

import type {Condition, CSSProperties, CSSValue, CustomValue, PropertyFunction, PropertyValueDefinition, PropertyValueMap, RenderProps, ShorthandProperty, StyleFunction, StyleValue, Theme, ThemeProperties, Value} from './types';

let defaultArbitraryProperty = <T>(value: T, property: string) => ({[property]: value} as CSSProperties);
export function createArbitraryProperty<T>(fn: (value: T, property: string) => CSSProperties = defaultArbitraryProperty): PropertyFunction<T> {
  return (value, property) => {
    let selector = Array.isArray(value) ? generateArbitraryValueSelector(value.map(v => JSON.stringify(v)).join('')) : generateArbitraryValueSelector(JSON.stringify(value));
    return {default: [fn(value, property), selector]};
  };
}

function recursiveValues(obj: object): string[] {
  return Object.values(obj).flatMap(v => typeof v === 'object' ? recursiveValues(v) : [v]);
}

export function createMappedProperty<T extends CSSValue>(fn: (value: string, property: string) => CSSProperties, values: PropertyValueMap<T> | string[]): PropertyFunction<T> {
  let valueMap = createValueLookup(Array.isArray(values) ? values : recursiveValues(values));
  return (value, property) => {
    let v = parseArbitraryValue(value);
    if (v) {
      return {default: [fn(v[0], property), v[1]]};
    }

    let val = Array.isArray(values) ? value : values[String(value)];
    return mapConditionalValue(val, value => {
      return [fn(value, property), valueMap.get(value)!];
    });
  };
}

export function createRenamedProperty<T extends CSSValue>(name: string, values: PropertyValueMap<T> | string[]): PropertyFunction<T> {
  return createMappedProperty((value, property) => ({[property.startsWith('--') ? property : name]: value}), values);
}

export function createSizingProperty<T extends CSSValue>(values: PropertyValueMap<T>, fn: (value: number) => string): PropertyFunction<T | (number & {})> {
  let valueMap = createValueLookup(Array.isArray(values) ? values : recursiveValues(values));
  return (value, property) => {
    let v = parseArbitraryValue(value);
    if (v) {
      return {default: [{[property]: v[0]}, v[1]]};
    }

    let val = values[String(value)];
    if (val != null) {
      return mapConditionalValue(val, value => {
        return [{[property]: value}, valueMap.get(value)!];
      });
    }

    if (typeof value === 'number') {
      let cssValue = value === 0 ? '0px' : fn(value);
      return {default: [{[property]: cssValue}, generateName(value + valueMap.size)]};
    }

    throw new Error('Invalid sizing value: ' + value);
  };
}

export type Color<C extends string> = C | `${string}/${number}`;
export function createColorProperty<C extends string>(colors: PropertyValueMap<C>, property?: keyof CSSProperties): PropertyFunction<Color<C>> {
  let valueMap = createValueLookup(Object.values(colors).flatMap((v: any) => typeof v === 'object' ? Object.values(v) : [v]));
  return (value: Color<C>, key: string) => {
    let v = parseArbitraryValue(value);
    if (v) {
      return {default: [{[property || key]: v[0]}, v[1]]};
    }

    let [color, opacity] = value.split('/');
    let c = colors[color];
    return mapConditionalValue(c, value => {
      let css = opacity ? `rgb(from ${value} r g b / ${opacity}%)` : value;
      let selector = valueMap.get(value)! + (opacity ? opacity.replace('.', '-') : '');
      return [{[property || key]: css}, selector];
    });
  };
}

function mapConditionalValue<T, U>(value: PropertyValueDefinition<T>, fn: (value: T) => U): PropertyValueDefinition<U> {
  if (typeof value === 'object') {
    let res: PropertyValueDefinition<U> = {};
    for (let condition in value) {
      res[condition] = mapConditionalValue((value as any)[condition], fn);
    }
    return res;
  } else {
    return fn(value);
  }
}

function mapConditionalShorthand<T, C extends string, R extends RenderProps<string>>(value: PropertyValueDefinition<T>, fn: ShorthandProperty<T>): {[property: string]: StyleValue<Value, C, R>} {
  if (typeof value === 'object') {
    let res = {};
    for (let condition in value) {
      let properties = mapConditionalShorthand(value[condition], fn);
      for (let property in properties) {
        res[property] ??= {};
        res[property][condition] = properties[property];
      }
    }
    return res;
  } else {
    return fn(value);
  }
}

function createValueLookup(values: Array<CSSValue>, atStart = false) {
  let map = new Map<CSSValue, string>();
  for (let value of values) {
    if (!map.has(value)) {
      map.set(value, generateName(map.size, atStart));
    }
  }
  return map;
}

export function parseArbitraryValue(value: any) {
  if (typeof value === 'string' && value.startsWith('--')) {
    return [`var(${value})`, generateArbitraryValueSelector(value)];
  } else if (typeof value === 'string' && value[0] === '[' && value[value.length - 1] === ']') {
    let s = generateArbitraryValueSelector(value.slice(1, -1));
    return [value.slice(1, -1), s];
  }
}

interface MacroContext {
  addAsset(asset: {type: string, content: string}): void
}

export function createTheme<T extends Theme>(theme: T): StyleFunction<ThemeProperties<T>, 'default' | Extract<keyof T['conditions'], string>> {
  let themePropertyMap = createValueLookup(Object.keys(theme.properties), true);
  let themeConditionMap = createValueLookup(Object.keys(theme.conditions), true);
  let propertyFunctions = new Map(Object.entries(theme.properties).map(([k, v]) => {
    if (typeof v === 'function') {
      return [k, v];
    }
    return [k, createMappedProperty((value, p) => ({[p]: value}), v) as PropertyFunction<Value>];
  }));

  let dependencies = new Set<string>();
  let hasConditions = false;
  return function style(this: MacroContext | void, style, allowedOverrides?: readonly string[]) {
    // Check if `this` is undefined, which means style was not called as a macro but as a normal function.
    // We also check if this is globalThis, which happens in non-strict mode bundles.
    // Also allow style to be called as a normal function in tests.
    // @ts-ignore
    // eslint-disable-next-line
    if ((this == null || this === globalThis) && process.env.NODE_ENV !== 'test') {
      throw new Error('The style macro must be imported with {type: "macro"}.');
    }

    // Generate rules for each property.
    let rules = new Map<string, Rule[]>();
    let values =  new Map();
    dependencies.clear();
    let usedPriorities = 1;
    let setRules = (key: string, value: [number, Rule[]]) => {
      usedPriorities = Math.max(usedPriorities, value[0]);
      rules.set(key, value[1]);
    };

    hasConditions = false;
    for (let key in style) {
      let value = style[key]!;
      let themeProperty = key;
      values.set(key, value);

      // Get the type of custom properties in the theme.
      if (key.startsWith('--')) {
        themeProperty = value.type;
        value = value.value;
      }

      // Expand shorthands to longhands so that merging works as expected.
      if (theme.shorthands[key]) {
        let shorthand = theme.shorthands[key];
        if (typeof shorthand === 'function') {
          let expanded = mapConditionalShorthand(value, shorthand);
          for (let k in expanded) {
            let v = expanded[k];
            values.set(k, v);
            setRules(k, compileValue(k, k, v));
          }
        } else {
          for (let prop of shorthand) {
            values.set(prop, value);
            setRules(prop, compileValue(prop, prop, value));
          }
        }
      } else if (themeProperty in theme.properties) {
        setRules(key, compileValue(key, themeProperty, value));
      }
    }

    // For properties referenced by self(), rewrite the declarations to assign
    // to an intermediary custom property so we can access the value.
    for (let dep of dependencies) {
      let value = values.get(dep);
      if (value != null) {
        if (!(dep in theme.properties)) {
          throw new Error(`Unknown dependency ${dep}`);
        }
        let name = `--${themePropertyMap.get(dep)}`;
        // Could potentially use @property to prevent the var from inheriting in children.
        setRules(name, compileValue(name, dep, value));
        setRules(dep, compileValue(dep, dep, name));
      }
    }
    dependencies.clear();

    // Prevent all global styles from leaking into this element.
    // The :not(#a#b) raises the specificity of the selector by 2 ids,
    // which can never occur on a real element, and will win over other
    // selectors such as class and element selectors.
    let css = '';

    // Declare layers for each priority ahead of time so the order is always correct.
    css += '@layer ';
    let first = true;
    for (let i = 0; i <= usedPriorities; i++) {
      if (first) {
        first = false;
      } else {
        css += ', ';
      }
      css += layerName(generateName(i, true));
    }
    css += ';\n\n';

    // If allowed overrides are provided, generate code to match the input override string and include only allowed classes.
    // Also generate a variable for each overridable property that overlaps with the style definition. If those are defined,
    // the defaults from the style definition are omitted.
    let allowedOverridesSet = new Set<string>();
    let js = 'let rules = " .";\n';
    if (allowedOverrides?.length) {
      for (let property of allowedOverrides) {
        if (themePropertyMap.has(property as string)) {
          allowedOverridesSet.add(themePropertyMap.get(property as string)!);
        }
      }

      js += `let matches = (overrides || '').match(/(?:^|\\s)(?:${[...allowedOverridesSet].join('|')})[^\\s]+/g) || [];\n`;
      js += 'rules += matches.join(\'\');\n';
      let loop = '';
      for (let property of rules.keys()) {
        let themeProperty = themePropertyMap.get(property);
        if (themeProperty && allowedOverridesSet.has(themeProperty)) {
          js += `let $${themeProperty} = false;\n`;
          loop += `  if (/^\\s*${themeProperty}/.test(p)) $${themeProperty} = true;\n`;
        }
      }
      if (loop) {
        js += 'for (let p of matches) {\n';
        js += loop;
        js += '}\n';
      }
    }

    // Generate JS and CSS for each rule.
    let isStatic = !(hasConditions || allowedOverrides);
    let className = ' .';
    let rulesByLayer = new Map<string, string[]>();
    for (let [property, propertyRules] of rules) {
      if (isStatic) {
        className += getStaticClassName(propertyRules);
      } else {
        let themeProperty = themePropertyMap.get(property);
        let allowsOverrides = themeProperty && allowedOverridesSet.has(themeProperty);
        if (allowsOverrides) {
          // Omit the value if an override was passed in.
          js += `if (!$${themeProperty}) {\n`;
        }
        js += printJS(propertyRules) + '\n';
        if (allowsOverrides) {
          js += '}\n';
        }
      }
      for (let rule of propertyRules) {
        printRule(rule, rulesByLayer);
      }
    }

    for (let [layer, rules] of rulesByLayer) {
      css += `@layer ${layerName(layer)} {\n`;
      css += rules.join('\n\n');
      css += '}\n\n';
    }

    if (this && typeof this.addAsset === 'function') {
      this.addAsset({
        type: 'css',
        content: css
      });
    }

    if (isStatic) {
      return className;
    }

    js += 'return rules;';
    if (allowedOverrides) {
      return new Function('props', 'overrides', js) as any;
    }
    return new Function('props', js) as any;
  };

  function compileValue(property: string, themeProperty: string, value: StyleValue<Value, Condition<T>, any>) {
    return conditionalToRules(value as any, 0, new Set(), new Set(), (value, priority, conditions, skipConditions) => {
      return compileRule(property, themeProperty, value, priority, conditions, skipConditions);
    });
  }

  function conditionalToRules<P extends CustomValue | any[]>(
    value: PropertyValueDefinition<P>,
    parentPriority: number,
    currentConditions: Set<string>,
    skipConditions: Set<string>,
    fn: (value: P, priority: number, conditions: Set<string>, skipConditions: Set<string>) => [number, Rule[]]
  ): [number, Rule[]] {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      let rules: Rule[] = [];

      // Later conditions in parent rules override conditions in child rules.
      let subSkipConditions = new Set([...skipConditions, ...Object.keys(value)]);

      // Skip the default condition if we're already filtering by one of the other possible conditions.
      // For example, if someone specifies `dark: 'gray-400'`, only include the dark version of `gray-400` from the theme.
      let skipDefault = Object.keys(value).some(k => currentConditions.has(k));
      let wasCSSCondition = false;
      let priority = parentPriority;

      for (let condition in value) {
        if (skipConditions.has(condition) || (condition === 'default' && skipDefault)) {
          continue;
        }
        subSkipConditions.delete(condition);

        let val = value[condition];

        // If a theme condition comes after runtime conditions, create a new grouping.
        // This makes the CSS class unconditional so it appears outside the `else` block in the JS.
        // The @layer order in the generated CSS will ensure that it overrides classes applied by runtime conditions.
        let isCSSCondition = condition in theme.conditions || /^[@:]/.test(condition);
        if (!wasCSSCondition && isCSSCondition && rules.length) {
          rules = [{prelude: '', condition: '', layer: '', body: rules}];
        }
        wasCSSCondition = isCSSCondition;

        // Increment the current priority whenever we see a new CSS condition.
        if (isCSSCondition) {
          priority++;
        }

        // If this is a runtime condition, inherit the priority from the parent rule.
        // Otherwise, use the current maximum of the parent and current priorities.
        let rulePriority = isCSSCondition ? priority : parentPriority;

        if (condition === 'default' || isCSSCondition || /^is[A-Z]/.test(condition) || /^allows[A-Z]/.test(condition)) {
          let subConditions = currentConditions;
          if (isCSSCondition) {
            subConditions = new Set([...currentConditions, condition]);
          }
          let [subPriority, subRules] = conditionalToRules(val, rulePriority, subConditions, subSkipConditions, fn);
          rules.push(...compileCondition(currentConditions, condition, priority, subRules));
          priority = Math.max(priority, subPriority);
        } else if (val && typeof val === 'object' && !Array.isArray(val)) {
          for (let key in val) {
            let [subPriority, subRules] = conditionalToRules(val[key], rulePriority, currentConditions, subSkipConditions, fn);
            rules.push(...compileCondition(currentConditions, `${condition} === ${JSON.stringify(key)}`, priority, subRules));
            priority = Math.max(priority, subPriority);
          }
        }
      }
      return [priority, rules];
    } else {
      // @ts-ignore - broken in non-strict?
      return fn(value, parentPriority, currentConditions, skipConditions);
    }
  }

  function compileCondition(conditions: Set<string>, condition: string, priority: number, rules: Rule[]): Rule[] {
    if (condition === 'default' || conditions.has(condition)) {
      return [{prelude: '', condition: '', layer: '', body: rules}];
    }

    if (condition in theme.conditions || /^[@:]/.test(condition)) {
      // Conditions starting with : are CSS pseudo classes. Nest them inside the parent rule.
      let prelude = theme.conditions[condition] || condition;
      if (prelude.startsWith(':')) {
        return [{
          prelude: '',
          layer: generateName(priority, true),
          body: rules.map(rule => nestRule(rule, prelude)),
          condition: ''
        }];
      }

      // Otherwise, wrap the rule in the condition (e.g. @media).
      return [{
        // Top level layer is based on the priority of the rule, not the condition.
        // Also group in a sub-layer based on the condition so that lightningcss can more effectively deduplicate rules.
        layer: `${generateName(priority, true)}.${themeConditionMap.get(condition) || generateArbitraryValueSelector(condition, true)}`,
        prelude,
        body: rules,
        condition: ''
      }];
    }

    hasConditions = true;
    return [{prelude: '', layer: '', condition, body: rules}];
  }

  function compileRule(property: string, themeProperty: string, value: Value, priority: number, conditions: Set<string>, skipConditions: Set<string>): [number, Rule[]] {
    // Generate selector. This consists of three parts:
    // 1. Property. For custom properties we use a hash. For theme properties, we use the index within the theme.
    // 2. Conditions. This uses the index within the theme.
    // 3. Value. The index in the theme, or a hash for arbitrary values.
    let prelude = '.';
    if (property.startsWith('--')) {
      // Include both custom property name and theme property in case the same var is reused between multiple theme properties.
      prelude += generateArbitraryValueSelector(property, true) + '_' + themePropertyMap.get(themeProperty) + '-';
    } else {
      prelude += themePropertyMap.get(themeProperty);
    }

    let propertyFunction = propertyFunctions.get(themeProperty);
    if (propertyFunction) {
      // Expand value to conditional CSS values, and then to rules.
      let res = propertyFunction(value, property);
      return conditionalToRules(res, priority, conditions, skipConditions, (value, priority, conditions) => {
        let [obj, p] = value;
        let body = '';
        for (let key in obj) {
          let k = key as any;
          let value = obj[k];
          if (value === undefined) {
            continue;
          }
          if (typeof value === 'string') {
            // Replace self() references with variables and track the dependencies.
            value = value.replace(/self\(([a-zA-Z]+)/g, (_, v) => {
              dependencies.add(v);
              return `var(--${themePropertyMap.get(v)}`;
            });
          }
          body += `${kebab(key)}: ${value};`;
        }

        let selector = prelude;
        if (conditions.size > 0) {
          for (let condition of conditions) {
            selector += themeConditionMap.get(condition) || generateArbitraryValueSelector(condition);
          }
        }

        let rules: Rule[] = [{
          condition: '',
          layer: '',
          prelude: selector + p,
          body
        }];

        return [0, rules];
      });
    } else {
      throw new Error('Unknown property ' + themeProperty);
    }
  }
}

function nestRule(rule: Rule, prelude: string): Rule {
  if (Array.isArray(rule.body)) {
    return {
      prelude: rule.prelude,
      layer: rule.layer,
      body: rule.body.map(r => nestRule(r, prelude)),
      condition: rule.condition
    };
  } else {
    return {
      prelude: rule.prelude,
      layer: rule.layer,
      body: [{...rule, prelude: '&' + prelude}],
      condition: ''
    };
  }
}

function kebab(property: string) {
  if (property.startsWith('--')) {
    return property;
  }
  return property.replace(/([a-z])([A-Z])/g, (_, a, b) => `${a}-${b.toLowerCase()}`);
}

interface Rule {
  prelude: string,
  layer: string,
  condition: string,
  body: string | Rule[]
}

// Generate a class name from a number, e.g. index within the theme.
// This maps to an alphabet containing lower case letters, upper case letters, and numbers.
// For numbers larger than 62, an underscore is prepended.
// This encoding allows easy parsing to enable runtime merging by property.
function generateName(index: number, atStart = false): string {
  if (index < 26) {
    // lower case letters
    return String.fromCharCode(index + 97);
  }

  if (index < 52) {
    // upper case letters
    return String.fromCharCode((index - 26) + 65);
  }

  if (index < 62 && !atStart) {
    // numbers
    return String.fromCharCode((index - 52) + 48);
  }

  return '_' + generateName(index - (atStart ? 52 : 62));
}

// For arbitrary values, we use a hash of the string to generate the class name.
function generateArbitraryValueSelector(v: string, atStart = false) {
  let c = hash(v).toString(36);
  if (atStart && /^[0-9]/.test(c)) {
    c = `_${c}`;
  }
  return `-${c}`;
}

// djb2 hash function.
// http://www.cse.yorku.ca/~oz/hash.html
function hash(v: string) {
  let hash = 5381;
  for (let i = 0; i < v.length; i++) {
    hash = ((hash << 5) + hash) + v.charCodeAt(i) >>> 0;
  }
  return hash;
}

function layerName(name: string) {
  // All of our layers should be sub-layers of a single parent layer, so that
  // the unsafe overrides layer always comes after.
  return `_.${name}`;
}

function printRule(rule: Rule, rulesByLayer: Map<string, string[]>, preludes: string[] = [], layer = 'a') {
  if (rule.prelude) {
    preludes.push(rule.prelude);
  }

  if (typeof rule.body === 'string') {
    // Nest rule in our stack of preludes (e.g. media queries/selectors).
    let content = '  ';
    preludes.forEach((p, i) => {
      content += `${p} {\n${' '.repeat((i + 2) * 2)}`;
    });
    content += rule.body + '\n';
    preludes.map((_, i) => {
      content += `${' '.repeat((preludes.length - i) * 2)}}\n`;
    });

    // Group rule into the appropriate layer.
    let rules = rulesByLayer.get(rule.layer || layer);
    if (!rules) {
      rules = [];
      rulesByLayer.set(rule.layer || layer, rules);
    }
    rules.push(content);
  } else {
    for (let b of rule.body) {
      printRule(b, rulesByLayer, preludes, rule.layer || layer);
    }
  }

  if (rule.prelude) {
    preludes.pop();
  }
}

function printJS(rules: Rule[], indent = ''): string {
  rules = rules.slice().reverse();

  let conditional = rules.filter(rule => rule.condition).map((rule, i) => {
    return `${i > 0 ? ' else ' : ''}if (props.${rule.condition}) {\n${indent}  ${printRuleChildren(rule, indent + '  ')}\n${indent}}`;
  });

  let elseCases = rules.filter(rule => !rule.condition).map(rule => printRuleChildren(rule, indent + '  '));

  if (conditional.length && elseCases.length) {
    return `${conditional.join('')} else {\n${indent}  ${elseCases.join('\n' + indent + '  ')}\n${indent}}`;
  }

  if (conditional.length) {
    return conditional.join('');
  }

  return elseCases.join('\n' + indent);
}

function printRuleChildren(rule: Rule, indent = '') {
  let res = '';
  if (rule.prelude.startsWith('.')) {
    res +=  `rules += ' ${rule.prelude.slice(1)}';`;
  }

  if (Array.isArray(rule.body)) {
    res += printJS(rule.body, indent);
  }

  return res;
}

function getStaticClassName(rules: Rule[]): string {
  return rules.map(rule => (rule.prelude.startsWith('.') ? ' ' + rule.prelude.slice(1) : '') + (Array.isArray(rule.body) ? getStaticClassName(rule.body) : '')).join('');
}

export function raw(this: MacroContext | void, css: string, layer = '_.a') {
  // Check if `this` is undefined, which means style was not called as a macro but as a normal function.
  // We also check if this is globalThis, which happens in non-strict mode bundles.
  // Also allow style to be called as a normal function in tests.
  // @ts-ignore
  // eslint-disable-next-line
  if ((this == null || this === globalThis) && process.env.NODE_ENV !== 'test') {
    throw new Error('The raw macro must be imported with {type: "macro"}.');
  }
  let className = generateArbitraryValueSelector(css, true);
  css = `@layer ${layer} {
  .${className} {
  ${css}
  }
}`;

  // Ensure layer is always declared after the _ layer used by style macro.
  if (!layer.startsWith('_.')) {
    css = `@layer _, ${layer};\n` + css;
  }

  if (this && typeof this.addAsset === 'function') {
    this.addAsset({
      type: 'css',
      content: css
    });
  }
  return className;
}

export function keyframes(this: MacroContext | void, css: string) {
  // Check if `this` is undefined, which means style was not called as a macro but as a normal function.
  // We also check if this is globalThis, which happens in non-strict mode bundles.
  // Also allow style to be called as a normal function in tests.
  // @ts-ignore
  // eslint-disable-next-line
  if ((this == null || this === globalThis) && process.env.NODE_ENV !== 'test') {
    throw new Error('The keyframes macro must be imported with {type: "macro"}.');
  }
  let name = generateArbitraryValueSelector(css, true);
  css = `@keyframes ${name} {
  ${css}
}`;
  if (this && typeof this.addAsset === 'function') {
    this.addAsset({
      type: 'css',
      content: css
    });
  }
  return name;
}

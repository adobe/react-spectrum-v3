const OFF = 0;
const WARN = 1;
const ERROR = 2;
let rulesDirPlugin = require('eslint-plugin-rulesdir');
rulesDirPlugin.RULES_DIR = './bin';

module.exports = {
  plugins: ['react', 'rulesdir', 'jsx-a11y', 'react-hooks', 'jest', 'monorepo', 'eslint-plugin-rsp-rules'],
  extends: ['eslint:recommended'],
  parser: 'babel-eslint',
  parserOptions: {
    ecmaFeatures: {
      'legacyDecorators': true
    },
    sourceType: 'module'
  },
  overrides: [{
    files: ['packages/**/*.ts', 'packages/**/*.tsx'],
    plugins: ['react', 'rulesdir', 'jsx-a11y', 'react-hooks', 'jest', '@typescript-eslint', 'monorepo', 'jsdoc'],
    parser: '@typescript-eslint/parser',
    parserOptions: {
      ecmaFeatures: {
        'jsx': true,
        'legacyDecorators': true
      },
      'useJSXTextNode': true,
      'project': './tsconfig.json',
      sourceType: 'module'
    },
    rules: {
      'jsdoc/require-description-complete-sentence': [ERROR, {abbreviations: ['e.g', 'etc']}],
      'jsdoc/check-alignment': ERROR,
      'jsdoc/check-indentation': ERROR,
      'jsdoc/check-tag-names': ERROR,
      // enable this rule to see literally everything missing jsdocs, this rule needs some refinement but is good as a sanity check.
      // 'jsdoc/require-jsdoc': [ERROR, {contexts:['TSInterfaceDeclaration TSPropertySignature', 'TSInterfaceDeclaration TSMethodSignature']}],
      'jsdoc/require-description': [ERROR, {exemptedBy: ['deprecated'], checkConstructors: false}],
      'no-redeclare': OFF,
      '@typescript-eslint/no-redeclare': ERROR,
      'no-unused-vars': OFF,
      '@typescript-eslint/no-unused-vars': ERROR,
      '@typescript-eslint/member-delimiter-style': [ERROR, {
        multiline: {
          delimiter: 'comma',
          requireLast: false
        },
        singleline: {
          delimiter: 'comma',
          requireLast: false
        }
      }]
    }
  }, {
    files: ['**/test/**', '**/stories/**', '**/docs/**', '**/chromatic/**'],
    rules: {
      'rsp-rules/act-events-test': ERROR,
      'rsp-rules/no-getByRole-toThrow': ERROR,
      'rulesdir/imports': OFF,
      'monorepo/no-internal-import': OFF,
      'jsdoc/require-jsdoc': OFF
    }
  }, {
    files: ['**/dev/**', '**/scripts/**'],
    rules: {
      'jsdoc/require-jsdoc': OFF,
      'jsdoc/require-description': OFF
    }
  }],
  env: {
    'browser': true,
    'node': true,
    'mocha': true,
    'es6': true,
    'jest': true
  },
  globals: {
    'importSpectrumCSS': 'readonly',
    'jest': true,
    'expect': true,
    'JSX': 'readonly',
    'NodeJS': 'readonly',
    'AsyncIterable': 'readonly'
  },
  settings: {
    jsdoc: {
      ignorePrivate: true,
      publicFunctionsOnly: true
    },
    react: {
      version: 'detect'
    }
  },
  rules: {
    'comma-dangle': ERROR,
    'indent': OFF,
    'indent-legacy': [ERROR, ERROR, {SwitchCase: 1}],
    'quotes': [ERROR, 'single', 'avoid-escape'],
    'linebreak-style': [ERROR, 'unix'],
    'semi': [ERROR, 'always'],
    'space-before-function-paren': [ERROR, {anonymous: 'always', named: 'never', asyncArrow: 'ignore'}],
    'keyword-spacing': [ERROR, {after: true}],
    'jsx-quotes': [ERROR, 'prefer-double'],
    'brace-style': [ERROR, '1tbs', {allowSingleLine: true}],
    'object-curly-spacing': [ERROR, 'never'],
    'curly': ERROR,
    'no-fallthrough': OFF,
    'comma-spacing': ERROR,
    'comma-style': [ERROR, 'last'],
    'no-irregular-whitespace': [ERROR],
    'eqeqeq': [ERROR, 'smart'],
    'no-spaced-func': ERROR,
    'array-bracket-spacing': [ERROR, 'never'],
    'key-spacing': [ERROR, {beforeColon: false, afterColon: true}],
    'no-console': OFF,
    'no-unused-vars': [ERROR, {args: 'none', vars: 'all', varsIgnorePattern: '[rR]eact'}],
    'space-in-parens': [ERROR, 'never'],
    'space-unary-ops': [ERROR, {words: true, nonwords: false}],
    'spaced-comment': [ERROR, 'always', {exceptions: ['*'], markers: ['/']}],
    'max-depth': [WARN, 4],
    'radix': [ERROR, 'always'],
    'react/jsx-uses-react': WARN,
    'eol-last': ERROR,
    'arrow-body-style': [ERROR, 'as-needed'],
    'arrow-spacing': ERROR,
    'space-before-blocks': [ERROR, 'always'],
    'space-infix-ops': ERROR,
    'no-new-wrappers': ERROR,
    'no-self-compare': ERROR,
    'no-nested-ternary': ERROR,
    'no-multiple-empty-lines': ERROR,
    'no-unneeded-ternary': ERROR,

    // Below are rules that are needed for linter functionality when using React
    'react/display-name': OFF,
    'react/jsx-curly-spacing': [ERROR, 'never'],
    'react/jsx-indent-props': [ERROR, 2],
    'react/jsx-no-duplicate-props': ERROR,
    'react/jsx-no-literals': OFF,
    'react/jsx-no-undef': ERROR,
    'react/jsx-quotes': OFF,
    'react/jsx-sort-prop-types': OFF,
    'react/jsx-sort-props': OFF,
    'react/jsx-uses-vars': ERROR,
    'react/no-danger': OFF,
    'react/no-did-mount-set-state': OFF,
    'react/no-did-update-set-state': ERROR,
    'react/no-multi-comp': OFF,
    'react/no-set-state': OFF,
    'react/no-unknown-property': ERROR,
    'react/react-in-jsx-scope': ERROR,
    'react/require-extension': OFF,
    'react/jsx-equals-spacing': ERROR,
    'react/jsx-max-props-per-line': [ERROR, {when: 'multiline'}],
    'react/jsx-closing-bracket-location': [ERROR, 'after-props'],
    'react/jsx-tag-spacing': ERROR,
    'react/jsx-indent': [ERROR, 2],
    'react/jsx-wrap-multilines': ERROR,
    'react/jsx-boolean-value': ERROR,
    'react/jsx-first-prop-new-line': [ERROR, 'multiline'],
    'react/self-closing-comp': ERROR,

    // hooks
    'react-hooks/rules-of-hooks': ERROR,
    'react-hooks/exhaustive-deps': WARN,

    // custom rules
    'rulesdir/sort-imports': [ERROR],
    'rulesdir/imports': [ERROR],

    // jsx-a11y rules
    'jsx-a11y/accessible-emoji': ERROR,
    'jsx-a11y/alt-text': ERROR,
    'jsx-a11y/anchor-has-content': ERROR,
    'jsx-a11y/anchor-is-valid': ERROR,
    'jsx-a11y/aria-activedescendant-has-tabindex': ERROR,
    'jsx-a11y/aria-props': ERROR,
    'jsx-a11y/aria-proptypes': ERROR,
    'jsx-a11y/aria-role': ERROR,
    'jsx-a11y/aria-unsupported-elements': ERROR,
    'jsx-a11y/click-events-have-key-events': ERROR,
    'jsx-a11y/heading-has-content': ERROR,
    'jsx-a11y/html-has-lang': ERROR,
    'jsx-a11y/iframe-has-title': ERROR,
    'jsx-a11y/img-redundant-alt': ERROR,
    'jsx-a11y/interactive-supports-focus': [
      ERROR,
      {
        tabbable: [
          'button',
          'checkbox',
          'link',
          'searchbox',
          'spinbutton',
          'switch',
          'textbox'
        ]
      }
    ],
    'jsx-a11y/label-has-associated-control': [
      ERROR,
      {
        'assert': 'either',
        'depth': 3
      }
    ],
    'jsx-a11y/media-has-caption': ERROR,
    'jsx-a11y/mouse-events-have-key-events': ERROR,
    'jsx-a11y/no-access-key': ERROR,
    'jsx-a11y/no-distracting-elements': ERROR,
    'jsx-a11y/no-interactive-element-to-noninteractive-role': ERROR,
    'jsx-a11y/no-noninteractive-element-interactions': [
      WARN,
      {
        handlers: [
          'onClick',
          'onMouseDown',
          'onMouseUp',
          'onKeyPress',
          'onKeyDown',
          'onKeyUp'
        ]
      }
    ],
    'jsx-a11y/no-noninteractive-element-to-interactive-role': [
      ERROR,
      {
        ul: [
          'listbox',
          'menu',
          'menubar',
          'radiogroup',
          'tablist',
          'tree',
          'treegrid'
        ],
        ol: [
          'listbox',
          'menu',
          'menubar',
          'radiogroup',
          'tablist',
          'tree',
          'treegrid'
        ],
        li: ['menuitem', 'option', 'row', 'tab', 'treeitem'],
        table: ['grid'],
        td: ['gridcell', 'columnheader', 'rowheader'],
        th: ['columnheader', 'rowheader']
      }
    ],
    'jsx-a11y/no-noninteractive-tabindex': [
      ERROR,
      {
        tags: [],
        roles: ['alertdialog', 'dialog', 'tabpanel']
      }
    ],
    'jsx-a11y/no-redundant-roles': ERROR,
    'jsx-a11y/no-static-element-interactions': [
      ERROR,
      {
        handlers: [
          'onClick',
          'onMouseDown',
          'onMouseUp',
          'onKeyPress',
          'onKeyDown',
          'onKeyUp'
        ]
      }
    ],
    'jsx-a11y/role-has-required-aria-props': ERROR,
    'jsx-a11y/role-supports-aria-props': ERROR,
    'jsx-a11y/scope': ERROR,
    'jsx-a11y/tabindex-no-positive': ERROR,

    // importing rules
    'monorepo/no-internal-import': [
      ERROR,
      {
        ignore: [
          '@adobe/spectrum-css-temp',
          '@react/react-spectrum',
          '@spectrum-icons/ui',
          '@spectrum-icons/workflow',
          '@spectrum-icons/illustrations'
        ]
      }
    ],
    'monorepo/no-relative-import': ERROR
  }
};

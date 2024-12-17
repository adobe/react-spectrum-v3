import react from "eslint-plugin-react";
import rulesdir from "eslint-plugin-rulesdir";
import jsxA11Y from "eslint-plugin-jsx-a11y";
import reactHooks from "eslint-plugin-react-hooks";
import jest from "eslint-plugin-jest";
import monorepo from "@jdb8/eslint-plugin-monorepo";
import * as rspRules from "eslint-plugin-rsp-rules";
import { fixupPluginRules } from "@eslint/compat";
import globals from "globals";
import babelParser from "@babel/eslint-parser";
import typescriptEslint from "@typescript-eslint/eslint-plugin";
import jsdoc from "eslint-plugin-jsdoc";
import tseslint from 'typescript-eslint';
import path from "node:path";
import { fileURLToPath } from "node:url";
import js from "@eslint/js";
import { FlatCompat } from "@eslint/eslintrc";
import stylistic from "@stylistic/eslint-plugin-ts";
import reactCompiler from "eslint-plugin-react-compiler";
console.log('reactCompiler', reactCompiler);

import rulesDirPlugin from "eslint-plugin-rulesdir";
rulesDirPlugin.RULES_DIR = './bin';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all
});

const OFF = 0;
const WARN = 1;
const ERROR = 2;

export default [{
    ignores: [
        "packages/@react-aria/i18n/server",
        "packages/@spectrum-icons/color/**/*",
        "packages/@spectrum-icons/ui/**/*",
        "packages/@spectrum-icons/workflow/**/*",
        "packages/@spectrum-icons/illustrations/**/*",
        "packages/@spectrum-icons/express/**/*",
        "**/node_modules",
        "packages/*/*/dist",
        "packages/*/*/i18n",
        "packages/react-aria/dist",
        "packages/react-aria/i18n",
        "packages/react-aria-components/dist",
        "packages/react-aria-components/i18n",
        "packages/react-stately/dist",
        "packages/dev/storybook-builder-parcel/preview.js",
        "packages/dev/optimize-locales-plugin/LocalesPlugin.d.ts",
        "examples/**/*",
        "starters/**/*",
        "packages/@react-spectrum/s2/icon.d.ts",
        "packages/@react-spectrum/s2/spectrum-illustrations"
    ],
}, ...compat.extends("eslint:recommended"), {
    plugins: {
        react,
        rulesdir,
        "jsx-a11y": jsxA11Y,
        "react-hooks": fixupPluginRules(reactHooks),
        jest,
        monorepo,
        "rsp-rules": rspRules,
        "react-compiler": reactCompiler
    },

    languageOptions: {
        globals: {
            ...globals.browser,
            ...globals.node,
            ...globals.mocha,
            ...globals.jest,
            importSpectrumCSS: "readonly",
            jest: true,
            expect: true,
            JSX: "readonly",
            NodeJS: "readonly",
            AsyncIterable: "readonly",
            FileSystemFileEntry: "readonly",
            FileSystemDirectoryEntry: "readonly",
            FileSystemEntry: "readonly",
            IS_REACT_ACT_ENVIRONMENT: "readonly",
        },

        parser: babelParser,
        ecmaVersion: 6,
        sourceType: "module",

        parserOptions: {
            ecmaFeatures: {
                legacyDecorators: true,
            },
        },
    },

    settings: {
        jsdoc: {
            ignorePrivate: true,
            publicFunctionsOnly: true,
        },

        react: {
            version: "detect",
        },
    },

    rules: {
        "comma-dangle": ERROR,
        indent: OFF,

        "indent-legacy": [ERROR, ERROR, {
            SwitchCase: WARN,
        }],

        quotes: [ERROR, "single", "avoid-escape"],
        "linebreak-style": [ERROR, "unix"],
        semi: [ERROR, "always"],

        "space-before-function-paren": [ERROR, {
            anonymous: "always",
            named: "never",
            asyncArrow: "ignore",
        }],

        "keyword-spacing": [ERROR, {
            after: true,
        }],

        "jsx-quotes": [ERROR, "prefer-double"],

        "brace-style": [ERROR, "1tbs", {
            allowSingleLine: true,
        }],

        "object-curly-spacing": [ERROR, "never"],
        curly: ERROR,
        "no-fallthrough": OFF,
        "comma-spacing": ERROR,
        "comma-style": [ERROR, "last"],
        "no-irregular-whitespace": [ERROR],
        eqeqeq: [ERROR, "smart"],
        "no-spaced-func": ERROR,
        "array-bracket-spacing": [ERROR, "never"],

        "key-spacing": [ERROR, {
            beforeColon: false,
            afterColon: true,
        }],

        "no-console": OFF,

        "no-unused-vars": [ERROR, {
            args: "none",
            vars: "all",
            varsIgnorePattern: "[rR]eact",
        }],
        "no-unused-private-class-members": OFF,

        "space-in-parens": [ERROR, "never"],

        "space-unary-ops": [ERROR, {
            words: true,
            nonwords: false,
        }],

        "spaced-comment": [ERROR, "always", {
            exceptions: ["*", "#__PURE__"],
            markers: ["/"],
        }],

        "max-depth": [WARN, 4],
        radix: [ERROR, "always"],
        "react/jsx-uses-react": WARN,
        "eol-last": ERROR,
        "arrow-spacing": ERROR,
        "space-before-blocks": [ERROR, "always"],
        "space-infix-ops": ERROR,
        "no-new-wrappers": ERROR,
        "no-self-compare": ERROR,
        "no-nested-ternary": ERROR,
        "no-multiple-empty-lines": ERROR,
        "no-unneeded-ternary": ERROR,
        "no-duplicate-imports": ERROR,
        "react-compiler/react-compiler": "error",
        "react/display-name": OFF,
        "react/jsx-curly-spacing": [ERROR, "never"],
        "react/jsx-indent-props": [ERROR, ERROR],
        "react/jsx-no-duplicate-props": ERROR,
        "react/jsx-no-literals": OFF,
        "react/jsx-no-undef": ERROR,
        "react/jsx-quotes": OFF,
        "react/jsx-sort-prop-types": OFF,
        "react/jsx-sort-props": OFF,
        "react/jsx-uses-vars": ERROR,
        "react/no-danger": OFF,
        "react/no-did-mount-set-state": OFF,
        "react/no-did-update-set-state": ERROR,
        "react/no-multi-comp": OFF,
        "react/no-set-state": OFF,

        "react/no-unknown-property": [ERROR, {
            ignore: ["prefix"],
        }],

        "react/react-in-jsx-scope": ERROR,
        "react/require-extension": OFF,
        "react/jsx-equals-spacing": ERROR,

        "react/jsx-max-props-per-line": [ERROR, {
            when: "multiline",
        }],

        "react/jsx-closing-bracket-location": [ERROR, "after-props"],
        "react/jsx-tag-spacing": ERROR,
        "react/jsx-indent": [ERROR, ERROR],
        "react/jsx-wrap-multilines": ERROR,
        "react/jsx-boolean-value": ERROR,
        "react/jsx-first-prop-new-line": [ERROR, "multiline"],
        "react/self-closing-comp": ERROR,
        "react-hooks/rules-of-hooks": ERROR, // https://github.com/facebook/react/blob/main/packages/eslint-plugin-react-hooks/CHANGELOG.md
        "react-hooks/exhaustive-deps": WARN,
        "rsp-rules/no-react-key": [ERROR],
        "rsp-rules/sort-imports": [ERROR],
        "rulesdir/imports": [ERROR],
        "rulesdir/useLayoutEffectRule": [ERROR],
        "jsx-a11y/accessible-emoji": ERROR,
        "jsx-a11y/alt-text": ERROR,
        "jsx-a11y/anchor-has-content": ERROR,
        "jsx-a11y/anchor-is-valid": ERROR,
        "jsx-a11y/aria-activedescendant-has-tabindex": ERROR,
        "jsx-a11y/aria-props": ERROR,
        "jsx-a11y/aria-proptypes": ERROR,
        "jsx-a11y/aria-role": ERROR,
        "jsx-a11y/aria-unsupported-elements": ERROR,
        "jsx-a11y/click-events-have-key-events": ERROR,
        "jsx-a11y/heading-has-content": ERROR,
        "jsx-a11y/html-has-lang": ERROR,
        "jsx-a11y/iframe-has-title": ERROR,
        "jsx-a11y/img-redundant-alt": ERROR,

        "jsx-a11y/interactive-supports-focus": [ERROR, {
            tabbable: [
                "button",
                "checkbox",
                "link",
                "searchbox",
                "spinbutton",
                "switch",
                "textbox",
            ],
        }],

        "jsx-a11y/label-has-associated-control": [ERROR, {
            assert: "either",
            depth: 3,
        }],

        "jsx-a11y/media-has-caption": ERROR,
        "jsx-a11y/mouse-events-have-key-events": ERROR,
        "jsx-a11y/no-access-key": ERROR,
        "jsx-a11y/no-distracting-elements": ERROR,
        "jsx-a11y/no-interactive-element-to-noninteractive-role": ERROR,

        "jsx-a11y/no-noninteractive-element-interactions": [WARN, {
            handlers: [
                "onClick",
                "onMouseDown",
                "onMouseUp",
                "onKeyPress",
                "onKeyDown",
                "onKeyUp",
            ],
        }],

        "jsx-a11y/no-noninteractive-element-to-interactive-role": [ERROR, {
            ul: ["listbox", "menu", "menubar", "radiogroup", "tablist", "tree", "treegrid"],
            ol: ["listbox", "menu", "menubar", "radiogroup", "tablist", "tree", "treegrid"],
            li: ["menuitem", "option", "row", "tab", "treeitem"],
            table: ["grid"],
            td: ["gridcell", "columnheader", "rowheader"],
            th: ["columnheader", "rowheader"],
        }],

        "jsx-a11y/no-noninteractive-tabindex": [ERROR, {
            tags: [],
            roles: ["alertdialog", "dialog", "tabpanel"],
        }],

        "jsx-a11y/no-redundant-roles": ERROR,

        "jsx-a11y/no-static-element-interactions": [ERROR, {
            handlers: [
                "onClick",
                "onMouseDown",
                "onMouseUp",
                "onKeyPress",
                "onKeyDown",
                "onKeyUp",
            ],
        }],

        "jsx-a11y/role-has-required-aria-props": ERROR,
        "jsx-a11y/role-supports-aria-props": ERROR,
        "jsx-a11y/scope": ERROR,
        "jsx-a11y/tabindex-no-positive": ERROR,

        "monorepo/no-internal-import": [ERROR, {
            ignore: [
                "@adobe/spectrum-css-temp",
                "@spectrum-icons/ui",
                "@spectrum-icons/workflow",
                "@spectrum-icons/illustrations",
            ],
        }],

        "monorepo/no-relative-import": ERROR,
    },
}, {
    files: ["packages/**/*.ts", "packages/**/*.tsx"],

    plugins: {
        react,
        rulesdir,
        "jsx-a11y": jsxA11Y,
        "react-hooks": fixupPluginRules(reactHooks),
        jest,
        "@typescript-eslint": typescriptEslint,
        monorepo,
        jsdoc,
        "@stylistic": stylistic,
        "react-compiler": reactCompiler
    },

    languageOptions: {
        parser: tseslint.parser,
        ecmaVersion: 6,
        sourceType: "module",

        parserOptions: {
            ecmaFeatures: {
                jsx: true,
                legacyDecorators: true,
            },

            useJSXTextNode: true,
            project: "./tsconfig.json",
        },
    },

    rules: {
        "jsdoc/require-description-complete-sentence": [ERROR, {
            abbreviations: ["e.g", "i.e"],
        }],

        "jsdoc/check-alignment": ERROR,
        "jsdoc/check-indentation": ERROR,

        "jsdoc/check-tag-names": [ERROR, {
            definedTags: ["selector", "note"],
        }],

        "jsdoc/require-description": [ERROR, {
            exemptedBy: ["deprecated"],
            checkConstructors: false,
        }],

        "no-redeclare": OFF,
        "@typescript-eslint/no-redeclare": ERROR,
        "no-unused-vars": OFF,
        "@typescript-eslint/no-unused-vars": ERROR,

        "@stylistic/member-delimiter-style": [ERROR, {
            multiline: {
                delimiter: "comma",
                requireLast: false,
            },

            singleline: {
                delimiter: "comma",
                requireLast: false,
            },
        }],
    },
}, {
    files: [
        "**/test/**",
        "**/stories/**",
        "**/docs/**",
        "**/chromatic/**",
        "**/chromatic-fc/**",
        "**/__tests__/**",
    ],

    rules: {
        "rsp-rules/no-react-key": [ERROR],
        "rsp-rules/act-events-test": ERROR,
        "rsp-rules/no-getByRole-toThrow": ERROR,
        "rulesdir/imports": OFF,
        "monorepo/no-internal-import": OFF,
        "jsdoc/require-jsdoc": OFF,
    },

    languageOptions: {
        globals: {
            ...globals.browser,
            ...globals.node,
            ...globals.mocha,
            ...globals.jest,
            importSpectrumCSS: "readonly",
            jest: true,
            expect: true,
            JSX: "readonly",
            NodeJS: "readonly",
            AsyncIterable: "readonly",
            FileSystemFileEntry: "readonly",
            FileSystemDirectoryEntry: "readonly",
            FileSystemEntry: "readonly",
            IS_REACT_ACT_ENVIRONMENT: "readonly",
        },

        parser: tseslint.parser,
        ecmaVersion: 6,
        sourceType: "module",

        parserOptions: {
            // eventually move to projectService for faster linting
            ecmaFeatures: {
                legacyDecorators: true,
            },
        },
    },
}, {
    files: ["**/dev/**", "**/scripts/**"],

    rules: {
        "jsdoc/require-jsdoc": OFF,
        "jsdoc/require-description": OFF,
    },
}, {
    files: [
        "packages/@react-aria/focus/src/**/*.ts",
        "packages/@react-aria/focus/src/**/*.tsx",
    ],

    rules: {
        "no-restricted-globals": [ERROR, {
            name: "window",
            message: "Use getOwnerWindow from @react-aria/utils instead.",
        }, {
            name: "document",
            message: "Use getOwnerDocument from @react-aria/utils instead.",
        }],
    },
}, {
    files: [
        "packages/@react-aria/interactions/src/**/*.ts",
        "packages/@react-aria/interactions/src/**/*.tsx",
    ],

    rules: {
        "no-restricted-globals": [WARN, {
            name: "window",
            message: "Use getOwnerWindow from @react-aria/utils instead.",
        }, {
            name: "document",
            message: "Use getOwnerDocument from @react-aria/utils instead.",
        }],
    },
}, {
    files: ["packages/@react-spectrum/s2/**"],

    rules: {
        "react/react-in-jsx-scope": OFF,
    },
}];
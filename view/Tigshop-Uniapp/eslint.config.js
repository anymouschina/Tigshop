import js from "@eslint/js";
import tseslint from "typescript-eslint";
import pluginVue from "eslint-plugin-vue";
import prettier from "eslint-config-prettier";
import pluginPrettier from "eslint-plugin-prettier";
import globals from "globals";

export default [
    // 基础配置
    js.configs.recommended,

    // TypeScript 配置
    ...tseslint.configs.recommended,

    // Vue 配置
    ...pluginVue.configs["flat/recommended"],

    // Prettier 集成
    prettier,

    {
        languageOptions: {
            globals: {
                ...globals.browser,
                ...globals.node,
                // uni-app 全局变量和 API
                uni: "readonly",
                plus: "readonly",
                wx: "readonly",
                getCurrentPages: "readonly",
                getApp: "readonly",
                getOpenerEventChannel: "readonly",
                __wxConfig: "readonly",

                // uni-app 可能作为函数的情况
                uniCloud: "readonly",
                requirePlugin: "readonly",

                // 微信小程序全局变量
                App: "readonly",
                Page: "readonly",
                Component: "readonly",
                Behavior: "readonly",
                getRegExp: "readonly",

                // 其他可能的全局变量
                my: "readonly", // 支付宝小程序
                swan: "readonly", // 百度小程序
                tt: "readonly", // 字节跳动小程序
                qq: "readonly", // QQ 小程序
                jd: "readonly" // 京东小程序
            },
            ecmaVersion: "latest",
            sourceType: "module",
            parserOptions: {
                parser: tseslint.parser
            }
        },
        plugins: {
            prettier: pluginPrettier
        },
        rules: {
            "prettier/prettier": [
                "error",
                {},
                {
                    usePrettierrc: true,
                    fileInfoOptions: {
                        withNodeModules: true
                    }
                }
            ],
            "@typescript-eslint/no-explicit-any": "off",
            "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
            "vue/multi-word-component-names": "off",
            "vue/no-unused-vars": "warn",
            "vue/html-self-closing": [
                "error",
                {
                    html: {
                        void: "always",
                        normal: "always",
                        component: "always"
                    },
                    svg: "always",
                    math: "always"
                }
            ]
        }
    },

    // 忽略配置
    {
        ignores: ["node_modules/", "dist/", "unpackage/", "*.min.js", ".vscode/", ".idea/", "harmony-configs/", "coverage/"]
    },

    // Vue 文件特定配置
    {
        files: ["**/*.vue"],
        languageOptions: {
            parserOptions: {
                parser: tseslint.parser,
                extraFileExtensions: [".vue"]
            }
        }
    },

    // TypeScript 文件特定配置
    {
        files: ["**/*.ts", "**/*.tsx"],
        languageOptions: {
            parser: tseslint.parser
        }
    }
];

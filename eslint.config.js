import js from "@eslint/js";

export default [
	{
		// output/: generated data (search databases, logs)
		ignores: ["output/**"],
	},
	js.configs.recommended,
	{
		languageOptions: {
			ecmaVersion: "latest",
			sourceType: "module",
			globals: {
				console: "readonly",
				process: "readonly",
				performance: "readonly",
				structuredClone: "readonly",
			},
		},
		rules: {
			"no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
		},
	},
];

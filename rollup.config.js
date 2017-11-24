import ts from "rollup-plugin-typescript2";

const pkg = require("./package.json");

export default {
	input: "./src/rollup-plugin-screeps.ts",
  output: {
    file: pkg.main,
    format: 'cjs'
  },
	plugins: [
		ts()
	],
  external: [ "screeps-api", "git-rev-sync", "fs" ]
};

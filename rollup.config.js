import del from "rollup-plugin-delete";
import ts from "rollup-plugin-typescript2";
import commonjs from '@rollup/plugin-commonjs';

const pkg = require("./package.json");

export default {
	input: "./src/index.ts",
  output: [
    {
      file: pkg.main,
      format: 'cjs'
    },
    {
      file: pkg.module,
      format: 'es'
    }
  ],
	plugins: [
    del({"targets":["dist/"]}),
    commonjs(),
		ts()
	],
  external: [ "screeps-api", "git-rev-sync", "fs", "path" ]
};

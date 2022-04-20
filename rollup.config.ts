import del from "rollup-plugin-delete";
import typescript from '@rollup/plugin-typescript';
import pkg from "./package.json";

export default {
  input: "./src/index.ts",
  output: [
    {
      file: pkg.main,
      format: 'cjs',
      sourcemap: false
    },
    {
      file: pkg.module,
      format: 'es',
      sourcemap: false
    }
  ],
  plugins: [
    del({ "targets": ["dist/"] }),
    typescript({
      tsconfig: './tsconfig.json'
    })
  ],
  external: ["screeps-api", "git-rev-sync", "fs", "path"]
};

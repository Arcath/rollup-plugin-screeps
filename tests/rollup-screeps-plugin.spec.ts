/* eslint-disable @typescript-eslint/no-unused-vars */
import * as rollup from 'rollup';
import typescript from '@rollup/plugin-typescript';
import { expect } from 'chai';
import { describe, it } from 'mocha';
import fs from 'fs';
import path from 'path';
import git from 'git-rev-sync';
import del from "rollup-plugin-delete";
import copy from "rollup-plugin-copy";
//import commonjs from '@rollup/plugin-commonjs';


import * as screeps from '../src/rollup-plugin-screeps';


describe('Rollup Screeps Plugin', function () {
  it('should support tokens for screeps.com and email/password for any other server', () => {
    let config: Partial<screeps.ScreepsConfig> = {
      token: "foo",
      branch: "auto",
      protocol: 'https',
      hostname: "screeps.com",
      port: 443,
      path: "/"
    }

    expect(screeps.validateConfig(config)).to.equal(true)

    config = {
      "email": "you@domain.tld",
      "password": "foo",
      "branch": "auto",
      "protocol": "https",
      "hostname": "screeps.com",
      "port": 443,
      "path": "/"
    }

    expect(screeps.validateConfig(config)).to.equal(false)

    config = {
      "token": "foo",
      "branch": "auto",
      "protocol": "https",
      "hostname": "myscreeps.com",
      "port": 443,
      "path": "/"
    }

    expect(screeps.validateConfig(config)).to.equal(true)

    config = {
      "email": "you@domain.tld",
      "password": "foo",
      "branch": "auto",
      "protocol": "https",
      "hostname": "myscreeps.com",
      "port": 443,
      "path": "/"
    }

    expect(screeps.validateConfig(config)).to.equal(true)
  })

  it('should generate source maps', async function () {
    const options = {
      input: './tests/fixtures/main.ts',
      output: {
        file: './tests/dist/main.js',
        sourcemap: true,
        format: 'cjs'
      },
      plugins: [
        del({ "targets": ["./tests/dist"] }),
        //commonjs(),
        typescript({ tsconfig: './tests/tsconfig.json' }),
        screeps.screeps({ dryRun: true })
      ]
    }

    const bundle = await rollup.rollup(options as rollup.RollupOptions);
    const output = (await bundle.write(options.output as rollup.OutputOptions)).output;

    output.forEach(item => {
      if (item.type !== undefined && item.type === "chunk" && item.map !== undefined) {
        expect(item.map.toString()).to.match(/^module.exports/)
      }
    });

    const basePath = path.join(__dirname, 'dist')
    const originalPath = path.join(basePath, 'main.js.map')
    const newPath = path.join(basePath, 'main.js.map.js')

    expect(fs.existsSync(originalPath)).to.equal(false)
    expect(fs.existsSync(newPath)).to.equal(true)

  })

  it('should generate branch name', async function () {
    const screepsOptions = {
      dryRun: true
    }

    const options = {
      input: './tests/fixtures/main.ts',
      output: {
        file: './tests/dist/main.js',
        sourcemap: true,
        format: 'cjs'
      },
      plugins: [
        del({ "targets": ["./tests/dist"] }),
        typescript({ tsconfig: './tests/tsconfig.json' }),
        //commonjs(),
        screeps.screeps(screepsOptions)
      ]
    }

    const bundle = await rollup.rollup(options as rollup.RollupOptions);
    const output = await bundle.write(options.output as rollup.OutputOptions);

    expect(screeps.getBranchName('auto')).to.equal(git.branch())
  })

  it('should use the branch name', async function () {
    const screepsOptions = {
      dryRun: true
    }

    const options = {
      input: './tests/fixtures/main.ts',
      output: {
        file: './tests/dist/main.js',
        sourcemap: true,
        format: 'cjs'
      },
      plugins: [
        del({ "targets": ["./tests/dist"] }),
        typescript({ tsconfig: './tests/tsconfig.json' }),
        //commonjs(),
        screeps.screeps(screepsOptions)
      ]
    }

    const bundle = await rollup.rollup(options as rollup.RollupOptions);
    const output = await bundle.write(options.output as rollup.OutputOptions);

    expect(screeps.getBranchName('ai')).to.equal('ai')
  })

  it('should create a list of files to upload', async function () {
    const screepsOptions = {
      dryRun: true
    }

    const options = {
      input: './tests/fixtures/main.ts',
      output: {
        file: './tests/dist/main.js',
        sourcemap: true,
        format: 'cjs'
      },
      plugins: [
        del({ "targets": ["./tests/dist"] }),
        typescript({ tsconfig: './tests/tsconfig.json' }),
        //commonjs(),
        copy({
          targets: [
            { src: "./tests/fixtures/*.wasm", dest: "./tests/dist" }
          ]
        }),
        screeps.screeps(screepsOptions)
      ]
    }

    const bundle = await rollup.rollup(options as rollup.RollupOptions);
    const output = await bundle.write(options.output as rollup.OutputOptions);

    const code = screeps.getFileList(options.output.file)

    expect(Object.keys(code).length).to.equal(3)
    expect(code.main).to.match(/input/)
    expect(code['main.js.map']).to.match(/^module.exports/)

  })

  it('should upload WASM files as binary modules', async function () {
    const screepsOptions = {
      dryRun: true
    }

    const options = {
      input: './tests/fixtures/main.ts',
      output: {
        file: './tests/dist/main.js',
        sourcemap: true,
        format: 'cjs'
      },
      plugins: [
        del({ "targets": ["./tests/dist"] }),
        typescript({ tsconfig: './tests/tsconfig.json' }),
        //commonjs(),
        copy({
          targets: [
            { src: "./tests/fixtures/*.wasm", dest: "./tests/dist" }
          ]
        }),
        screeps.screeps(screepsOptions)
      ]
    }

    const bundle = await rollup.rollup(options as rollup.RollupOptions);
    const output = await bundle.write(options.output as rollup.OutputOptions);

    const code = screeps.getFileList(options.output.file)

    expect(code['wasm_module.wasm']).to.be.an('object');
    expect((code['wasm_module.wasm'] as screeps.BinaryModule).binary).to.be.a('string')
    expect(code.main).to.be.a('string')
  })

  it('should get the config', function () {
    const config = screeps.loadConfigFile('./tests/fixtures/screeps.json')
    expect(config.branch).to.equal('foo')
  })
})

import * as rollup from 'rollup';
import typescript from "rollup-plugin-typescript2";
import { expect } from 'chai';
import { describe, it } from 'mocha';
import fs from 'fs';
import path from 'path';
import git from 'git-rev-sync';
import del from "rollup-plugin-delete";
import copy from "rollup-plugin-copy";
import commonjs from '@rollup/plugin-commonjs';


import * as screeps from '../src/rollup-plugin-screeps';


describe('Rollup Screeps Plugin', function () {
  var config: Partial<screeps.ScreepsConfig>;
  it('should support tokens for screeps.com and email/password for any other server', () => {
    var config: Partial<screeps.ScreepsConfig> = {
      token: "foo",
      branch: "auto",
      protocol: 'https',
      hostname: "screeps.com",
      port: 443,
      path: "/"
    }

    expect(screeps.validateConfig(config)).to.equal(true)

    var config: Partial<screeps.ScreepsConfig> = {
      "email": "you@domain.tld",
      "password": "foo",
      "branch": "auto",
      "protocol": "https",
      "hostname": "screeps.com",
      "port": 443,
      "path": "/"
    }

    expect(screeps.validateConfig(config)).to.equal(false)

    var config: Partial<screeps.ScreepsConfig> = {
      "token": "foo",
      "branch": "auto",
      "protocol": "https",
      "hostname": "myscreeps.com",
      "port": 443,
      "path": "/"
    }

    expect(screeps.validateConfig(config)).to.equal(true)

    var config: Partial<screeps.ScreepsConfig> = {
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
    var options = {
      input: './tests/fixtures/main.ts',
      output: {
        file: './tests/dist/main.js',
        sourcemap: true,
        format: 'cjs'
      },
      plugins: [
        del({ "targets": ["./tests/dist"] }),
        commonjs(),
        typescript({ tsconfig: './tests/tsconfig.json' }),
        screeps.screeps({ dryRun: true })
      ]
    }

    let bundle = await rollup.rollup(options as rollup.RollupOptions);
    let output = (await bundle.write(options.output as rollup.OutputOptions)).output;

    output.forEach(item => {
      if (item.type !== undefined && item.type === "chunk" && output.map !== undefined) {
        expect(output.map.toString(), output.map.toString()).to.match(/^module.exports/)
        console.log(output.map.toString())
      }
    });

    var basePath = path.join(__dirname, 'dist')
    var originalPath = path.join(basePath, 'main.js.map')
    var newPath = path.join(basePath, 'main.js.map.js')

    expect(fs.existsSync(originalPath)).to.equal(false)
    expect(fs.existsSync(newPath)).to.equal(true)

  })

  it('should generate branch name', async function () {
    var screepsOptions = {
      dryRun: true
    }

    var options = {
      input: './tests/fixtures/main.ts',
      output: {
        file: './tests/dist/main.js',
        sourcemap: true,
        format: 'cjs'
      },
      plugins: [
        del({ "targets": ["./tests/dist"] }),
        typescript({ tsconfig: './tests/tsconfig.json' }),
        commonjs(),
        screeps.screeps(screepsOptions)
      ]
    }

    let bundle = await rollup.rollup(options as rollup.RollupOptions);
    let output = await bundle.write(options.output as rollup.OutputOptions);

    expect(screeps.getBranchName('auto')).to.equal(git.branch())
  })

  it('should use the branch name', async function () {
    var screepsOptions = {
      dryRun: true
    }

    var options = {
      input: './tests/fixtures/main.ts',
      output: {
        file: './tests/dist/main.js',
        sourcemap: true,
        format: 'cjs'
      },
      plugins: [
        del({ "targets": ["./tests/dist"] }),
        typescript({ tsconfig: './tests/tsconfig.json' }),
        commonjs(),
        screeps.screeps(screepsOptions)
      ]
    }

    let bundle = await rollup.rollup(options as rollup.RollupOptions);
    let output = await bundle.write(options.output as rollup.OutputOptions);

    expect(screeps.getBranchName('ai')).to.equal('ai')
  })

  it('should create a list of files to upload', async function () {
    var screepsOptions = {
      dryRun: true
    }

    var options = {
      input: './tests/fixtures/main.ts',
      output: {
        file: './tests/dist/main.js',
        sourcemap: true,
        format: 'cjs'
      },
      plugins: [
        del({ "targets": ["./tests/dist"] }),
        typescript({ tsconfig: './tests/tsconfig.json' }),
        commonjs(),
        copy({
          targets: [
            { src: "./tests/fixtures/*.wasm", dest: "./tests/dist" }
          ]
        }),
        screeps.screeps(screepsOptions)
      ]
    }

    let bundle = await rollup.rollup(options as rollup.RollupOptions);
    let output = await bundle.write(options.output as rollup.OutputOptions);

    var code = screeps.getFileList(options.output.file)

    expect(Object.keys(code).length).to.equal(3)
    expect(code.main).to.match(/input/)
    expect(code['main.js.map']).to.match(/^module.exports/)

  })

  it('should upload WASM files as binary modules', async function () {
    var screepsOptions = {
      dryRun: true
    }

    var options = {
      input: './tests/fixtures/main.ts',
      output: {
        file: './tests/dist/main.js',
        sourcemap: true,
        format: 'cjs'
      },
      plugins: [
        del({ "targets": ["./tests/dist"] }),
        typescript({ tsconfig: './tests/tsconfig.json' }),
        commonjs(),
        copy({
          targets: [
            { src: "./tests/fixtures/*.wasm", dest: "./tests/dist" }
          ]
        }),
        screeps.screeps(screepsOptions)
      ]
    }

    let bundle = await rollup.rollup(options as rollup.RollupOptions);
    let output = await bundle.write(options.output as rollup.OutputOptions);

    var code = screeps.getFileList(options.output.file)

    expect(code['wasm_module.wasm']).to.be.an('object');
    expect((code['wasm_module.wasm'] as screeps.BinaryModule).binary).to.be.a('string')
    expect(code.main).to.be.a('string')
  })

  it('should get the config', function () {
    var config = screeps.loadConfigFile('./tests/fixtures/screeps.json')
    expect(config.branch).to.equal('foo')
  })
})

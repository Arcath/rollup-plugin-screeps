const rollup = require('rollup')
const typescript = require("rollup-plugin-typescript2")
const expect = require('chai').expect
const fs = require('fs')
const path = require('path')
const git = require('git-rev-sync')
const clear = require("rollup-plugin-clear");

const screeps = require('../src/rollup-plugin-screeps')


describe('Rollup Screeps Plugin', function(){
  it('should support tokens for screeps.com and email/password for any other server', () => {
    var config = {
      "token": "foo",
      "branch": "auto",
      "protocol": "https",
      "hostname": "screeps.com",
      "port": 443,
      "path": "/"
    }

    expect(screeps.validateConfig(config)).to.equal(true)

    var config = {
      "email": "you@domain.tld",
      "password": "foo",
      "branch": "auto",
      "protocol": "https",
      "hostname": "screeps.com",
      "port": 443,
      "path": "/"
    }

    expect(screeps.validateConfig(config)).to.equal(false)

    var config = {
      "token": "foo",
      "branch": "auto",
      "protocol": "https",
      "hostname": "myscreeps.com",
      "port": 443,
      "path": "/"
    }

    expect(screeps.validateConfig(config)).to.equal(true)

    var config = {
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

  it('should generate source maps', async function(){
    var options = {
      input: './tests/fixtures/main.ts',
      output: {
        file: './tests/dist/main.js',
        sourcemap: true,
        format: 'cjs'
      },
      plugins: [
        clear({"targets": ["./tests/dist"]}),
        typescript({tsconfig: './tests/tsconfig.json'}),
        screeps.screeps({dryRun: true})
      ]
    }

    let bundle = await rollup.rollup(options);
    let output = await bundle.write(options.output);
    
    // Iterate through bundle and test if type===chunk && map is defined
    let itemName;
    for (itemName in bundle) {
      let item = bundle[itemName];
      if (item.type === "chunk" && item.map) {

        expect(item.map.toString()).to.match(/^module.exports/)
      }
    }
    var basePath = path.join(__dirname, 'dist')
    var originalPath = path.join(basePath, 'main.js.map')
    var newPath = path.join(basePath, 'main.js.map.js')

    expect(fs.existsSync(originalPath)).to.equal(false)
    expect(fs.existsSync(newPath)).to.equal(true)

  })

  it('should generate branch name', async function(){
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
        clear({"targets": ["./tests/dist"]}),
        typescript({tsconfig: './tests/tsconfig.json'}),
        screeps.screeps(screepsOptions)
      ]
    }

    let bundle = await rollup.rollup(options);
    let output = await bundle.generate(options.output);

    expect(screeps.getBranchName('auto')).to.equal(git.branch())
  })

  it('should use the branch name', async function(){
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
        clear({"targets": ["./tests/dist"]}),
        typescript({tsconfig: './tests/tsconfig.json'}),
        screeps.screeps(screepsOptions)
      ]
    }

    let bundle = await rollup.rollup(options);
    let output = await bundle.generate(options.output);

    expect(screeps.getBranchName('ai')).to.equal('ai')
  })

  it('should create a list of files to upload', async function(){
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
        clear({"targets": ["./tests/dist"]}),
        typescript({tsconfig: './tests/tsconfig.json'}),
        screeps.screeps(screepsOptions)
      ]
    }

    let bundle = await rollup.rollup(options);
    let output = await bundle.write(options.output);
    
    var code = screeps.getFileList(options.output.file)

    expect(Object.keys(code).length).to.equal(2)
    expect(code.main).to.match(/input/)
    expect(code['main.js.map']).to.match(/^module.exports/)
 
  })

  it('should get the config', function(){
    var config = screeps.loadConfigFile('./tests/fixtures/screeps.json')
    expect(config.branch).to.equal('foo')
  })
})

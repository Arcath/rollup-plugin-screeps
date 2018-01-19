const rollup = require('rollup')
const typescript = require("rollup-plugin-typescript2")
const expect = require('chai').expect
const fs = require('fs')
const path = require('path')
const git = require('git-rev-sync')

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

  it('should generate source maps', function(done){
    var options = {
      input: './tests/fixtures/main.ts',
      output: {
        file: './tests/fixtures/dist/main.js',
        sourcemap: true,
        format: 'cjs'
      },
      plugins: [
        typescript({tsconfig: './tsconfig.json'}),
        screeps.screeps({dryRun: true})
      ]
    }

    rollup.rollup(options).then(function(bundle){
      bundle.generate(options).then(function(value){
        expect(value.map.toString()).to.match(/^module.exports/)
        bundle.write(options.output, value).then(function(val){
          var basePath = path.join(__dirname, 'fixtures', 'dist')
          var originalPath = path.join(basePath, 'main.js.map')
          var newPath = path.join(basePath, 'main.js.map.js')


          expect(fs.existsSync(originalPath)).to.equal(false)
          expect(fs.existsSync(newPath)).to.equal(true)

          done()
        }).catch(done)
      }).catch(done)
    })
  })

  it('should generate branch name', function(done){
    var screepsOptions = {
      dryRun: true
    }

    var options = {
      input: './tests/fixtures/main.ts',
      output: {
        file: './tests/fixtures/dist/main.js',
        sourcemap: true,
        format: 'cjs'
      },
      plugins: [
        typescript({tsconfig: './tsconfig.json'}),
        screeps.screeps(screepsOptions)
      ]
    }

    rollup.rollup(options).then(function(bundle){
      bundle.generate(options).then(function(value){
        expect(screeps.getBranchName('auto')).to.equal(git.branch())
        done()
      }).catch(done)
    })
  })

  it('should use the branch name', function(done){
    var screepsOptions = {
      dryRun: true
    }

    var options = {
      input: './tests/fixtures/main.ts',
      output: {
        file: './tests/fixtures/dist/main.js',
        sourcemap: true,
        format: 'cjs'
      },
      plugins: [
        typescript({tsconfig: './tsconfig.json'}),
        screeps.screeps(screepsOptions)
      ]
    }

    rollup.rollup(options).then(function(bundle){
      bundle.generate(options).then(function(value){
        expect(screeps.getBranchName('ai')).to.equal('ai')
        done()
      }).catch(done)
    })
  })

  it('should create a list of files to upload', function(done){
    var screepsOptions = {
      dryRun: true
    }

    var options = {
      input: './tests/fixtures/main.ts',
      output: {
        file: './tests/fixtures/dist/main.js',
        sourcemap: true,
        format: 'cjs'
      },
      plugins: [
        typescript({tsconfig: './tsconfig.json'}),
        screeps.screeps(screepsOptions)
      ]
    }

    rollup.rollup(options).then(function(bundle){
      bundle.generate(options).then(function(value){
        var code = screeps.getFileList(options.output.file)

        expect(Object.keys(code).length).to.equal(2)
        expect(code.main).to.match(/input/)
        expect(code['main.js.map']).to.match(/^module.exports/)

        done()
      }).catch(done)
    })
  })

  it('should get the config', function(){
    var config = screeps.loadConfigFile('./tests/fixtures/screeps.json')
    expect(config.branch).to.equal('foo')
  })
})

import { ScreepsAPI } from 'screeps-api'
import * as fs from 'fs'
import * as git from 'git-rev-sync'
import * as path from 'path'
import { BundleOptions, Bundle, Plugin, GenerateOptions, WriteOptions } from 'rollup';

export function generateSourceMaps(bundle: Bundle) {
  const b = bundle as Bundle & {map: { sourceContent: string }};

  let tmp = b.map.toString

  delete b.map.sourceContent

  b.map.toString = function () {
    return "module.exports = " + tmp.apply(this, arguments) + ";";
  }
}

export function writeSourceMaps(options: WriteOptions) {
  fs.renameSync(
    options.file + '.map',
    options.file + '.map.js'
  )
}

export function uploadSource(configFile: string, options: WriteOptions, bundle: Bundle) {
  if (!configFile) {
    console.log('screeps() needs the path of your config file e.g. screeps({configFile: \'./screeps.json\'})')
    return
  } else {
    let config = getConfig(configFile)
    let code = getFileList(options.file)
    let branch = getBranchName(config.branch)

    let api = new ScreepsAPI()

    api.setServer(config)
    api.auth().then(function () {
      api.raw.user.branches().then((data: any) => {
        let branches = data.list.map((b: any) => b.branch)

        if (branches.includes(branch)) {
          api.code.set(branch, code)
        } else {
          api.raw.user.cloneBranch('', branch, code)
        }
      })
    })
  }
}

export function getConfig(configFile: string) {
  let data = fs.readFileSync(configFile, 'utf8')
  return JSON.parse(data)
}

export function getFileList(outputFile: string) {
  let code: CodeList = {}
  let base = path.dirname(outputFile)
  let files = fs.readdirSync(base).filter((f) => path.extname(f) === '.js')
  files.map((file) => {
    code[file.replace(/\.js$/i, '')] = fs.readFileSync(path.join(base, file), 'utf8')
  })
  return code
}

export function getBranchName(branch: string) {
  if (branch === 'auto') {
    return git.branch()
  } else {
    return branch
  }
}

export function screeps(screepsOptions: ScreepsOptions = {}) {
  return {
    name: "screeps",

    ongenerate(options: GenerateOptions, bundle: Bundle) {
      if (options.sourcemap) generateSourceMaps(bundle);
    },

    onwrite(options: WriteOptions, bundle: Bundle) {
      if (options.sourcemap) writeSourceMaps(options);

      if (!screepsOptions.dryRun) uploadSource(screepsOptions.configFile!, options, bundle);
    }
  } as Plugin;
}

export default screeps;
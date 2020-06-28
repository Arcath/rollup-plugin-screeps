import { ScreepsAPI } from 'screeps-api'
import * as fs from 'fs'
import * as git from 'git-rev-sync'
import * as path from 'path'
import { Plugin, OutputOptions, SourceDescription, OutputBundle, PluginContext } from 'rollup';


export interface ScreepsConfig {
  token?: string
  email?: string
  password?: string
  protocol: "http" | "https",
  hostname: string,
  port: number,
  path: string,
  branch: string | "auto"
}

export interface ScreepsOptions{
  configFile?: string
  config?: ScreepsConfig
  dryRun?: boolean
}

export interface BinaryModule {
  binary: string
}

export interface CodeList{
  [key: string]: string | BinaryModule
}

export function generateSourceMaps(bundle: OutputBundle) {
  // Iterate through bundle and test if type===chunk && map is defined
  let itemName: string;
  for (itemName in bundle) {
    let item = bundle[itemName];
    if (item.type === "chunk" && item.map) {

      // Tweak maps
      let tmp = item.map.toString;
    
      delete item.map.sourcesContent;
    
      item.map.toString = function () {
        return "module.exports = " + tmp.apply(this, arguments as unknown as []) + ";";
       
    }
  }

  }

}

export function writeSourceMaps(options: OutputOptions) {
  fs.renameSync(
    options.file + '.map',
    options.file + '.map.js'
  )
}

export function validateConfig(cfg: Partial<ScreepsConfig>): cfg is ScreepsConfig {
  if(cfg.hostname && cfg.hostname === 'screeps.com'){
    return [
      typeof cfg.token === "string",
      cfg.protocol === "http" || cfg.protocol === "https",
      typeof cfg.hostname === "string",
      typeof cfg.port === "number",
      typeof cfg.path === "string",
      typeof cfg.branch === "string"
    ].reduce((a,b) => a && b)
  }

  return [
    (typeof cfg.email === 'string' && typeof cfg.password === 'string') || typeof cfg.token === 'string',
    cfg.protocol === "http" || cfg.protocol === "https",
    typeof cfg.hostname === "string",
    typeof cfg.port === "number",
    typeof cfg.path === "string",
    typeof cfg.branch === "string"
  ].reduce((a, b) => a && b)
}

export function loadConfigFile(configFile: string) {
  let data = fs.readFileSync(configFile, 'utf8')
  let cfg = JSON.parse(data) as Partial<ScreepsConfig>
  if (!validateConfig(cfg)) throw new TypeError("Invalid config")
  if(cfg.email && cfg.password && !cfg.token && cfg.hostname === 'screeps.com'){ console.log('Please change your email/password to a token') }  
  return cfg;
}

export function uploadSource(config: string | ScreepsConfig, options: OutputOptions, bundle: OutputBundle) {
  if (!config) {
    console.log('screeps() needs a config e.g. screeps({configFile: \'./screeps.json\'}) or screeps({config: { ... }})')
  } else {
    if (typeof config === "string") config = loadConfigFile(config)

    let code = getFileList(options.file!)
    let branch = getBranchName(config.branch)

    let api = new ScreepsAPI(config)

    if(!config.token){
      api.auth().then(() => {
        runUpload(api, branch!, code)
      })
    }else{
      runUpload(api, branch!, code)
    }
  }
}

export function runUpload(api: any, branch: string, code: CodeList){
  api.raw.user.branches().then((data: any) => {
    let branches = data.list.map((b: any) => b.branch)

    if (branches.includes(branch)) {
      api.code.set(branch, code)
    } else {
      api.raw.user.cloneBranch('', branch, code)
    }
  })
}

export function getFileList(outputFile: string) {
  let code: CodeList = {}
  let base = path.dirname(outputFile)
  let files = fs.readdirSync(base).filter((f) =>  path.extname(f) === '.js' || path.extname(f) === '.wasm' )
  files.map((file) => {
    if (file.endsWith('.js')) {
        code[file.replace(/\.js$/i, '')] = fs.readFileSync(path.join(base, file), 'utf8');
    } else {
        code[file] = {
            binary: fs.readFileSync(path.join(base, file)).toString('base64')
        }
    }
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

const ex = (x: any) => JSON.stringify(x, null, 2);

export function screeps(screepsOptions: ScreepsOptions = {}) {
  return {
    name: "screeps",

    generateBundle(options: OutputOptions, bundle: OutputBundle, isWrite: boolean) {
      if (options.sourcemap) generateSourceMaps(bundle);
    },

    writeBundle(options: OutputOptions, bundle: OutputBundle) {
      if (options.sourcemap) writeSourceMaps(options);

      if (!screepsOptions.dryRun) {
        uploadSource((screepsOptions.configFile || screepsOptions.config)!, options, bundle);
      }
    }
  } as Plugin;
}

export default screeps
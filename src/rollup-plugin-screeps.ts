import { ScreepsAPI } from 'screeps-api';
import { renameSync, readFileSync, readdirSync } from 'fs';
import * as git from 'git-rev-sync';
import { dirname, extname, join } from 'path';
import { Plugin, OutputOptions, OutputBundle } from 'rollup';


export interface ScreepsConfig {
  token?: string,
  email?: string,
  password?: string,
  protocol: string,
  hostname: string,
  port: number,
  path: string,
  branch: string
}

export interface ScreepsOptions {
  configFile?: string
  config?: ScreepsConfig
  dryRun?: boolean
}

export interface BinaryModule {
  binary: string
}

export interface CodeList {
  [key: string]: string | BinaryModule
}

export function generateSourceMaps(bundle: OutputBundle) {
  // Iterate through bundle and test if type===chunk && map is defined

  Object.keys(bundle).forEach(filename => {
    const item = bundle[filename];
    if (item.type === "chunk" && item.map) {

      // Tweak maps
      const tmp = item.map.toString;

      //delete item.map.sourcesContent;

      item.map.toString = function () {
        // eslint-disable-next-line prefer-rest-params
        return "module.exports = " + tmp.apply(this, arguments as unknown as []) + ";";

      }
    }
  });
}

export function writeSourceMaps(options: OutputOptions) {
  renameSync(
    options.file + '.map',
    options.file + '.map.js'
  )
}

export function validateConfig(cfg: Partial<ScreepsConfig>): cfg is ScreepsConfig {
  if (cfg.hostname && cfg.hostname === 'screeps.com') {
    return [
      typeof cfg.token === "string",
      cfg.protocol === "http" || cfg.protocol === "https",
      typeof cfg.hostname === "string",
      typeof cfg.port === "number",
      typeof cfg.path === "string",
      typeof cfg.branch === "string"
    ].reduce((a, b) => a && b)
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
  const data = readFileSync(configFile, 'utf8')
  const cfg = JSON.parse(data) as Partial<ScreepsConfig>
  if (!validateConfig(cfg)) throw new TypeError("Invalid config")
  if (cfg.email && cfg.password && !cfg.token && cfg.hostname === 'screeps.com') { console.log('Please change your email/password to a token') }
  return cfg;
}

export function uploadSource(config: string | ScreepsConfig, options: OutputOptions, bundle: OutputBundle) {
  if (!config) {
    console.log('screeps() needs a config e.g. screeps({configFile: \'./screeps.json\'}) or screeps({config: { ... }})')
  } else {
    if (typeof config === "string") config = loadConfigFile(config)

    const code = getFileList(options.file!)
    const branch = getBranchName(config.branch)

    const api = new ScreepsAPI(config)

    if (!config.token) {
      api.auth().then(() => {
        runUpload(api, branch!, code)
      })
    } else {
      runUpload(api, branch!, code)
    }
  }
}

export function runUpload(api: any, branch: string, code: CodeList) {
  api.raw.user.branches().then((data: any) => {
    const branches = data.list.map((b: any) => b.branch)

    if (branches.includes(branch)) {
      api.code.set(branch, code)
    } else {
      api.raw.user.cloneBranch('', branch, code)
    }
  })
}

export function getFileList(outputFile: string) {
  const code: CodeList = {}
  const base = dirname(outputFile)
  const files = readdirSync(base).filter((f) => extname(f) === '.js' || extname(f) === '.wasm')
  files.map((file) => {
    if (file.endsWith('.js')) {
      code[file.replace(/\.js$/i, '')] = readFileSync(join(base, file), 'utf8');
    } else {
      code[file] = {
        binary: readFileSync(join(base, file)).toString('base64')
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
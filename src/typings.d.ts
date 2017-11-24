declare module "screeps-api"{
    const ScreepsAPI: any
}

declare module "git-rev-sync"{
    function remoteUrl(): string | undefined
    function branch(): string | undefined
}

interface ScreepsOptions{
  configFile?: string
  dryRun?: boolean
}

interface CodeList{
  [key: string]: string
}

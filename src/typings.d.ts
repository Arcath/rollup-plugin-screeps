declare module "screeps-api"{
    const ScreepsAPI: any
}

declare module "git-rev-sync"{
    function remoteUrl(): string | undefined
    function branch(): string | undefined
}
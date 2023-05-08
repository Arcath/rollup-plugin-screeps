# Rollup Screeps Plugin

## Install

```
npm install --save-dev rollup-plugin-screeps
```

## Usage

In `rollup.config.js`

```js
import screeps from "rollup-plugin-screeps";

...

export default {
  ...
  sourcemap: true, // If set to true your source maps will be made screeps friendly and uploaded

  plugins: [
    ...
    screeps()
  ]
}
```

### Yaml Config File

rollup-plugin-screeps now uses the [screeps unified credentials file](https://github.com/screepers/screepers-standards/blob/master/SS3-Unified_Credentials_File.md), as used by [screeps-api](https://github.com/screepers/node-screeps-api).

Example `.screeps.yaml` config file:

```
servers:
  main:
    host: screeps.com
    secure: true
    token: '00000000-0a0a-0a00-000a-a0000a0000a0'
  private:
    host: 127.0.0.1
    port: 21025
    secure: false
    username: bob
    password: password123
```

Target server default to `main`, it can be selected with `screeps({ server: 'my-server' })` or the environment variable `$SCREEPS_SERVER`.

Branch *(aka the destination folder on screeps server)* default to `auto`, it can be select with `screeps({ branch: 'my-branch' })` or the environment variable `$SCREEPS_BRANCH`.

### JS Config File

rollup-plugin-screeps still support the json config file.

```json
{
  "email": "you@domain.tld",
  "password": "pass",
  "protocol": "https",
  "hostname": "screeps.com",
  "port": 443,
  "path": "/",
  "branch": "auto"
}
```

It change be loaded from a file with `screeps({ configFile: './screeps.json' })` or direct as value with `screeps({ config: my_config })`.

If `branch` is set to `"auto"` rollup-plugin-screeps will use your current git branch as the name of the branch on screeps, if you set it to anything else that string will be used as the name of the branch.

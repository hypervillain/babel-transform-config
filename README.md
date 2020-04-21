## babel-transform-config
If you ever wanted to update a Nuxt or Next config file programmatically.
#### Readme: wip
Simplest way to understand what it does:

````bash
git clone https://github.com/hypervillain/babel-transform-config;
cd babel-transform-config && npm install;
node examples/nuxt.simple.js
````
This should display some info 👇

##### 1/ previous code:

The actual `nuxt.config.js` file that was read from file.
Something like:
```javascript
export default {
  css: [],
  modules: ['@org/my-nuxt-module'],
  build: {
    webpack : {}
  },
};
````

##### 2/ args passed :
The arguments that were passed to `babel-transform-config`.
Something like:
```javascript
const args = {
  css: ['path/to/file'],
  modules: [
    ['my-module', { config: true }]
  ],
  transpile: ['my-other-module']
}
// will be used like this:
// transformConfig(code, 'nuxt', args)
````

##### 3/ the transpiled code :
What you came for:
```javascript
export default {
  css: ["path/to/file"],
  modules: ['@org/my-nuxt-module', ["my-module", {
    "config": true
  }]],
  build: {
    webpack: {},
    transpile: ["my-other-module"]
  }
};
````

## Using the module

This package exports a `transformConfig` function that takes as arguments some code, a framework key, and key-value params that will help the module transform these arguments.

For example, these arguments:
````javascript
const args = {
    script: ['path/to/script-file.js']
}
transformConfig(myNuxtConfig, 'nuxt', args)
````

`transformConfig` will try & match your script key and transform your arguments into:
````javascript
transforms: [{
    'head:script': {
        action: 'create:merge',
        value: ['path/to/script-file.js']
    }
],
````
This will help the underlying Babel plugin perform the right actions, based on what it knows of your framework. The complete call:

````javascript
const fs = require('fs')
const transformConfig = require('babel-transform-config')

const code = fs.readFileSync('path/to/config', 'utf8')
const args = { script: ['path/to/script-file.js'] }

const { code: updatedCode} = transformConfig(code, 'nuxt', args)

// ⚠️ this is experimental, please log things first
fs.writeFileSync('path/to/config', updatedCode, 'utf8')

````

## Direct transform / Babel plugin

Right now, `transformConfig` only supports Nuxt framexwork. If you want to use things for yourself with another framework, you should use the lower-level transform method:

```javascript
const { transform } = require('babel-transform-config')

const transforms = {
  'head:script': { // create or replace export default { head: { script: [] }}
    action: 'create:replace',
    value: ['my/script.js']
  },
  'deleteMe': { // delete export default { deleteMe: ... }
    action: 'delete'
  },
  'build:transpile': { // merges export default { babel: { transpile: arrayOrObject } }
    action: 'merge',
    value: ['path/to/file']
  }
}
const { code: updatedCode } = transform(yourCustomCode, transforms)

`````

👆 See `examples/transform`.


#### Quick note

ATM you'll need to use ES2015 `export default` feature to use this plugin.



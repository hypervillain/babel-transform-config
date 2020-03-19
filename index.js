const consola = require('consola')
const babelTransform = require('@babel/standalone').transform

const babelTransformConfigPlugin = require('./plugin')

const nuxt = {
  css(value) {
    // arr of strings
    return ['css', {
      action: 'create:merge',
      value
    }]
  },
  script(value) {
    // arr of objects or strings
    return ['head:script', {
      action: 'create:merge',
      value
    }]
  },
  module(value) {
    return ['modules', {
      action: 'create:merge',
      [value]: [value]
    }]
  },
  modules(value) {
    return ['modules', {
      action: 'create:merge',
      value
    }]
  },
  transpile(value) {
    return ['build:transpile', {
      action: 'create:merge',
      value
    }]
  }
}
const table = { nuxt }

function createTransformArgs(framework, args) {
  const frameworkTable = table[framework]
  const keysNotFound = []
  if (!frameworkTable) {
    return consola.error(`[transform-configs] ${framework} Framework not supported\nUse babel plugin directly instead`)
  }
  try {
    const transforms = Object.entries(args).reduce((acc, [k, v]) => {
      if (frameworkTable[k]) {
        const [key, value] = frameworkTable[k](v)
        return {
          ...acc,
          [key]: value
        }
      }
      keysNotFound.push(k)
      return {
        ...acc,
        [k]: {
          action: 'create:merge',
          value: v
        }
      }
    }, {})
    return {
      transforms,
      keysNotFound
    }
  } catch(e) {
    return {
      reason: e
    }
  }
}

function transform(code, transforms) {
  return babelTransform(code, {
    plugins: [
      [
        babelTransformConfigPlugin,
        transforms
      ]
    ]
  }) // { code } or Throws error
}

function handleKeysNotFound(keys) {
  keys.forEach((key) => {
    consola.warn(`[transform-args] Key "${key}" not recognized.\nDefaulting to default transform`)
  })
}
function transformConfig(code, framework, args) {
  const {
    transforms,
    keysNotFound,
    reason,
  } = createTransformArgs(framework, args)

  if (!transforms) {
    return consola.error(reason)
  }
  if (keysNotFound.length) {
    handleKeysNotFound(keysNotFound);
  }
  return transform(code, transforms)
}

transformConfig.transform = transform
transformConfig.plugin = babelTransformConfigPlugin

module.exports = transformConfig
const fs = require('fs')
const path = require('path')
const transformConfig = require('..')

const code = fs.readFileSync(path.join(process.cwd(), 'examples/configs/nuxt.simple.js'), 'utf8')

const mod = ["@nuxtjs/prismic", {
  "endpoint": "https://prismic.prismic.io",
  apiOptions: {
    "routes": ["/:uid", "/"]
  }
}]

const args = {
  css: ['path/to/file'],
  modules: [mod],
  script: ['/script-key-created'],
  transpile: ['my-other-module'],
}

const { code: updated } = transformConfig(code, 'nuxt', args)

console.log('previous code:\n', code)

console.log('new code:\n', updated)
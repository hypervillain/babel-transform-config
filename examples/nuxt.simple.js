const fs = require('fs')
const path = require('path')
const transformConfig = require('../')

const code = fs.readFileSync(path.join(process.cwd(), 'examples/configs/nuxt.simple.js'), 'utf8')

const args = {
  css: ['path/to/file'],
  modules: [
    ['my-module', { config: true }]
  ],
  transpile: ['my-other-module']
}

const { code: updated } = transformConfig(code, 'nuxt', args)

console.log('previous code:\n', code)

console.log('passed args: ', JSON.stringify(args), '\n')
console.log('new code:\n', updated)
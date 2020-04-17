const fs = require('fs')
const path = require('path')
const transformCode = require('..').transform

const code = fs.readFileSync(path.join(process.cwd(), 'examples/configs/nuxt.trans.js'), 'utf8')

const transforms = {
  'head:script': { // create or replace export default { head: { script: [] }}
    action: 'create:replace',
    value: ['my/script.js']
  },
  'deleteMeMaybe': { // delete export default { deleteMe: ... }
    action: 'delete'
  },
  'build:transpile': { // merges export default { babel: { transpile: arrayOrObject } }
    action: 'merge:create',
    value: ['path/to/file']
  }
}

const { code: updated } = transformCode(code, transforms)

console.log('previous code:\n', code)

console.log('passed transform args: ', JSON.stringify(transforms), '\n')

console.log('new code:\n', updated)
const fs = require('fs')
const path = require('path')
const transformConfig = require('..')

const code = fs.readFileSync(path.join(process.cwd(), 'examples/configs/nuxt.simple.js'), 'utf8')

const mod = ["@nuxtjs/prismic", {
  "endpoint": "",
  "linkResolver": function linkResolver(doc) {
    if (doc.uid === "page") {
      return doc.uid === "homepage" ? "/" : "/" + doc.uid;
    }

    return "/";
  },
  "routes": ["/:uid", "/"]
}]

const args = {
  css: ['path/to/file'],
  script: [{ src: 'duped', t: true }],
  modules: [mod, mod, '@org/my-nuxt-module'],
  transpile: ['my-other-module'],
}

const { code: updated } = transformConfig(code, 'nuxt', args)

console.log('previous code:\n', code)

console.log('passed args: ', JSON.stringify(args), '\n')
console.log('new code:\n', updated)
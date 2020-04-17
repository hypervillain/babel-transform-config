export default {
  head: {
    key: 'value'
  },
  mode: "universal",
  css: [],
  modules: ['@org/my-nuxt-module'],
  build: {
    extend(config, ctx) {},
    transpile: ['my-module']
  }
};

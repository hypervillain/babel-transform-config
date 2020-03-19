const babylon = require('@babel/parser')

const babelPluginTransformRuntime = require("@babel/plugin-transform-runtime").default;
const babelPluginTransformArrowFunction = require("@babel/plugin-transform-arrow-functions").default;

function toAst(t, elem) {
  if (elem === null) {
    return t.nullLiteral()
  }
  if (Array.isArray(elem)) {
    return t.arrayExpression(elem.map(e => toAst(t, e)));
  }
  if (typeof elem === 'object') {
    const expression = t.objectExpression(Object.entries(elem)
      .reduce((acc, [key, value]) => {
        if (typeof value !== 'undefined') {
          const property = t.objectProperty(
            t.stringLiteral(key),
            toAst(t, value)
          )
          return [...acc, property]
        }
        return acc
      }, []))
    return expression
  }
  switch (typeof elem) {
    case 'function':
      const ast = babylon.parse(elem.toString(), {
        plugins: [
          babelPluginTransformRuntime,
          babelPluginTransformArrowFunction
        ]
      });
      const { params, body } = ast.program.body[0];
      return t.functionExpression(null, params, body)
    case "number":
      return t.numericLiteral(elem)
    case "string":
      return t.stringLiteral(elem)
    case "boolean":
      return t.booleanLiteral(elem);
  }
}

module.exports = toAst
function buildSubjacentPaths(arr, store = [], len = 0) {
  if (len >= arr.length) {
    return store
  }
  store = [...store, arr.slice(0, len + 1)]
  return buildSubjacentPaths(arr, store, len + 1)
}

function dedupeStringLiterals(elements) {
  const set = new Set()
  return elements.filter(e => {
    if (e.type !== 'StringLiteral') {
      return true
    }
    const duplicate = set.has(e.value)
    set.add(e.value)
    return !duplicate
  })
}

/** There probably is a better way */
function testNodeValue(t, path) {
  const { type } = path.node.value
  if (type === 'ArrayExpression') {
    return !!path.node.value.elements.length
  }
  if (type === 'ObjectExpression') {
    return !!path.node.value.properties.length
  }
  if (type === 'NullLiteral') {
    return false
  }
  return true
}

module.exports = {
  buildSubjacentPaths,
  dedupeStringLiterals,
  testNodeValue
}
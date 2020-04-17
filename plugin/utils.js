const isEqual = require('lodash.isequal')
const sortBy = require("lodash.sortby");

function dedupeModulesLike(modules) {
  const moduleNames = {}
  return modules.filter((elem) => {
    if (elem.type === 'StringLiteral') {
      if (moduleNames[elem.value]) {
        return false
      }
      moduleNames[elem.value] = true
      return true
    }
    if (elem.type === 'ArrayExpression') {
      const maybeModName = elem.elements[0]
      if (
        !maybeModName
        || maybeModName.type !== 'StringLiteral'
        || !maybeModName.value
      ) {
        return true // don't eval
      }
      if (moduleNames[maybeModName.value]) {
        return false
      }
      moduleNames[maybeModName.value] = true
      return true
    }
  })
}

/** 
 * 
 * type: 'ObjectProperty',
   key: {
     type: 'StringLiteral',
     value: 'src'
   },
   value: {
     type: 'StringLiteral',
     value: 'duped'
   },
   computed: false,
   shorthand: false,
   decorators: null
 */
function dedupeObjectExpressions(objectProperties, keyName) {
  const propertiesList = objectProperties
    .map(({ properties }) => ([
      ...properties.map(({
        type,
        key,
        value,
        computed,
        shorthand,
        decorator
      }) => ({
        type,
        key: key.value || key.name,
        value: value.value,
        computed,
        shorthand,
        decorator
      }))
    ]))

  const dedupedProps = propertiesList.reduce((acc, properties, index) => {
    // sort current property and flatten it
    // for each (flattened) elem in acc, test equality
    // return true if 1 was true
    const duplicate = acc.find((accProps, iii) => {
      const sortedProps = sortBy(properties.map(sortBy)).flat()
      const sortedAcc = sortBy(accProps.map(sortBy)).flat()
      const isEq = isEqual(sortedProps, sortedAcc)
      return isEq
    });

    if (duplicate) {
      console.log("duplicate", duplicate);
      return acc
    }
    return [...acc, properties]

  }, [])
  return dedupedProps
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

function dedupe(elements, keyName) {
  const elementTypes = elements.map(({ type }) => type)
  const ofSingleType = elementTypes.every(val => val === elementTypes[0])
  const childrenType = ofSingleType ? elementTypes[0] : null

  const isArrayAndOrString =
    !ofSingleType 
    & elementTypes.every(val =>
      val === 'StringLiteral'
      || val === 'ArrayExpression'
    )

  if (ofSingleType) {
    if (childrenType === 'StringLiteral') {
      return dedupeStringLiterals(elements)
    } if (childrenType === 'ObjectExpression') {
      const duplicateKeys = dedupeObjectExpressions(elements, keyName)
    }
  }

  if (isArrayAndOrString) {
    return dedupeModulesLike(elements)
  }

  return elements

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
  dedupeStringLiterals,
  testNodeValue,
  dedupe
}
const consola = require('consola')
const toAst = require('./toAst')

const { dedupe } = require('./utils')

const OPERATIONS = ['create', 'merge', 'replace', 'delete']

function getParentPropertyName(path) {
  if (path.parent.type === 'ExportDefaultDeclaration') {
    return "__default"
  } else if (path.parent.key) {
    return (path.parent.key.value || path.parent.key.name)
  }
}

function accessorKey(type) {
  return type === 'ArrayExpression' ? 'elements' : 'properties'
}
function mergePaths(parentKeys, nodeName) {
  return `${parentKeys}${parentKeys.length ? ':' : ''}${nodeName}`
}

function validateAction(transform) {
  const operations = transform.action.split(':')

  operations.forEach((operation) => {
    if (!OPERATIONS.includes(operation)) {
      throw new Error(`Operation "${operation}" does not exist.\nDefined operations: ${OPERATIONS}`)
    }
  })
  if (operations.includes('merge') && operations.includes('replace')) {
    throw new Error('Operations "merge" and "update" cannot coexist in transform\'s "action" property')
  }
  if (operations.includes('create') && operations.includes('delete')) {
    throw new Error('Operations "create" and "delete" cannot coexist in transform\'s "action" property')
  }
  if (operations.includes('merge') && !Array.isArray(transform.value)) {
    throw new Error('Operations "merge" expects value to be of type "Array" (tested with Array.isArray)')
  }
}

function formatTransforms(transforms) {
  return Object.entries(transforms).reduce((acc, [key, transform]) => {
    if (!transform.action || !transform.action.length) {
      throw new Error(`Transformation with key "${key}" should possess a non-empty "action" key`)
    }
    if (transform.action.indexOf('delete') === -1 && transform.value === undefined) {
      throw new Error(`Transformation with key "${key}" should possess a non-empty "value" key`)
    }
    validateAction(transform)
    return {
      ...acc,
      [`__default:${key}`]: transform
    }
  }, {})
}

module.exports = function({ types: t }, transformsProps) {
  const transforms = formatTransforms(transformsProps)

  const objectPropVisitor = {
    ObjectExpression(path, { nest = ''} = {}) {
      const currentKey = getParentPropertyName(path)
      if (!currentKey) {
        return
      }
      const currentPath = mergePaths(nest, currentKey)

      const maybeTransforms =
        Object.entries(transforms).filter(([key]) => 
          key.split(':').slice(0, -1).join(':') === currentPath
        )

      if (maybeTransforms.length) {
        maybeTransforms.forEach(([key, transform]) => {
          if (transform) {
            const operations = transform.action.split(':')
            if (operations.includes('delete')) {
              return path.remove()
            }

            const maybeProperty =
              path.node.properties.find(e => (e.key.value || e.key.name) === key.split(':').pop())

            const shouldCreate = !maybeProperty && operations.includes('create')

            if (shouldCreate || operations.includes('replace')) {
              const accessor = accessorKey(path.node)
              const elems = [
                ...path.node[accessor],
                t.objectProperty(t.Identifier(key.split(':').pop()), toAst(t, transform.value))
              ]
              return path.node[accessor] = dedupe(elems, key.name)
            }

            if (operations.includes('merge')) {
              const accessor = accessorKey(maybeProperty.value.type)
              const elems = [
                ...maybeProperty.value[accessor],
                ...toAst(t, transform.value)[accessor]
              ];
              maybeProperty.value[accessor] = dedupe(elems, key.name)
            }
          }
        })
      }
      return path.traverse(objectPropVisitor, {
        nest: currentPath
      })
    }
  }

  return {
    name: 'babel-plugin-transform-config',
    visitor: {
      Program(path) {
        const exportPath = path.get('body')
          .find((path) => path.isExportDefaultDeclaration()
            && path.node.declaration
            && path.node.declaration.type === 'ObjectExpression'
          )

        if (!exportPath) {
          return consola.error('Could not find default exported object. Maybe your config file returns a function?')
        }
        exportPath.traverse(objectPropVisitor)
      },
    }
  }
};
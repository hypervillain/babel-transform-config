const consola = require('consola')
const toAst = require('./toAst')

const {
  dedupeStringLiterals,
  testNodeValue,
  buildSubjacentPaths
} = require('./utils')

const OPERATIONS = ['create', 'merge', 'replace', 'delete']

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

function validateTransforms(transforms) {
  Object.entries(transforms).forEach(([key, transform]) => {
    if (!transform.action || !transform.action.length) {
      throw new Error(`Transformation with key "${key}" should possess a non-empty "action" key`)
    }
    if (transform.action.indexOf('delete') === -1 && transform.value === undefined) {
      throw new Error(`Transformation with key "${key}" should possess a non-empty "value" key`)
    }
    validateAction(transform)
  })
}

module.exports = function({ types: t }, transforms) {
  const status = {}

  validateTransforms(transforms)
  Object.keys(transforms).forEach((key) => status[key] = false)
  

  const expressionVisitor = {
    ObjectExpression(path, { isRoot, objectKeysPath, createKey, value }) {

      const fullPathToBuild = mergePaths(objectKeysPath, createKey)
      const currentParentKey = path.parent.key ? path.parent.key.name : ''

      const currentPathToBuild = mergePaths(currentParentKey, createKey)

      if (currentPathToBuild === fullPathToBuild) {
        if (
          path.parent.declaration
          && path.parent.declaration.properties
          && path.parent.declaration.properties.find(e => e.key.name === createKey)
        ) {
          return
        }

        // Make sure you create root key
        // at exportDefault level to prevent writing value evrywhere
        if (isRoot && (!path.parentPath.node.key || path.parentPath.node.key.loc)) {
          return
        }
        const newObjectProperty = t.ObjectProperty(
          t.identifier(createKey),
          toAst(t, value)
        )
        path.node.properties = [
          ...path.node.properties,
          newObjectProperty
        ]
      }
    }
  }
  const objectPropVisitor = {
    ObjectProperty(path, { parentKeys = '' } =  {}) {
      const currentPath = mergePaths(parentKeys, path.node.key.name)
      const transform = transforms[currentPath]

      if (transform) {
        status[currentPath] = true
        const operations = transform.action.split(':')
        if (operations.includes('delete')) {
          return path.remove()
        }

        const { type } = path.node.value
        const elemExists = testNodeValue(t, path);
        
        (function handleWrite() {
          if ((!elemExists && operations.includes('create')) || operations.includes('replace')) {
            path.node.value = toAst(t, transform.value)
          }

          if (operations.includes('merge')) {
            const accessor = type === 'ArrayExpression' ? 'elements' : 'properties'
            const elems = [
              ...path.node.value[accessor],
              ...toAst(t, transform.value)[accessor]
            ];
            path.node.value[accessor] = dedupeStringLiterals(elems)
          }
        })();
      }

      if (path.node.value && (path.node.value.properties || path.node.value.elements)) {
        return path.traverse(objectPropVisitor, {
          parentKeys: currentPath
        })
      }
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

        Object.entries(status).forEach(([key, value]) => {
          if (value === false && transforms[key].action.indexOf('create') !== -1) {
            const subPaths = key.split(':')
            const subPathsToCreate = buildSubjacentPaths(subPaths).slice(0, -1);

            subPathsToCreate.forEach((p, i) => {
              exportPath.traverse(expressionVisitor, {
                objectKeysPath: p.slice(0, -1).join(':'),
                createKey: p.pop(),
                value: {},
                isRoot: i === 0
              })
            })
            exportPath.traverse(expressionVisitor, {
              objectKeysPath: key.split(':').slice(0, -1).join(':'),
              createKey: key.split(':').pop(),
              value: transforms[key].value
            })
          }
        }, [])
      },
    }
  }
};
import MemoryExport from './MemoryExport.vue'

const components = {
  MemoryExport,
}

export const registerGlobalComponents = (app) => {
  Object.keys(components).forEach((key) => {
    app.component(key, components[key])
  })
}

export default components

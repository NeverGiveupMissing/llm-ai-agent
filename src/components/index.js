import MemoryExport from './MemoryExport.vue'
import BaseTable from './BaseTable/index.vue'
import BaseForm from './BaseForm/index.vue'
import BaseModal from './BaseModal/index.vue'
import CommonButton from './CommonButton.vue'

const components = {
  MemoryExport,
  BaseTable,
  BaseForm,
  BaseModal,
  CommonButton,
}

export const registerGlobalComponents = (app) => {
  Object.keys(components).forEach((key) => {
    app.component(key, components[key])
  })
}

export default components

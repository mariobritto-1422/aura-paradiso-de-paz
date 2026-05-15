import { _registry } from './utils'
import { F1_INFO } from './F1_Afiliacion'
import { F2_INFO } from './F2_ConformidadSG'
import { F3_INFO } from './F3_ConveniosNac'
import { F4_INFO } from './F4_Cremacion'
import { F5_INFO } from './F5_ConformIPSM'
import { F6_INFO } from './F6_FichaCementerio'
import { F7_INFO } from './F7_ConformPrincipal'

// Registrar todos los formularios
_registry.push(F1_INFO, F2_INFO, F3_INFO, F4_INFO, F5_INFO, F6_INFO, F7_INFO)

export { F1_INFO, F2_INFO, F3_INFO, F4_INFO, F5_INFO, F6_INFO, F7_INFO }
export { getFormulariosRequeridos, imprimirFormulario, imprimirTodos } from './utils'
export type { FormularioInfo } from './utils'

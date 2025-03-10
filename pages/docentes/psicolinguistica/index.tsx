import PrivateRouteDocentes from '@/components/layouts/PrivateRoutesDocentes'
import ListaEvaluaciones from '@/components/psicolinguistica/lista-de-evaluaciones'
import React from 'react'

const PsicolinguisticaDocentes = () => {
  return (
    <ListaEvaluaciones/>
  )
}

export default PsicolinguisticaDocentes
PsicolinguisticaDocentes.Auth = PrivateRouteDocentes
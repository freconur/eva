import React from 'react';
import { useRouter } from 'next/router';
import PrivateRouteEspecialista from '@/components/layouts/PrivateRoutesEspecialista';
import { EvaluacionDetalleDocenteContainer } from '@/components/evaluaciones-desempeno/containers';

const EvaluacionDetalleDocenteEspecialistaPage = () => {
  const router = useRouter();
  const id = (router.query.id as string) || '';

  return (
    <EvaluacionDetalleDocenteContainer
      id={id}
      role="especialista"
      basePath="/especialistas/evaluaciones-docentes"
    />
  );
};

export default EvaluacionDetalleDocenteEspecialistaPage;
EvaluacionDetalleDocenteEspecialistaPage.Auth = PrivateRouteEspecialista;

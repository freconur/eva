import React from 'react';
import { useRouter } from 'next/router';
import PrivateRouteEspecialista from '@/components/layouts/PrivateRoutesEspecialista';
import { EvaluacionDetalleDirectorContainer } from '@/components/evaluaciones-desempeno/containers';

const EvaluacionDetalleDirectorEspecialistaPluralPage = () => {
  const router = useRouter();
  const id = (router.query.id as string) || '';

  return (
    <PrivateRouteEspecialista>
      <EvaluacionDetalleDirectorContainer
        id={id}
        role="especialista"
        basePath="/especialistas/evaluaciones-director"
      />
    </PrivateRouteEspecialista>
  );
};

export default EvaluacionDetalleDirectorEspecialistaPluralPage;
EvaluacionDetalleDirectorEspecialistaPluralPage.Auth = PrivateRouteEspecialista;

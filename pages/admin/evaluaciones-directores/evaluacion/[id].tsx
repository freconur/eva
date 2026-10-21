import React from 'react';
import { useRouter } from 'next/router';
import PrivateRouteAdmins from '@/components/layouts/PrivateRoutes';
import { EvaluacionDetalleDirectorContainer } from '@/components/evaluaciones-desempeno/containers';

const EvaluacionDetalleDirectorAdminPage = () => {
  const router = useRouter();
  const id = (router.query.id as string) || '';

  return (
    <PrivateRouteAdmins>
      <EvaluacionDetalleDirectorContainer
        id={id}
        role="admin"
        basePath="/admin/evaluaciones-directores"
      />
    </PrivateRouteAdmins>
  );
};

export default EvaluacionDetalleDirectorAdminPage;
EvaluacionDetalleDirectorAdminPage.Auth = PrivateRouteAdmins;

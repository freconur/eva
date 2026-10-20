import React from 'react';
import { useRouter } from 'next/router';
import PrivateRouteAdmins from '@/components/layouts/PrivateRoutes';
import { EvaluacionDetalleDocenteContainer } from '@/components/evaluaciones-desempeno/containers';

const EvaluacionDetalleDocenteAdminPage = () => {
  const router = useRouter();
  const id = (router.query.id as string) || '';

  return (
    <EvaluacionDetalleDocenteContainer
      id={id}
      role="admin"
      basePath="/admin/evaluaciones-docentes"
    />
  );
};

export default EvaluacionDetalleDocenteAdminPage;
EvaluacionDetalleDocenteAdminPage.Auth = PrivateRouteAdmins;

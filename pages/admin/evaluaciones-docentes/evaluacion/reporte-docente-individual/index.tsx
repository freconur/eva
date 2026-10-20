import React from 'react';
import { useRouter } from 'next/router';
import PrivateRouteAdmins from '@/components/layouts/PrivateRoutes';
import { ReporteIndividualContainer } from '@/components/evaluaciones-desempeno/containers';

const ReporteDocenteIndividualAdmin = () => {
	const router = useRouter();
	const idEvaluacion = (router.query.idEvaluacion as string) || '';

	return (
		<ReporteIndividualContainer
			collectionName="evaluaciones-docentes"
			role="admin"
			monitoreadoRoleLabel="DATOS DEL(A) DOCENTE:"
			monitorRoleLabel="DATOS DEL EVALUADOR / ADMINISTRADOR:"
			backHref={`/admin/evaluaciones-docentes/evaluacion/${idEvaluacion}/evaluados`}
		/>
	);
};

export default ReporteDocenteIndividualAdmin;
ReporteDocenteIndividualAdmin.Auth = PrivateRouteAdmins;

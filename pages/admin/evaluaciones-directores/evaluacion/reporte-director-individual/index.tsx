import React from 'react';
import { useRouter } from 'next/router';
import PrivateRouteAdmins from '@/components/layouts/PrivateRoutes';
import { ReporteIndividualContainer } from '@/components/evaluaciones-desempeno/containers';

const ReporteDirectorIndividualAdmin = () => {
	const router = useRouter();
	const idEvaluacion = (router.query.idEvaluacion as string) || '';

	return (
		<ReporteIndividualContainer
			collectionName="evaluaciones-director"
			role="admin"
			monitoreadoRoleLabel="DATOS DEL(A) DIRECTOR(A):"
			monitorRoleLabel="DATOS DEL EVALUADOR / ADMINISTRADOR:"
			backHref={(evalId) => {
				const currentId = evalId || idEvaluacion;
				if (router.query.from === 'evaluados') {
					return currentId
						? `/admin/evaluaciones-directores/evaluacion/${currentId}/evaluados`
						: '/admin/evaluaciones-directores';
				}
				return currentId
					? `/admin/evaluaciones-directores/evaluacion/${currentId}`
					: '/admin/evaluaciones-directores';
			}}
		/>
	);
};

export default ReporteDirectorIndividualAdmin;
ReporteDirectorIndividualAdmin.Auth = PrivateRouteAdmins;

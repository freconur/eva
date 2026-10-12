import React from 'react';
import { useRouter } from 'next/router';
import PrivateRouteDirectores from '@/components/layouts/PrivateRoutesDirectores';
import { ReporteIndividualContainer } from '@/components/evaluaciones-desempeno/containers';

const ReporteDocenteIndividual = () => {
	const router = useRouter();
	const idEvaluacion = (router.query.idEvaluacion as string) || '';

	return (
		<ReporteIndividualContainer
			collectionName="evaluaciones-docentes"
			role="director"
			monitoreadoRoleLabel="DATOS DEL(A) DOCENTE:"
			monitorRoleLabel="DATOS DEL DIRECTOR (MONITOR):"
			backHref={`/directores/evaluaciones-docentes/evaluacion/${idEvaluacion}/evaluados`}
		/>
	);
};

export default ReporteDocenteIndividual;
ReporteDocenteIndividual.Auth = PrivateRouteDirectores;
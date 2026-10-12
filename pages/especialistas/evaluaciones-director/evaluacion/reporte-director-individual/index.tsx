import React from 'react';
import { useRouter } from 'next/router';
import PrivateRouteEspecialista from '@/components/layouts/PrivateRoutesEspecialista';
import { ReporteIndividualContainer } from '@/components/evaluaciones-desempeno/containers';

const ReporteDirectorIndividual = () => {
	const router = useRouter();
	const idEvaluacion = (router.query.idEvaluacion as string) || '';

	return (
		<ReporteIndividualContainer
			collectionName="evaluaciones-director"
			role="especialista"
			monitoreadoRoleLabel="DATOS DEL(A) DIRECTOR(A):"
			monitorRoleLabel="DATOS DEL ESPECIALISTA (MONITOR):"
			backHref={`/especialistas/evaluaciones-director/evaluacion/${idEvaluacion}/evaluados`}
		/>
	);
};

export default ReporteDirectorIndividual;
ReporteDirectorIndividual.Auth = PrivateRouteEspecialista;
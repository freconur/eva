import React from 'react';
import { useRouter } from 'next/router';
import { ReporteIndividualContainer } from '@/components/evaluaciones-desempeno/containers';

const ReporteEspecialistaIndividual = () => {
	const router = useRouter();
	const idEvaluacion = (router.query.idEvaluacion as string) || '';

	return (
		<ReporteIndividualContainer
			collectionName="evaluaciones-especialista"
			role="admin"
			monitoreadoRoleLabel="DATOS DEL(A) MONITOREADO (A):"
			monitorRoleLabel="DATOS DEL MONITOR:"
			backHref={`/admin/especialistas/evaluaciones-especialistas/evaluacion/${idEvaluacion}/evaluados`}
		/>
	);
};

export default ReporteEspecialistaIndividual;
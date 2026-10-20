import React from 'react';
import { useRouter } from 'next/router';
import PrivateRouteEspecialista from '@/components/layouts/PrivateRoutesEspecialista';
import { ReporteIndividualContainer } from '@/components/evaluaciones-desempeno/containers';

const ReporteDocenteIndividualEspecialista = () => {
	const router = useRouter();
	const idEvaluacion = (router.query.idEvaluacion as string) || '';

	return (
		<ReporteIndividualContainer
			collectionName="evaluaciones-docentes"
			role="especialista"
			monitoreadoRoleLabel="DATOS DEL(A) DOCENTE:"
			monitorRoleLabel="DATOS DEL ESPECIALISTA (MONITOR):"
			backHref={`/especialistas/evaluaciones-docentes/evaluacion/${idEvaluacion}/evaluados`}
		/>
	);
};

export default ReporteDocenteIndividualEspecialista;
ReporteDocenteIndividualEspecialista.Auth = PrivateRouteEspecialista;
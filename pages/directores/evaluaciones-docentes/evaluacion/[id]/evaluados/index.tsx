import React from 'react';
import { useRouter } from 'next/router';
import PrivateRouteDirectores from '@/components/layouts/PrivateRoutesDirectores';
import { EvaluadosDashboardContainer } from '@/components/evaluaciones-desempeno/containers';

const DocentesEvaluadosPage = () => {
	const router = useRouter();
	const id = (router.query.id as string) || '';

	return (
		<EvaluadosDashboardContainer
			id={id}
			collectionName="evaluaciones-docentes"
			role="director"
			targetTitle="Docentes Evaluados"
			targetNoun="docentes"
			targetNounSingular="Docente"
			backHref={`/directores/evaluaciones-docentes/evaluacion/${id}`}
			getReporteIndividualHref={(evalId, evalu) => {
				const docenteDni = evalu.dni || (evalu as any).docenteDni || '';
				const sessionParam = evalu.id ? `&sessionId=${evalu.id}` : '';
				return `/directores/evaluaciones-docentes/evaluacion/reporte-docente-individual?idEvaluacion=${evalId}&idDocente=${docenteDni}${sessionParam}`;
			}}
		/>
	);
};

export default DocentesEvaluadosPage;
DocentesEvaluadosPage.Auth = PrivateRouteDirectores;

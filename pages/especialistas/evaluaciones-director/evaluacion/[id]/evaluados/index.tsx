import React from 'react';
import { useRouter } from 'next/router';
import PrivateRouteEspecialista from '@/components/layouts/PrivateRoutesEspecialista';
import { EvaluadosDashboardContainer } from '@/components/evaluaciones-desempeno/containers';

const DirectoresEvaluadosPage = () => {
	const router = useRouter();
	const id = (router.query.id as string) || '';

	return (
		<EvaluadosDashboardContainer
			id={id}
			collectionName="evaluaciones-director"
			role="especialista"
			targetTitle="Directores Evaluados"
			targetNoun="directores"
			targetNounSingular="Director"
			backHref={`/especialistas/evaluaciones-director/evaluacion/${id}`}
			getReporteIndividualHref={(evalId, evalu) => {
				const directorDni = evalu.dni || (evalu as any).directorDni || '';
				const sessionParam = evalu.id ? `&sessionId=${evalu.id}` : '';
				return `/especialistas/evaluaciones-director/evaluacion/reporte-director-individual?idEvaluacion=${evalId}&idDirector=${directorDni}${sessionParam}`;
			}}
		/>
	);
};

export default DirectoresEvaluadosPage;
DirectoresEvaluadosPage.Auth = PrivateRouteEspecialista;

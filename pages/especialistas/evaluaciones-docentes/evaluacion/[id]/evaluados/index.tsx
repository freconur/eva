import React from 'react';
import { useRouter } from 'next/router';
import PrivateRouteEspecialista from '@/components/layouts/PrivateRoutesEspecialista';
import { EvaluadosDashboardContainer } from '@/components/evaluaciones-desempeno/containers';

const DocentesEvaluadosEspecialistaPage = () => {
	const router = useRouter();
	const id = (router.query.id as string) || '';

	return (
		<EvaluadosDashboardContainer
			id={id}
			collectionName="evaluaciones-docentes"
			role="especialista"
			targetTitle="Docentes Evaluados"
			targetNoun="docentes"
			targetNounSingular="Docente"
			showUgelFilter={false}
			backHref={`/especialistas/evaluaciones-docentes/evaluacion/${id}`}
			getReporteIndividualHref={(evalId, evalu) => {
				const docenteDni = evalu.dni || (evalu as any).docenteDni || '';
				const sessionParam = evalu.id ? `&sessionId=${evalu.id}` : '';
				return `/especialistas/evaluaciones-docentes/evaluacion/reporte-docente-individual?idEvaluacion=${evalId}&idDocente=${docenteDni}${sessionParam}`;
			}}
		/>
	);
};

export default DocentesEvaluadosEspecialistaPage;
DocentesEvaluadosEspecialistaPage.Auth = PrivateRouteEspecialista;

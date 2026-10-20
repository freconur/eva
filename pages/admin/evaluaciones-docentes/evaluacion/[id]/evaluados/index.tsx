import React from 'react';
import { useRouter } from 'next/router';
import PrivateRouteAdmins from '@/components/layouts/PrivateRoutes';
import { EvaluadosDashboardContainer } from '@/components/evaluaciones-desempeno/containers';

const DocentesEvaluadosAdminPage = () => {
	const router = useRouter();
	const id = (router.query.id as string) || '';

	return (
		<EvaluadosDashboardContainer
			id={id}
			collectionName="evaluaciones-docentes"
			role="admin"
			targetTitle="Docentes Evaluados"
			targetNoun="docentes"
			targetNounSingular="Docente"
			backHref={`/admin/evaluaciones-docentes/evaluacion/${id}`}
			getReporteIndividualHref={(evalId, evalu) => {
				const docenteDni = evalu.dni || (evalu as any).docenteDni || '';
				const sessionParam = evalu.id ? `&sessionId=${evalu.id}` : '';
				return `/admin/evaluaciones-docentes/evaluacion/reporte-docente-individual?idEvaluacion=${evalId}&idDocente=${docenteDni}${sessionParam}`;
			}}
		/>
	);
};

export default DocentesEvaluadosAdminPage;
DocentesEvaluadosAdminPage.Auth = PrivateRouteAdmins;

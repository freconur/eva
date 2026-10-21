import React from 'react';
import { useRouter } from 'next/router';
import PrivateRouteAdmins from '@/components/layouts/PrivateRoutes';
import { EvaluadosDashboardContainer } from '@/components/evaluaciones-desempeno/containers';

const DirectoresEvaluadosAdminPage = () => {
	const router = useRouter();
	const id = (router.query.id as string) || '';

	return (
		<EvaluadosDashboardContainer
			id={id}
			collectionName="evaluaciones-director"
			role="admin"
			targetTitle="Directores Evaluados"
			targetNoun="directores"
			targetNounSingular="Director"
			backHref={`/admin/evaluaciones-directores/evaluacion/${id}`}
			getReporteIndividualHref={(evalId, evalu) => {
				const directorDni = evalu.dni || (evalu as any).directorDni || '';
				const sessionParam = evalu.id ? `&sessionId=${evalu.id}` : '';
				return `/admin/evaluaciones-directores/evaluacion/reporte-director-individual?idEvaluacion=${evalId}&idDirector=${directorDni}${sessionParam}`;
			}}
		/>
	);
};

export default DirectoresEvaluadosAdminPage;
DirectoresEvaluadosAdminPage.Auth = PrivateRouteAdmins;

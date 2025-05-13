import { User } from '@/features/types/types'
import React from 'react'
import styles from './datos-monitor.module.css'
import { rolTexto } from '@/fuctions/regiones'

interface Props {
	dataMonitor: User
}

const DatosMonitor = ({ dataMonitor }: Props) => {
	return (
		<>
		<h2 className={styles.titleMonitor}>II. datos del monitor</h2>
		<div className={styles.container}>
			<div className={styles.borderContainer}>
				<div className={styles.borderRow}>
					<div className={styles.label}>nombres y apellidos:</div>
					<div className={styles.value}>{dataMonitor?.nombres?.toUpperCase()} {dataMonitor?.apellidos?.toUpperCase()}</div>
				</div>
				<div className={styles.row}>
					<div className={styles.halfRow}>
						<div className={styles.rolLabel}>rol:</div>
						<div className={styles.value}>{rolTexto(dataMonitor?.rol || 0)}</div>
					</div>
				</div>
			</div>
		</div>
		</>
	)
}

export default DatosMonitor
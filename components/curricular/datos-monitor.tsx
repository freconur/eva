import { User } from '@/features/types/types'
import React from 'react'
import styles from './datos-monitor.module.css'

interface Props {
	dataMonitor: User
}

const DatosMonitor = ({ dataMonitor }: Props) => {
	return (
		<div className={styles.container}>
			<h2 className={styles.title}>I.datos del monitor</h2>
			<div className={styles.borderContainer}>
				<div className={styles.borderRow}>
					<div className={styles.label}>nombres y apellidos:</div>
					<div className={styles.value}>{dataMonitor?.nombres} {dataMonitor?.apellidos}</div>
				</div>
				<div className={styles.row}>
					<div className={styles.halfRow}>
						<div className={styles.rolLabel}>rol:</div>
						<div className={styles.value}>{dataMonitor?.rol}</div>
					</div>
				</div>
			</div>
		</div>
	)
}

export default DatosMonitor
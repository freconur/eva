import React from 'react';
import { Page, Text, View, Document } from '@react-pdf/renderer';
import { PDFViewer } from '@react-pdf/renderer';
import { styles } from './invoice'
import { regionTexto } from '@/fuctions/regiones';
import { ReporteDocenteIndividual } from '@/features/types/types';
import { Table, TH, TR, TD } from '@ag-media/react-pdf-table/';

interface Props {
    reporteIndividualDocente: ReporteDocenteIndividual
}
// Create Document Component
const MyDocument = ({ reporteIndividualDocente }: Props) => (

    <Document>
        <Page size="A4" style={styles.page}>
            {/* <View style={styles.section}>
                <Text style={styles.tituloPrincipal}>Evaluación de desempeño del docente</Text>
                <View style={styles.containerInfo}>
                    <Text style={styles.label}>Nombres:</Text>
                    <Text style={styles.tituloSecundario}>{reporteIndividualDocente.info?.nombres} {reporteIndividualDocente.info?.apellidos}</Text>

                </View>
                <View style={styles.containerInfo}>
                    <Text style={styles.label}>Institución:</Text>
                    <Text style={styles.tituloSecundario}>{reporteIndividualDocente.info?.institucion} </Text>

                </View>
                <View style={styles.containerInfo}>
                    <Text style={styles.label}>Región:</Text>
                    <Text style={styles.tituloSecundario}>{regionTexto(`${reporteIndividualDocente.info?.region}`)}</Text>

                </View>
                <View style={styles.containerInfo}>
                    <Text style={styles.label}>Rol:</Text>
                    <Text style={styles.tituloSecundario}>{reporteIndividualDocente.info?.perfil?.nombre}</Text>

                </View>
                <View style={styles.containerTabla}>
                    <Text style={styles.tituloTabla}>Detalle de evaluación y califación</Text>

                </View>
            </View> */}
            <Table style={{borderWidth: 1,
    borderColor: '#000',}}>
                <TH style={{fontSize: 14}}>
                    <TD>First Name</TD>
                    <TD>Last Name</TD>
                    <TD style={{justifyContent: 'center'}}>DOB</TD>
                    <TD style={{padding: '12px'}}>Country</TD>
                    <TD style={{justifyContent: 'flex-end'}}>Phone Number</TD>
                </TH>
                
            </Table>
        </Page>
    </Document>
);

export const ReporteDocentePdf = ({ reporteIndividualDocente }: Props) => {
    // console.log('reporteIndividualDocente', reporteIndividualDocente)z
    return (
        <div className='w-full h-[750px]'>
            <PDFViewer width="100%" height="100%">
                <MyDocument reporteIndividualDocente={reporteIndividualDocente} />
            </PDFViewer>

        </div>
    )
}

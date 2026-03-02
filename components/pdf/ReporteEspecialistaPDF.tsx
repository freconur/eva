import React from 'react';
import {
    Document,
    Page,
    View,
    Text,
    Image,
    StyleSheet,
} from '@react-pdf/renderer';

import { PRDocentes, AlternativasDocente, DimensionEspecialista, User } from '@/features/types/types';

// ── Types ────────────────────────────────────────────────────────────────────
export interface ReporteEspecialistaPDFProps {
    especialista: User;
    preguntas: PRDocentes[];              // preguntas con respuestas ya mergeadas
    dimensiones: DimensionEspecialista[];
    escala: AlternativasDocente[];
    ugel: string;
    tituloReporte?: string;
    descripcion?: string;
}

// ── Palette ──────────────────────────────────────────────────────────────────
const C = {
    labelBg: '#f1f5f9',
    border: '#cbd5e1',
    dimBg: '#f1f5f9',
    dimColor: '#111827',
    white: '#ffffff',
    text: '#1e293b',
    muted: '#64748b',
    accent: '#2563eb',
    feedBorder: '#3b82f6',
};

// ── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
    page: {
        fontFamily: 'Helvetica',
        fontSize: 9,
        color: C.text,
        backgroundColor: C.white,
        paddingTop: 36,
        paddingBottom: 48,
        paddingHorizontal: 36,
    },

    // ── Page title
    pageTitle: {
        fontSize: 11,
        fontFamily: 'Helvetica-Bold',
        color: C.text,
        marginBottom: 16,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        textAlign: 'center',
    },

    // ── Institutional header
    headerBanner: {
        flexDirection: 'row',
        marginBottom: 6,
        height: 38,
    },

    headerLogoPlaceholder: {
        width: 44,
        height: 38,
        backgroundColor: '#e2e8f0',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 2,
    },

    headerBlock1: {
        flex: 1,
        backgroundColor: '#2d4a5e',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 4,
        marginRight: 2,
    },

    headerBlock2: {
        flex: 2,
        backgroundColor: '#2980b9',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 4,
        marginRight: 2,
    },

    headerBlock3: {
        flex: 2,
        backgroundColor: '#27ae60',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 4,
    },

    headerBlockText: {
        fontSize: 7,
        fontFamily: 'Helvetica-Bold',
        color: '#ffffff',
        textAlign: 'center',
        textTransform: 'uppercase',
    },

    headerSubtitleContainer: {
        marginBottom: 12,
        alignItems: 'center',
    },

    headerSubtitle: {
        fontSize: 8,
        fontFamily: 'Helvetica-Oblique',
        color: C.text,
        textAlign: 'center',
        lineHeight: 1.5,
    },


    // ── Info section
    sectionBlock: {
        border: `1 solid ${C.border}`,
        borderRadius: 4,
        marginBottom: 6,
        overflow: 'hidden',
    },


    sectionHeader: {
        backgroundColor: C.labelBg,
        paddingHorizontal: 6,
        paddingVertical: 3,
        borderBottom: `1 solid ${C.border}`,
    },


    sectionHeaderText: {
        fontSize: 8,
        fontFamily: 'Helvetica-Bold',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        color: C.text,
    },

    // ── Footer (fixed — appears on every page)
    footer: {
        position: 'absolute',
        bottom: 18,
        left: 36,
        right: 36,
        borderTop: `1 solid ${C.border}`,
        paddingTop: 5,
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 8,
    },

    footerLegal: {
        flex: 1,
        fontSize: 5.5,
        color: C.muted,
        lineHeight: 1.5,
    },

    footerLegalBold: {
        fontFamily: 'Helvetica-Bold',
        fontSize: 5.5,
        color: C.muted,
    },

    footerQrPlaceholder: {
        width: 36,
        height: 36,
        backgroundColor: '#e2e8f0',
        alignItems: 'center',
        justifyContent: 'center',
    },

    footerAddress: {
        width: 90,
        fontSize: 5.5,
        color: C.muted,
        lineHeight: 1.5,
        textAlign: 'left',
    },

    footerAddressBold: {
        fontFamily: 'Helvetica-Bold',
        fontSize: 5.5,
        color: C.muted,
        textAlign: 'left',
    },


    sectionDivider: {
        backgroundColor: C.labelBg,
        paddingHorizontal: 8,
        paddingVertical: 5,
        borderTop: `1 solid ${C.border}`,
        borderBottom: `1 solid ${C.border}`,
    },

    sectionDividerText: {
        fontSize: 8,
        fontFamily: 'Helvetica-Bold',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        color: C.text,
    },

    // ── Info rows
    infoRow: {
        flexDirection: 'row',
        borderBottom: `1 solid ${C.border}`,
        minHeight: 15,
    },

    infoRowLast: {
        flexDirection: 'row',
        minHeight: 15,
    },

    labelCell: {
        width: 110,
        backgroundColor: C.labelBg,
        paddingHorizontal: 5,
        paddingVertical: 2,
        borderRight: `1 solid ${C.border}`,
        justifyContent: 'center',
    },

    labelCellSmall: {
        width: 70,
        backgroundColor: C.labelBg,
        paddingHorizontal: 4,
        paddingVertical: 2,
        borderRight: `1 solid ${C.border}`,
        justifyContent: 'center',
    },


    labelText: {
        fontSize: 7,
        fontFamily: 'Helvetica-Bold',
        color: C.muted,
        textTransform: 'uppercase',
    },

    valueCell: {
        flex: 1,
        paddingHorizontal: 5,
        paddingVertical: 2,
        justifyContent: 'center',
        backgroundColor: C.white,
    },

    valueCellSmall: {
        flex: 1,
        paddingHorizontal: 4,
        paddingVertical: 2,
        justifyContent: 'center',
        backgroundColor: C.white,
    },

    valueCellBordered: {
        flex: 1,
        paddingHorizontal: 5,
        paddingVertical: 2,
        justifyContent: 'center',
        backgroundColor: C.white,
        borderRight: `1 solid ${C.border}`,
    },

    valueText: {
        fontSize: 8,
        color: C.text,
    },

    valueTextSmall: {
        fontSize: 7,
        color: C.text,
    },

    emptyText: {
        fontSize: 8,
        color: '#d1d5db',
        fontStyle: 'italic',
    },

    // ── Scale legend
    legendBlock: {
        marginBottom: 8,
        padding: 8,
        backgroundColor: '#f8fafc',
        border: `1 solid ${C.border}`,
        borderRadius: 4,
    },

    legendTitle: {
        fontSize: 8,
        fontFamily: 'Helvetica-Bold',
        color: C.text,
        marginBottom: 4,
    },

    legendRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 14,
    },

    legendBullet: {
        fontSize: 7,
        color: C.muted,
        marginRight: 4,
    },

    legendText: {
        fontSize: 7,
        color: C.muted,
    },

    legendTextBold: {
        fontSize: 7,
        fontFamily: 'Helvetica-Bold',
        color: C.text,
    },

    // ── Table
    tableBlock: {
        border: `1 solid ${C.border}`,
        borderRadius: 4,
        marginBottom: 14,
        overflow: 'hidden',
    },


    tableHead: {
        flexDirection: 'row',
        backgroundColor: C.labelBg,
        borderBottom: `2 solid ${C.border}`,
    },

    thNumber: { width: 30, paddingVertical: 5, paddingHorizontal: 4, borderRight: `1 solid ${C.border}` },
    thCriterio: { flex: 1, paddingVertical: 5, paddingHorizontal: 6, borderRight: `1 solid ${C.border}` },
    thValue: { width: 34, paddingVertical: 5, paddingHorizontal: 2, borderRight: `1 solid ${C.border}` },
    thValueLast: { width: 34, paddingVertical: 5, paddingHorizontal: 2 },

    thText: {
        fontSize: 7,
        fontFamily: 'Helvetica-Bold',
        color: C.text,
        textAlign: 'center',
        textTransform: 'uppercase',
    },

    dimensionRow: {
        flexDirection: 'row',
        backgroundColor: C.dimBg,
        borderBottom: `1 solid ${C.border}`,
        borderTop: `1 solid ${C.border}`,
        paddingVertical: 4,
        paddingHorizontal: 8,
    },

    dimensionText: {
        fontSize: 8,
        fontFamily: 'Helvetica-Bold',
        color: C.dimColor,
        textTransform: 'uppercase',
    },

    questionRow: {
        flexDirection: 'row',
        borderBottom: `1 solid ${C.border}`,
        minHeight: 22,
    },

    questionRowLast: {
        flexDirection: 'row',
        minHeight: 22,
    },

    tdNumber: {
        width: 30,
        paddingVertical: 4,
        paddingHorizontal: 4,
        borderRight: `1 solid ${C.border}`,
        justifyContent: 'center',
        alignItems: 'center',
    },

    tdCriterio: {
        flex: 1,
        paddingVertical: 4,
        paddingHorizontal: 6,
        borderRight: `1 solid ${C.border}`,
        justifyContent: 'center',
    },

    tdRadio: {
        width: 34,
        paddingVertical: 4,
        justifyContent: 'center',
        alignItems: 'center',
        borderRight: `1 solid ${C.border}`,
    },

    tdRadioLast: {
        width: 34,
        paddingVertical: 4,
        justifyContent: 'center',
        alignItems: 'center',
    },

    radioSelected: {
        alignItems: 'center',
        justifyContent: 'center',
    },

    radioSelectedText: {
        fontSize: 10,
        fontFamily: 'Helvetica-Bold',
        color: '#2563eb',
    },

    radioEmpty: {},


    criterioText: {
        fontSize: 8,
        color: C.text,
        lineHeight: 1.4,
    },

    numberText: {
        fontSize: 8,
        color: C.muted,
        fontFamily: 'Helvetica-Bold',
    },

    // ── Feedback
    feedbackBlock: {
        marginBottom: 14,
        border: `1 solid ${C.border}`,
        borderRadius: 4,
        overflow: 'hidden',
    },

    feedbackHeader: {
        backgroundColor: C.labelBg,
        paddingHorizontal: 8,
        paddingVertical: 5,
        borderBottom: `1 solid ${C.border}`,
        borderLeft: `4 solid ${C.feedBorder}`,
    },

    feedbackHeaderText: {
        fontSize: 7,
        fontFamily: 'Helvetica-Bold',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        color: C.muted,
    },

    feedbackBody: {
        paddingHorizontal: 10,
        paddingVertical: 8,
        minHeight: 40,
        backgroundColor: C.white,
    },

    feedbackText: {
        fontSize: 8.5,
        color: C.text,
        lineHeight: 1.5,
    },

    // ── Signatures
    signatureSection: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 56,
        marginBottom: 8,
        paddingHorizontal: 20,
    },

    signatureBlock: {
        alignItems: 'center',
        width: 180,
    },

    signatureLine: {
        fontSize: 8,
        color: C.muted,
        letterSpacing: 0.5,
        marginBottom: 4,
    },

    signatureLabel: {
        fontSize: 8,
        fontFamily: 'Helvetica-Bold',
        color: C.text,
        textAlign: 'center',
    },
});

// ── Helpers ──────────────────────────────────────────────────────────────────
const val = (v?: string | null, fallback = '—') => (v && v.trim() !== '' ? v : fallback);

const upperName = (a?: string, b?: string) => {
    const full = `${a?.toUpperCase() ?? ''} ${b?.toUpperCase() ?? ''}`.trim();
    return full || '—';
};

// ── Sub-components ───────────────────────────────────────────────────────────
const InfoRow = ({
    label,
    value,
    isLast = false,
}: {
    label: string;
    value: string;
    isLast?: boolean;
}) => (
    <View style={isLast ? s.infoRowLast : s.infoRow}>
        <View style={s.labelCell}>
            <Text style={s.labelText}>{label}</Text>
        </View>
        <View style={s.valueCell}>
            <Text style={value === '—' ? s.emptyText : s.valueText}>{value}</Text>
        </View>
    </View>
);

// ── Main document ─────────────────────────────────────────────────────────────
const ReporteEspecialistaPDF = ({
    especialista,
    preguntas,
    dimensiones,
    escala,
    ugel,
    tituloReporte,
    descripcion,
}: ReporteEspecialistaPDFProps) => {
    const monitor = (especialista as any)?.datosMonitor ?? {};

    return (
        <Document>
            <Page size="A4" style={s.page}>

                {/* ── Institutional header (first page only) */}
                <View style={s.headerBanner}>
                    {/* Escudo Regional Puno */}
                    <View style={{ width: 46, height: 38, justifyContent: 'center', alignItems: 'center', marginRight: 2 }}>
                        <Image
                            src="https://upload.wikimedia.org/wikipedia/commons/f/fd/Escudo_regional_Puno.png"
                            style={{ width: 36, height: 36, objectFit: 'contain' }}
                        />
                    </View>

                    <View style={s.headerBlock1}>
                        <Text style={s.headerBlockText}>Gobierno{`\n`}Regional Puno</Text>
                    </View>
                    <View style={s.headerBlock2}>
                        <Text style={s.headerBlockText}>Dirección Regional de{`\n`}Educación Puno</Text>
                    </View>
                    <View style={s.headerBlock3}>
                        <Text style={s.headerBlockText}>Dirección de Gestión{`\n`}Pedagógica EBR</Text>
                    </View>
                </View>

                {/* Subtitles */}
                <View style={s.headerSubtitleContainer}>
                    <Text style={s.headerSubtitle}>
                        &quot;Año de la Esperanza y el Fortalecimiento de la Democracia&quot;
                    </Text>
                    <Text style={s.headerSubtitle}>
                        &quot;Decenio de la Igualdad de Oportunidades para Mujeres y Hombres&quot;
                    </Text>
                </View>

                {/* Page title */}
                <Text style={s.pageTitle}>
                    {descripcion ? descripcion : tituloReporte ? tituloReporte : "Ficha de Monitoreo al Especialista en el Uso del CompetenceLAB V. 2.0"}
                </Text>

                {/* ── Datos del Monitoreado ──────────────────────────────── */}
                <View style={s.sectionBlock}>
                    <View style={s.sectionHeader}>
                        <Text style={s.sectionHeaderText}>Datos del(a) Monitoreado(a):</Text>
                    </View>

                    <InfoRow label="UGEL:" value={val(ugel)} />
                    <InfoRow
                        label="APELLIDOS Y NOMBRES:"
                        value={upperName(especialista?.apellidos, especialista?.nombres)}
                    />

                    {/* DNI | EMAIL | CELULAR */}
                    <View style={s.infoRowLast}>
                        <View style={s.labelCell}><Text style={s.labelText}>DNI:</Text></View>
                        <View style={s.valueCellBordered}><Text style={s.valueText}>{val(especialista?.dni)}</Text></View>
                        <View style={s.labelCellSmall}><Text style={s.labelText}>E-MAIL:</Text></View>
                        <View style={s.valueCellBordered}><Text style={s.valueText}>{val(especialista?.email)}</Text></View>
                        <View style={s.labelCellSmall}><Text style={s.labelText}>Nº CELULAR:</Text></View>
                        <View style={s.valueCell}><Text style={s.valueText}>{val(especialista?.celular)}</Text></View>
                    </View>
                </View>

                {/* ── Datos del Monitor ──────────────────────────────────── */}
                <View style={s.sectionBlock}>
                    <View style={s.sectionHeader}>
                        <Text style={s.sectionHeaderText}>Datos del Monitor:</Text>
                    </View>

                    <InfoRow label="APELLIDOS Y NOMBRES:" value={upperName(monitor.apellidos, monitor.nombres)} />

                    {/* DNI | CARGO | EMAIL | CELULAR */}
                    <View style={s.infoRowLast}>
                        <View style={s.labelCellSmall}><Text style={s.labelText}>DNI:</Text></View>
                        <View style={s.valueCellBordered}><Text style={s.valueTextSmall}>{val(monitor.dni)}</Text></View>
                        <View style={s.labelCellSmall}><Text style={s.labelText}>CARGO:</Text></View>
                        <View style={s.valueCellBordered}><Text style={s.valueTextSmall}>{val(monitor.cargo, 'MONITOR')}</Text></View>
                        <View style={s.labelCellSmall}><Text style={s.labelText}>E-MAIL:</Text></View>
                        <View style={s.valueCellBordered}><Text style={s.valueTextSmall}>{val(monitor.email)}</Text></View>
                        <View style={s.labelCellSmall}><Text style={s.labelText}>Nº CELULAR:</Text></View>
                        <View style={s.valueCell}><Text style={s.valueTextSmall}>{val(monitor.celular)}</Text></View>
                    </View>
                </View>

                {/* ── Fecha y Duración ───────────────────────────────────── */}
                <View style={s.sectionBlock}>
                    <View style={s.sectionHeader}>
                        <Text style={s.sectionHeaderText}>Fecha y Duración:</Text>
                    </View>

                    <View style={s.infoRowLast}>
                        <View style={s.labelCell}><Text style={s.labelText}>FECHA:</Text></View>
                        <View style={s.valueCellBordered}><Text style={s.valueText}>{val(especialista?.fechaMonitoreo)}</Text></View>
                        <View style={s.labelCell}><Text style={s.labelText}>HORA INICIO:</Text></View>
                        <View style={s.valueCellBordered}><Text style={s.valueText}>{val(especialista?.horaInicio)}</Text></View>
                        <View style={s.labelCell}><Text style={s.labelText}>HORA FINAL:</Text></View>
                        <View style={s.valueCell}><Text style={s.valueText}>{val(especialista?.horaFinal)}</Text></View>
                    </View>
                </View>

                {/* ── Leyenda de escala ──────────────────────────────────── */}
                <View style={s.legendBlock}>
                    <Text style={s.legendTitle}>Escala de valoración</Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                        {escala.map((e) => (
                            <View key={String(e.alternativa)} style={s.legendRow}>
                                <Text style={s.legendBullet}>•</Text>
                                <Text style={s.legendTextBold}>{e.alternativa}</Text>
                                <Text style={s.legendText}>{' = '}{e.descripcion}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* ── Tabla de evaluación ────────────────────────────────── */}
                <View style={s.tableBlock}>
                    {/* Header row */}
                    <View style={s.tableHead}>
                        <View style={s.thNumber}><Text style={s.thText}>№</Text></View>
                        <View style={s.thCriterio}><Text style={s.thText}>Criterio</Text></View>
                        {escala.map((e, i) => (
                            <View key={String(e.alternativa)} style={i < escala.length - 1 ? s.thValue : s.thValueLast}>
                                <Text style={s.thText}>{e.alternativa}</Text>
                            </View>
                        ))}
                    </View>

                    {/* Rows */}
                    {dimensiones.length > 0 ? (
                        dimensiones.map((dim) => {
                            const qs = preguntas.filter((p) => p.dimensionId === dim.id);
                            if (qs.length === 0) return null;
                            return (
                                <React.Fragment key={dim.id}>
                                    {/* Dimension header */}
                                    <View style={s.dimensionRow}>
                                        <Text style={s.dimensionText}>{dim.nombre}</Text>
                                    </View>
                                    {qs.map((q, qi) => {
                                        const isLast = qi === qs.length - 1;
                                        return (
                                            <View key={q.id} style={isLast ? s.questionRowLast : s.questionRow}>
                                                <View style={s.tdNumber}>
                                                    <Text style={s.numberText}>{q.order}</Text>
                                                </View>
                                                <View style={s.tdCriterio}>
                                                    <Text style={s.criterioText}>{q.criterio}</Text>
                                                </View>
                                                {escala.map((e, ei) => {
                                                    const isSelected = q.alternativas?.find(
                                                        (a) => a.alternativa === e.alternativa
                                                    )?.selected;
                                                    return (
                                                        <View
                                                            key={String(e.alternativa)}
                                                            style={ei < escala.length - 1 ? s.tdRadio : s.tdRadioLast}
                                                        >
                                                            {isSelected
                                                                ? <View style={s.radioSelected}><Text style={s.radioSelectedText}>X</Text></View>
                                                                : <View style={s.radioEmpty} />}
                                                        </View>
                                                    );
                                                })}
                                            </View>
                                        );
                                    })}
                                </React.Fragment>
                            );
                        })
                    ) : (
                        // Sin dimensiones: mostrar preguntas planas
                        preguntas.map((q, qi) => {
                            const isLast = qi === preguntas.length - 1;
                            return (
                                <View key={q.id} style={isLast ? s.questionRowLast : s.questionRow}>
                                    <View style={s.tdNumber}>
                                        <Text style={s.numberText}>{qi + 1}</Text>
                                    </View>
                                    <View style={s.tdCriterio}>
                                        <Text style={s.criterioText}>{q.criterio}</Text>
                                    </View>
                                    {escala.map((e, ei) => {
                                        const isSelected = q.alternativas?.find(
                                            (a) => a.alternativa === e.alternativa
                                        )?.selected;
                                        return (
                                            <View
                                                key={String(e.alternativa)}
                                                style={ei < escala.length - 1 ? s.tdRadio : s.tdRadioLast}
                                            >
                                                {isSelected
                                                    ? <View style={s.radioSelected}><Text style={s.radioSelectedText}>X</Text></View>
                                                    : <View style={s.radioEmpty} />}
                                            </View>
                                        );
                                    })}
                                </View>
                            );
                        })
                    )}
                </View>

                {/* ── Footer fijo — página 1 */}
                <View style={s.footer} fixed>
                    <Text style={s.footerLegal}>
                        <Text style={s.footerLegalBold}>&quot;</Text>
                        Esta es una representación impresa cuya autenticidad puede ser contrastada con la representación imprimible localizada en la sede digital del Gobierno Regional Puno, aplicando lo dispuesto por el Art. 25 de D.S. 070–2013-PCM y la Tercera Disposición Complementaria Final del D.S. 026-2016-PCM. Su autenticidad e integridad pueden ser contrastadas a través de la siguiente dirección web:{' '}
                        <Text style={s.footerLegalBold}>https://sgd.regionpuno.gob.pe/verificadoc/inicio.do</Text>
                        {' '}e ingresando la siguiente clave:{' '}
                        <Text style={s.footerLegalBold}>90VDMPT&quot;</Text>
                    </Text>
                    <View style={s.footerQrPlaceholder}>
                        <Text style={{ fontSize: 5, color: '#94a3b8' }}>QR</Text>
                    </View>
                    <View style={{ width: 90 }}>
                        <Text style={s.footerAddress}>
                            Jr. Bustamante Dueñas 881 - Urb II{'\n'}Etapa Chanu Chanu – Puno
                        </Text>
                        <Text style={{ ...s.footerAddress, marginTop: 4 }}>
                            <Text style={s.footerAddressBold}>Nro. Exp: </Text>
                        </Text>
                    </View>
                </View>

            </Page>

            {/* ══ PÁGINA 2: Retroalimentación, Firmas ══════════════════════ */}
            <Page size="A4" style={s.page}>

                {/* ── Retroalimentación Dinámica ──────────────────────────── */}
                {especialista?.retroalimentacionDinamica && especialista.retroalimentacionDinamica.length > 0 ? (
                    especialista.retroalimentacionDinamica.map((item, index) => (
                        <FeedbackBlock key={index} label={item.etiqueta} value={item.contenido} />
                    ))
                ) : (
                    // Fallback para datos antiguos
                    <>
                        <FeedbackBlock label="AVANCES" value={especialista?.avancesRetroalimentacion} />
                        <FeedbackBlock label="DIFICULTADES" value={especialista?.dificultadesRetroalimentacion} />
                        <FeedbackBlock label="COMPROMISOS" value={especialista?.compromisosRetroalimentacion} />
                    </>
                )}

                {/* ── Firmas ──────────────────────────────────────────── */}
                <View style={s.signatureSection}>
                    <View style={s.signatureBlock}>
                        <Text style={s.signatureLine}>
                            ............................................
                        </Text>
                        <Text style={s.signatureLabel}>Firma Especialista UGEL</Text>
                    </View>
                    <View style={s.signatureBlock}>
                        <Text style={s.signatureLine}>
                            ............................................
                        </Text>
                        <Text style={s.signatureLabel}>Firma Especialista DREP</Text>
                    </View>
                </View>

                {/* ── Footer fijo — aparece en todas las páginas */}
                <View style={s.footer} fixed>
                    {/* Texto legal */}
                    <Text style={s.footerLegal}>
                        <Text style={s.footerLegalBold}>&quot;</Text>
                        Esta es una representación impresa cuya autenticidad puede ser contrastada con la representación imprimible localizada en la sede digital del Gobierno Regional Puno, aplicando lo dispuesto por el Art. 25 de D.S. 070–2013-PCM y la Tercera Disposición Complementaria Final del D.S. 026-2016-PCM. Su autenticidad e integridad pueden ser contrastadas a través de la siguiente dirección web:{' '}
                        <Text style={s.footerLegalBold}>https://sgd.regionpuno.gob.pe/verificadoc/inicio.do</Text>
                        {' '}e ingresando la siguiente clave:{' '}
                        <Text style={s.footerLegalBold}>90VDMPT&quot;</Text>
                    </Text>

                    {/* QR placeholder */}
                    <View style={s.footerQrPlaceholder}>
                        <Text style={{ fontSize: 5, color: '#94a3b8' }}>QR</Text>
                    </View>

                    {/* Dirección */}
                    <View style={{ width: 90 }}>
                        <Text style={s.footerAddress}>
                            Jr. Bustamante Dueñas 881 - Urb II{`\n`}Etapa Chanu Chanu – Puno
                        </Text>
                        <Text style={{ ...s.footerAddress, marginTop: 4 }}>
                            <Text style={s.footerAddressBold}>Nro. Exp: </Text>
                        </Text>
                    </View>
                </View>

            </Page>
        </Document>
    );
};

// ── Feedback block sub-component ─────────────────────────────────────────────
const FeedbackBlock = ({ label, value }: { label: string; value?: string }) => (
    <View style={s.feedbackBlock}>
        <View style={s.feedbackHeader}>
            <Text style={s.feedbackHeaderText}>{label}:</Text>
        </View>
        <View style={s.feedbackBody}>
            <Text style={value ? s.feedbackText : { ...s.feedbackText, color: '#9ca3af', fontStyle: 'italic' }}>
                {value || `Sin ${label.toLowerCase()} registrados.`}
            </Text>
        </View>
    </View>
);

export default ReporteEspecialistaPDF;

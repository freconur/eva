import React, { useRef, useEffect } from 'react';
import {
  RiFeedbackLine,
  RiInformationLine,
  RiSave3Line,
  RiAddLine,
  RiCloseLine,
  RiArrowGoBackLine,
  RiLightbulbLine,
  RiEditLine,
} from 'react-icons/ri';
import { RetroalimentacionDinamica } from '@/features/types/types';

interface RetroalimentacionSectionProps {
  retroalimentacionDinamica: RetroalimentacionDinamica[];
  isAutoreporte: boolean;
  isAdmin?: boolean;
  isTemplateDirty?: boolean;
  isSavingTemplateConfig?: boolean;
  handleSaveTemplateConfig?: () => Promise<void> | void;
  handleDiscardTemplateChanges?: () => void;
  handleAddFeedbackField?: () => void;
  handleRemoveFeedbackField?: (index: number) => void;
  handleChangeFeedbackLabel?: (index: number, newLabel: string) => void;
  handleChangeFeedbackDescription?: (index: number, newDescription: string) => void;
  handleChangeFeedbackValue: (index: number, newValue: string) => void;
}

const RetroalimentacionSection: React.FC<RetroalimentacionSectionProps> = ({
  retroalimentacionDinamica,
  isAutoreporte,
  isAdmin = false,
  isTemplateDirty = false,
  isSavingTemplateConfig = false,
  handleSaveTemplateConfig,
  handleDiscardTemplateChanges,
  handleAddFeedbackField,
  handleRemoveFeedbackField,
  handleChangeFeedbackLabel,
  handleChangeFeedbackDescription,
  handleChangeFeedbackValue,
}) => {
  // Solo los administradores (y cuando no sea autorreporte) pueden gestionar la estructura y plantilla de campos
  const canManageFields = Boolean(isAdmin && !isAutoreporte);

  // Referencias para auto-scroll suave hacia el nuevo campo agregado
  const prevLengthRef = useRef(retroalimentacionDinamica.length);
  const shouldScrollToNewRef = useRef(false);

  const onAddClick = () => {
    shouldScrollToNewRef.current = true;
    if (handleAddFeedbackField) {
      handleAddFeedbackField();
    }
  };

  useEffect(() => {
    // Si se agregó un nuevo campo por clic del usuario, hacer scroll suave hacia él y enfocarlo
    if (retroalimentacionDinamica.length > prevLengthRef.current && shouldScrollToNewRef.current) {
      shouldScrollToNewRef.current = false;
      const lastIndex = retroalimentacionDinamica.length - 1;
      setTimeout(() => {
        const targetElement = document.getElementById(`feedback_group_${lastIndex}`);
        if (targetElement) {
          targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        const titleInput = document.getElementById(`feedback_label_${lastIndex}`) as HTMLInputElement | null;
        if (titleInput) {
          titleInput.focus();
          if (typeof titleInput.select === 'function') {
            titleInput.select();
          }
        }
      }, 120);
    }
    prevLengthRef.current = retroalimentacionDinamica.length;
  }, [retroalimentacionDinamica.length]);

  return (
    <div className="w-full max-w-5xl mx-auto my-8 bg-white border border-slate-200/90 rounded-3xl shadow-xs p-6 sm:p-8 space-y-7">
      {/* Cabecera Principal de la Sección */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100/90 shrink-0 shadow-2xs">
            <RiFeedbackLine className="text-xl" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h3 className="text-base sm:text-lg font-extrabold text-slate-800 tracking-tight">
                RETROALIMENTACIÓN CUALITATIVA
              </h3>
              {canManageFields && (
                <span className="inline-flex items-center px-2.5 py-0.5 text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200/80 rounded-md uppercase tracking-wider">
                  Configuración Plantilla
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Guías orientadoras y valoraciones cualitativas correspondientes a esta evaluación.
            </p>
          </div>
        </div>

        {/* Acciones de Cabecera para Administrador */}
        {canManageFields && (
          <div className="flex items-center gap-2.5 self-end sm:self-auto shrink-0">
            {isTemplateDirty && handleDiscardTemplateChanges && (
              <button
                type="button"
                onClick={handleDiscardTemplateChanges}
                disabled={isSavingTemplateConfig}
                className="inline-flex items-center gap-1 px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer"
              >
                <RiArrowGoBackLine className="text-xs" />
                <span>Descartar</span>
              </button>
            )}
            {isTemplateDirty && handleSaveTemplateConfig && (
              <button
                type="button"
                onClick={handleSaveTemplateConfig}
                disabled={isSavingTemplateConfig}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
                title="Guardar cambios de la plantilla en la evaluación"
              >
                <RiSave3Line className="text-sm" />
                <span>{isSavingTemplateConfig ? 'Guardando...' : 'Guardar Plantilla'}</span>
              </button>
            )}
            {handleAddFeedbackField && (
              <button
                type="button"
                onClick={onAddClick}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs hover:shadow transition-all cursor-pointer"
              >
                <RiAddLine className="text-sm" />
                <span>+ Agregar campo</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Banner de Aviso de Cambios Pendientes en la Plantilla */}
      {canManageFields && isTemplateDirty && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-amber-50/90 border border-amber-200 text-amber-900 rounded-2xl text-xs font-medium">
          <div className="flex items-center gap-2.5">
            <RiInformationLine className="text-amber-600 text-lg shrink-0" />
            <div>
              <span className="font-bold">Tienes modificaciones sin guardar en la plantilla.</span>
              <p className="text-amber-800 text-[11px] mt-0.5">
                Los cambios se mantendrán en memoria hasta presionar &quot;Guardar Plantilla&quot;.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            {handleDiscardTemplateChanges && (
              <button
                type="button"
                onClick={handleDiscardTemplateChanges}
                disabled={isSavingTemplateConfig}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-slate-600 hover:text-slate-900 hover:bg-amber-100 rounded-xl transition-colors cursor-pointer"
              >
                <span>Descartar</span>
              </button>
            )}
            {handleSaveTemplateConfig && (
              <button
                type="button"
                onClick={handleSaveTemplateConfig}
                disabled={isSavingTemplateConfig}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs transition-all cursor-pointer"
              >
                <RiSave3Line className="text-xs" />
                <span>{isSavingTemplateConfig ? 'Guardando...' : 'Guardar Plantilla'}</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Lista de Secciones de Retroalimentación Organizadas en Tarjetas */}
      <div className="space-y-6">
        {retroalimentacionDinamica.map((item, index) => {
          // CLAVE ESTABLE E INMUTABLE: nunca cambia al editar el texto, evitando la pérdida de foco
          const itemKey = item.id || `feedback_field_${index}`;
          const fieldId = `feedback_content_${index}_${(item.etiqueta || '').toLowerCase().replace(/\s+/g, '_')}`;
          const hasDescription = Boolean(item.descripcion && item.descripcion.trim().length > 0);

          return (
            <div
              key={itemKey}
              id={`feedback_group_${index}`}
              className="bg-slate-50/70 hover:bg-slate-50/90 border border-slate-200/80 hover:border-slate-300 rounded-2xl p-5 sm:p-6 space-y-4 transition-all duration-200 focus-within:ring-2 focus-within:ring-blue-500/10 focus-within:border-blue-400 focus-within:bg-white shadow-2xs"
            >
              {/* Cabecera del Campo: Badge numerado + Título en azul + Botón circular (X) */}
              <div className="flex items-center justify-between gap-3 pb-2 border-b border-slate-200/60">
                <div className="flex items-center gap-2.5 flex-1">
                  <span className="w-6 h-6 rounded-lg bg-blue-100/80 text-blue-700 font-bold text-xs flex items-center justify-center shrink-0">
                    {index + 1}
                  </span>

                  {canManageFields && handleChangeFeedbackLabel ? (
                    <div className="flex items-center gap-2 flex-1 max-w-md">
                      <input
                        id={`feedback_label_${index}`}
                        name={`feedback_label_${index}`}
                        className="font-bold text-sm sm:text-base text-blue-600 uppercase tracking-wide bg-white/90 hover:bg-white focus:bg-white border border-slate-200/90 focus:border-blue-500 rounded-xl px-3 py-1.5 outline-none transition-all shadow-2xs focus:ring-2 focus:ring-blue-500/20 w-full"
                        value={item.etiqueta}
                        onChange={e => handleChangeFeedbackLabel(index, e.target.value)}
                        placeholder="Título del campo..."
                      />
                    </div>
                  ) : (
                    <h4 className="font-bold text-sm sm:text-base text-blue-600 uppercase tracking-wide">
                      {item.etiqueta || `SECCIÓN ${index + 1}`}
                    </h4>
                  )}
                </div>

                {canManageFields && handleRemoveFeedbackField && (
                  <button
                    type="button"
                    onClick={() => handleRemoveFeedbackField(index)}
                    className="w-8 h-8 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-500 hover:text-rose-600 flex items-center justify-center transition-all cursor-pointer border border-rose-100 shadow-2xs shrink-0"
                    title="Eliminar campo"
                  >
                    <RiCloseLine className="text-lg" />
                  </button>
                )}
              </div>

              {/* Guía u orientación orientadora para el evaluador */}
              {canManageFields && handleChangeFeedbackDescription ? (
                <div className="space-y-1.5">
                  <label
                    htmlFor={`feedback_desc_${index}`}
                    className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider"
                  >
                    <RiLightbulbLine className="text-amber-500 text-xs" />
                    <span>Guía u orientación de la plantilla para el evaluador:</span>
                  </label>
                  <div className="p-2 sm:p-2.5 bg-white border border-slate-200/90 rounded-xl shadow-2xs">
                    <textarea
                      id={`feedback_desc_${index}`}
                      name={`feedback_desc_${index}`}
                      className="w-full bg-slate-50/50 border border-dashed border-slate-300 rounded-lg p-2.5 text-xs italic text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-blue-400 focus:bg-white transition-all resize-y min-h-[46px] leading-relaxed"
                      value={item.descripcion || ''}
                      onChange={e => handleChangeFeedbackDescription(index, e.target.value)}
                      placeholder="Ej. Aquí debe detallar en qué situaciones el especialista presentó un déficit..."
                      rows={2}
                    />
                  </div>
                </div>
              ) : (
                !canManageFields &&
                hasDescription && (
                  <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-xl text-xs italic text-blue-900 leading-relaxed flex items-start gap-2.5">
                    <RiInformationLine className="text-blue-500 text-sm shrink-0 mt-0.5" />
                    <span>{item.descripcion}</span>
                  </div>
                )
              )}

              {/* Textarea de redacción del evaluador */}
              <div className="space-y-1.5 pt-1">
                <label
                  htmlFor={fieldId}
                  className="flex items-center gap-1.5 text-xs font-semibold text-slate-700"
                >
                  <RiEditLine className="text-slate-400 text-xs" />
                  <span>
                    Observaciones y redacción para{' '}
                    <span className="font-bold text-blue-600 uppercase">
                      {item.etiqueta || `Sección ${index + 1}`}
                    </span>
                    :
                  </span>
                </label>
                <textarea
                  id={fieldId}
                  name={fieldId}
                  className="w-full min-h-[120px] p-4 text-sm text-slate-800 bg-white border border-slate-200/90 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all resize-y placeholder:text-slate-400 placeholder:italic leading-relaxed shadow-2xs"
                  placeholder={`Describa ${(item.etiqueta || '').toLowerCase()}...`}
                  value={item.contenido}
                  onChange={e => handleChangeFeedbackValue(index, e.target.value)}
                  rows={4}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RetroalimentacionSection;

import React, { useState, useRef, useEffect } from 'react';
import styles from './PaletteColorPopover.module.css';
import { db } from '@/firebase/firebase.config';
import { doc, onSnapshot } from 'firebase/firestore';

interface PaletteColorPopoverProps {
  color: string;
  onChange: (color: string) => void;
  palette?: string[];
  disabled?: boolean;
}

const DEFAULT_PALETTE = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899',
  '#06B6D4', '#84CC16', '#64748B', '#F97316', '#14B8A6', '#A855F7',
  '#0284C7', '#059669', '#D97706', '#DC2626', '#7C3AED', '#DB2777'
];

export const PaletteColorPopover: React.FC<PaletteColorPopoverProps> = ({
  color = '#3B82F6',
  onChange,
  palette: customPalette,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [palette, setPalette] = useState<string[]>(customPalette && customPalette.length > 0 ? customPalette : DEFAULT_PALETTE);
  const [hexInput, setHexInput] = useState(color || '#3B82F6');
  const containerRef = useRef<HTMLDivElement>(null);

  // Sincronizar paleta desde Firestore si no se pasa como prop personalizada
  useEffect(() => {
    if (customPalette && customPalette.length > 0) {
      setPalette(customPalette);
      return;
    }

    try {
      const globalPaletteRef = doc(db, 'configuraciones', 'paletaColoresEspecialistas');
      const unsubscribe = onSnapshot(globalPaletteRef, (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data?.palette && Array.isArray(data.palette) && data.palette.length > 0) {
            setPalette(data.palette);
          }
        }
      });
      return () => unsubscribe();
    } catch (e) {
      console.warn('Error suscribiéndose a la paleta de colores global', e);
    }
  }, [customPalette]);

  // Sincronizar input de texto cuando cambie el color
  useEffect(() => {
    setHexInput((color || '#3B82F6').toUpperCase());
  }, [color]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const isValidHex = (hex: string) => /^#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})$/.test(hex);

  const handleHexTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.trim();
    if (val && !val.startsWith('#')) {
      val = '#' + val;
    }
    val = val.toUpperCase();
    setHexInput(val);
    if (isValidHex(val)) {
      onChange(val);
    }
  };

  const handleSelectColor = (hex: string) => {
    onChange(hex);
    setHexInput(hex.toUpperCase());
    setIsOpen(false);
  };

  const currentColor = color || '#3B82F6';

  return (
    <div className={styles.wrapper} ref={containerRef}>
      <button
        type="button"
        disabled={disabled}
        className={`${styles.triggerBtn} ${isOpen ? styles.triggerBtnActive : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        title="Seleccionar color de la paleta"
      >
        <span className={styles.colorPreviewDot} style={{ backgroundColor: currentColor }} />
        <span className={styles.hexText}>{currentColor.toUpperCase()}</span>
        <span className={styles.chevron} style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>
          ▼
        </span>
      </button>

      {isOpen && (
        <div className={styles.popover}>
          <span className={styles.popoverTitle}>Paleta de colores:</span>
          
          <div className={styles.swatchesGrid}>
            {palette.map((hex, idx) => {
              const isActive = currentColor.toLowerCase() === hex.toLowerCase();
              return (
                <button
                  key={`${hex}-${idx}`}
                  type="button"
                  className={`${styles.swatchBtn} ${isActive ? styles.swatchActive : ''}`}
                  style={{ backgroundColor: hex }}
                  onClick={() => handleSelectColor(hex)}
                  title={hex}
                />
              );
            })}
          </div>

          <div className={styles.divider} />

          <div className={styles.customColorRow}>
            <span className={styles.customLabel}>Personalizado:</span>
            <div className={styles.customInputs}>
              <input
                type="color"
                className={styles.nativeColorInput}
                value={isValidHex(currentColor) ? currentColor : '#3B82F6'}
                onChange={(e) => {
                  onChange(e.target.value);
                  setHexInput(e.target.value.toUpperCase());
                }}
                title="Selector de color personalizado"
              />
              <input
                type="text"
                className={styles.customHexInput}
                value={hexInput}
                onChange={handleHexTextChange}
                placeholder="#HEX"
                maxLength={7}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaletteColorPopover;

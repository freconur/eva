import React, { useState, useRef, useEffect, useMemo } from 'react';
import { RiArrowDownSLine, RiSearchLine, RiCheckLine, RiCloseLine } from 'react-icons/ri';
import styles from './CustomFilterDropdown.module.css';

export interface FilterOption {
  value: string;
  label: string;
  badge?: string;
  badgeType?: 'success' | 'neutral' | 'warning';
  icon?: React.ReactNode;
}

interface CustomFilterDropdownProps {
  label?: string;
  icon?: string | React.ReactNode;
  value: string;
  options: FilterOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  showSearch?: boolean;
  minWidth?: number | string;
  className?: string;
  disabled?: boolean;
}

export const CustomFilterDropdown: React.FC<CustomFilterDropdownProps> = ({
  label,
  icon,
  value,
  options,
  onChange,
  placeholder = 'Seleccionar...',
  showSearch = false,
  minWidth,
  className = '',
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedOption = useMemo(
    () => options.find((opt) => opt.value === value),
    [options, value]
  );

  // Cerrar al hacer clic fuera del componente
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen]);

  // Cerrar con la tecla Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        e.preventDefault();
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Autoenfocar input de búsqueda al abrir
  useEffect(() => {
    if (isOpen && showSearch && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  }, [isOpen, showSearch]);

  // Búsqueda inteligente multi-palabra, insensible a tildes, mayúsculas y signos
  const normalizeText = (text: string) =>
    text
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9\s]/g, ' ')
      .toLowerCase()
      .trim();

  const filteredOptions = useMemo(() => {
    if (!searchTerm.trim()) return options;
    const terms = normalizeText(searchTerm).split(/\s+/).filter(Boolean);
    if (terms.length === 0) return options;

    return options.filter((opt) => {
      const normLabel = normalizeText(opt.label);
      const normBadge = opt.badge ? normalizeText(opt.badge) : '';
      const combined = `${normLabel} ${normBadge}`;
      return terms.every((t) => combined.includes(t));
    });
  }, [options, searchTerm]);

  const handleSelect = (val: string) => {
    onChange(val);
    setIsOpen(false);
    setSearchTerm('');
  };

  return (
    <div className={`${styles.container} ${className}`} ref={containerRef}>
      {label && (
        <label className={styles.label}>
          {icon && <span>{icon}</span>}
          <span>{label}</span>
        </label>
      )}

      <div className={styles.dropdownWrapper}>
        <button
          type="button"
          className={`${styles.trigger} ${isOpen ? styles.triggerOpen : ''} ${disabled ? styles.triggerDisabled : ''}`}
          style={minWidth ? { minWidth } : undefined}
          onClick={() => {
            if (!disabled) {
              setIsOpen((prev) => !prev);
            }
          }}
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-disabled={disabled}
        >
          <div className={styles.triggerContent}>
            <span className={styles.triggerText}>
              {selectedOption ? selectedOption.label : placeholder}
            </span>
            {selectedOption?.badge && (
              <span
                className={
                  selectedOption.badgeType === 'success'
                    ? styles.badgeSuccess
                    : selectedOption.badgeType === 'warning'
                    ? styles.badgeWarning
                    : styles.badgeNeutral
                }
              >
                {selectedOption.badge}
              </span>
            )}
          </div>
          <RiArrowDownSLine
            className={`${styles.arrowIcon} ${isOpen ? styles.arrowRotate : ''}`}
          />
        </button>

        {isOpen && (
          <div className={styles.menu} role="listbox">
            {showSearch && (
              <div className={styles.searchWrapper}>
                <RiSearchLine className={styles.searchIcon} />
                <input
                  ref={searchInputRef}
                  type="text"
                  className={styles.searchInput}
                  placeholder="Buscar..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                  <button
                    type="button"
                    className={styles.clearSearchBtn}
                    onClick={() => setSearchTerm('')}
                    title="Limpiar búsqueda"
                  >
                    <RiCloseLine />
                  </button>
                )}
              </div>
            )}

            <div className={styles.optionsList}>
              {filteredOptions.length > 0 ? (
                filteredOptions.map((opt) => {
                  const isSelected = opt.value === value;
                  return (
                    <div
                      key={opt.value}
                      className={`${styles.optionItem} ${
                        isSelected ? styles.optionSelected : ''
                      }`}
                      onClick={() => handleSelect(opt.value)}
                      role="option"
                      aria-selected={isSelected}
                    >
                      <div className={styles.optionTextGroup}>
                        {opt.icon && <span>{opt.icon}</span>}
                        <span>{opt.label}</span>
                        {opt.badge && (
                          <span
                            className={
                              opt.badgeType === 'success'
                                ? styles.badgeSuccess
                                : opt.badgeType === 'warning'
                                ? styles.badgeWarning
                                : styles.badgeNeutral
                            }
                          >
                            {opt.badge}
                          </span>
                        )}
                      </div>
                      {isSelected && <RiCheckLine className={styles.checkIcon} />}
                    </div>
                  );
                })
              ) : (
                <div className={styles.noResults}>No se encontraron resultados</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomFilterDropdown;

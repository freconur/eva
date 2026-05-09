import React, { useState, useRef, useEffect } from 'react';
import { RiArrowDownSLine, RiSearchLine, RiCheckLine } from 'react-icons/ri';
import styles from './CustomDropdown.module.css';

interface Option {
  id: number;
  region: string;
}

interface CustomDropdownProps {
  options: Option[];
  value?: number;
  onChange: (value: number | undefined) => void;
  placeholder?: string;
  label?: string;
}

const CustomDropdown = ({ options, value, onChange, placeholder = "Seleccionar...", label }: CustomDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(opt => opt.id === value);

  const filteredOptions = options.filter(opt =>
    opt.region.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (optionId: number | undefined) => {
    onChange(optionId);
    setIsOpen(false);
    setSearchTerm('');
  };

  return (
    <div className={styles.dropdownContainer} ref={dropdownRef}>
      {label && <label className={styles.label}>{label}</label>}
      <div 
        className={`${styles.dropdownHeader} ${isOpen ? styles.headerOpen : ''}`} 
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className={selectedOption ? styles.selectedValue : styles.placeholder}>
          {selectedOption ? selectedOption.region : placeholder}
        </span>
        <RiArrowDownSLine className={`${styles.arrowIcon} ${isOpen ? styles.arrowRotate : ''}`} />
      </div>

      {isOpen && (
        <div className={styles.dropdownList}>
          <div className={styles.searchWrapper}>
            <RiSearchLine className={styles.searchIcon} />
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Buscar región..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              autoFocus
            />
          </div>
          <div className={styles.optionsList}>
            <div 
              className={`${styles.optionItem} ${!value ? styles.optionSelected : ''}`}
              onClick={() => handleSelect(undefined)}
            >
              <span>Todas las regiones</span>
              {!value && <RiCheckLine className={styles.checkIcon} />}
            </div>
            {filteredOptions.map((option) => (
              <div 
                key={option.id} 
                className={`${styles.optionItem} ${value === option.id ? styles.optionSelected : ''}`}
                onClick={() => handleSelect(option.id)}
              >
                <span>{option.region}</span>
                {value === option.id && <RiCheckLine className={styles.checkIcon} />}
              </div>
            ))}
            {filteredOptions.length === 0 && (
              <div className={styles.noResults}>No se encontraron resultados</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomDropdown;

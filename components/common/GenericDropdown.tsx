import React, { useState, useRef, useEffect } from 'react';
import { RiArrowDownSLine, RiCheckLine } from 'react-icons/ri';

interface DropdownOption {
    id: string | number;
    name: string;
}

interface GenericDropdownProps {
    options: DropdownOption[];
    value: string | number;
    onChange: (value: string) => void;
    placeholder: string;
    icon?: React.ReactNode;
    allOptionsLabel?: string;
    className?: string;
}

const GenericDropdown: React.FC<GenericDropdownProps> = ({
    options,
    value,
    onChange,
    placeholder,
    icon,
    allOptionsLabel,
    className = '',
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Find the currently selected option name
    const selectedOption = options.find((opt) => String(opt.id) === String(value));

    // Handle clicks outside of the dropdown to close it
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (optionId: string) => {
        onChange(optionId);
        setIsOpen(false);
    };

    return (
        <div className={`relative ${className}`} ref={dropdownRef}>
            {/* Header Trigger */}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`flex w-full items-center justify-between gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-sm transition-all hover:bg-gray-50 active:scale-[0.99] focus:border-colorTercero focus:ring-2 focus:ring-colorTercero focus:ring-opacity-20 outline-none ${
                    isOpen ? 'border-colorTercero ring-2 ring-colorTercero ring-opacity-20' : ''
                }`}
            >
                <div className="flex items-center gap-2 truncate">
                    {icon && <span className="text-gray-400 flex-shrink-0">{icon}</span>}
                    <span className={`truncate ${!selectedOption && value === '' ? 'text-gray-400 font-normal' : 'text-gray-800'}`}>
                        {selectedOption ? selectedOption.name : allOptionsLabel || placeholder}
                    </span>
                </div>
                <RiArrowDownSLine
                    className={`h-5 w-5 text-gray-400 transition-transform duration-300 flex-shrink-0 ${
                        isOpen ? 'rotate-180' : ''
                    }`}
                />
            </button>

            {/* Dropdown Options List */}
            {isOpen && (
                <div className="absolute left-0 mt-2 z-30 w-full min-w-[200px] origin-top-right rounded-xl border border-gray-100 bg-white p-1.5 shadow-xl ring-1 ring-black ring-opacity-5 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="max-h-60 overflow-y-auto custom-scrollbar">
                        {/* Option for "All" / Reset */}
                        {allOptionsLabel && (
                            <button
                                type="button"
                                onClick={() => handleSelect('')}
                                className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
                                    value === ''
                                        ? 'bg-blue-50 font-semibold text-blue-700'
                                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                }`}
                            >
                                <span className="truncate">{allOptionsLabel}</span>
                                {value === '' && <RiCheckLine className="h-4 w-4 text-blue-600 flex-shrink-0" />}
                            </button>
                        )}

                        {options.map((option) => {
                            const isSelected = String(option.id) === String(value);
                            return (
                                <button
                                    key={option.id}
                                    type="button"
                                    onClick={() => handleSelect(String(option.id))}
                                    className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
                                        isSelected
                                            ? 'bg-blue-50 font-semibold text-blue-700'
                                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                    }`}
                                >
                                    <span className="truncate">{option.name}</span>
                                    {isSelected && <RiCheckLine className="h-4 w-4 text-blue-600 flex-shrink-0" />}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

export default GenericDropdown;

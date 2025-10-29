import React, { useRef, useState } from 'react';
import { RiUploadLine, RiFileExcelLine, RiCloseLine } from 'react-icons/ri';
import { validarArchivoExcel } from '@/features/utils/excelProcessor';
import styles from './FileUploader.module.css';

interface FileUploaderProps {
  onFileSelect: (file: File) => void;
  isLoading: boolean;
  error: string | null;
  selectedFile: File | null;
}

const FileUploader: React.FC<FileUploaderProps> = ({
  onFileSelect,
  isLoading,
  error,
  selectedFile
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleFileSelect = (file: File) => {
    if (!validarArchivoExcel(file)) {
      return;
    }
    onFileSelect(file);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveFile = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onFileSelect(null as any);
  };

  return (
    <div className={styles.fileUploaderContainer}>
      <div
        className={`${styles.dropZone} ${isDragOver ? styles.dragOver : ''} ${error ? styles.error : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls"
          onChange={handleInputChange}
          className={styles.hiddenInput}
          disabled={isLoading}
        />
        
        {selectedFile ? (
          <div className={styles.selectedFile}>
            <RiFileExcelLine className={styles.fileIcon} />
            <div className={styles.fileInfo}>
              <span className={styles.fileName}>{selectedFile.name}</span>
              <span className={styles.fileSize}>
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </span>
            </div>
            <button
              type="button"
              className={styles.removeButton}
              onClick={(e) => {
                e.stopPropagation();
                handleRemoveFile();
              }}
            >
              <RiCloseLine />
            </button>
          </div>
        ) : (
          <div className={styles.uploadPrompt}>
            <RiUploadLine className={styles.uploadIcon} />
            <div className={styles.uploadText}>
              <p className={styles.uploadTitle}>
                {isLoading ? 'Procesando archivo...' : 'Arrastra tu archivo Excel aquí'}
              </p>
              <p className={styles.uploadSubtitle}>
                o haz clic para seleccionar un archivo
              </p>
              <p className={styles.uploadFormat}>
                Formatos soportados: .xlsx, .xls
              </p>
            </div>
          </div>
        )}
        
        {isLoading && (
          <div className={styles.loadingOverlay}>
            <div className={styles.loadingSpinner}></div>
          </div>
        )}
      </div>
      
      {error && (
        <div className={styles.errorMessage}>
          <span className={styles.errorIcon}>⚠️</span>
          {error}
        </div>
      )}
    </div>
  );
};

export default FileUploader;

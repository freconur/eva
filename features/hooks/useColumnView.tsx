import { useState, useCallback } from 'react';

export type ColumnView = '1-column' | '2-columns' | '3-columns';

export const useColumnView = (initialView: ColumnView = '2-columns') => {
  const [columnView, setColumnView] = useState<ColumnView>(initialView);

  const toggleColumnView = useCallback(() => {
    setColumnView(prev => {
      if (prev === '1-column') return '2-columns';
      if (prev === '2-columns') return '3-columns';
      return '1-column';
    });
  }, []);

  const setColumnView1 = useCallback(() => {
    setColumnView('1-column');
  }, []);

  const setColumnView2 = useCallback(() => {
    setColumnView('2-columns');
  }, []);

  const setColumnView3 = useCallback(() => {
    setColumnView('3-columns');
  }, []);

  return {
    columnView,
    toggleColumnView,
    setColumnView1,
    setColumnView2,
    setColumnView3,
    is1Column: columnView === '1-column',
    is2Columns: columnView === '2-columns',
    is3Columns: columnView === '3-columns'
  };
};

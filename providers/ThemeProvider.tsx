import React, { createContext, useContext, useMemo } from 'react';
import { theme, Theme } from '../src/design/theme';

const ThemeCtx = createContext<Theme>(theme);
export const useTheme = () => useContext(ThemeCtx);

export const ThemeProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const value = useMemo(() => theme, []);
  return <ThemeCtx.Provider value={value}>{children}</ThemeCtx.Provider>;
};
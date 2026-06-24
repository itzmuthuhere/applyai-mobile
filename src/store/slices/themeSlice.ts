import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ThemeMode, AccentColor } from '../../theme/themes';

interface ThemeState {
  mode: ThemeMode;
  accent: AccentColor;
}

const initialState: ThemeState = { mode: 'light', accent: 'blue' };

const themeSlice = createSlice({
  name: 'theme',
  initialState,
  reducers: {
    setMode: (state, action: PayloadAction<ThemeMode>) => { state.mode = action.payload; },
    setAccent: (state, action: PayloadAction<AccentColor>) => { state.accent = action.payload; },
    toggleMode: (state) => { state.mode = state.mode === 'light' ? 'dark' : 'light'; },
  },
});

export const { setMode, setAccent, toggleMode } = themeSlice.actions;
export default themeSlice.reducer;

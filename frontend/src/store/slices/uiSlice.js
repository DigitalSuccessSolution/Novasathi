import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  isLoginModalOpen: false,
  language: localStorage.getItem('language') || 'en',
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleLoginModal: (state, action) => {
      state.isLoginModalOpen = action.payload !== undefined ? action.payload : !state.isLoginModalOpen;
    },
    setLanguage: (state, action) => {
      state.language = action.payload;
      localStorage.setItem('language', action.payload);
    },
  },
});

export const { toggleLoginModal, setLanguage } = uiSlice.actions;
export default uiSlice.reducer;

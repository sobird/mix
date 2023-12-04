/**
 * app slice
 *
 * sobird<i@sobird.me> at 2023/11/24 18:41:38 created.
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import Cookies from 'js-cookie';

const TOGGLE_ASIDE = 'TOGGLE_ASIDE';

export type User = {
  name: string,
};

export interface IAppState {
  user: User,
  collapsed: boolean;
  micro: {
    loading: boolean
  };
}

// defaultState
const initialState = {
  user: {
    name: 'sobird',
  },
  collapsed: Cookies.get(TOGGLE_ASIDE) === '1',
  micro: {
    loading: false,
  },
};

const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    updateUser: (state, action: PayloadAction<IAppState['user']>) => {
      state.user = action.payload;
    },
    updateMicro: (state, action: PayloadAction<IAppState['micro']>) => {
      state.micro = action.payload;
    },
    toggleAside: (state) => {
      Cookies.set(TOGGLE_ASIDE, state.collapsed ? '0' : '1', {
        path: '/',
      });
      // 主动触发window.resize事件
      setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
      }, 300);
      state.collapsed = !state.collapsed;
    },
  },
});

export const { updateUser, updateMicro, toggleAside } = appSlice.actions;
export default appSlice.reducer;

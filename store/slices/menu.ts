/**
 * menu slice
 *
 * sobird<i@sobird.me> at 2023/11/24 19:21:00 created.
 */
import {
  createSlice, createAsyncThunk, PayloadAction,
} from '@reduxjs/toolkit';
import MenuService, { IMenuItem } from '@/services/menu';

export interface IMenuState {
  /** 收藏夹列表 */
  favorites?: IMenuItem[];
  /** 菜单原始列表 */
  menuItems?: IMenuItem[];
  /** 菜单树 用来渲染导航菜单 */
  menuTrees?: IMenuItem[];
  pathMap?: {
    [key in string]: IMenuItem
  },
  defaultOpenKeys?: string[];
}

// defaultState
const initialState: IMenuState = {
  favorites: [],
  menuItems: [],
  menuTrees: [],
  pathMap: {},
  defaultOpenKeys: [],
};

export const fetchMenu = createAsyncThunk('menu/fetch', async () => {
  return MenuService.list();
});

const menuSlice = createSlice({
  name: 'menu',
  initialState,
  extraReducers: (builder) => {
    builder
      .addCase(fetchMenu.pending, (state, action) => {
        // state.status = 'loading'
        console.log('state', state, action);
      })
      .addCase(fetchMenu.fulfilled, (state, action) => {
        const [menuTrees, menuItems, favorites] = action.payload;
        const defaultOpenKeys = menuTrees.filter((item) => {
          return item.children && item.children.length > 0;
        }).map((item) => { return item.id; });

        return {
          ...state,
          favorites,
          menuItems,
          menuTrees,
          // 默认菜单全打开
          defaultOpenKeys: [...new Set(defaultOpenKeys)],
        };
      });
  },
  reducers: {
    updateMenu: (state, action: PayloadAction<IMenuState>) => {
      // state = action.payload;
      return {
        ...state,
        ...action.payload,
      };
    },
    removeFavMenuItem: (state, action: PayloadAction<IMenuItem>) => {
      const { favorites } = state;

      const index = favorites.findIndex((item) => { return item.id === action.payload.id; });

      if (index !== -1) {
        favorites.splice(index, 1);
      }

      state.favorites = [...favorites];
    },
    insertFavMenuItem: (state, action: PayloadAction<IMenuItem>) => {
      const { favorites } = state;
      favorites.push(action.payload);

      state.favorites = [...favorites];
    },
  },
});

export const { updateMenu, removeFavMenuItem, insertFavMenuItem } = menuSlice.actions;
export default menuSlice.reducer;

/**
 * Store
 *
 * @see https://redux.js.org/usage/configuring-your-store
 * @see https://redux.js.org/tutorials/typescript-quick-start
 * @see https://redux.js.org/usage/nextjs
 *
 * sobird<i@sobird.me> at 2023/05/08 23:11:10 created.
 */

// import { createStore, applyMiddleware, combineReducers, compose } from 'redux';
import { configureStore } from '@reduxjs/toolkit';
import {
  TypedUseSelectorHook, useDispatch, useSelector, useStore,
} from 'react-redux';
import reducers from './slices';
import logger from './middleware/logger';

// const composeWithDevTools = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;

// const createStoreWithMiddleware = applyMiddleware(thunk)(createStore);
// const reducer = combineReducers(reducers);
// const store = createStoreWithMiddleware(reducer);
// const store = createStore(combineReducers(reducers), composeWithDevTools(applyMiddleware(thunk, logger)));

// const store = configureStore({
//   reducer: reducers,
//   middleware: [thunk.withExtraArgument('thunk'), logger],
//   devTools: process.env.NODE_ENV !== 'production',
//   // enhancers: []
// });

export const makeStore = (preloadedState) => {
  return configureStore({
    reducer: reducers,
    middleware: (getDefaultMiddleware) => {
      return getDefaultMiddleware({
        thunk: {
          extraArgument: 'thunk',
        },
      }).concat(logger);
    },
    devTools: process.env.NODE_ENV !== 'production',
    preloadedState,
  });
};

// Infer the type of makeStore
export type AppStore = ReturnType<typeof makeStore>;
// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<AppStore['getState']>;
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = AppStore['dispatch'];

export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
export const useAppStore: () => AppStore = useStore;

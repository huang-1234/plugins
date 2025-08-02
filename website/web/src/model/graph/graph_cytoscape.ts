// import React, { useEffect } from 'react';
// import { useContextStore } from 'lite-store-react';
// import { Button, Spin, Switch } from 'antd';
// import type { IDefReducer } from 'lite-store-react';
// import { createStoreWithoutReducer, useStoreProvider } from 'lite-store-react';

// export const initialState = {
//   count: 0,
//   loading: false,
// };

// export const storeGraph = createStoreWithoutReducer(
//   () => initialState,
//   (reducer, getState) => ({
//     setInitialState(props: IDefReducer) {
//       reducer.setState((draft: IDefReducer) => {
//         Object.keys(props).forEach((key) => {
//           draft[key] = props[key];
//         });
//         return draft;
//       });
//     },
//     getInitialState() {
//       return getState();
//     },
//     add() {
//       reducer.setState((draft) => {
//         draft.count = draft.count + 1;
//         return draft;
//       });
//     },
//     sub(c?: number) {
//       const { count } = getState();
//       const _c = c ?? count;
//       reducer.setState({
//         count: _c - 1,
//       });
//     },
//     double(c?: number) {
//       reducer.setState((state) => {
//         const { count } = state;
//         const _c = c ?? count;
//         return {
//           count: _c * 2,
//         };
//       });
//     },
//     half(c?: number) {
//       const { count } = getState();
//       const _c = c ?? count;
//       reducer.setState({
//         count: _c / 2,
//       });
//     },
//     loadingTrigger(l?: boolean) {
//       reducer.setState((draft) => {
//         draft.loading = l ?? !draft.loading;
//         return draft;
//       });
//     },
//   }),
// );

// export function ContextStoreProvider({ children }: any) {
//   const StoreProvider: React.ComponentType<{ children: React.ReactNode }> = useStoreProvider(
//     storeGraph,
//   ) as React.ComponentType<{ children: React.ReactNode }>;
//   // @ts-ignore
//   return <StoreProvider>{children}</StoreProvider>;
// }

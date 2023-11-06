"use client";
import React, { createContext, useReducer } from "react";

interface CreateDataContextItf<ReducerState, ReducerActions> {
  defaultState: [ReducerState, React.Dispatch<ReducerActions>];
  reducer: (
    initialState: ReducerState,
    Actions: ReducerActions
  ) => ReducerState;
  reducerInitialState: ReducerState;
}

export const createDataContext = <ReducerState, ReducerActions>({
  defaultState,
  reducer,
  reducerInitialState,
}: CreateDataContextItf<ReducerState, ReducerActions>) => {
  const Context = createContext<typeof defaultState>(defaultState);

  const Provider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [state, dispatch] = useReducer(reducer, reducerInitialState);

    return (
      <Context.Provider value={[state, dispatch]}>{children}</Context.Provider>
    );
  };
  return { Context, Provider };
};

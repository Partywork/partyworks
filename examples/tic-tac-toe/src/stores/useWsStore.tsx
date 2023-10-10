"use client";
import { useContext } from "react";
import { createDataContext } from "../utils/createDataContext";
import { WsActions } from "../interface/actions";
import { WsStoreState } from "../interface/types";

//for now just adding the followers & following to wsStore
const wsInitialState: WsStoreState = {};
const reducer = (state: WsStoreState, action: WsActions): WsStoreState => {
  switch (action.type) {
    case "ROOM_STATE": {
      return {
        ...state,
        currentGame: action.payload.currentGame,
      };
    }

    case "SET_CURRENT_GAME": {
      return {
        ...state,
        currentGame: action.payload,
      };
    }

    case "GAME_USER_JOINED": {
      return {
        ...state,
        currentGame: {
          ...state.currentGame!,
          players: [...state.currentGame!.players, action.payload],
        },
      };
    }

    case "START_GAME": {
      return {
        ...state,
        currentGame: {
          ...state.currentGame!,
          gameState: action.payload,
          gameStatus: "started",
        },
      };
    }

    case "PLAY_MOVE": {
      return {
        ...state,
        currentGame: {
          ...state.currentGame!,
          gameState: {
            ...state.currentGame!.gameState!,
            currentTimeoutDate: action.payload.currentPlayerTimeout,
            moves:
              typeof state.currentGame!.gameState!.moves !== "undefined"
                ? [
                    ...state.currentGame!.gameState!.moves,
                    {
                      ...action.payload,
                      newMove: true,
                      moveId: Math.random() * Math.random(),
                    },
                  ]
                : [
                    {
                      ...action.payload,
                      newMove: true,
                      moveId: Math.random() * Math.random(),
                    },
                  ],
          },
        },
      };
    }

    case "APPLY_MOVE": {
      //   console.log(`applying move`, action);
      return {
        ...state,
        currentGame: {
          ...state.currentGame!,
          gameState: {
            ...action.payload.gameState,
            moves: state.currentGame!.gameState!.moves!.map((move: any) => {
              if (move.moveId === action.payload.moveId) {
                return { ...move, newMove: false };
              }

              return move;
            }),
          },
        },
      };
    }

    case "COMPLETE_GAME": {
      return {
        ...state,
        currentGame: {
          ...state.currentGame!,
          gameStatus: "completed",
          gameState: {
            ...state.currentGame!.gameState,
            results: action.payload,
          },
        },
      };
    }

    case "CLOSE_GAME": {
      if (state.currentGame && state.currentGame.gameStatus === "completed") {
        return {
          ...state,
          currentGame: undefined,
        };
      }

      return state;
    }

    default:
      return state;
  }
};

export const { Context: WsStateCtx, Provider: WsCtxProvider } =
  createDataContext<WsStoreState, WsActions>({
    defaultState: [wsInitialState, () => wsInitialState],
    reducerInitialState: wsInitialState,
    reducer,
  });

export const useWsStore = () => useContext(WsStateCtx);

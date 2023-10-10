import React, { useRef, useEffect, useState, useMemo } from "react";

import { ClientEvents, GameResults, Move } from "../interface/types";
import TimeoutBar from "./TimeoutBar";
import styles from "./TicTacToe.module.css";
import { useWsStore } from "../stores/useWsStore";
import { useOthers, useRoom, useSelf } from "../partyworks.config";
import { useWsActions } from "../action/wsAction";
interface Cell {
  userId: string;
  role: "x" | "o";
}

interface GameState {
  currentPlayer: string;
  gameState: ("x" | "o" | null)[];
  players: Cell[];
}

interface TicTacToeCanvasItf {
  gameId?: string;
}

//where should i add the make move funtionlity> when the event is recieved?
//? a weird complex way would be to ad it to the context, via currentGame.gameState.moves as an array and let  useMemo update it. and update the game.
//?this way we can easily handle multiple games & mulitple games being played at the same time. while easily decoupling the logic from the central socket event handler
//? we can track internally as to what moves have already been seen, to check for new moves.

const GamePlayers = () => {
  const [{ currentGame }] = useWsStore();

  const self = useSelf();
  const others = useOthers();

  console.log(currentGame);
  //   console.log(currentGame!.gameState!.players);

  //so the flow goes a

  //ok so this one is gonna be for rendering inner onem, that is different per game, and we may not even need sperately for some games
  //so it should be a part of canvas render :/\.\.
  const renderPlayers = () => {
    //there's 2 ways in which we can potentially render 2 players. or 2 places where we can/wil have to render these users
    //no1. an ingame view, that can be sperate per game, that can have additonal informationm s to which player has what role & etc. whose turn it is & stuff
    //no2. an outsider view, the people who see the game card from outdise to see who's playing in the game.
    //for what I can think, the card one does not care about the role & is same for every game. & we already have a state for that ^^
    //we also havean inner state with more detailed stuff like role & turn, so should be good
    //? should we keep our player to a particular side? if we;re playing?, like always to the right or left.
    //? maybe also let's add images avatars

    const players = currentGame!.gameState!.players as Cell[];

    return (
      <>
        <div className={styles.playersBox}>
          {players.map(({ userId, role }) => {
            let status:
              | undefined
              | "draw"
              | "win"
              | "lost"
              | "resign"
              | "inactivity";
            const isCompleted = currentGame!.gameStatus === "completed";

            if (isCompleted) {
              const results = currentGame!.gameState!.results as GameResults;
              const userResult = results.find(
                ({ playerId }) => playerId === userId
              )!;

              status = userResult.result;
            }

            // console.log(
            //   currentGame!.gameState!.currentTimeoutDate - Date.now()
            // );
            // console.log(currentGame!.gameState!.currentTimeoutDate);

            //todo have server send a timeout time, that can be time when the player's turn ends.
            //todo since this can/will  be helpful in case of late events recieved, due to network, or people joining in between
            return (
              <div key={userId} className={styles.playerContainer}>
                {currentGame!.gameStatus === "completed" && (
                  <div className={styles.playerTurnContainer}>{status}</div>
                )}
                {currentGame!.gameStatus !== "completed" &&
                  currentGame!.gameState!.currentPlayer === userId && (
                    <>
                      <TimeoutBar
                        totalTime={15000}
                        remainingTime={
                          currentGame!.gameState!.currentTimeoutDate -
                          Date.now()
                        }
                      />
                      <div className={styles.playerTurnContainer}>Turn</div>
                    </>
                  )}
                <div className={styles.playerCard}>
                  <img
                    className={styles.playerCardImg}
                    src={`https://avatars.dicebear.com/api/avataaars/${userId}.svg?mouth=default,smile,tongue&eyes=default,happy,hearts&eyebrows=default,defaultNatural,flatNatural`}
                    alt={`Avatar of user`}
                  />

                  <div className={styles.playerInfoContainer}>
                    <span className={styles.playerInfoUsername}>
                      {userId === self?.info.userId
                        ? "me"
                        : others.find((player) => player.info.userId === userId)
                            ?.info.username || "unknown"}
                    </span>

                    <span className={styles.playeInfoRole}>{role}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </>
    );
  };

  return <>{renderPlayers()}</>;
};

const TicTacToeCanvas: React.FC<TicTacToeCanvasItf> = ({ gameId }) => {
  const [{ currentGame }] = useWsStore();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { applyMove } = useWsActions();
  const self = useSelf();
  const room = useRoom();

  const gameState = useMemo(() => {
    //handle the new moves
    //mark them as read | consumed. for this we need new unique or maybe incremental ids for each move
    // for(let )

    return currentGame?.gameState as GameState;
  }, [currentGame]);

  //well this should only render for ongoing games right :/
  useEffect(() => {
    if (gameId) return;
    const newMoves = currentGame!.gameState!.moves?.filter(
      (move: Move & { newMove: boolean; moveId: number }) => {
        return move.newMove === true;
      }
    );

    if (!newMoves || newMoves.length < 1) {
      return;
    }

    const currentGameState = { ...currentGame!.gameState! } as GameState;

    //we only need 1 move, since there will only be 1 move duh/

    const move = newMoves[0] as Move & { moveId: number };

    currentGameState.currentPlayer = move.currentPlayer;
    currentGameState.gameState = currentGameState.gameState.map(
      (cell, index) => {
        if (move.moveData.cellIndex === index) {
          const player = currentGameState.players.find(
            ({ userId }) => move.player.userId === userId
          );
          return player!.role;
        }

        return cell;
      }
    );

    //apply the move & make appropriate changes to the gameState

    applyMove(currentGameState, move.moveId);
  }, [currentGame]);

  useEffect(() => {
    const canvas = canvasRef.current!;
    if (!canvas) return;

    const ctx = canvas.getContext("2d")!;
    const drawBoard = () => {
      // const gameState = currentGame!.gameState as {currentPlayerIndex: number, gameState: ("x" | 'o' | null)[], players: Cell[]}
      const containerWidth = canvas.parentElement?.clientWidth || 300;
      const containerHeight = canvas.parentElement?.clientHeight || 300;
      const minSize = Math.min(containerWidth, containerHeight);
      const cellSize = minSize / 3;

      canvas.width = minSize;
      canvas.height = minSize;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw colorful grid lines
      ctx.strokeStyle = "#333";
      ctx.lineWidth = 4;
      // Draw grid lines (inner lines)
      for (let i = 1; i < 3; i++) {
        // Vertical lines
        ctx.beginPath();
        ctx.moveTo(i * cellSize, 0);
        ctx.lineTo(i * cellSize, minSize);
        ctx.stroke();

        // Horizontal lines
        ctx.beginPath();
        ctx.moveTo(0, i * cellSize);
        ctx.lineTo(minSize, i * cellSize);
        ctx.stroke();
      }

      ctx.font = `${cellSize * 0.5}px Arial`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      for (let i = 0; i < gameState.gameState.length; i++) {
        const cellContent = gameState.gameState[i];

        if (cellContent !== null) {
          const row = Math.floor(i / 3);
          const col = i % 3;
          const x = col * cellSize + cellSize / 2;
          const y = row * cellSize + cellSize / 2;

          ctx.font = "48px serif";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(cellContent, x, y);
        }
      }

      const winningCombinations: number[][] = [
        [0, 1, 2], // Top row
        [3, 4, 5], // Middle row
        [6, 7, 8], // Bottom row
        [0, 3, 6], // Left column
        [1, 4, 7], // Middle column
        [2, 5, 8], // Right column
        [0, 4, 8], // Diagonal from top-left to bottom-right
        [2, 4, 6], // Diagonal from top-right to bottom-left
      ];
      // Check for a winning combination
      for (const combination of winningCombinations) {
        const [cell1Index, cell2Index, cell3Index] = combination;

        const cell1Content = gameState.gameState[cell1Index];
        const cell2Content = gameState.gameState[cell2Index];
        const cell3Content = gameState.gameState[cell3Index];

        // console.log(`checking for winnign comni`);

        if (
          cell1Content &&
          cell2Content &&
          cell3Content &&
          cell1Content === cell2Content &&
          cell2Content === cell3Content
        ) {
          console.log(`someone won!!!`);
          // Draw the winning stroke line
          drawWinningLine(cell1Index, cell3Index, cellSize);
          break; // Exit loop after finding one winning combination
        }
      }
    };

    drawBoard(); // Initial draw
    // Add mouse click event listener
    const handleCanvasClick = (event: MouseEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      if (gameState.currentPlayer !== self?.info.userId) return;

      if (currentGame!.gameStatus !== "started") return;

      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      const containerWidth = canvas.parentElement?.clientWidth || 300;
      const containerHeight = canvas.parentElement?.clientHeight || 300;
      const minSize = Math.min(containerWidth, containerHeight);

      const clickedRow = Math.floor((y / minSize) * 3);
      const clickedCol = Math.floor((x / minSize) * 3);
      const clickedCellIndex = clickedRow * 3 + clickedCol;

      //todo try emitawait here
      room.emit(ClientEvents.MAKE_MOVE, { index: clickedCellIndex });

      // Handle canvas click logic using clickedCellIndex
    };

    canvas.addEventListener("click", handleCanvasClick);

    // Clean up event listeners
    return () => {
      canvas.removeEventListener("click", handleCanvasClick);
    };
  }, [gameState]);

  const drawWinningLine = (
    startCellIndex: number,
    endCellIndex: number,
    cellSize: number
  ) => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;

    ctx.strokeStyle = "red"; // Set the color of the winning stroke line
    ctx.lineWidth = 5; // Set the width of the line

    const startX = (startCellIndex % 3) * cellSize + cellSize / 2;
    const startY = Math.floor(startCellIndex / 3) * cellSize + cellSize / 2;
    const endX = (endCellIndex % 3) * cellSize + cellSize / 2;
    const endY = Math.floor(endCellIndex / 3) * cellSize + cellSize / 2;

    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();
  };

  if (
    !gameId &&
    (!currentGame ||
      (currentGame.gameStatus !== "started" &&
        currentGame!.gameStatus !== "completed"))
  )
    return <>bad</>;

  return (
    <>
      <GamePlayers />
      <canvas ref={canvasRef} className={styles.canvas} />
    </>
  );
};

export default TicTacToeCanvas;

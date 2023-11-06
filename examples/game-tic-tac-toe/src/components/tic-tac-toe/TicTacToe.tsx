import React, { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import styles from "./TicTacToe.module.css";
import { TTTGameState } from "./types";
import { SoundFilePath } from "../../constants";
import { soundManager } from "../../utils/SoundManager";
import {
  ClientEvents,
  Game,
  GameResults,
  Move,
  ServerEvents,
} from "../../types";
import { useRoom } from "../../partyworks.config";
import { GamePlayersBoard } from "./GamePlayersBoard";
import { CreateGameButton } from "../CreateGame";
let isResizing = false;
let animationFrameId: any = null;

interface TicTacToeCanvasProps {
  game: Game<TTTGameState>;
}

//I believe this is gonna be seperate per game
//Even for games that have similar 1 on 1 timeout based meta
//because of additional gameData, and it's rendering

export const TicTacToeGame: React.FC<TicTacToeCanvasProps> = ({ game }) => {
  const room = useRoom();

  const [gameCompleted, setGameCompleted] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [gameState, setGameState] = useState<TTTGameState>(game.gameState);

  useEffect(() => {
    const cleanupId = room.on(
      ServerEvents.PLAY,
      (move: Move<{ cellIndex: number }>) => {
        soundManager.playSoundEffect(SoundFilePath.POP);
        applyMove(move);
      }
    );

    const unsubscribe = room.on(ServerEvents.GAME_COMPLETED, (results) => {
      soundManager.playSoundEffect(SoundFilePath.CONCLUSION);
      completeGame(results);
      setGameCompleted(true);
    });

    return () => {
      room.off(ServerEvents.PLAY, cleanupId);
      room.off(ServerEvents.GAME_COMPLETED, unsubscribe);
    };
  }, [room, game.id]);

  useEffect(() => {
    const canvas = canvasRef.current!;
    if (!canvas) return;

    const ctx = canvas.getContext("2d")!;

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

    const drawBoard = () => {
      const rect = canvas.getBoundingClientRect();
      const containerWidth = rect.height || 300;
      const containerHeight = rect.width || 300;
      const minSize = Math.min(containerWidth, containerHeight);
      const cellSize = minSize / 3;

      canvas.width = minSize;
      canvas.height = minSize;

      //this avoids a redraw/paint of canvas
      //initial render gives us the current live dimesnions that are not square
      //in our draw board function we manually set them to be equal, the shortest one wins, for it to be square
      //so here if they're not yet equal. we need to return, as this avoids the initial draw
      //we need to avoid the first render it's efficent, and also doesn't gives the users blurry render
      if (containerHeight !== containerWidth) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw colorful grid lines
      ctx.strokeStyle = "#629ACC";
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

          //   ctx.font = "48px serif";

          if (cellContent === "x") {
            ctx.fillStyle = "#E94141";
          } else {
            ctx.fillStyle = "#0086F4";
          }
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

    drawBoard(); // Initial draw, this set's the canvas height & width to be equal
    drawBoard(); //technically this is the initial draw :>

    // Add mouse click event listener
    const handleCanvasClick = (event: MouseEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      const containerWidth = rect.width || 300;
      const containerHeight = rect.height || 300;

      const clickedRow = Math.floor((y / containerHeight) * 3);
      const clickedCol = Math.floor((x / containerWidth) * 3);
      const clickedCellIndex = clickedRow * 3 + clickedCol;

      sendMove(clickedCellIndex);
    };

    function resizeCanvas() {
      if (!isResizing) {
        isResizing = true;
        cancelAnimationFrame(animationFrameId);

        // Schedule a redraw
        animationFrameId = requestAnimationFrame(() => {
          drawBoard();
          isResizing = false;
        });
      }
    }

    canvas.addEventListener("click", handleCanvasClick);

    // Listen for window resize event
    window.addEventListener("resize", resizeCanvas);

    // Clean up event listeners
    return () => {
      canvas.removeEventListener("click", handleCanvasClick);
      window.removeEventListener("resize", resizeCanvas);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState]);

  const sendMove = async (index: number) => {
    try {
      await room.emitAwait({
        event: ClientEvents.MAKE_MOVE,
        data: {
          index,
        },
      });
    } catch (error: any) {
      if (error.status) {
        toast(error.message as string, {
          autoClose: 2000,
          type: "error",
        });
      }
      //we're okay here with timeouts, since we're just catching errors
      console.log(error);
    }
  };

  const applyMove = async (move: Move<{ cellIndex: number }>) => {
    setGameState((currentState) => {
      const updatedGameState = [...currentState.gameState];
      updatedGameState[move.moveData.cellIndex] = currentState.players.find(
        (player) => player.userId === move.player.userId
      )!.role;

      return {
        ...currentState,
        gameState: updatedGameState,
        currentPlayer: move.currentPlayer,
        currentTimeoutDate: move.currentPlayerTimeout,
      };
    });
  };

  const completeGame = async (results: Readonly<GameResults>) => {
    const res = [...results];
    setGameState((currentState) => {
      return {
        ...currentState,
        results: res,
      };
    });
  };

  return (
    <div className={styles.container}>
      {gameCompleted && <CreateGameButton title="START A NEW GAME" />}
      <GamePlayersBoard game={gameState} />
      <div className={styles.canvasRootContainer}>
        <div className={styles.canvasContainer}>
          <canvas ref={canvasRef} className={styles.canvas} />
        </div>
      </div>
    </div>
  );
};

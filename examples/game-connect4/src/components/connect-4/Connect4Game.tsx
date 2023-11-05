import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import styles from "./Connect4.module.css";
import {
  Connect4BoardColumns,
  Connect4BoardRows,
  Connect4GameState,
  ConnectFourCellState,
} from "./types";
import { SoundFilePath } from "../../constants";
import { soundManager } from "../../utils/SoundManager";
import { useRoom, useSelf } from "../../partyworks.config";
import {
  ClientEvents,
  Game,
  GameResults,
  Move,
  ServerEvents,
} from "../../types";
import { GamePlayersBoard } from "./GamePlayersBoard";
import { CreateGameButton } from "../CreateGame";

interface Connect4GameProps {
  game: Game<Connect4GameState>;
}

export const Connect4Game: React.FC<Connect4GameProps> = ({ game }) => {
  // Define the size of the board (rows and columns)

  const room = useRoom();
  const self = useSelf();

  const [gameCompleted, setGameCompleted] = useState(false);

  // Initialize the game board as a 2D array
  const [gameState, setGameState] = useState<Connect4GameState>(game.gameState);
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);
  const [winningCells, setWinningCells] = useState<number[][]>([]);

  useEffect(() => {
    if (checkForWin(gameState.gameState, ConnectFourCellState.Blue)) {
      // Get the winning cells and update the state
      const winningCells = getWinningCells(gameState.gameState);

      setWinningCells(winningCells);
    }
    if (checkForWin(gameState.gameState, ConnectFourCellState.Red)) {
      // Get the winning cells and update the state
      const winningCells = getWinningCells(gameState.gameState);

      setWinningCells(winningCells);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState]);

  useEffect(() => {
    const cleanupPlay = room.on(
      ServerEvents.PLAY,
      (move: Move<{ rowIndex: number; cellIndex: number }>) => {
        soundManager.playSoundEffect(SoundFilePath.SLID);
        applyMove(move);
      }
    );

    const cleanupCompleteGame = room.on(
      ServerEvents.GAME_COMPLETED,
      (results) => {
        soundManager.playSoundEffect(SoundFilePath.CONCLUSION);
        completeGame(results);
        setGameCompleted(true);
      }
    );

    return () => {
      room.off(ServerEvents.PLAY, cleanupPlay);
      room.off(ServerEvents.GAME_COMPLETED, cleanupCompleteGame);
    };
  }, [room, game.id]);

  const getWinningCells = (board: ConnectFourCellState[][]) => {
    const winningCells: number[][] = [];
    const rows = Connect4BoardRows;
    const columns = Connect4BoardColumns;

    // Iterate through each cell on the board
    for (let row = 0; row < rows; row++) {
      for (let column = 0; column < columns; column++) {
        const cell = board[row][column];

        // Check for a win for both players (represented as "X" and "O")
        if (
          cell === ConnectFourCellState.Blue ||
          cell === ConnectFourCellState.Red
        ) {
          if (
            checkDirection(board, row, column, 1, 0, cell) || // Horizontal
            checkDirection(board, row, column, 0, 1, cell) || // Vertical
            checkDirection(board, row, column, 1, 1, cell) || // Diagonal (top-left to bottom-right)
            checkDirection(board, row, column, -1, 1, cell) // Diagonal (top-right to bottom-left)
          ) {
            // Add the current cell to the winning cells
            winningCells.push([row, column]);
          }
        }
      }
    }

    return winningCells;
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

  // Handle mouse enter event to set the hovered row
  const handleMouseEnter = (rowIndex: number) => {
    setHoveredRow(rowIndex);
  };

  // Handle mouse leave event to clear the hovered row
  const handleMouseLeave = () => {
    setHoveredRow(null);
  };

  const sendMove = async (row: number) => {
    let columnIndex = -1;

    for (let i = Connect4BoardColumns - 1; i >= 0; i--) {
      if (gameState.gameState[row][i] === ConnectFourCellState.Empty) {
        columnIndex = i;
        break;
      }
    }

    // Check if a valid move is possible (columnIndex is within bounds)
    if (columnIndex >= 0) {
      try {
        await room.emitAwait({
          event: ClientEvents.MAKE_MOVE,
          data: { rowIndex: row, cellIndex: columnIndex },
        });
      } catch (error: any) {
        if (error.status) {
          toast(error.message as string, {
            autoClose: 2000,
            type: "error",
          });
        }

        //we're okay here with timeouts, or maybe we need async/await confirmation :/
        console.log(error);
      }

      // Toggle the currentPlayer for the next move (if you haven't already)
      // Implement logic to check for a win or draw
      // Implement logic for switching players
    }
  };

  const applyMove = async (
    move: Move<{ rowIndex: number; cellIndex: number }>
  ) => {
    setGameState((currentState) => {
      const { rowIndex, cellIndex } = move.moveData;
      const currentPlayer = currentState.players.find(
        (player) => player.userId === move.player.userId
      )!.role;

      const updatedGameState = [...currentState.gameState];
      const updatedRow = [...updatedGameState[rowIndex]];
      updatedRow[cellIndex] = currentPlayer;
      updatedGameState[rowIndex] = updatedRow;

      return {
        ...currentState,
        gameState: updatedGameState,
        currentPlayer: move.currentPlayer,
        currentTimeoutDate: move.currentPlayerTimeout,
      };
    });
  };

  const checkDirection = (
    board: ConnectFourCellState[][],
    row: number,
    column: number,
    directionX: number,
    directionY: number,
    player: ConnectFourCellState
  ) => {
    const rows = board.length;
    const columns = board[0].length;
    let count = 0;

    // Check in the specified direction for consecutive player tokens
    for (let i = -3; i <= 3; i++) {
      const newRow = row + directionY * i;
      const newColumn = column + directionX * i;

      // Check if the new coordinates are within bounds
      if (
        newRow >= 0 &&
        newRow < rows &&
        newColumn >= 0 &&
        newColumn < columns &&
        board[newRow][newColumn] === player
      ) {
        count++;
        if (count === 4) {
          // Four consecutive tokens found; the player wins
          return true;
        }
      } else {
        // Reset the count if there's a gap or the edge of the board is reached
        count = 0;
      }
    }

    return false;
  };

  // Function to check for a win on the entire board
  const checkForWin = (
    board: ConnectFourCellState[][],
    player: ConnectFourCellState
  ) => {
    const rows = board.length;
    const columns = board[0].length;

    // Iterate through each cell on the board
    for (let row = 0; row < rows; row++) {
      for (let column = 0; column < columns; column++) {
        // Check for a win in all directions (horizontal, vertical, and diagonals)
        if (
          checkDirection(board, row, column, 1, 0, player) || // Horizontal
          checkDirection(board, row, column, 0, 1, player) || // Vertical
          checkDirection(board, row, column, 1, 1, player) || // Diagonal (top-left to bottom-right)
          checkDirection(board, row, column, -1, 1, player) // Diagonal (top-right to bottom-left)
        ) {
          return true; // Player has won
        }
      }
    }

    return false; // No winner found
  };

  console.log(gameState.currentPlayer === self?.info.userId);

  return (
    <div className={styles.rootContainer}>
      {gameCompleted && <CreateGameButton title="start new game" />}
      <div className={styles.connect4Container}>
        <GamePlayersBoard game={gameState} />
        <div className={styles.connect4}>
          {gameState.gameState.map((row, rowIndex) => (
            <div
              key={rowIndex}
              className={`${styles.row} ${
                gameState.currentPlayer === self?.info.userId
                  ? hoveredRow === rowIndex
                    ? styles["hovered-row"]
                    : ""
                  : ""
              }`}
              onMouseEnter={() => handleMouseEnter(rowIndex)}
              onMouseLeave={handleMouseLeave}
              onTouchStart={() => handleMouseEnter(rowIndex)} // Triggered on touch start
              onTouchEnd={() => handleMouseLeave()} // Triggered on touch end
              onClick={() => {
                sendMove(rowIndex);
              }}
            >
              {row.map((cell, columnIndex) => {
                let availableCellIndex = -1;

                for (let i = Connect4BoardColumns - 1; i >= 0; i--) {
                  if (
                    gameState.gameState[rowIndex][i] ===
                    ConnectFourCellState.Empty
                  ) {
                    availableCellIndex = i;
                    break;
                  }
                }

                return (
                  <div
                    key={`${columnIndex}${gameState.gameState[rowIndex][columnIndex]}`}
                    className={styles.cell}
                  >
                    {winningCells &&
                    winningCells.find((index) => {
                      if (rowIndex === index[0] && columnIndex === index[1]) {
                        return true;
                      }
                    }) ? (
                      <div
                        className={styles.token}
                        style={{
                          backgroundColor:
                            cell === ConnectFourCellState.Blue
                              ? "var(--game-blue-color)"
                              : "var(--danger-color)",
                          padding: ".1rem",
                          border: ".5rem solid var(--win-color)",
                        }}
                      ></div>
                    ) : (
                      cell !== ConnectFourCellState.Empty && (
                        <div
                          className={styles.token}
                          style={{
                            border:
                              cell === ConnectFourCellState.Blue
                                ? "5px solid #09375c"
                                : "5px solid maroon",
                            backgroundColor:
                              cell === ConnectFourCellState.Blue
                                ? "var(--game-blue-color)"
                                : "var(--danger-color)",
                          }}
                        ></div>
                      )
                    )}

                    {/* Display temporary indicator in the available cell */}

                    {(gameState.currentPlayer === self?.info.userId &&
                      rowIndex) === hoveredRow &&
                      columnIndex === availableCellIndex && (
                        <div
                          className={styles.tokenIndicator}
                          style={{
                            height: "100%",
                            backgroundColor:
                              gameState.players.find(
                                (player) =>
                                  player.userId === gameState.currentPlayer
                              )?.role === ConnectFourCellState.Blue
                                ? "var(--game-blue-color)"
                                : "var(--danger-color)",
                          }}
                        ></div>
                      )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

import { useRouter } from "next/router";
import styles from "./games.module.css";
import { usePathname, useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { useRoom, useSelf } from "../partyworks.config";
import { ClientEvents, Game } from "../interface/types";
import { useWsActions } from "../action/wsAction";
import { useWsStore } from "../stores/useWsStore";
import TicTacToeCanvas from "./TicTacToe";

interface GameCardPropsItf {
  game?: Game;
}

const GameCard: React.FC<GameCardPropsItf> = ({ game }) => {
  const room = useRoom();
  const self = useSelf();

  const router = useRouter();
  const pathName = usePathname();
  const params = useSearchParams();

  const isJoined = useMemo(() => {
    if (!self || !game || !game.gameId) return false;
    console.log(game);
    const isPLayer = game.players.find(
      (player) => player.userId === self.info.userId
    );

    if (isPLayer) return true;

    return false;
    // if(currentGame.gameState)
  }, [game, self]);

  //if the self is not yet loaded we return loading
  //not ideal but this also serves as a check if we've recieved the room_state yet or not
  if (!self) return <>loading...</>;

  const handleCreateGame = async () => {
    room.emit(ClientEvents.CREATE_GAME, "tic-tac-toe");
  };

  const handleJoin = () => {
    room.emit(ClientEvents.JOIN_GAME, "tic-tac-toe");
  };

  if (!game) {
    return (
      <>
        <div className={styles.gameCardContainer} onClick={handleCreateGame}>
          <img
            className={styles.gameCardImg}
            src="/tic-tac-toe.png"
            alt="Picture of the author"
          />
          <h3>Tic Tac Toe</h3>
        </div>
      </>
    );
  }

  if (game) {
    if (game.gameStatus === "created") {
    }

    if (game.gameStatus === "started" || game.gameStatus === "completed") {
    }

    // return <>unknown gae status</>
  }

  const renderJoinCard = () => {
    return (
      <button className={styles.joinButton} onClick={handleJoin}>
        join
      </button>
    );
  };

  const renderViewCard = () => {
    return (
      <button
        className={styles.joinButton}
        onClick={() => {
          if (game.gameStatus === "completed") {
            //todo make it so that the viewGame reads data from the context of played games, & not the current game
            router.push(`${pathName}?${params}&viewGame=${game.id}`);
          }
        }}
      >
        view
      </button>
    );
  };

  return (
    <>
      <div className={styles.gameCardContainer}>
        <img
          className={styles.gameCardImg}
          src="/tic-tac-toe.png"
          alt="Picture of the author"
        />
        <h3>Tic Tac Toe</h3>
        <div className={styles.gameCardBottomContainer}>
          <div className={styles.playersInfoContainer}>
            {game.players.map((player) => {
              return (
                <div key={player.userId}>
                  <img
                    className={styles.playerCardImg}
                    src={`https://avatars.dicebear.com/api/avataaars/${player.userId}.svg?mouth=default,smile,tongue&eyes=default,happy,hearts&eyebrows=default,defaultNatural,flatNatural`}
                    alt={`Avatar of user`}
                  />
                </div>
              );
            })}
          </div>
          {game.gameStatus === "created" && !isJoined && (
            <button className={styles.joinButton} onClick={handleJoin}>
              join
            </button>
          )}

          {(game.gameStatus === "started" || game.gameStatus === "completed") &&
            renderViewCard()}
        </div>
      </div>
    </>
  );
};

const supportedGames = ["tic-tac-toe"];
export const Games: React.FC<{}> = () => {
  const self = useSelf();
  const room = useRoom();
  const [{ currentGame }] = useWsStore();
  const { closeGame } = useWsActions();

  const param = useSearchParams();

  const isJoined = useMemo(() => {
    if (!self || !currentGame || !currentGame.gameId) return false;
    console.log(currentGame);
    const isPLayer = currentGame.players.find(
      (player) => player.userId === self.info.userId
    );

    if (isPLayer) return true;

    return false;
    // if(currentGame.gameState)
  }, [currentGame, self]);

  if (
    currentGame &&
    currentGame.gameId &&
    !supportedGames.includes(currentGame.gameId)
  )
    return (
      <>This platform does not yet supports this game {currentGame.gameId}</>
    );

  //eventually we will show only the games the user has selected, not the current one, cuz we will have the option to play multiple games at once!
  if (
    currentGame?.gameStatus === "started" ||
    currentGame?.gameStatus === "completed"
  ) {
    return (
      <div>
        <h1>Tic Tac Toe playing</h1>
        {currentGame.gameStatus === "completed" && (
          <button onClick={closeGame} className={styles.joinButton}>
            Close
          </button>
        )}
        <div style={{ height: "70vh", width: "100%" }}>
          <TicTacToeCanvas />;
        </div>
      </div>
    );
  }

  const renderCurrentGame = () => {
    console.log(currentGame);

    const handleJoin = () => {
      room.emit(ClientEvents.JOIN_GAME, "tic-tac-toe");
    };

    //todo add the card for joining
    const renderGameCard = () => {
      return (
        <>
          <div className={styles.gameCardContainer}>
            <img
              className={styles.gameCardImg}
              src="/tic-tac-toe.png"
              alt="Picture of the author"
            />
            <h3>Tic Tac Toe</h3>

            <div className={styles.gameCardBottomContainer}>
              <div className={styles.playersInfoContainer}>
                {currentGame?.players.map((player) => {
                  return (
                    <div key={player.userId}>
                      <img
                        className={styles.playerCardImg}
                        src={`https://avatars.dicebear.com/api/avataaars/${player.userId}.svg?mouth=default,smile,tongue&eyes=default,happy,hearts&eyebrows=default,defaultNatural,flatNatural`}
                        alt={`Avatar of user`}
                      />
                    </div>
                  );
                })}
              </div>
              {!isJoined && (
                <button className={styles.joinButton} onClick={handleJoin}>
                  join
                </button>
              )}
            </div>
          </div>
        </>
      );
    };

    return (
      <>
        <h1>Currently playing game</h1>

        <GameCard game={currentGame} />
        {/* {renderGameCard()} */}
      </>
    );
  };

  //todo we need here to set up a way
  //todo i'm not sure how i want it to be.
  //but the users can go back from an ongoing game maybe
  //they should be able to go back to the current screen at any point they want. even during an ongoing game
  //so maybe a nav pointer, or a url base. like it should be a query param added to the url to which game you're currently viewing, for ex.
  //so we can do it like queryParam.get('game') if(viweingGame) //find game (from current to played) if not found render home, else render game
  //but does this pose an issue? when playing game we'd need to redirect to the game, based on socket message :/ . dunno abou tthat
  //this shoul differ for each game i guess, for already played games we can use this

  const renderChooseGame = () => {
    return (
      <div style={{ height: "100%", overflow: "auto" }}>
        <h1>games</h1>

        <h2>Pick game to play</h2>

        <GameCard />

        {currentGame?.gameId && (
          <>
            <h2>Current Game</h2>

            <GameCard game={currentGame} />
          </>
        )}
      </div>
    );
  };

  return <>{currentGame?.gameId ? renderCurrentGame() : renderChooseGame()}</>;
};

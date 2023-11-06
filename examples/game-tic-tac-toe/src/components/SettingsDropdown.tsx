import { toast } from "react-toastify";
import styles from "./SettingsDropdown.module.css";
import { Dropdown } from "./utility/Dropdown";
import { useRoom } from "../partyworks.config";
import { ClientEvents } from "../types";

interface SettingsDropdownProps {
  isPlayer: boolean;
}

export const SettingsDropdown: React.FC<SettingsDropdownProps> = ({
  isPlayer,
}) => {
  const room = useRoom();

  const resignGame = async () => {
    try {
      await room.emitAwait({
        event: ClientEvents.RESIGN_GAME,
        data: undefined,
      });
    } catch (error: any) {
      if (error.status) {
        toast(error.message as string, {
          autoClose: 2000,
          type: "error",
        });
      }
    } finally {
    }
  };

  return (
    <div className={styles.dropdown}>
      <Dropdown>
        {isPlayer && (
          <>
            <span className={styles.dropdownContentItem} onClick={resignGame}>
              Resign
            </span>
          </>
        )}

        <span
          className={styles.dropdownContentItem}
          onClick={() => {
            toast("not implemented yet", {
              autoClose: 2000,
              type: "error",
            });
          }}
        >
          Share
        </span>
      </Dropdown>
    </div>
  );
};

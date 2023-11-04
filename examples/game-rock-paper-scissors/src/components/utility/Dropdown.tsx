import React, { useEffect, useRef, useState } from "react";
import { BsThreeDotsVertical } from "react-icons/bs";
import styles from "./Dropdown.module.css";

interface DropdownProps {
  children: React.ReactNode;
  buttonIconClassname?: string;
}

export const Dropdown: React.FC<DropdownProps> = ({
  children,
  buttonIconClassname,
}) => {
  const [open, setOpen] = useState(false);

  let menuRef = useRef<HTMLDivElement>(undefined!);

  useEffect(() => {
    let handler = (e: MouseEvent) => {
      if (e.target) {
        if (!menuRef.current.contains(e.target as any)) {
          setOpen(false);
        }
      }
    };

    document.addEventListener("mousedown", handler);

    return () => {
      document.removeEventListener("mousedown", handler);
    };
  }, []);

  return (
    <div className={styles.App}>
      <div className={styles.menuContainer} ref={menuRef}>
        <div
          className={buttonIconClassname || styles.dropdownTrigger}
          onClick={() => {
            setOpen(!open);
          }}
        >
          <BsThreeDotsVertical />
        </div>

        {open && <div className={styles.dropdownContent}>{children}</div>}
      </div>
    </div>
  );
};

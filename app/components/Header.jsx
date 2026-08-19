"use client";

import { useEffect, useState } from "react";
import { useApp } from "@/lib/store";
import Logo from "./Logo";
import styles from "./Header.module.css";

export default function Header() {
  const { user } = useApp();
  const [now, setNow] = useState(null);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(id);
  }, []);

  const today = now
    ? now.toLocaleDateString(undefined, {
        weekday: "long",
        day: "numeric",
        month: "short",
      })
    : "";

  const clock = now
    ? now.toLocaleTimeString(undefined, {
        hour: "numeric",
        minute: "2-digit",
      })
    : "";

  return (
    <header className={styles.header}>
      <div className={`${styles.inner} container`}>
        <div className={styles.brand}>
          <Logo />
          <span className={styles.date}>
            {today}
            {clock && <span className={styles.time}>{clock}</span>}
          </span>
        </div>
        {user?.name && (
          <span className={styles.hello}>Hi, {user.name.split(" ")[0]}</span>
        )}
      </div>
    </header>
  );
}

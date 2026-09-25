import { State } from "@/state";
import React from "react";

import { PageLogin } from "@/components/pages/PageLogin";

import Styles from "./access.module.css";
import { Logo } from "@/components/Logo";
import { NotificationProvider } from "@/components/Notification";
import { isRouteEqualTo } from "./routes";
import { isRoutePath } from "./types";

export default function Layout({ children }: { children: React.ReactNode }) {
  const nickname = State.user.nickname.useValue();
  const isLogged = nickname || isRouteEqualTo("/user/[id]/[activation]");

  return (
    <div className={Styles.layout}>
      <Logo className={Styles.layout} />
      {isLogged ? <div className={Styles.page}>{children}</div> : <PageLogin />}
      <NotificationProvider />
    </div>
  );
}

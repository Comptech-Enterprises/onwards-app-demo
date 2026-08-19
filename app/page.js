"use client";

import { useApp } from "@/lib/store";
import Header from "./components/Header";
import EmployeeView from "./components/EmployeeView";
import ManagerView from "./components/ManagerView";
import Login from "./components/Login";
import TaskReminder from "./components/TaskReminder";
import BottomNav from "./components/BottomNav";
import AlertsView from "./components/AlertsView";
import ProfileView from "./components/ProfileView";

export default function Home() {
  const { user, hydrated, view } = useApp();

  if (!hydrated) {
    return (
      <div className="app">
        <main className="container">
          <div className="skeleton">Loading…</div>
        </main>
      </div>
    );
  }

  if (!user) return <Login />;

  let body;
  if (view === "profile") body = <ProfileView />;
  else if (view === "alerts") body = <AlertsView />;
  else if (user.role === "manager") body = <ManagerView />;
  else body = <EmployeeView />;

  return (
    <div className="app app-with-nav">
      <Header />
      <TaskReminder />
      <main className="container">{body}</main>
      <BottomNav />
    </div>
  );
}

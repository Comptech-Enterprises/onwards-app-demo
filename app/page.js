"use client";

import { useApp } from "@/lib/store";
import Header from "./components/Header";
import EmployeeView from "./components/EmployeeView";
import ManagerView from "./components/ManagerView";
import Login from "./components/Login";

export default function Home() {
  const { user, hydrated } = useApp();

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

  return (
    <div className="app">
      <Header />
      <main className="container">
        {user.role === "manager" ? <ManagerView /> : <EmployeeView />}
      </main>
      <footer className="footer">
        Comptech Enterprises · Technology · Innovation · Integrity
      </footer>
    </div>
  );
}

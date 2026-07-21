import "./globals.css";
import { AppProvider } from "@/lib/store";

export const metadata = {
  title: "Onward Workspaces — Task Management",
  description:
    "Daily task management & issue reporting for Onward Workspaces.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}

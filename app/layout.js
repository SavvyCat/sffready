import NavBar from "@/components/Navbar";
import "./globals.css";

export const metadata = {
  title: "SFF Ready?",
  description: "",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <NavBar />
        {children}
      </body>
    </html>
  );
}

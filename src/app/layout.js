import "./globals.css";
import Providers from "./providers";

export const metadata = {
  title: "PDF to E-Course Platform",
  description: "Upload a PDF to generate a learning course",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
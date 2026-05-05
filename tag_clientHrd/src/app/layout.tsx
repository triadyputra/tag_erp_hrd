import React from "react";
import MyApp from "./app";
import NextTopLoader from 'nextjs-toploader';
import "./global.css";
import { CustomizerContextProvider } from "./context/customizerContext";
import AuthGuard from "./components/auth/AuthGuard";
import { SnackbarProvider } from "./context/SnackbarContext";
import IdleLockProvider from "./components/security/IdleLockProvider";


export const metadata = {
  title: "Sistem Aplikasi TAG",
  description: "PT TUNAS ARTHA GARDATAMA (TAG)",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <NextTopLoader color="#5D87FF" />
        <CustomizerContextProvider>
          <AuthGuard>
            <MyApp>
              <SnackbarProvider>
                <IdleLockProvider>{children}</IdleLockProvider>
              </SnackbarProvider>
            </MyApp>
          </AuthGuard>
        </CustomizerContextProvider>
      </body>
    </html>
  );
}

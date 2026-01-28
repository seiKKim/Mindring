"use client";

import { UserProvider } from "@/contexts/UserContext";
import { ReactNode } from "react";
import { ModalProviderWithContext } from "./ui/modal-provider";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <UserProvider>
      <ModalProviderWithContext>{children}</ModalProviderWithContext>
    </UserProvider>
  );
}

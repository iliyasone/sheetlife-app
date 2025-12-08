import { ReactNode } from "react";
import { ViewShell } from "@/components/views/view-shell";

export default function ViewsLayout({ children }: { children: ReactNode }) {
  return <ViewShell>{children}</ViewShell>;
}

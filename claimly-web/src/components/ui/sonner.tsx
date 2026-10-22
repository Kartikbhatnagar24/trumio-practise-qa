import { Toaster as Sonner } from "sonner";

export function Toaster() {
  return <Sonner position="bottom-right" toastOptions={{ style: { fontFamily: "var(--font-sans)", borderRadius: "8px", border: "1px solid var(--color-rule)" } }} />;
}

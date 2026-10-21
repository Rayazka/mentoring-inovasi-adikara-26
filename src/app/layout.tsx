// TODO: Bind visual tokens to future approved canvas revisions without publishing private source assets.
import type { Metadata } from "next";
import "@/views/styles/globals.css";

export const metadata: Metadata = {
  title: "Mentoring ADIKARA 2026",
  description: "Mentoring karya dan inovasi ADIKARA 2026.",
};

/** Provide the shared Indonesian document and global design tokens to every application route. */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="id"><body>{children}</body></html>;
}

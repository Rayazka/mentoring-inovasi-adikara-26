import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mentoring ADIKARA 2026",
  description: "Mentoring karya dan inovasi ADIKARA 2026.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="id"><body>{children}</body></html>;
}

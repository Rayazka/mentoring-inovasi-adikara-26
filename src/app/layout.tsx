// TODO: Jaga dokumentasi, pemisahan tanggung jawab dan pengujian modul ini saat perilakunya berubah.
import type { Metadata } from "next";
import "@/views/styles/globals.css";

export const metadata: Metadata = {
	title: "Mentoring ADIKARA 2026",
	description: "Mentoring karya dan inovasi ADIKARA 2026.",
};

/** Menyediakan dokumen Bahasa Indonesia dan token desain untuk seluruh route aplikasi. */
export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html lang="id">
			<body>{children}</body>
		</html>
	);
}

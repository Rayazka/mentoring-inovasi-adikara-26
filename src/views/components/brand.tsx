// TODO: Pertahankan fallback teks saat aset resmi belum tersedia pada checkout publik.
"use client";
import Image from "next/image";
import { publicAssets } from "@/models/public-assets";
import { useState } from "react";

/** Menggunakan logo resmi lokal tanpa menggambar ulang atau memublikasikan berkas brand. */
export function Brand({
	compact = false,
	source = "logo",
}: {
	compact?: boolean;
	source?: "logo" | "login-logo";
}) {
	const [failed, setFailed] = useState(false);
	/** Mengalihkan tampilan ke teks ketika checkout tidak menyertakan aset privat. */
	function showFallback() {
		setFailed(true);
	}
	return failed ? (
		<span className="brand-word">
			ADIKARA 2026<small>Lead With Character, Shape The Future.</small>
		</span>
	) : (
		<Image
			className="official-brand"
			src={compact ? publicAssets.icon : publicAssets[source]}
			width={compact ? 28 : 218}
			height={compact ? 42 : 48}
			alt="ADIKARA 2026 — Lead With Character, Shape The Future."
			unoptimized
			onError={showFallback}
		/>
	);
}

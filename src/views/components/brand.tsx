// TODO: Pertahankan fallback teks ketika aset brand publik gagal dimuat.
"use client";
import Image from "next/image";
import { publicAssets } from "@/models/public-assets";
import { useState } from "react";

/** Menampilkan logo resmi yang diizinkan pemilik tanpa menggambar ulang identitas brand. */
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

// TODO: Pertahankan penggunaan komponen Home V2 bersama saat sumber data produksi bertambah.
import Link from "next/link";
import type { loadParticipantHome } from "@/controllers/connected/participant-home";
import { ParticipantHomeView } from "@/views/components/participant-home";
import { Panel } from "@/views/components/ui";

/** Menghubungkan hasil controller produksi ke tampilan Home V2 yang sudah disepakati. */
export function ConnectedParticipantHome({
	result,
}: {
	result: Awaited<ReturnType<typeof loadParticipantHome>>;
}) {
	if (result.error || !result.data)
		return (
			<Panel title="Home belum dapat dimuat">
				<p role="alert">
					Periksa koneksi dan coba lagi. Data tim dan karya tetap tersimpan.
				</p>
				<Link href="/peserta" className="button secondary">
					Coba lagi
				</Link>
			</Panel>
		);
	return (
		<>
			{result.attention && (
				<p className="notice warning">
					{result.attention}{" "}
					<Link href="/peserta/pengajuan" className="text-link">
						Lihat pengajuan
					</Link>
				</p>
			)}
			<ParticipantHomeView data={result.data} />
		</>
	);
}

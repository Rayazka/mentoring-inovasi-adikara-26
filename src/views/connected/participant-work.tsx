// TODO: Pertahankan karya dan dokumen pada halaman yang sama saat penyimpanan bahan dihubungkan.
import Link from "next/link";
import type { loadParticipantWork } from "@/controllers/connected/participant-work";
import { isConnectedWorkReady } from "@/models/connected/work";
import { Badge, EmptyState, Panel } from "@/views/components/ui";
import { ConnectedWorkForm } from "./work-form";
import { WorkDocuments } from "./work-documents";

/** Menyajikan ringkasan dan form karya sesuai struktur desain menggunakan data tim aktif. */
export function ConnectedWorkPage({
	data,
}: {
	data: Awaited<ReturnType<typeof loadParticipantWork>>;
}) {
	if (data.error)
		return (
			<Panel title="Identitas karya belum dapat dimuat">
				<p role="alert">Periksa koneksi dan coba lagi.</p>
				<Link className="button secondary" href="/peserta/karya">
					Coba lagi
				</Link>
			</Panel>
		);
	if (!data.team)
		return (
			<Panel title="Identitas Karya">
				<EmptyState
					title="Bentuk tim terlebih dahulu"
					description="Judul topik, deskripsi, dan dokumen menjadi identitas karya milik tim."
					icon="team"
				>
					<Link className="button" href="/peserta/tim">
						Ke Tim Saya
					</Link>
				</EmptyState>
			</Panel>
		);
	return (
		<>
			<nav className="local-navigation" aria-label="Bagian Identitas Karya">
				<a className="is-active" href="#informasi-karya">
					Informasi Karya
				</a>
				<a href="#dokumen-pendukung">
					Dokumen Pendukung{" "}
					<span className="count">{data.documents.length}</span>
				</a>
			</nav>
			<section className="crimson-summary" aria-label="Ringkasan karya">
				<div className="row spread wrap">
					<div>
						<h2>{data.work?.title || "Identitas karya belum diisi"}</h2>
						<p>
							Milik Tim {data.team.name} · {data.team.category}
						</p>
					</div>
					<Badge
						label={
							isConnectedWorkReady(data.work)
								? "Judul & deskripsi terisi"
								: "Perlu dilengkapi"
						}
					/>
				</div>
				<p>
					Informasi karya digunakan kembali saat mengajukan mentoring. Kamu
					tidak perlu menuliskannya ulang untuk setiap sesi.
				</p>
			</section>
			<ConnectedWorkForm key={data.team.id} work={data.work} />
			<WorkDocuments
				documents={data.documents}
				userId={data.userId}
				leaderId={data.team.leader_id}
			/>
		</>
	);
}

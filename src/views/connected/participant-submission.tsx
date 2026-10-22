// TODO: Pertahankan snapshot review yang jelas sebelum peserta mengirim permintaan mentoring.
import Link from "next/link";
import type { loadParticipantSubmission } from "@/controllers/connected/participant-submission";
import { formatWib } from "@/models/connected/operations";
import { Avatar, EmptyState, Panel } from "@/views/components/ui";
import { SubmissionForm } from "./submission-form";

/** Menyajikan review mentor, jadwal, tim dan karya tersimpan sebelum transaksi pengajuan. */
export function ConnectedSubmissionPage({
	data,
}: {
	data: Awaited<ReturnType<typeof loadParticipantSubmission>>;
}) {
	if (data.kind === "error")
		return (
			<Panel title="Review belum dapat dimuat">
				<p role="alert">Periksa koneksi dan coba muat ulang.</p>
			</Panel>
		);
	if (data.kind === "restricted")
		return (
			<Panel>
				<EmptyState
					title="Pengajuan belum dapat dilanjutkan"
					description={data.message}
					icon="request"
				>
					<Link className="button" href={data.href}>
						Lengkapi langkah sebelumnya
					</Link>
				</EmptyState>
			</Panel>
		);
	return (
		<>
			<div className="section-heading">
				<div>
					<span className="eyebrow">PENGAJUAN MENTORING</span>
					<h2>Tinjau pengajuan tim</h2>
					<p>
						Periksa informasi sebelum mengirim. Pengajuan belum mengunci jadwal.
					</p>
				</div>
			</div>
			<div className="team-columns">
				<Panel title="Ringkasan sesi">
					<div className="stack">
						<div className="row">
							<Avatar
								name={data.mentor.name}
								photo={data.mentor.photo_url ?? undefined}
							/>
							<div>
								<h3>{data.mentor.name}</h3>
								<p>{data.mentor.expertise}</p>
							</div>
						</div>
						<strong>{formatWib(data.slot.starts_at)}</strong>
						<p>Tim {data.team.name}</p>
						<Link href={`/peserta/mentor/${data.mentor.id}`}>Ganti jadwal</Link>
					</div>
				</Panel>
				<Panel title="Identitas Karya">
					<h3>{data.work.title}</h3>
					<p style={{ whiteSpace: "pre-wrap" }}>{data.work.description}</p>
					<Link className="text-link" href="/peserta/karya#informasi-karya">
						Perbaiki identitas karya
					</Link>
				</Panel>
			</div>
			<Panel title="Konfirmasi pengajuan">
				<SubmissionForm
					slotId={data.slot.id}
					submissionKey={data.key}
					documents={data.documents}
				/>
			</Panel>
		</>
	);
}

// TODO: Pertahankan konteks pemohon ketika keputusan gagal karena kapasitas atau perubahan serentak.
import { reviewParticipantJoin } from "@/controllers/connected/team-actions";
import type { JoinRequest } from "@/models/connected/team";
import { Avatar, Badge, EmptyState, Panel } from "@/views/components/ui";
import { MutationForm } from "./mutation-form";

/** Menyajikan permintaan bagi ketua dengan tindakan eksplisit dan hitungan kapasitas aktual. */
export function IncomingTeamRequests({
	requests,
	full,
}: {
	requests: JoinRequest[];
	full: boolean;
}) {
	return (
		<Panel
			title="Permintaan Bergabung"
			actions={<Badge label={`${requests.length} menunggu`} tone="warning" />}
		>
			<div className="stack">
				<p>
					Tinjau calon anggota sebelum menerima. Tim maksimal tiga orang
					termasuk ketua.
				</p>
				{requests.length ? (
					requests.map(
						/** Menampilkan perkenalan pemohon beserta keputusan yang diverifikasi ulang oleh server. */
						function request(item) {
							return (
								<article key={item.id} className="subtle-box stack">
									<div className="row">
										<Avatar name={item.applicant_name ?? "Peserta"} />
										<h3>{item.applicant_name ?? "Peserta ADIKARA"}</h3>
									</div>
									<p>{item.note}</p>
									<div className="grid-2">
										<MutationForm
											action={reviewParticipantJoin}
											submit="Tolak permintaan"
											fields={[
												{
													name: "join",
													label: "Permintaan",
													type: "hidden",
													value: item.id,
												},
												{
													name: "decision",
													label: "Keputusan",
													type: "hidden",
													value: "reject",
												},
											]}
										/>
										<MutationForm
											action={reviewParticipantJoin}
											submit={full ? "Tim penuh" : "Terima permintaan"}
											disabled={full}
											fields={[
												{
													name: "join",
													label: "Permintaan",
													type: "hidden",
													value: item.id,
												},
												{
													name: "decision",
													label: "Keputusan",
													type: "hidden",
													value: "accept",
												},
											]}
										/>
									</div>
								</article>
							);
						},
					)
				) : (
					<EmptyState
						title="Belum ada permintaan baru"
						description="Permintaan calon anggota akan tampil di sini."
						icon="team"
					/>
				)}
			</div>
		</Panel>
	);
}

// TODO: Jaga dokumentasi, pemisahan tanggung jawab dan pengujian modul ini saat perilakunya berubah.
"use client";

import Link from "next/link";
import Image from "next/image";
import {
	useEffect,
	useId,
	useRef,
	type ButtonHTMLAttributes,
	type ReactNode,
} from "react";
import type { Mentor, RequestStatus, ResourceLink } from "@/models/demo/types";

const iconPaths = {
	home: "m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1Z",
	team: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M16 3a4 4 0 0 1 0 8m6 10v-2a4 4 0 0 0-3-3.87M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0",
	file: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Zm0 0v6h6M8 13h8m-8 4h6",
	mentor:
		"M12 15v6m-5 0h10M5 3h14v4a7 7 0 0 1-14 0Zm0 2H2v2a4 4 0 0 0 4 4m13-6h3v2a4 4 0 0 1-4 4",
	calendar:
		"M8 2v4m8-4v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2",
	request: "M9 5H5v16h14V5h-4M9 3h6v4H9Zm-2 9h10m-10 4h7",
	bell: "M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9m-11 13h4",
	settings:
		"M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8m-2-6h4l1 3 3 1 3 1v4l-3 1-1 3-1 3h-4l-1-3-3-1-3-1v-4l3-1 1-3Z",
	logout: "M9 3H3v18h6m6-16 7 7-7 7m-8-7h15",
	arrow: "M5 12h14m-6-6 6 6-6 6",
	external: "M15 3h6v6m0-6L10 14M9 3H3v18h18v-6",
	plus: "M12 5v14M5 12h14",
	check: "m5 12 4 4L19 6",
	close: "m6 6 12 12M6 18 18 6",
	menu: "M4 6h16M4 12h16M4 18h16",
	collapse: "M9 3v18M4 3h16v18H4Zm12 6-3 3 3 3",
	search: "M21 21l-5-5M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0",
	clock: "M12 8v5l3 2M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0",
} as const;
export type IconName = keyof typeof iconPaths;

/** Menampilkan ikon garis dekoratif; label aksesibel disediakan kontrol yang menyertainya. */
export function Icon({ name }: { name: IconName }) {
	return (
		<svg
			className="icon"
			aria-hidden="true"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="1.7"
			strokeLinecap="round"
			strokeLinejoin="round"
		>
			<path d={iconPaths[name]} />
		</svg>
	);
}

/** Menampilkan foto atau inisial akun berbentuk lingkaran dengan label aksesibel. */
export function Avatar({
	name,
	size = "",
	photo,
}: {
	name: string;
	size?: "" | "small" | "large";
	photo?: string;
}) {
	const parts = name.trim().split(/\s+/);
	const initials = `${parts[0]?.[0] ?? "?"}${parts.length > 1 ? parts[parts.length - 1][0] : ""}`;
	return (
		<span className={`avatar ${size}`} role="img" aria-label={name}>
			{photo ? (
				<Image
					src={photo}
					alt=""
					width={112}
					height={112}
					unoptimized={!photo.startsWith("/mentors/")}
					style={{
						width: "100%",
						height: "100%",
						objectFit: "cover",
						borderRadius: "50%",
					}}
				/>
			) : (
				initials
			)}
		</span>
	);
}

/** Menyediakan tampilan tombol bersama sambil mempertahankan perilaku form dan kondisi nonaktif. */
export function Button({
	variant = "",
	className = "",
	children,
	type = "button",
	...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
	variant?: "" | "secondary" | "neutral" | "danger";
	children: ReactNode;
}) {
	return (
		<button type={type} className={`button ${variant} ${className}`} {...props}>
			{children}
		</button>
	);
}

/** Mengelompokkan bagian halaman dengan judul dan tindakan yang relevan. */
export function Panel({
	title,
	icon,
	children,
	actions,
	className = "",
}: {
	title?: string;
	icon?: IconName;
	children: ReactNode;
	actions?: ReactNode;
	className?: string;
}) {
	return (
		<section className={`panel ${className}`}>
			{title && (
				<div className="panel-header">
					<h2 className="panel-title">
						{icon && <Icon name={icon} />}
						{title}
					</h2>
					{actions}
				</div>
			)}
			{children}
		</section>
	);
}

const statuses: Record<RequestStatus, { label: string; tone: string }> = {
	pending: { label: "Menunggu respons", tone: "warning" },
	revision_requested: { label: "Perlu revisi", tone: "info" },
	approved: { label: "Disetujui", tone: "success" },
	rejected: { label: "Ditolak", tone: "danger" },
	cancelled: { label: "Dibatalkan", tone: "" },
	completed: { label: "Selesai", tone: "success" },
};

/** Menampilkan status melalui teks dan penanda visual selain warna. */
export function Badge({
	status,
	label,
	tone = "",
}: {
	status?: RequestStatus;
	label?: string;
	tone?: string;
}) {
	const value = status ? statuses[status] : { label, tone };
	return <span className={`badge ${value.tone}`}>{value.label}</span>;
}

/** Menjelaskan kondisi kosong sambil menyediakan tindakan berikutnya. */
export function EmptyState({
	title,
	description,
	icon = "file",
	children,
}: {
	title: string;
	description: string;
	icon?: IconName;
	children?: ReactNode;
}) {
	return (
		<div className="empty">
			<span className="empty-icon">
				<Icon name={icon} />
			</span>
			<strong>{title}</strong>
			<p>{description}</p>
			{children && <div className="actions">{children}</div>}
		</div>
	);
}

/** Menampilkan penjelasan ringkas bahwa data dan login hanya untuk demo lokal. */
export function DemoBanner() {
	return (
		<div className="demo-banner">
			<strong>MODE DEMO</strong> · Seluruh akun dan karya adalah data contoh ·
			Tersimpan di browser ini · Google belum terhubung
		</div>
	);
}

/** Menampilkan tautan resmi pemilik tanpa menyalin ilustrasi privat. */
export function ResourcePanel({ links }: { links: ResourceLink[] }) {
	return (
		<section className="resource-panel" id="link-penting">
			<div>
				<span className="eyebrow">Bekal untuk langkah berikutnya</span>
				<h2>Link Penting</h2>
				<p>
					Semua bekal untuk mempersiapkan karya terbaikmu. Baca panduan dan
					lengkapi dokumen sebelum mentoring.
				</p>
			</div>
			<div className="resource-links">
				{links
					.filter(
						/** Menjalankan langkah activeLink sesuai tanggung jawab modul ini. */
						function activeLink(link) {
							return link.active;
						},
					)
					.sort(
						/** Mengikuti urutan panel resource pada desain LOGIN dan Home V2. */
						function resourcePriority(first, second) {
							const order = [
								"Template Proposal",
								"Guidebook ADIKARA 2026",
								"Twibbon & Caption",
								"Pendaftaran",
							];
							const a = order.indexOf(first.title);
							const b = order.indexOf(second.title);
							return (a < 0 ? 99 : a) - (b < 0 ? 99 : b);
						},
					)
					.map(
						/** Menjalankan langkah resourceItem sesuai tanggung jawab modul ini. */
						function resourceItem(link) {
							return (
								<a
									className="resource-link"
									href={link.url}
									target="_blank"
									rel="noreferrer"
									key={link.id}
								>
									<span className="row">
										<Icon name="file" />
										{link.title}
									</span>
									<Icon name="external" />
								</a>
							);
						},
					)}
			</div>
		</section>
	);
}

/** Menampilkan ringkasan mentor rata tengah dengan avatar lingkaran dan tautan profil. */
export function MentorCard({ mentor }: { mentor: Mentor }) {
	return (
		<article className="mentor-card">
			<Avatar name={mentor.name} size="large" photo={mentor.photo} />
			<div className="mentor-copy">
				<h3>{mentor.name}</h3>
				<p>{mentor.title}</p>
			</div>
			<div className="tags">
				<span className="tag">{mentor.expertise}</span>
				{mentor.dates.length === 1 && (
					<span className="tag">Hanya 24 Oktober</span>
				)}
			</div>
			<Link
				className="button secondary small"
				href={`/peserta/mentor/${mentor.id}`}
			>
				Lihat Profil <Icon name="arrow" />
			</Link>
		</article>
	);
}

/** Menyelaraskan kondisi dialog native dan menjaga pemulihan fokus browser. */
export function Modal({
	open,
	title,
	children,
	onClose,
	className = "",
}: {
	open: boolean;
	title: string;
	children: ReactNode;
	onClose: () => void;
	className?: string;
}) {
	const ref = useRef<HTMLDialogElement>(null);
	const headingId = useId();
	/** Membuka atau menutup dialog hanya ketika kondisi tampilnya berubah. */
	useEffect(
		/** Menjalankan langkah synchronizeDialog sesuai tanggung jawab modul ini. */
		function synchronizeDialog() {
			const dialog = ref.current;
			if (open && dialog && !dialog.open) dialog.showModal();
			if (!open && dialog?.open) dialog.close();
		},
		[open],
	);
	return (
		<dialog
			className={`dialog ${className}`}
			ref={ref}
			aria-labelledby={headingId}
			onCancel={onClose}
			onClose={onClose}
		>
			<div className="dialog-header">
				<h2 id={headingId}>{title}</h2>
				<button
					type="button"
					className="icon-button"
					aria-label="Tutup dialog"
					onClick={onClose}
				>
					<Icon name="close" />
				</button>
			</div>
			{children}
		</dialog>
	);
}

/** Memformat waktu dalam WIB untuk riwayat dan ringkasan operasional. */
export function formatDate(value: string, withTime = false) {
	return (
		new Intl.DateTimeFormat("id-ID", {
			timeZone: "Asia/Jakarta",
			day: "numeric",
			month: "short",
			year: "numeric",
			...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
		}).format(
			new Date(value.includes("T") ? value : `${value}T12:00:00+07:00`),
		) + (withTime ? " WIB" : "")
	);
}

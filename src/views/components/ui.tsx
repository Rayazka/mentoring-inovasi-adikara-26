// TODO: Keep reusable controls consistent with the approved design and accessible across all role views.
"use client";

import Link from "next/link";
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

/** Render a consistent decorative stroke icon; its accompanying control supplies the accessible label. */
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

/** Present fictional accounts as circular initials without publishing withheld portrait assets. */
export function Avatar({
	name,
	size = "",
}: {
	name: string;
	size?: "" | "small" | "large";
}) {
	const parts = name.trim().split(/\s+/);
	const initials = `${parts[0]?.[0] ?? "?"}${parts.length > 1 ? parts[parts.length - 1][0] : ""}`;
	return (
		<span className={`avatar ${size}`} role="img" aria-label={name}>
			{initials}
		</span>
	);
}

/** Share button appearance while retaining native form and disabled semantics. */
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

/** Group a meaningful section with an accessible heading and optional contextual actions. */
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

/** Show status with readable text and a secondary visual marker, not color alone. */
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

/** Explain an empty section and keep its next action available instead of hiding the container. */
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

/** Render a compact disclosure of the local-only dummy data and authentication mode. */
export function DemoBanner() {
	return (
		<div className="demo-banner">
			<strong>MODE DEMO</strong> · Seluruh akun dan karya adalah data contoh ·
			Tersimpan di browser ini · Google belum terhubung
		</div>
	);
}

/** Render official resource destinations supplied by the owner without copying private artwork. */
export function ResourcePanel({ links }: { links: ResourceLink[] }) {
	return (
		<section className="resource-panel" id="link-penting">
			<div>
				<span className="eyebrow">Bekal untuk langkah berikutnya</span>
				<h2>Link Penting</h2>
				<p>
					Temukan panduan dan bahan yang kamu butuhkan untuk menyiapkan karya
					ADIKARA 2026.
				</p>
			</div>
			<div className="resource-links">
				{links
					.filter(function activeLink(link) {
						return link.active;
					})
					.map(function resourceItem(link) {
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
					})}
			</div>
		</section>
	);
}

/** Present a centered mentor summary with a circular avatar and a real profile route. */
export function MentorCard({ mentor }: { mentor: Mentor }) {
	return (
		<article className="mentor-card">
			<Avatar name={mentor.name} size="large" />
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

/** Keep a native modal's open state synchronized and restore focus through browser dialog semantics. */
export function Modal({
	open,
	title,
	children,
	onClose,
}: {
	open: boolean;
	title: string;
	children: ReactNode;
	onClose: () => void;
}) {
	const ref = useRef<HTMLDialogElement>(null);
	const headingId = useId();
	/** Open or close the native modal only when its controlled visibility changes. */
	useEffect(
		function synchronizeDialog() {
			const dialog = ref.current;
			if (open && dialog && !dialog.open) dialog.showModal();
			if (!open && dialog?.open) dialog.close();
		},
		[open],
	);
	return (
		<dialog
			className="dialog"
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

/** Format timestamps as explicit WIB labels for history and operational summaries. */
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

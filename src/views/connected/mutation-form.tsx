// TODO: Pertahankan nilai input saat gagal dan status pengiriman yang dapat dibaca pembaca layar.
"use client";
import { useActionState, useState, useId, type ChangeEvent } from "react";
import type { MutationResult } from "@/models/connected/team";

export interface FormField {
	name: string;
	label: string;
	type?: "text" | "textarea" | "select" | "hidden" | "url";
	value?: string;
	options?: readonly string[];
	optionLabels?: Record<string, string>;
	required?: boolean;
	maxLength?: number;
}
/** Mengirim form ke controller server dengan input terkontrol agar kesalahan tidak menghapus isian. */
export function MutationForm({
	action,
	fields,
	submit,
	disabled = false,
}: {
	action: (state: MutationResult, form: FormData) => Promise<MutationResult>;
	fields: FormField[];
	submit: string;
	disabled?: boolean;
}) {
	const [state, formAction, pending] = useActionState(action, { error: null });
	const formId = useId();
	const [values, setValues] = useState<Record<string, string>>({});
	return (
		<form action={formAction} className="stack">
			<fieldset
				disabled={pending || disabled}
				className="stack"
				style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }}
			>
				{fields.map(
					/** Menyajikan input berlabel tanpa menyimpan data pada penyimpanan browser. */
					function field(item) {
						const value =
							values[item.name] ?? item.value ?? item.options?.[0] ?? "";
						/** Menyimpan perubahan isian hanya selama komponen form terpasang. */
						function change(
							event: ChangeEvent<
								HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
							>,
						) {
							setValues({ ...values, [item.name]: event.target.value });
						}
						if (item.type === "hidden")
							return (
								<input
									key={item.name}
									type="hidden"
									name={item.name}
									value={item.value ?? ""}
								/>
							);
						const props = {
							id: `${formId}-${item.name}`,
							name: item.name,
							value,
							onChange: change,
							required: item.required,
							maxLength: item.maxLength,
						};
						return (
							<label className="field" key={item.name} htmlFor={props.id}>
								{item.label}
								{item.type === "textarea" ? (
									<textarea {...props} />
								) : item.type === "select" ? (
									<select {...props}>
										{item.options?.map(
											/** Menampilkan opsi yang sudah ditentukan oleh model atau halaman. */
											function option(text) {
												return (
													<option key={text} value={text}>
														{item.optionLabels?.[text] ?? text}
													</option>
												);
											},
										)}
									</select>
								) : (
									<input {...props} type={item.type ?? "text"} />
								)}
							</label>
						);
					},
				)}
				<button type="submit" className="button">
					{pending ? "Menyimpan…" : submit}
				</button>
			</fieldset>
			{state.error && (
				<p className="notice danger" role="alert">
					{state.error}
				</p>
			)}
			{state.success && (
				<p className="notice" role="status">
					{state.success}
				</p>
			)}
		</form>
	);
}

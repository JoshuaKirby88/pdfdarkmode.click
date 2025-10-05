"use client"

import { useEffect, useMemo, useRef } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { Form } from "@/components/form/form"
import { FormButton } from "@/components/form/form-button"
import { FormInput } from "@/components/form/form-input"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { usePDFZustand } from "@/zustand/pdf-zustand"

type Props = {
	totalPages: number
}

type FormValues = {
	startPage: string
	endPage: string
	fileName: string
}

const PDF_EXT_RE = /\.pdf$/i

function getFilenameFromUrlString(input: string): string | null {
	try {
		const url = new URL(input, window.location.href)
		const last = url.pathname.split("/").pop() || ""
		return last ? decodeURIComponent(last) : null
	} catch {
		const cleaned = input.split("?")[0].split("#")[0]
		const last = cleaned.split("/").pop() || ""
		return last ? decodeURIComponent(last) : null
	}
}

function deriveTitle(source: File | string): string | null {
	if (source instanceof File) {
		return source.name
	}
	if (typeof source === "string" && !source.startsWith("data:")) {
		return getFilenameFromUrlString(source)
	}
	return null
}

function ensurePdfSuffix(name: string): string {
	return name.toLowerCase().endsWith(".pdf") ? name : `${name}.pdf`
}

async function sourceToArrayBuffer(src: File | string): Promise<ArrayBuffer> {
	if (src instanceof File) {
		return src.arrayBuffer()
	}
	if (src.startsWith("data:")) {
		const base64 = src.split(",")[1] ?? ""
		const binary = atob(base64)
		const bytes = new Uint8Array(binary.length)
		for (let i = 0; i < binary.length; i += 1) {
			bytes[i] = binary.charCodeAt(i)
		}
		return bytes.buffer
	}
	const res = await fetch(src)
	if (!res.ok) {
		throw new Error(`Failed to fetch PDF (${res.status})`)
	}
	return res.arrayBuffer()
}

export const ExportPagesDialog = ({ totalPages }: Props) => {
	const { pdf, open, setOpen, currentPage } = usePDFZustand(state => ({
		pdf: state.pdf,
		open: state.showExportDialog,
		setOpen: state.setShowExportDialog,
		currentPage: state.currentPage,
	}))

	const form = useForm<FormValues>({
		defaultValues: {
			startPage: "1",
			endPage: "1",
			fileName: "export.pdf",
		},
	})

	const hasManuallyEditedName = useRef(false)

	const defaultBaseName = useMemo(() => {
		const title = pdf ? deriveTitle(pdf) : null
		const fallback = "export"
		const base = (title || fallback).replace(PDF_EXT_RE, "")
		return base || fallback
	}, [pdf])

	// Prefill when dialog opens
	useEffect(() => {
		if (!open) {
			return
		}
		const clampedPages = Math.max(totalPages, 1)
		const start = Math.min(Math.max(currentPage ?? 1, 1), clampedPages)
		const end = start
		const suggested = ensurePdfSuffix(`${defaultBaseName}-p${start}-${end}`)
		form.reset({
			startPage: String(start),
			endPage: String(end),
			fileName: suggested,
		})
		hasManuallyEditedName.current = false
		// Focus first field on open
		setTimeout(() => {
			const el = document.querySelector<HTMLInputElement>('input[name="startPage"]')
			if (el) {
				el.select()
				el.focus()
			}
		}, 0)
	}, [open, currentPage, totalPages, defaultBaseName, form])

	// Auto-update filename based on page range unless manually edited
	const watchedStart = form.watch("startPage")
	const watchedEnd = form.watch("endPage")
	useEffect(() => {
		if (!open) {
			return
		}
		if (hasManuallyEditedName.current) {
			return
		}
		const clampedPages = Math.max(totalPages, 1)
		const start = Number.parseInt(watchedStart || "1", 10) || 1
		const end = Number.parseInt(watchedEnd || String(start), 10) || start
		const s = Math.min(Math.max(start, 1), clampedPages)
		const e = Math.min(Math.max(end, 1), clampedPages)
		const low = Math.min(s, e)
		const high = Math.max(s, e)
		const suggested = ensurePdfSuffix(`${defaultBaseName}-p${low}-${high}`)
		form.setValue("fileName", suggested, { shouldDirty: false, shouldTouch: false })
	}, [watchedStart, watchedEnd, defaultBaseName, totalPages, open, form.setValue])

	// Global shortcut: Cmd/Ctrl+E to open, Esc to close
	useEffect(() => {
		const onKey = (e: KeyboardEvent) => {
			const meta = e.metaKey || e.ctrlKey
			if (meta && (e.key === "e" || e.key === "E")) {
				if (!pdf) {
					return
				}
				e.preventDefault()
				setOpen(true)
			} else if (e.key === "Escape" && open) {
				setOpen(false)
			}
		}
		window.addEventListener("keydown", onKey)
		return () => {
			window.removeEventListener("keydown", onKey)
		}
	}, [pdf, open, setOpen])

	const onSubmit = async (values: FormValues) => {
		if (!pdf) {
			toast.error("No PDF loaded")
			return
		}

		const clampedPages = Math.max(totalPages, 1)
		let start = Number.parseInt(values.startPage, 10)
		let end = Number.parseInt(values.endPage, 10)
		if (Number.isNaN(start) || Number.isNaN(end)) {
			toast.error("Start and end pages must be numbers")
			return
		}

		start = Math.min(Math.max(start, 1), clampedPages)
		end = Math.min(Math.max(end, 1), clampedPages)
		const low = Math.min(start, end)
		const high = Math.max(start, end)

		try {
			const { PDFDocument } = await import("pdf-lib")
			const srcBytes = await sourceToArrayBuffer(pdf)
			const srcDoc = await PDFDocument.load(srcBytes)
			const outDoc = await PDFDocument.create()

			const indices = Array.from({ length: high - low + 1 }, (_, i) => low - 1 + i)
			const copiedPages = await outDoc.copyPages(srcDoc, indices)
			for (const p of copiedPages) {
				outDoc.addPage(p)
			}

			const cleanBaseTitle = (values.fileName?.trim() || `${defaultBaseName}-p${low}-${high}`).replace(PDF_EXT_RE, "")
			outDoc.setTitle(cleanBaseTitle)

			const outBytes = await outDoc.save()
			const blob = new Blob([outBytes], { type: "application/pdf" })
			const url = URL.createObjectURL(blob)
			const a = document.createElement("a")
			a.href = url
			a.download = ensurePdfSuffix(values.fileName?.trim() || `${defaultBaseName}-p${low}-${high}`)
			document.body.appendChild(a)
			a.click()
			a.remove()
			URL.revokeObjectURL(url)

			toast.success(`Exported pages ${low}–${high} as ${a.download}`)
			setOpen(false)
		} catch (err) {
			const message = err instanceof Error ? err.message : "Failed to export PDF"
			toast.error(message)
		}
	}

	return (
		<Dialog onOpenChange={v => setOpen(v)} open={!!open}>
			<DialogContent aria-describedby={undefined}>
				<DialogHeader>
					<DialogTitle>Export pages</DialogTitle>
					<DialogDescription>Choose a page range and a name for the new PDF. Press Enter to export.</DialogDescription>
				</DialogHeader>

				<Form<FormValues> {...form} className="gap-3" onSubmit={onSubmit}>
					<div className="flex items-end gap-2">
						<FormInput
							inputMode="numeric"
							label="Start page"
							max={Math.max(totalPages, 1)}
							min={1}
							name="startPage"
							onWheel={e => {
								;(e.currentTarget as HTMLInputElement).blur()
							}}
							step={1}
							type="number"
						/>
						<span className="pb-2 text-muted-foreground">to</span>
						<FormInput
							inputMode="numeric"
							label="End page"
							max={Math.max(totalPages, 1)}
							min={1}
							name="endPage"
							onWheel={e => {
								;(e.currentTarget as HTMLInputElement).blur()
							}}
							step={1}
							type="number"
						/>
					</div>

					<FormInput
						label="File name"
						name="fileName"
						onChange={e => {
							form.setValue("fileName", e.target.value)
							hasManuallyEditedName.current = true
						}}
						placeholder={`${defaultBaseName}-p1-1.pdf`}
					/>

					<DialogFooter>
						<FormButton>{form.formState.isSubmitting ? "Exporting…" : "Export"}</FormButton>
					</DialogFooter>
				</Form>
			</DialogContent>
		</Dialog>
	)
}

export default ExportPagesDialog

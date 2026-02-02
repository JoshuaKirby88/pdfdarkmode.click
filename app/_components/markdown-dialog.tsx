"use client"

import { ClipboardCopy, Download, Loader2 } from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts"
import { usePDFZustand } from "@/zustand/pdf-zustand"
import { convertPdfToMarkdown } from "../actions/convert-pdf-to-markdown"

type Props = {
	totalPages: number
}

export const MarkdownDialog = ({ totalPages }: Props) => {
	const { pdf, open, setOpen, markdownContent, setMarkdownContent, markdownCost, setMarkdownCost, isConverting, setIsConverting } = usePDFZustand(state => ({
		pdf: state.pdf,
		open: state.showMarkdownDialog,
		setOpen: state.setShowMarkdownDialog,
		markdownContent: state.markdownContent,
		setMarkdownContent: state.setMarkdownContent,
		markdownCost: state.markdownCost,
		setMarkdownCost: state.setMarkdownCost,
		isConverting: state.isConvertingToMarkdown,
		setIsConverting: state.setIsConvertingToMarkdown,
	}))

	const [isCopying, setIsCopying] = useState(false)
	const [isSaving, setIsSaving] = useState(false)

	const handleSave = useCallback(() => {
		if (!markdownContent) {
			return
		}

		setIsSaving(true)
		try {
			const blob = new Blob([markdownContent], { type: "text/markdown" })
			const url = URL.createObjectURL(blob)

			const a = document.createElement("a")
			a.href = url
			a.download = "document.md"
			document.body.appendChild(a)
			a.click()
			document.body.removeChild(a)

			URL.revokeObjectURL(url)

			toast.success("Markdown file saved")
		} catch (_error) {
			toast.error("Failed to save markdown file")
		} finally {
			setIsSaving(false)
		}
	}, [markdownContent])

	const handleCopy = useCallback(async () => {
		if (!markdownContent) {
			return
		}

		setIsCopying(true)
		try {
			await navigator.clipboard.writeText(markdownContent)
			toast.success("Markdown copied to clipboard")
		} catch (_error) {
			try {
				const textArea = document.createElement("textarea")
				textArea.value = markdownContent
				textArea.style.position = "fixed"
				textArea.style.left = "-999999px"
				document.body.appendChild(textArea)
				textArea.select()
				document.execCommand("copy")
				document.body.removeChild(textArea)
				toast.success("Markdown copied to clipboard")
			} catch (_fallbackError) {
				toast.error("Failed to copy to clipboard")
			}
		} finally {
			setIsCopying(false)
		}
	}, [markdownContent])

	useEffect(() => {
		if (!(open && pdf)) {
			return
		}

		if (markdownContent) {
			return
		}

		const convert = async () => {
			setIsConverting(true)
			try {
				// Import splitting utility
				const { splitPdfIntoPageBuffers } = await import("@/utils/split-pdf")

				// Split PDF into pages
				const pageBuffers = await splitPdfIntoPageBuffers(pdf)

				// Convert to base64 strings
				const base64Pages = pageBuffers.map(buffer => {
					let binary = ""
					for (let i = 0; i < buffer.byteLength; i++) {
						binary += String.fromCharCode(buffer[i])
					}
					return btoa(binary)
				})

				// Call server action with split pages
				const result = await convertPdfToMarkdown(base64Pages, totalPages)
				if (result.success && result.markdown) {
					setMarkdownContent(result.markdown)
					if (result.cost !== undefined) {
						setMarkdownCost(result.cost)
					}
					toast.success("PDF converted to markdown successfully")
				} else {
					toast.error(result.error || "Failed to convert PDF to markdown")
					setOpen(false)
				}
			} catch (error) {
				const message = error instanceof Error ? error.message : "Failed to convert PDF"
				toast.error(message)
				setOpen(false)
			} finally {
				setIsConverting(false)
			}
		}

		convert()
	}, [open, pdf, markdownContent, totalPages, setIsConverting, setMarkdownContent, setMarkdownCost, setOpen])

	useKeyboardShortcuts(
		[
			{
				key: "ctrl+x+c",
				handler: e => {
					if (markdownContent && !isConverting) {
						e.preventDefault()
						e.stopPropagation()
						handleCopy()
					}
				},
				condition: () => open && !!markdownContent && !isConverting,
				priority: 20,
			},

			{
				key: "ctrl+x+s",
				handler: e => {
					if (markdownContent && !isConverting) {
						e.preventDefault()
						e.stopPropagation()
						handleSave()
					}
				},
				condition: () => open && !!markdownContent && !isConverting,
				priority: 20,
			},

			{
				key: "escape",
				handler: e => {
					if (open) {
						e.preventDefault()
						setOpen(false)
					}
				},
				condition: () => open,
				priority: 20,
			},
		],
		[open, markdownContent, isConverting, handleCopy, handleSave, setOpen]
	)

	return (
		<Dialog onOpenChange={v => setOpen(v)} open={!!open}>
			<DialogContent aria-describedby={undefined} className="!max-w-[95vw] flex h-[95vh] flex-col">
				<DialogHeader>
					<DialogTitle className="pr-8">PDF to Markdown</DialogTitle>
					{isConverting ? (
						<DialogDescription>Converting your PDF to markdown... This may take a moment.</DialogDescription>
					) : (
						markdownCost !== null && markdownCost > 0 && <DialogDescription className="text-xs">Cost: ~${markdownCost.toFixed(4)}</DialogDescription>
					)}
				</DialogHeader>

				<div className="flex-1 overflow-hidden">
					{isConverting ? (
						<div className="flex h-full items-center justify-center">
							<div className="flex flex-col items-center gap-4">
								<Loader2 className="h-8 w-8 animate-spin text-primary" />
								<p className="text-muted-foreground text-sm">Converting PDF to markdown...</p>
							</div>
						</div>
					) : (
						<textarea
							className="h-full w-full resize-none rounded-md border border-input bg-background px-3 py-2 font-mono text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
							placeholder="Markdown content will appear here..."
							readOnly
							value={markdownContent || ""}
						/>
					)}
				</div>

				<DialogFooter className="sm:justify-between">
					<Button className="gap-2" disabled={isConverting || !markdownContent || isSaving} onClick={handleSave} title="Save as .md file (Ctrl+X+S)" variant="outline">
						{isSaving ? (
							<>
								<Loader2 className="h-4 w-4 animate-spin" />
								Saving...
							</>
						) : (
							<>
								<Download className="h-4 w-4" />
								Save as .md <span className="ml-1 text-muted-foreground text-xs">(S)</span>
							</>
						)}
					</Button>
					<Button className="gap-2" disabled={isConverting || !markdownContent || isCopying} onClick={handleCopy} title="Copy to Clipboard (Ctrl+X+C)">
						{isCopying ? (
							<>
								<Loader2 className="h-4 w-4 animate-spin" />
								Copying...
							</>
						) : (
							<>
								<ClipboardCopy className="h-4 w-4" />
								Copy <span className="ml-1 text-muted-foreground text-xs">(C)</span>
							</>
						)}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}

export default MarkdownDialog

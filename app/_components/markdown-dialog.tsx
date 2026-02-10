"use client"

import { ClipboardCopy, Download, Loader2 } from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts"
import { usePDFZustand } from "@/zustand/pdf-zustand"
import { convertPdfPageToMarkdown } from "../actions/convert-pdf-to-markdown"

async function processPagesParallel(base64Pages: string[], onUpdate: (results: ({ markdown: string; cost: number } | null)[]) => void) {
	const results: ({ markdown: string; cost: number } | null)[] = new Array(base64Pages.length).fill(null)

	await Promise.all(
		base64Pages.map(async (page, index) => {
			try {
				const result = await convertPdfPageToMarkdown(page)
				if (result.success && result.markdown) {
					results[index] = { markdown: result.markdown, cost: result.cost || 0 }
				} else {
					results[index] = { markdown: `[Error converting page ${index + 1}: ${result.error || "Unknown error"}]`, cost: 0 }
				}
			} catch (error) {
				const message = error instanceof Error ? error.message : "Unknown error"
				results[index] = { markdown: `[Error converting page ${index + 1}: ${message}]`, cost: 0 }
			} finally {
				onUpdate([...results])
			}
		})
	)
}

async function preparePdfForConversion(pdf: string | File) {
	const { splitPdfIntoPageBuffers } = await import("@/utils/split-pdf")
	const pageBuffers = await splitPdfIntoPageBuffers(pdf)
	return pageBuffers.map(buffer => {
		let binary = ""
		for (let i = 0; i < buffer.byteLength; i++) {
			binary += String.fromCharCode(buffer[i])
		}
		return btoa(binary)
	})
}

export const MarkdownDialog = () => {
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
	const [conversionProgress, setConversionProgress] = useState<{ current: number; total: number } | null>(null)

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

	const convertPDF = useCallback(async () => {
		if (!pdf) {
			return
		}

		setIsConverting(true)
		try {
			// Prepare PDF
			const base64Pages = await preparePdfForConversion(pdf)

			// Initialize progress
			setConversionProgress({ current: 0, total: base64Pages.length })

			await processPagesParallel(base64Pages, results => {
				const completedCount = results.filter(r => r !== null).length
				setConversionProgress({ current: completedCount, total: base64Pages.length })

				const validResults = results.filter((r): r is { markdown: string; cost: number } => r !== null)
				const text = validResults.map(r => r.markdown).join("\n\n")
				const cost = validResults.reduce((acc, r) => acc + r.cost, 0)

				setMarkdownContent(text)
				setMarkdownCost(cost)
			})

			toast.success("PDF converted to markdown successfully")
		} catch (error) {
			const message = error instanceof Error ? error.message : "Failed to convert PDF"
			toast.error(message)
			setOpen(false)
		} finally {
			setIsConverting(false)
			setConversionProgress(null)
		}
	}, [pdf, setIsConverting, setMarkdownContent, setMarkdownCost, setOpen])

	useEffect(() => {
		if (!(open && pdf)) {
			return
		}

		if (markdownContent) {
			return
		}

		if (isConverting) {
			return
		}

		convertPDF()
	}, [open, pdf, markdownContent, isConverting, convertPDF])

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
						<DialogDescription>{conversionProgress ? `Converted ${conversionProgress.current} of ${conversionProgress.total} pages...` : "Preparing conversion..."}</DialogDescription>
					) : (
						markdownCost !== null && markdownCost > 0 && <DialogDescription className="text-xs">Cost: ~${markdownCost.toFixed(4)}</DialogDescription>
					)}
				</DialogHeader>

				<div className="flex-1 overflow-hidden">
					{isConverting ? (
						<div className="flex h-full items-center justify-center">
							<div className="flex flex-col items-center gap-4">
								<Loader2 className="h-8 w-8 animate-spin text-primary" />
								<p className="text-muted-foreground text-sm">
									{conversionProgress ? `Converted ${conversionProgress.current} of ${conversionProgress.total} pages...` : "Preparing PDF..."}
								</p>
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

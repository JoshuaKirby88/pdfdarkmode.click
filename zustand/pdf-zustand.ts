import { createWithEqualityFn } from "zustand/traditional"

type PDFState = {
	pdf: string | File | null
	currentPage: number
	showExportDialog: boolean

	setShowExportDialog: (show: boolean) => void
	openExportDialog: () => void
	closeExportDialog: () => void
	toggleExportDialog: () => void
}

export const usePDFZustand = createWithEqualityFn<PDFState>()((set, get) => ({
	pdf: null as string | File | null,
	currentPage: 0,
	showExportDialog: false,

	setShowExportDialog: (show: boolean) => set({ showExportDialog: show }),
	openExportDialog: () => set({ showExportDialog: true }),
	closeExportDialog: () => set({ showExportDialog: false }),
	toggleExportDialog: () => set({ showExportDialog: !get().showExportDialog }),
}))

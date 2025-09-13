import { create } from "zustand"

export const usePDFZustand = create(() => ({
	pdf: null as string | File | null,
}))

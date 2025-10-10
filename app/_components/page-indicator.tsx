import { usePDFZustand } from "@/zustand/pdf-zustand"

export const PageIndicator = ({ totalPages }: { totalPages: number }) => {
	const currentPage = usePDFZustand(state => state.currentPage)

	return (
		<div className="-translate-x-1/2 fixed bottom-6 left-1/2 z-50">
			<div className="rounded-full border bg-background/80 px-4 py-2 shadow-lg backdrop-blur-md">
				<span className="font-mono text-foreground text-sm">
					{currentPage} / {totalPages}
				</span>
			</div>
		</div>
	)
}

"use client"

import { GithubIcon } from "lucide-react"
import dynamic from "next/dynamic"
import Link from "next/link"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { env } from "@/utils/env"
import { usePDFZustand } from "@/zustand/pdf-zustand"
import { UploadPDF } from "./upload-pdf"

const DynamicPDFCanvas = dynamic(() => import("./pdf-canvas").then(mod => mod.PDFCanvas))

export const App = () => {
	const pdf = usePDFZustand(state => state.pdf)

	return (
		<>
			{pdf ? (
				<DynamicPDFCanvas pdf={pdf} />
			) : (
				<>
					<UploadPDF />

					<Link className={cn(buttonVariants({ size: "icon", variant: "outline" }), "fixed right-2 bottom-2 rounded-full p-0")} href={env.NEXT_PUBLIC_GITHUB_URL} target="_blank">
						<GithubIcon className="size-4" />
					</Link>
				</>
			)}
		</>
	)
}

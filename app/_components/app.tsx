"use client"

import dynamic from "next/dynamic"
import { usePDFZustand } from "@/zustand/pdf-zustand"
import { UploadPDF } from "./upload-pdf"

const DynamicPDFCanvas = dynamic(() => import("./pdf-canvas").then(mod => mod.PDFCanvas))

export const App = () => {
	const pdf = usePDFZustand(state => state.pdf)

	return <>{pdf ? <DynamicPDFCanvas pdf={pdf} /> : <UploadPDF />}</>
}

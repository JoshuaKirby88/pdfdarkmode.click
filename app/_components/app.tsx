"use client"

import dynamic from "next/dynamic"
import { useState } from "react"
import { UploadPDF } from "./upload-pdf"

const DynamicPDFCanvas = dynamic(() => import("./pdf-canvas").then(mod => mod.PDFCanvas))

export const App = () => {
	const [pdf, setPDF] = useState<File | string | null>(null)

	return <>{pdf ? <DynamicPDFCanvas fileOrUrl={pdf} /> : <UploadPDF setPDF={setPDF} />}</>
}

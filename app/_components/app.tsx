"use client"

import dynamic from "next/dynamic"
import { useState } from "react"
import { PDFLinkInput } from "./pdf-link-input"

const DynamicPDFCanvas = dynamic(() => import("./pdf-canvas").then(mod => mod.PDFCanvas))

export const App = () => {
	const [pdfLink, setPDFLink] = useState("")

	return <>{!pdfLink ? <PDFLinkInput setPDFLink={setPDFLink} /> : <DynamicPDFCanvas pdfLink={pdfLink} />}</>
}

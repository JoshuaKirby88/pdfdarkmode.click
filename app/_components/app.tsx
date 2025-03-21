"use client"

import { useState } from "react"
import { PDFLinkInput } from "./pdf-link-input"
import dynamic from "next/dynamic"

const DynamicPDFCanvas = dynamic(() => import("./pdf-canvas").then(mod => mod.PDFCanvas))

export const App = () => {
	const [pdfLink, setPDFLink] = useState("")

	return <>{!pdfLink ? <PDFLinkInput setPDFLink={setPDFLink} /> : <DynamicPDFCanvas pdfLink={pdfLink} />}</>
}

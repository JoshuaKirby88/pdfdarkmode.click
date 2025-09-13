import Image from "next/image"
import { App } from "./_components/app"

const Page = () => {
	return (
		<div className="flex h-[100dvh] flex-col items-center justify-center">
			<div className="mb-5 flex items-center gap-3">
				<Image alt="PDF icon" height={70} src="/thiings/pdf-icon.webp" width={70} />
				<h1 className="font-semibold text-5xl">PDF to Dark Mode</h1>
			</div>

			<App />
		</div>
	)
}

export default Page

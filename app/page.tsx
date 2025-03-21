import { App } from "./_components/app"

const Page = () => {
	return (
		<div className="flex h-[100dvh] flex-col items-center justify-center">
			<h1 className="mb-10 font-semibold text-5xl">PDF to Dark Mode</h1>

			<App />
		</div>
	)
}

export default Page

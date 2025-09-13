import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import { Toaster } from "@/components/ui/sonner"
import { PDFDARKMODE_URL } from "@/config"
import { cn } from "@/lib/utils"
import { PostHogProvider } from "./_components/posthog-provider"
import { ThemeProvider } from "./_components/theme-provider"

const geistSans = Geist({
	variable: "--font-geist-sans",
	subsets: ["latin"],
})

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
})

export const metadata: Metadata = {
	title: "PDF to Dark Mode",
	description: "Convert PDF to Dark Mode.",
	keywords: ["PDF convert", "dark mode", "PDF", "online"],
	openGraph: {
		title: "PDF to Dark Mode",
		description: "Convert PDF to Dark Mode.",
		url: PDFDARKMODE_URL,
		siteName: "PDF to Dark Mode",
		locale: "en_US",
		type: "website",
	},
}

const Layout = (props: { children: React.ReactNode }) => (
	<html lang="en">
		<body className={cn(geistSans.variable, geistMono.variable, "antialiased")}>
			<PostHogProvider>
				<ThemeProvider attribute="class" defaultTheme="system" disableTransitionOnChange enableSystem>
					{props.children}

					<Toaster />
				</ThemeProvider>
			</PostHogProvider>
		</body>
	</html>
)

export default Layout

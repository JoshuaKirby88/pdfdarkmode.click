import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import { cn } from "@/lib/utils"
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
	title: "PDF Dark Mode",
	description: "Convert PDF to Dark Mode.",
}

const Layout = (props: { children: React.ReactNode }) => (
	<html lang="en">
		<body className={cn(geistSans.variable, geistMono.variable, "antialiased")}>
			<ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
				{props.children}
			</ThemeProvider>
		</body>
	</html>
)

export default Layout

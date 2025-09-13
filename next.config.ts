import path from "node:path"
import CopyWebpackPlugin from "copy-webpack-plugin"
import type { NextConfig } from "next"
import { env } from "./utils/env"

const pdfjsDistPath = path.dirname(require.resolve("pdfjs-dist/package.json"))
const cMapsDir = path.join(pdfjsDistPath, "cmaps")

const nextConfig: NextConfig = {
	experimental: {
		turbo: {
			resolveAlias: {
				canvas: "./empty-module.ts",
			},
		},
	},
	eslint: {
		ignoreDuringBuilds: true,
	},
	plugins: [
		new CopyWebpackPlugin({
			patterns: [
				{
					from: cMapsDir,
					to: "cmaps/",
				},
			],
		}),
	],
	// biome-ignore lint/suspicious/useAwait: Has to be async
	async rewrites() {
		return [
			{
				source: `${env.NEXT_PUBLIC_POSTHOG_HOST}/static/:path*`,
				destination: "https://us-assets.i.posthog.com/static/:path*",
			},
			{
				source: `${env.NEXT_PUBLIC_POSTHOG_HOST}/:path*`,
				destination: "https://us.i.posthog.com/:path*",
			},
		]
	},
	skipTrailingSlashRedirect: true,
}

export default nextConfig

import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare"

initOpenNextCloudflareForDev()

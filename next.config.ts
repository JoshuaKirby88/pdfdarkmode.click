import path from "node:path"
import CopyWebpackPlugin from "copy-webpack-plugin"
import type { NextConfig } from "next"

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
}

export default nextConfig

import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare"
initOpenNextCloudflareForDev()

/// <reference path="./.sst/platform/config.d.ts" />

export default $config({
	app(input) {
		return {
			name: "pdf-dark-mode",
			removal: input?.stage === "production" ? "retain" : "remove",
			protect: ["production"].includes(input?.stage),
			home: "aws",
			providers: {
				aws: {
					region: "us-east-1",
				},
			},
		}
	},
	async run() {
		new sst.aws.Nextjs("NextJS", {
			transform: {
				server: {
					timeout: "900 seconds",
					runtime: "nodejs22.x",
					architecture: "arm64",
				},
			},
			dev: {
				command: "pnpm exec next dev --turbo",
			},
		})
	},
})

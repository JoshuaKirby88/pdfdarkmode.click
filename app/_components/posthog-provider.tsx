"use client"

import posthog from "posthog-js"
import { PostHogProvider as PHProvider } from "posthog-js/react"
import { useEffect } from "react"
import { env } from "@/utils/env"

export const PostHogProvider = (props: { children: React.ReactNode }) => {
	useEffect(() => {
		posthog.init(env.NEXT_PUBLIC_POSTHOG_KEY, {
			api_host: env.NEXT_PUBLIC_POSTHOG_HOST,
			person_profiles: "always",
			defaults: "2025-05-24",
		})
	}, [])

	return <PHProvider client={posthog}>{props.children}</PHProvider>
}

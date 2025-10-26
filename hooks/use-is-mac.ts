import { useMemo } from "react"

const APPLE_PLATFORM_REGEX = /Mac|iPhone|iPad|iPod/i

export const useIsMac = () => {
	return useMemo(() => {
		if (typeof navigator === "undefined") {
			return false
		}
		return APPLE_PLATFORM_REGEX.test(navigator.platform)
	}, [])
}

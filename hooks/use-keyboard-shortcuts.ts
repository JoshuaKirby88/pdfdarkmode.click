import { useEffect, useRef } from "react"

type ShortcutHandler = (e: KeyboardEvent) => void | boolean
type ShortcutCondition = () => boolean

interface ShortcutRegistration {
	id: string
	priority: number
	handler: ShortcutHandler
	condition?: ShortcutCondition
}

class KeyboardShortcutManager {
	private shortcuts: Map<string, ShortcutRegistration[]> = new Map()
	private ctrlXPressed = false
	private ctrlXTimeout: NodeJS.Timeout | null = null
	private readonly CTRL_X_TIMEOUT_MS = 1000
	private listener: ((e: KeyboardEvent) => void) | null = null

	constructor() {
		this.listener = (e: KeyboardEvent) => this.handleKeyDown(e)
		if (typeof window !== "undefined") {
			window.addEventListener("keydown", this.listener, true)
		}
	}

	private handleKeyDown(e: KeyboardEvent) {
		if (e.ctrlKey && (e.key === "x" || e.key === "X") && !this.ctrlXPressed) {
			e.preventDefault()
			this.ctrlXPressed = true

			if (this.ctrlXTimeout) {
				clearTimeout(this.ctrlXTimeout)
			}

			this.ctrlXTimeout = setTimeout(() => {
				this.ctrlXPressed = false
			}, this.CTRL_X_TIMEOUT_MS)
			return
		}

		const key = e.key.toLowerCase()
		const keyId = this.ctrlXPressed ? `ctrl+x+${key}` : key

		const handlers = this.shortcuts.get(keyId) || []

		const sortedHandlers = [...handlers].sort((a, b) => b.priority - a.priority)

		for (const registration of sortedHandlers) {
			if (registration.condition && !registration.condition()) {
				continue
			}

			const result = registration.handler(e)

			if (result === false) {
				break
			}

			if (e.defaultPrevented) {
				break
			}
		}

		if (this.ctrlXPressed && handlers.length > 0) {
			this.ctrlXPressed = false
			if (this.ctrlXTimeout) {
				clearTimeout(this.ctrlXTimeout)
			}
		}
	}

	register(key: string, id: string, handler: ShortcutHandler, options?: { priority?: number; condition?: ShortcutCondition }) {
		const normalizedKey = key.toLowerCase()
		const registration: ShortcutRegistration = {
			id,
			priority: options?.priority ?? 0,
			handler,
			condition: options?.condition,
		}

		const existing = this.shortcuts.get(normalizedKey) || []

		const filtered = existing.filter(r => r.id !== id)
		this.shortcuts.set(normalizedKey, [...filtered, registration])
	}

	unregister(key: string, id: string) {
		const normalizedKey = key.toLowerCase()
		const existing = this.shortcuts.get(normalizedKey)
		if (!existing) return

		const filtered = existing.filter(r => r.id !== id)
		if (filtered.length > 0) {
			this.shortcuts.set(normalizedKey, filtered)
		} else {
			this.shortcuts.delete(normalizedKey)
		}
	}

	unregisterAll(id: string) {
		for (const [key, registrations] of this.shortcuts.entries()) {
			const filtered = registrations.filter(r => r.id !== id)
			if (filtered.length > 0) {
				this.shortcuts.set(key, filtered)
			} else {
				this.shortcuts.delete(key)
			}
		}
	}

	destroy() {
		if (this.listener && typeof window !== "undefined") {
			window.removeEventListener("keydown", this.listener, true)
		}
		if (this.ctrlXTimeout) {
			clearTimeout(this.ctrlXTimeout)
		}
		this.shortcuts.clear()
		this.listener = null
	}

	isCtrlXPressed() {
		return this.ctrlXPressed
	}
}

let globalManager: KeyboardShortcutManager | null = null

function getManager(): KeyboardShortcutManager {
	if (!globalManager) {
		globalManager = new KeyboardShortcutManager()
	}
	return globalManager
}

export function useKeyboardShortcuts(
	shortcuts: Array<{
		key: string
		handler: ShortcutHandler
		condition?: ShortcutCondition
		priority?: number
	}>,
	deps: React.DependencyList
) {
	const idRef = useRef<string | undefined>(undefined)

	useEffect(() => {
		if (!idRef.current) {
			idRef.current = `shortcut-${Math.random().toString(36).slice(2, 11)}`
		}

		const manager = getManager()
		const id = idRef.current

		for (const shortcut of shortcuts) {
			manager.register(shortcut.key, id, shortcut.handler, {
				priority: shortcut.priority,
				condition: shortcut.condition,
			})
		}

		return () => {
			manager.unregisterAll(id)
		}
	}, deps)
}

export function isInputElement(element: Element | null): boolean {
	if (!element) return false
	const tag = element.tagName
	return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT"
}

export function isInputFocused(): boolean {
	return isInputElement(document.activeElement)
}

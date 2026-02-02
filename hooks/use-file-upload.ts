"use client"

import { type ChangeEvent, type DragEvent, type InputHTMLAttributes, useCallback, useRef, useState } from "react"

export type FileMetadata = {
	name: string
	size: number
	type: string
	url: string
	id: string
}

export type FileWithPreview = {
	file: File | FileMetadata
	id: string
	preview?: string
}

export type FileUploadOptions = {
	maxFiles?: number
	maxSize?: number
	accept?: string
	multiple?: boolean
	initialFiles?: FileMetadata[]
	onFilesChange?: (files: FileWithPreview[]) => void
	onFilesAdded?: (addedFiles: FileWithPreview[]) => void
}

export type FileUploadState = {
	files: FileWithPreview[]
	isDragging: boolean
	errors: string[]
}

const isFileOverMaxSize = (file: File | FileMetadata, maxSize: number): boolean => file.size > maxSize

const getFileName = (file: File | FileMetadata): string => (file instanceof File ? file.name : file.name)

const getFileType = (file: File | FileMetadata): string => (file instanceof File ? file.type || "" : file.type)

const getFileExtension = (file: File | FileMetadata): string => {
	const name = file instanceof File ? file.name : file.name
	const ext = name.split(".").pop()
	return ext ? `.${ext}` : ""
}

const isTypeAccepted = (accept: string, mimeType: string, extension: string): boolean => {
	if (accept === "*") {
		return true
	}
	const acceptedTypes = accept.split(",").map(type => type.trim())
	for (const type of acceptedTypes) {
		if (type.startsWith(".")) {
			if (extension.toLowerCase() === type.toLowerCase()) {
				return true
			}
			continue
		}
		if (type.endsWith("/*")) {
			const baseType = type.split("/")[0]
			if (mimeType.startsWith(`${baseType}/`)) {
				return true
			}
			continue
		}
		if (mimeType === type) {
			return true
		}
	}
	return false
}

type PreparedFiles = { validFiles: FileWithPreview[]; errors: string[] }

const prepareValidFiles = (
	inputFiles: File[],
	options: {
		multiple: boolean
		existingFiles: FileWithPreview[]
		maxSize: number
		accept: string
		validateFile: (file: File) => string | null
		createPreview: (file: File) => string | undefined
		generateUniqueId: (file: File) => string
	}
): PreparedFiles => {
	const errors: string[] = []
	const validFiles: FileWithPreview[] = []

	for (const file of inputFiles) {
		if (options.multiple) {
			const isDuplicate = options.existingFiles.some(existing => existing.file.name === file.name && existing.file.size === file.size)
			if (isDuplicate) {
				continue
			}
		}

		if (isFileOverMaxSize(file, options.maxSize)) {
			errors.push(`File exceeds the maximum size of ${formatBytes(options.maxSize)}.`)
			continue
		}

		const error = options.validateFile(file)
		if (error) {
			errors.push(error)
			continue
		}

		validFiles.push({ file, id: options.generateUniqueId(file), preview: options.createPreview(file) })
	}

	return { validFiles, errors }
}

export const useFileUpload = (options: FileUploadOptions = {}) => {
	const { maxFiles = Number.POSITIVE_INFINITY, maxSize = Number.POSITIVE_INFINITY, accept = "*", multiple = false, initialFiles = [], onFilesChange, onFilesAdded } = options

	const [state, setState] = useState<FileUploadState>({
		files: initialFiles.map(file => ({
			file,
			id: file.id,
			preview: file.url,
		})),
		isDragging: false,
		errors: [],
	})

	const inputRef = useRef<HTMLInputElement>(null)

	const validateFile = useCallback(
		(file: File | FileMetadata): string | null => {
			if (isFileOverMaxSize(file, maxSize)) {
				return `File "${getFileName(file)}" exceeds the maximum size of ${formatBytes(maxSize)}.`
			}

			if (accept === "*") {
				return null
			}

			const mimeType = getFileType(file)
			const extension = getFileExtension(file)
			if (!isTypeAccepted(accept, mimeType, extension)) {
				return `File "${getFileName(file)}" is not an accepted file type.`
			}

			return null
		},
		[accept, maxSize]
	)

	const createPreview = useCallback((file: File | FileMetadata): string | undefined => {
		if (file instanceof File) {
			return URL.createObjectURL(file)
		}
		return file.url
	}, [])

	const generateUniqueId = useCallback((file: File | FileMetadata): string => {
		const randomBase = 36
		const startIndex = 2
		const endIndex = 9
		if (file instanceof File) {
			return `${file.name}-${Date.now()}-${Math.random().toString(randomBase).substring(startIndex, endIndex)}`
		}
		return file.id
	}, [])

	const clearFiles = useCallback(() => {
		setState(prev => {
			for (const file of prev.files) {
				if (file.preview && file.file instanceof File && file.file.type.startsWith("image/")) {
					URL.revokeObjectURL(file.preview)
				}
			}

			if (inputRef.current) {
				inputRef.current.value = ""
			}

			const newState = {
				...prev,
				files: [],
				errors: [],
			}

			onFilesChange?.(newState.files)
			return newState
		})
	}, [onFilesChange])

	const addFiles = useCallback(
		(newFiles: FileList | File[]) => {
			if (!newFiles || newFiles.length === 0) {
				return
			}

			const newFilesArray = Array.from(newFiles) as File[]
			setState(prev => ({ ...prev, errors: [] }))

			if (!multiple) {
				clearFiles()
			}

			if (multiple && maxFiles !== Number.POSITIVE_INFINITY && state.files.length + newFilesArray.length > maxFiles) {
				setState(prev => ({ ...prev, errors: [`You can only upload a maximum of ${maxFiles} files.`] }))
				return
			}

			const { validFiles, errors } = prepareValidFiles(newFilesArray, {
				multiple,
				existingFiles: state.files,
				maxSize,
				accept,
				validateFile: file => validateFile(file),
				createPreview: file => createPreview(file),
				generateUniqueId: file => generateUniqueId(file),
			})

			if (validFiles.length > 0) {
				onFilesAdded?.(validFiles)
				setState(prev => {
					const nextFiles = multiple ? [...prev.files, ...validFiles] : validFiles
					onFilesChange?.(nextFiles)
					return { ...prev, files: nextFiles, errors }
				})
			} else if (errors.length > 0) {
				setState(prev => ({ ...prev, errors }))
			}

			if (inputRef.current) {
				inputRef.current.value = ""
			}
		},
		[state.files, maxFiles, multiple, maxSize, accept, validateFile, createPreview, generateUniqueId, clearFiles, onFilesChange, onFilesAdded]
	)

	const removeFile = useCallback(
		(id: string) => {
			setState(prev => {
				const fileToRemove = prev.files.find(file => file.id === id)
				if (fileToRemove?.preview && fileToRemove.file instanceof File && fileToRemove.file.type.startsWith("image/")) {
					URL.revokeObjectURL(fileToRemove.preview)
				}

				const newFiles = prev.files.filter(file => file.id !== id)
				onFilesChange?.(newFiles)

				return {
					...prev,
					files: newFiles,
					errors: [],
				}
			})
		},
		[onFilesChange]
	)

	const clearErrors = useCallback(() => {
		setState(prev => ({
			...prev,
			errors: [],
		}))
	}, [])

	const handleDragEnter = useCallback((e: DragEvent<HTMLElement>) => {
		e.preventDefault()
		e.stopPropagation()
		setState(prev => ({ ...prev, isDragging: true }))
	}, [])

	const handleDragLeave = useCallback((e: DragEvent<HTMLElement>) => {
		e.preventDefault()
		e.stopPropagation()

		if (e.currentTarget.contains(e.relatedTarget as Node)) {
			return
		}

		setState(prev => ({ ...prev, isDragging: false }))
	}, [])

	const handleDragOver = useCallback((e: DragEvent<HTMLElement>) => {
		e.preventDefault()
		e.stopPropagation()
	}, [])

	const handleDrop = useCallback(
		(e: DragEvent<HTMLElement>) => {
			e.preventDefault()
			e.stopPropagation()
			setState(prev => ({ ...prev, isDragging: false }))

			if (inputRef.current?.disabled) {
				return
			}

			if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
				if (multiple) {
					addFiles(e.dataTransfer.files)
				} else {
					const file = e.dataTransfer.files[0]
					addFiles([file])
				}
			}
		},
		[addFiles, multiple]
	)

	const handleFileChange = useCallback(
		(e: ChangeEvent<HTMLInputElement>) => {
			if (e.target.files && e.target.files.length > 0) {
				addFiles(e.target.files)
			}
		},
		[addFiles]
	)

	const openFileDialog = useCallback(() => {
		if (inputRef.current) {
			inputRef.current.click()
		}
	}, [])

	const getInputProps = useCallback(
		(props: InputHTMLAttributes<HTMLInputElement> = {}) => {
			return {
				...props,
				type: "file" as const,
				onChange: handleFileChange,
				accept: props.accept || accept,
				multiple: props.multiple !== undefined ? props.multiple : multiple,
				ref: inputRef,
			}
		},
		[accept, multiple, handleFileChange]
	)

	return [
		state,
		{
			addFiles,
			removeFile,
			clearFiles,
			clearErrors,
			handleDragEnter,
			handleDragLeave,
			handleDragOver,
			handleDrop,
			handleFileChange,
			openFileDialog,
			getInputProps,
		},
	] as const
}

export const formatBytes = (bytes: number, decimals = 2): string => {
	if (bytes === 0) {
		return "0 Bytes"
	}

	const k = 1024
	const dm = decimals < 0 ? 0 : decimals
	const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"]

	const i = Math.floor(Math.log(bytes) / Math.log(k))

	return Number.parseFloat((bytes / k ** i).toFixed(dm)) + sizes[i]
}

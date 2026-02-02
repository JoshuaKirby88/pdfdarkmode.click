import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Form } from "@/components/form/form"
import { FormButton } from "@/components/form/form-button"
import { FormInput } from "@/components/form/form-input"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { useFileUpload } from "@/hooks/use-file-upload"
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts"
import { usePDFZustand } from "@/zustand/pdf-zustand"

export const UploadPDF = () => {
	const schema = z.object({ link: z.string().optional() })
	const form = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema) })
	const [_, { openFileDialog, getInputProps }] = useFileUpload({
		accept: ".pdf",
		onFilesAdded: addedFiles => usePDFZustand.setState({ pdf: addedFiles[0].file as File, markdownContent: null, markdownCost: null }),
	})

	const onSubmit = (input: z.infer<typeof schema>) => {
		if (input.link && input.link.trim().length > 0) {
			usePDFZustand.setState({ pdf: input.link, markdownContent: null, markdownCost: null })
		}
	}

	useKeyboardShortcuts(
		[
			{
				key: "ctrl+x+u",
				handler: e => {
					e.preventDefault()
					e.stopPropagation()
					openFileDialog()
				},
				priority: 10,
			},
		],
		[openFileDialog]
	)

	return (
		<>
			<Form {...form} className="w-full max-w-lg flex-row items-end gap-2" onSubmit={onSubmit}>
				<FormInput autoFocus name="link" placeholder="URL to a public PDF" />
				<FormButton className="w-fit">Open ↵</FormButton>

				<Separator className="mx-2" orientation="vertical" />

				<Button onClick={openFileDialog}>
					Upload <span className="ml-1 text-muted-foreground text-xs">(U)</span>
				</Button>
				<input {...getInputProps()} className="sr-only" tabIndex={-1} />
			</Form>

			<p className="fixed bottom-4 text-muted-foreground text-xs">All shortcuts use Ctrl+X followed by a key</p>
		</>
	)
}

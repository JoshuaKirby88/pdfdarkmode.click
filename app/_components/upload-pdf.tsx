import { zodResolver } from "@hookform/resolvers/zod"
import { UploadIcon } from "lucide-react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Form } from "@/components/form/form"
import { FormButton } from "@/components/form/form-button"
import { FormInput } from "@/components/form/form-input"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { useFileUpload } from "@/hooks/use-file-upload"
import { usePDFZustand } from "@/zustand/pdf-zustand"

export const UploadPDF = () => {
	const schema = z.object({ link: z.string().optional() })
	const form = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema) })
	const [_, { openFileDialog, getInputProps }] = useFileUpload({ accept: ".pdf", onFilesAdded: addedFiles => usePDFZustand.setState({ pdf: addedFiles[0].file as File }) })

	const onSubmit = (input: z.infer<typeof schema>) => {
		if (input.link && input.link.trim().length > 0) {
			usePDFZustand.setState({ pdf: input.link })
		}
	}

	return (
		<Form {...form} className="w-full max-w-lg flex-row items-end gap-2" onSubmit={onSubmit}>
			<FormInput autoFocus name="link" placeholder="URL to a public PDF" />
			<FormButton className="w-fit">Open ↵</FormButton>

			<Separator orientation="vertical" />

			<Button onClick={openFileDialog}>
				Upload
				<UploadIcon />
			</Button>
			<input {...getInputProps()} className="sr-only" tabIndex={-1} />
		</Form>
	)
}

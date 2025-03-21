import { Form } from "@/components/form/form"
import { FormButton } from "@/components/form/form-button"
import { FormInput } from "@/components/form/form-input"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"

export const PDFLinkInput = (props: { setPDFLink: (input: string) => void }) => {
	const schema = z.object({ link: z.string() })
	const form = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema) })

	const onSubmit = async (input: z.infer<typeof schema>) => {
		props.setPDFLink(input.link)
	}

	return (
		<Form {...form} onSubmit={onSubmit} className="w-full max-w-lg flex-row items-end">
			<FormInput name="link" placeholder="Paste a url to a public PDF" autoFocus />

			<FormButton className="w-fit">Submit ↵</FormButton>
		</Form>
	)
}

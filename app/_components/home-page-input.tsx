"use client"

import { Form } from "@/components/form/form"
import { FormInput } from "@/components/form/form-input"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"

export const HomePageInput = () => {
	const schema = z.object({ link: z.string() })
	const form = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema) })

	const onSubmit = async (input: z.infer<typeof schema>) => {}

	return (
		<Form {...form} onSubmit={onSubmit}>
			<FormInput name="link" />
		</Form>
	)
}

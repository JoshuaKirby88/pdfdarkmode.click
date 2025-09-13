import type { FieldValues, SubmitHandler, UseFormReturn } from "react-hook-form"
import { FormProvider } from "react-hook-form"
import { cn } from "@/lib/utils"

type FormProps<TFieldValues extends FieldValues> = {
	onSubmit: SubmitHandler<TFieldValues>
	className?: string
	children: React.ReactNode
} & UseFormReturn<TFieldValues>

export function Form<TFieldValues extends FieldValues>({ onSubmit, children, className, ...props }: FormProps<TFieldValues>) {
	return (
		<FormProvider {...props}>
			<form className={cn("flex flex-col gap-2", className)} onSubmit={props.handleSubmit(onSubmit)}>
				{children}
			</form>
		</FormProvider>
	)
}

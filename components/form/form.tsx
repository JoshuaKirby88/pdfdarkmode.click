import { cn } from "@/lib/utils"
import { FormProvider, UseFormReturn } from "react-hook-form"

export const Form = ({ onSubmit, children, className, ...props }: { onSubmit: (...args: any[]) => any; className?: string } & UseFormReturn<any, any, undefined> & { children: React.ReactNode }) => (
	<FormProvider {...props}>
		<form className={cn("flex flex-col gap-2", className)} onSubmit={props.handleSubmit(onSubmit)}>
			{children}
		</form>
	</FormProvider>
)

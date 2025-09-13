import { useFormContext } from "react-hook-form"
import { cn } from "@/lib/utils"
import { Button } from "../ui/button"

export const FormButton = ({ className, children, ...props }: React.ComponentProps<typeof Button>) => {
	const { formState } = useFormContext()

	return (
		<Button className={cn("mt-1 w-full", className)} disabled={formState.isSubmitting} type="submit" {...props}>
			{children}
		</Button>
	)
}

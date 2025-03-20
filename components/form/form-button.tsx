import { cn } from "@/lib/utils"
import { useFormContext } from "react-hook-form"
import { Button } from "../ui/button"

export const FormButton = ({ className, children, ...props }: React.ComponentProps<typeof Button>) => {
	const { formState } = useFormContext()

	return (
		<Button type="submit" className={cn("mt-1 w-full", className)} {...props}>
			{children}
		</Button>
	)
}

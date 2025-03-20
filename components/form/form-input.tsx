import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { ComponentProps } from "react"
import { useFormContext } from "react-hook-form"

type Props = { label?: string; name: string } & ComponentProps<typeof Input>

export const FormInput = ({ className, ...props }: Props) => {
	const { register } = useFormContext()

	return (
		<div className={cn("w-full space-y-1", className)}>
			{props.label && <Label>{props.label}</Label>}

			<Input type="text" {...props} {...register(props.name)} />
		</div>
	)
}

FormInput.displayName = "FormInput"

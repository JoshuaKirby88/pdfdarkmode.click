import type { ComponentProps } from "react"
import { useFormContext } from "react-hook-form"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

type Props = { label?: string; name: string } & ComponentProps<typeof Input>

export const FormInput = ({ className, label, name, ...rest }: Props) => {
	const { register } = useFormContext()

	return (
		<div className={cn("w-full space-y-1", className)}>
			{label && <Label>{label}</Label>}

			<Input {...rest} {...register(name)} />
		</div>
	)
}

FormInput.displayName = "FormInput"

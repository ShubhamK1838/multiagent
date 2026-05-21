import type { ParsedField } from '../../types/form'
import { FieldWrapper } from './fields/FieldWrapper'
import { TextInput } from './fields/TextInput'
import { TextareaInput } from './fields/TextareaInput'
import { NumberInput } from './fields/NumberInput'
import { RangeInput } from './fields/RangeInput'
import { SelectInput } from './fields/SelectInput'
import { RadioInput } from './fields/RadioInput'
import { CheckboxGroup } from './fields/CheckboxGroup'
import { ToggleInput } from './fields/ToggleInput'
import { DateInput } from './fields/DateInput'
import { FileInput } from './fields/FileInput'
import { ColorInput } from './fields/ColorInput'

interface FormFieldProps {
  field: ParsedField
  value: unknown
  error?: string
  onChange: (v: unknown) => void
}

export function FormField({ field, value, error, onChange }: FormFieldProps) {
  const isHorizontal = field.component === 'toggle'

  const input = renderInput(field, value, error, onChange)

  return (
    <FieldWrapper
      title={field.title}
      description={field.description}
      error={error}
      required={field.required}
      horizontal={isHorizontal}
    >
      {input}
    </FieldWrapper>
  )
}

function renderInput(field: ParsedField, value: unknown, error: string | undefined, onChange: (v: unknown) => void) {
  const hasError = !!error

  switch (field.component) {
    case 'text':
    case 'email':
    case 'url':
    case 'tel':
    case 'password':
      return (
        <TextInput
          value={(value as string) ?? ''}
          onChange={onChange}
          placeholder={field.placeholder}
          minLength={field.minLength}
          maxLength={field.maxLength}
          pattern={field.pattern}
          component={field.component}
          hasError={hasError}
        />
      )

    case 'textarea':
      return (
        <TextareaInput
          value={(value as string) ?? ''}
          onChange={onChange}
          placeholder={field.placeholder}
          maxLength={field.maxLength}
          hasError={hasError}
        />
      )

    case 'number':
      return (
        <NumberInput
          value={(value as number | '') ?? ''}
          onChange={onChange}
          min={field.min}
          max={field.max}
          step={field.step}
          placeholder={field.placeholder}
          hasError={hasError}
        />
      )

    case 'range':
      return (
        <RangeInput
          value={(value as number) ?? (field.min ?? 0)}
          onChange={onChange}
          min={field.min}
          max={field.max}
          step={field.step}
        />
      )

    case 'select':
      return (
        <SelectInput
          value={(value as string) ?? ''}
          onChange={onChange}
          options={field.options ?? []}
          placeholder={field.placeholder}
          hasError={hasError}
        />
      )

    case 'radio':
      return (
        <RadioInput
          value={(value as string) ?? ''}
          onChange={onChange}
          options={field.options ?? []}
        />
      )

    case 'checkboxes':
      return (
        <CheckboxGroup
          value={(value as string[]) ?? []}
          onChange={onChange}
          options={field.options ?? []}
        />
      )

    case 'toggle':
      return (
        <ToggleInput
          value={(value as boolean) ?? false}
          onChange={onChange}
        />
      )

    case 'date':
    case 'datetime':
    case 'time':
      return (
        <DateInput
          value={(value as string) ?? ''}
          onChange={onChange}
          component={field.component}
          hasError={hasError}
        />
      )

    case 'file':
      return (
        <FileInput
          value={(value as string) ?? ''}
          onChange={onChange}
          accept={field.accept}
          hasError={hasError}
        />
      )

    case 'color':
      return (
        <ColorInput
          value={(value as string) ?? ''}
          onChange={onChange}
        />
      )

    default:
      return null
  }
}

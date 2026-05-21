import type { FormSchema, ParsedField, FieldOption, FieldComponentType, JsonSchemaProperty } from '../../types/form'

export function parseSchema(schema: FormSchema): ParsedField[] {
  const required = schema.required ?? []
  return Object.entries(schema.properties ?? {}).map(([key, prop]) => ({
    ...inferField(key, prop),
    required: required.includes(key),
  }))
}

function inferField(key: string, prop: JsonSchemaProperty): Omit<ParsedField, 'required'> {
  const base = {
    key,
    title: prop.title ?? key,
    description: prop.description,
    placeholder: prop['ui:placeholder'],
    defaultValue: prop.default,
    minLength: prop.minLength,
    maxLength: prop.maxLength,
    pattern: prop.pattern,
  }

  if (prop.type === 'boolean') {
    return { ...base, component: 'toggle' }
  }

  if (prop.type === 'array' && prop.items?.enum) {
    return {
      ...base,
      component: 'checkboxes',
      options: buildOptions(prop.items.enum, []),
    }
  }

  if (prop.type === 'number' || prop.type === 'integer') {
    const component: FieldComponentType = prop['ui:widget'] === 'range' ? 'range' : 'number'
    return { ...base, component, min: prop.minimum, max: prop.maximum, step: prop.type === 'integer' ? 1 : undefined }
  }

  if (prop.enum) {
    const options = buildOptions(prop.enum, prop.enumNames ?? [])
    const useRadio = prop['ui:widget'] === 'radio' || prop.enum.length <= 4
    return { ...base, component: useRadio ? 'radio' : 'select', options }
  }

  if (prop.type === 'string') {
    return { ...base, ...inferStringField(prop) }
  }

  return { ...base, component: 'text' }
}

function inferStringField(prop: JsonSchemaProperty): Partial<ParsedField> {
  if (prop['ui:widget'] === 'password') return { component: 'password' }
  if (prop['ui:widget'] === 'textarea') return { component: 'textarea' }
  if (prop.format === 'date') return { component: 'date' }
  if (prop.format === 'date-time') return { component: 'datetime' }
  if (prop.format === 'time') return { component: 'time' }
  if (prop.format === 'email') return { component: 'email' }
  if (prop.format === 'uri') return { component: 'url' }
  if (prop.format === 'phone') return { component: 'tel' }
  if (prop.format === 'data-url') return { component: 'file', accept: '*/*' }
  if (prop.format === 'color') return { component: 'color' }
  if (prop.maxLength && prop.maxLength > 200) return { component: 'textarea' }
  return { component: 'text' }
}

function buildOptions(values: string[], names: string[]): FieldOption[] {
  return values.map((v, i) => ({ value: v, label: names[i] ?? v }))
}

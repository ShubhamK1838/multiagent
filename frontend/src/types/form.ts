export type FieldComponentType =
  | 'text' | 'textarea' | 'email' | 'url' | 'tel' | 'password'
  | 'number' | 'range' | 'date' | 'datetime' | 'time'
  | 'select' | 'radio' | 'checkboxes' | 'toggle' | 'file' | 'color'

export interface FieldOption {
  value: string
  label: string
}

export interface ParsedField {
  key: string
  component: FieldComponentType
  title: string
  description?: string
  placeholder?: string
  required: boolean
  options?: FieldOption[]
  min?: number
  max?: number
  step?: number
  minLength?: number
  maxLength?: number
  pattern?: string
  accept?: string
  defaultValue?: unknown
}

export interface FormSchema {
  title?: string
  description?: string
  type: 'object'
  properties: Record<string, JsonSchemaProperty>
  required?: string[]
}

export interface JsonSchemaProperty {
  type?: string
  title?: string
  description?: string
  format?: string
  'ui:widget'?: string
  'ui:placeholder'?: string
  enum?: string[]
  enumNames?: string[]
  items?: { type?: string; enum?: string[] }
  uniqueItems?: boolean
  minimum?: number
  maximum?: number
  minLength?: number
  maxLength?: number
  pattern?: string
  default?: unknown
}

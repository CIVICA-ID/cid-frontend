export interface SelectOption {
    label: string;
    value: string;
}

export interface SelectOptionGroup {
    label: string;
    items: SelectOption[];
}

export interface SearchFieldConfig {
    id: string;
    controlName: string;
    label: string;
    maxLength: number;
}

export interface FormFieldConfig {
    id: string;
    controlName: string;
    label: string;
    type: 'text' | 'date' | 'list';
    maxLength?: number;
    options?: SelectOption[] | SelectOptionGroup[];
    group?: boolean;
}

export const GENDER_OPTIONS: SelectOption[] = [
    { label: 'Femenino', value: 'femenino' },
    { label: 'Masculino', value: 'masculino' }
];

export const MARITAL_STATUS_OPTIONS: SelectOption[] = [
    { label: 'Soltero', value: 'soltero' },
    { label: 'Casado', value: 'casado' },
    { label: 'Divorciado', value: 'divorciado' },
    { label: 'Viudo', value: 'viudo' }
];

export const EDUCATION_LEVEL_OPTIONS: SelectOptionGroup[] = [
    {
        label: 'NIVEL BASICO',
        items: [
            { label: 'Primaria', value: 'primaria' },
            { label: 'Secundaria', value: 'secuendaria' }
        ]
    },
    {
        label: 'NIVEL MEDIO SUPERIOR',
        items: [{ label: 'Bachillerato', value: 'bachillerato' }]
    },
    {
        label: 'NIVEL SUPERIOR',
        items: [
            { label: 'Licenciatura', value: 'licenciatura' },
            { label: 'Especialidad', value: 'especialidad' },
            { label: 'Maestría', value: 'maestria' },
            { label: 'Doctorado', value: 'doctorado' }
        ]
    }
];

export const SEARCH_FIELDS: SearchFieldConfig[] = [
    { id: 'firstName', controlName: 'firstName', label: 'Nombres', maxLength: 50 },
    { id: 'paternalName', controlName: 'paternalName', label: 'Apellido Paterno', maxLength: 50 },
    { id: 'maternalName', controlName: 'maternalName', label: 'Apellido Materno', maxLength: 50 },
    { id: 'curp', controlName: 'curp', label: 'CURP', maxLength: 18 }
];

export const ADD_PERSON_FIELDS: FormFieldConfig[] = [
    { id: 'firstName', controlName: 'firstName', label: 'Nombres', maxLength: 150, type: 'text' },
    { id: 'paternalName', controlName: 'paternalName', label: 'Apellido Paterno', maxLength: 150, type: 'text' },
    { id: 'maternalName', controlName: 'maternalName', label: 'Apellido Materno', maxLength: 150, type: 'text' },
    { id: 'gender', controlName: 'gender', label: 'Género', type: 'list', options: GENDER_OPTIONS },
    { id: 'alias', controlName: 'alias', label: 'Alias', maxLength: 150, type: 'text' },
    { id: 'maritalStatus', controlName: 'maritalStatus', label: 'Estado Civil', type: 'list', options: MARITAL_STATUS_OPTIONS },
    { id: 'birthDate', controlName: 'birthDate', label: 'Fecha de nacimiento', type: 'date' },
    { id: 'educationLevel', controlName: 'educationLevel', label: 'Nivel de educación', type: 'list', group: true, maxLength: 50, options: EDUCATION_LEVEL_OPTIONS },
    { id: 'occupation', controlName: 'occupation', label: 'Ocupación', maxLength: 50, type: 'text' },
    { id: 'curp', controlName: 'curp', label: 'CURP', maxLength: 18, type: 'text' }
];

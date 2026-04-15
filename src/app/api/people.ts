export class People {
    'id': string;
    'firstName': string;
    'paternalName': string;
    'maternalName': string;
    'birthDate': Date; // O string en formato ISO-8601
    'alias': string;
    'gender': string;
    'maritalStatus': string;
    'educationLevel': string;
    'occupation': string;
    'peopleAddresses': [
        {
            address: string; // UUID de la dirección (ID)
        }
    ];
    'curp': string;
    'arrestType'?: string;
    administrativeFault: {
        active: boolean;
        createdAt: Date;
        description: string;
        id: string;
        id_category: string;
        updatedAt: Date;
    };
}

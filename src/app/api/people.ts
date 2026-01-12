export class People {
  "firstName": string;
  "paternalName": string;
  "maternalName": string;
  "birthDate": Date;          // O string en formato ISO-8601
  "alias": string;
  "gender": string;
  "maritalStatus": string;
  "educationLevel": string;
  "occupation": string;
  "peopleAddresses": [
    {
      "address": string       // UUID de la dirección (ID)
    }
  ];
  "curp": string;
}
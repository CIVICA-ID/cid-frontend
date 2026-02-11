import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { PageTitleComponent } from '@shared/page-title/page-title.component';
import { LUCIDE_ICONS, LucideAngularModule, LucideIconProvider, icons } from 'lucide-angular';
import { FlatpickrModule } from '../../../Component/flatpickr/flatpickr.module';
import { Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from "@angular/forms";
import { EmployeeService } from "../module/service";
import { BackService as ServiceCatalogState } from '../../catalog-state/back.service';
import { BackService as ServiceCatalogCity } from '../../catalog-city/back.service';
// Importar los servicios de catálogos de Denken (solo para Departamento y Puesto)
import { DepartmentService } from '../../department/module/service';
import { PositionService } from '../../position/module/service';
import { ToastrService } from 'ngx-toastr';
import {MDModalModule} from "../../../Component/modals/public_api";
import { EmployeeDocumentationService, EmployeeDocumentation } from '../../employee-documentation/employee-documentation.service';

@Component({
  selector: 'app-employee-save',
  standalone: true,
  imports: [
    CommonModule,
    PageTitleComponent,
    LucideAngularModule,
    MDModalModule,
    FlatpickrModule,
    FormsModule
  ],
  templateUrl: './template.html',
  styles: ``,
  providers: [
    { provide: LUCIDE_ICONS, multi: true, useValue: new LucideIconProvider(icons) },
    EmployeeService,
    ServiceCatalogState,
    ServiceCatalogCity,
    DepartmentService,
    PositionService,
    EmployeeDocumentationService
  ]
})
export class SaveComponent implements OnInit {
  activeTab = 'general';

  // TAB GENERAL
  firstName = ''; lastName = ''; middleName = ''; fileName = ''; gender = ''; maritalStatus = ''; its = '';
  militaryCard = ''; nss = ''; curp = ''; rfc = ''; birthEntity = ''; birthId = ''; birthDate = ''; nationality = '';
  infonavitCredit = ''; stateId = ''; bengala = '';

  // TAB CONTRATACION
  fullName_contr = ''; its_contr = ''; service = ''; hireDate = ''; fireDate = ''; fireReason = '';
  rehireDate = ''; entryDate = ''; position = ''; promotionDate = ''; commandLevel = ''; status = '';
  hiringStatus = ''; recruitmentDate = ''; weight = ''; height = ''; education = ''; fitness = ''; notes = '';
  tipoArmado = ''; withIMSS = ''; regionIMSS = '';
  checkFiniquito = ''; fechaFiniquito = ''; notaDeFiniquito = ''; segob = ''; cuip = ''; creditoInfonavit = '';

  // TAB DOMICILIO
  fullName_domicilio = ''; street = ''; exteriorNumber = ''; interiorNumber = ''; neighborhood = '';
  betweenStreets = ''; addressDescription = ''; addressReference = ''; neighborhoodAndMunicipality = '';
  postalCode = ''; zone = ''; homePhone = ''; cellPhone = ''; otherPhone = ''; parentOrSpousePhone = '';
  emergencyContact = ''; bloodType = ''; allergy = ''; email = ''; municipalityIdId = ''; stateIdId = '';

  // Edit mode properties
  isEditMode = false;
  editingEmployeeId: number | null = null;

  // Loading states
  isLoading = false;

  // Validation state
  formSubmitted = false;

  // Estados y Municipios desde catalog-state y catalog-city
  states: any[] = [];
  municipalities: any[] = [];
  isLoadingStates = false;
  isLoadingMunicipalities = false;

  // Catálogos de Denken (solo Departamento y Puesto)
  departmentsFromDenken: any[] = [];
  positionsFromDenken: any[] = [];

  // Loading states para los catálogos de Denken
  isLoadingDenkenDepartments = false;
  isLoadingDenkenPositions = false;

  // Términos de búsqueda para los selects
  birthEntitySearch = '';
  bengalaSearch = '';
  stateIdSearch = '';
  positionSearch = '';
  municipalityIdIdSearch = '';
  stateIdIdSearch = '';

  // ID del estado seleccionado para filtrar municipios
  selectedResidenceStateId: number | null = null;

  // TAB DOCUMENTACIÓN
  documentation: EmployeeDocumentation = {
    solicitud_empleo_original: false,
    solicitud_empleo_copia: false,
    acta_nacimiento_original: false,
    acta_nacimiento_copia: false,
    comprobante_estudios_original: false,
    comprobante_estudios_copia: false,
    comprobante_domicilio_original: false,
    comprobante_domicilio_copia: false,
    carta_antecedentes_np_original: false,
    carta_antecedentes_np_copia: false,
    recom_personales_original: false,
    recom_personales_copia: false,
    recom_laborales_original: false,
    recom_laborales_copia: false,
    carta_baja_laboral_original: false,
    carta_baja_laboral_copia: false,
    cartilla_smn_original: false,
    cartilla_smn_copia: false,
    certificado_medico_original: false,
    certificado_medico_copia: false,
    alta_imss_original: false,
    alta_imss_copia: false,
    ine_original: false,
    ine_copia: false,
    curp_original: false,
    curp_copia: false,
    rfc_original: false,
    rfc_copia: false,
    infonavit_original: false,
    infonavit_copia: false,
    licencia_original: false,
    licencia_copia: false,
    reconocimiento_original: false,
    reconocimiento_copia: false
  };
  isLoadingDocumentation = false;
  isSavingDocumentation = false;

  // Visibility flags for autocomplete dropdowns
  showBirthEntityDropdown = false;
  showBengalaDropdown = false;
  showStateIdDropdown = false;
  showPositionDropdown = false;
  showMunicipalityDropdown = false;
  showStateIdIdDropdown = false;

  private employeeService = inject(EmployeeService);
  private catalogStateService = inject(ServiceCatalogState);
  private catalogCityService = inject(ServiceCatalogCity);
  // Inyectar servicios de Denken (solo Departamento y Puesto)
  private denkenDepartmentService = inject(DepartmentService);
  private denkenPositionService = inject(PositionService);
  private documentationService = inject(EmployeeDocumentationService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private toastr = inject(ToastrService);

  ngOnInit(): void {
    // Cargar estados desde catalog-state
    this.loadStates();
    // Cargar catálogos de Denken (Departamento y Puesto)
    this.loadDenkenDepartments();
    this.loadDenkenPositions();
    // No cargar municipios aquí, se cargarán cuando se seleccione un estado

    // Check if we're in edit mode
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.editingEmployeeId = Number(params['id']);
        this.isEditMode = true;
        this.loadEmployeeForEdit(this.editingEmployeeId);
      } else {
        // En modo creación, inicializar la fecha de ingreso
        this.updateEntryDate();
      }
    });
  }

  private async waitForStatesLoaded(): Promise<void> {
    let attempts = 0;
    const maxAttempts = 50; // 5 segundos máximo (50 * 100ms)

    while (this.isLoadingStates && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }
  }

  async loadEmployeeForEdit(employeeId: number) {
    this.isLoading = true;
    try {
      const return_data = await this.employeeService.getProfileById(employeeId);

      console.log("Datos del empleado recibidos para edición:", return_data);
      const employee = return_data.data.data;

      // Populate form with employee data from new API (Spanish fields)
      this.firstName = employee.nombre || '';
      this.lastName = employee.apellidoPaterno || '';
      this.middleName = employee.apellidoMaterno || '';
      this.fileName = (`${this.lastName} ${this.middleName}, ${this.firstName}`.replace(/\s+/g, ' ').trim()).substring(0, 60);
      this.gender = employee.sexo || '';
      this.maritalStatus = employee.edoCivil || '';
      this.its = (employee.its ?? '').toString();
      this.militaryCard = employee.matriculaCartilla || '';
      this.nss = employee.nss || '';
      this.curp = employee.curp || '';
      this.rfc = employee.rfc || '';

      // Detectar género automáticamente desde CURP si no está establecido
      if (this.curp && !this.gender) {
        this.updateGenderFromCurp();
      }
      this.birthEntity = employee.entidadNacimiento || '';
      this.birthEntitySearch = this.birthEntity;
      this.birthId = '';
      this.birthDate = employee.fechaNac || '';
      this.nationality = employee.nacionalidad || '';
      this.infonavitCredit = '';
      this.stateId = employee.estadoContratacion || '';
      this.stateIdSearch = employee.estadoContratacion || '';
      this.bengala = employee.bengala || '';
      this.bengalaSearch = this.bengala;

      // Hiring/contratación data
      this.position = employee.puesto || '';
      this.positionSearch = this.position;
      this.status = employee.estatus || '';
      this.hiringStatus = employee.contratacion || '';
      this.regionIMSS = employee.regionImss || '';
      this.hireDate = employee.fechaDeAlta || '';
      this.fireDate = employee.fechaDeBaja || '';
      this.fireReason = employee.motivoDeBaja || '';
      this.rehireDate = employee.fechaDeReingreso || '';
      this.entryDate = employee.fechaDeIngreso || '';
      this.recruitmentDate = employee.fechaReclutamiento || '';
      this.weight = employee.peso || '';
      this.height = employee.estatura || '';
      this.education = employee.escolaridad || '';
      this.tipoArmado = employee.tipoArmado || '';
      this.withIMSS = employee.conImss || '';
      this.checkFiniquito = employee.checkFiniquito || '';
      this.fechaFiniquito = employee.fechaFiniquito || '';
      this.notaDeFiniquito = employee.notaDeFiniquito || '';
      this.segob = employee.segob || '';
      this.cuip = employee.cuip || '';
      this.creditoInfonavit = employee.creditoInfonavit || '';

      // Address/domicilio data
      this.street = employee.calle || '';
      this.exteriorNumber = employee.noExt || '';
      this.interiorNumber = employee.noInt || '';
      this.neighborhood = employee.colonia || '';
      this.municipalityIdIdSearch = employee.municipio || '';
      this.municipalityIdId = employee.municipio || '';
      this.stateIdIdSearch = employee.estado || '';
      this.stateIdId = employee.estado || '';
      this.postalCode = employee.cp || '';
      // Phones and email
      this.cellPhone = employee.tel1 || '';
      this.homePhone = employee.tel2 || '';
      this.otherPhone = '';
      this.email = employee.correo || '';

      // Buscar el estado de residencia en la lista para obtener su código
      if (this.stateIdIdSearch) {
        // Esperar a que los estados se carguen
        await this.waitForStatesLoaded();
        const foundState = this.states.find((state: any) =>
          (state.name || '').toLowerCase() === (this.stateIdIdSearch || '').toLowerCase()
        );
        if (foundState && foundState.code) {
          this.selectedResidenceStateId = foundState.code;
          // Cargar municipios para el estado seleccionado
          await this.loadMunicipalitiesByState(foundState.code);
        }
      }

      this.parentOrSpousePhone = employee.telPadresEsposa || '';
      this.emergencyContact = employee.contactoEmergencia || '';
      this.bloodType = employee.tipoSangre || '';
      this.allergy = employee.alergia || '';

      // Actualizar la fecha de ingreso después de cargar los datos
      this.updateEntryDate();

      // Cargar la documentación del empleado
      await this.loadEmployeeDocumentation();

    } catch (error) {
      this.toastr.error('Error al cargar los datos del empleado', 'Error', {
        timeOut: 5000,
        positionClass: 'toast-top-right',
        closeButton: true
      });
    } finally {
      this.isLoading = false;
    }
  }

  updateFileName() {
    // Convierte a mayúsculas y arma el formato requerido, máx. 60 caracteres
    const last = (this.lastName || '').trim().toUpperCase();
    const middle = (this.middleName || '').trim().toUpperCase();
    const first = (this.firstName || '').trim().toUpperCase();
    this.fileName = (`${last} ${middle},  ${first}`.replace(/\s+/g, ' ').trim()).substring(0, 60);
  }

  // Métodos para validaciones de fechas
  shouldDisableHireDate(): boolean {
    if (!this.isEditMode) return false; // En modo creación se puede editar

    // Si no hay fecha de alta, se puede editar
    if (!this.hireDate) return false;

    // Obtener la fecha actual
    const today = new Date();
    const hireDateObj = new Date(this.hireDate);

    // Calcular la diferencia en días
    const diffTime = today.getTime() - hireDateObj.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // Si ha pasado más de un día desde la fecha de alta, no se puede editar
    return diffDays > 1;
  }

  updateGenderFromCurp(): void {
    // Limpiar espacios y convertir a mayúsculas
    this.curp = this.curp.trim().toUpperCase();

    // Validar que la CURP tenga exactamente 18 caracteres
    if (!this.curp || this.curp.length !== 18) {
      this.gender = '';
      return;
    }

    // Validar formato básico de CURP (4 letras + 6 números + H/M + 5 letras + 2 caracteres alfanuméricos)
    const curpPattern = /^[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z0-9]{2}$/;

    if (!curpPattern.test(this.curp)) {
      this.gender = '';
      return;
    }

    // Extraer el carácter de género (posición 10, índice 10)
    const genderChar = this.curp.charAt(10);

    // Determinar el género basado en el carácter
    switch (genderChar) {
      case 'H':
        this.gender = 'HOMBRE';
        break;
      case 'M':
        this.gender = 'MUJER';
        break;
      default:
        // Esto no debería ocurrir si el patrón regex es correcto, pero por seguridad
        this.gender = '';
        break;
    }

  }

  updateEntryDate(): void {
    // La fecha de ingreso es la más reciente entre fecha de alta y fecha de reingreso
    const hireDate = this.hireDate ? new Date(this.hireDate) : null;
    const rehireDate = this.rehireDate ? new Date(this.rehireDate) : null;

    let entryDate: Date | null = null;

    if (hireDate && rehireDate) {
      // Si ambas fechas existen, tomar la más reciente
      entryDate = hireDate > rehireDate ? hireDate : rehireDate;
    } else if (hireDate) {
      // Solo existe fecha de alta
      entryDate = hireDate;
    } else if (rehireDate) {
      // Solo existe fecha de reingreso
      entryDate = rehireDate;
    }

    // Convertir a formato YYYY-MM-DD para el input date
    if (entryDate) {
      this.entryDate = entryDate.toISOString().split('T')[0];
    } else {
      this.entryDate = '';
    }
  }

  highlightDuplicateFields(): void {
    // Resaltar campos que pueden tener duplicados
    setTimeout(() => {
      const fieldsToHighlight = ['curp', 'rfc', 'nss'];

      fieldsToHighlight.forEach(fieldId => {
        const element = document.getElementById(fieldId);
        if (element) {
          // Agregar clase de error temporalmente
          element.classList.add('border-red-500', 'bg-red-50');

          // Remover la clase después de 5 segundos
          setTimeout(() => {
            element.classList.remove('border-red-500', 'bg-red-50');
          }, 5000);
        }
      });

      // Cambiar a la pestaña de datos generales donde están estos campos
      this.activeTab = 'general';
    }, 100);
  }

  // Métodos helper para validar campos individuales
  isFieldInvalid(fieldValue: string | null | undefined): boolean {
    if (!this.formSubmitted) return false;
    return !fieldValue || fieldValue.trim() === '';
  }

  // Validar y limpiar NSS - Solo permite números (sin límite de dígitos)
  onNssInput(event: any): void {
    const input = event.target.value;
    // Remover todo lo que no sean números
    const cleaned = input.replace(/\D/g, '');
    // Actualizar el valor
    this.nss = cleaned;
  }

  validateRequiredFields(): { isValid: boolean; missingFields: string[]; tabWithError: string } {
    const missingFields: string[] = [];
    let tabWithError = 'general';

    // TAB GENERAL - Validaciones
    // Validar nombre completo (nombre + primer apellido son obligatorios)
    if (!this.firstName || this.firstName.trim() === '') {
      missingFields.push('Nombre(s)');
    }
    if (!this.lastName || this.lastName.trim() === '') {
      missingFields.push('Primer apellido');
    }

    // Validar RFC
    const rfcPattern = /^[A-Z&Ñ]{4}\d{6}[A-Z0-9]{3}$/i;
    if (!this.rfc || this.rfc.trim() === '') {
      missingFields.push('RFC');
    } else if (this.rfc.trim().length !== 13 || !rfcPattern.test(this.rfc.trim())) {
      missingFields.push('RFC (formato inválido)');
    }

    // Validar CURP
    if (!this.curp || this.curp.trim() === '') {
      missingFields.push('CURP');
    }

    // Validar NSS
    if (!this.nss || this.nss.trim() === '') {
      missingFields.push('NSS');
    }

    // Validar Fecha de nacimiento
    if (!this.birthDate || this.birthDate.trim() === '') {
      missingFields.push('Fecha de nacimiento');
    }

    // Validar Entidad de nacimiento
    if ((
      !this.birthEntity || String(this.birthEntity).trim() === ''
    ) && (
      !this.birthEntitySearch || String(this.birthEntitySearch).trim() === ''
    )) {
      missingFields.push('Entidad de nacimiento');
    }

    // Validar Estado de contratación
    if ((
      !this.stateId || String(this.stateId).trim() === ''
    ) && (
      !this.stateIdSearch || String(this.stateIdSearch).trim() === ''
    )) {
      missingFields.push('Estado de contratación');
    }

    // Validar Sexo (se detecta automáticamente desde CURP)
    if (!this.gender || this.gender.trim() === '') {
      missingFields.push('Sexo (verifique que la CURP sea válida)');
    }

    // TAB CONTRATACIÓN - Validaciones
    // Validar Estatus
    if (!this.status || this.status.trim() === '') {
      missingFields.push('Estatus');
      if (tabWithError === 'general') tabWithError = 'contratacion';
    }

    // Validar Estatus de contratación
    if (!this.hiringStatus || this.hiringStatus.trim() === '') {
      missingFields.push('Estatus de contratación');
      if (tabWithError === 'general') tabWithError = 'contratacion';
    }

    // Validar Tipo (Armado/No Armado)
    if (!this.tipoArmado || this.tipoArmado.trim() === '') {
      missingFields.push('Tipo');
      if (tabWithError === 'general') tabWithError = 'contratacion';
    }

    // Validar Estatura
    if (!this.height || this.height.trim() === '') {
      missingFields.push('Estatura');
      if (tabWithError === 'general') tabWithError = 'contratacion';
    }

    // Validar Escolaridad
    if (!this.education || this.education.trim() === '') {
      missingFields.push('Escolaridad');
      if (tabWithError === 'general') tabWithError = 'contratacion';
    }

    // TAB DOMICILIO - Validaciones
    // Validar Calle
    if (!this.street || this.street.trim() === '') {
      missingFields.push('Calle');
      if (tabWithError === 'general') tabWithError = 'domicilio';
    }

    // Validar Número exterior
    if (!this.exteriorNumber || this.exteriorNumber.trim() === '') {
      missingFields.push('Número exterior');
      if (tabWithError === 'general') tabWithError = 'domicilio';
    }

    // Validar Colonia
    if (!this.neighborhood || this.neighborhood.trim() === '') {
      missingFields.push('Colonia');
      if (tabWithError === 'general') tabWithError = 'domicilio';
    }

    // Validar Código postal
    if (!this.postalCode || this.postalCode.trim() === '') {
      missingFields.push('Código postal');
      if (tabWithError === 'general') tabWithError = 'domicilio';
    }

    // Validar Celular
    if (!this.cellPhone || this.cellPhone.trim() === '') {
      missingFields.push('Celular');
      if (tabWithError === 'general') tabWithError = 'domicilio';
    }

    // Validar Contacto de emergencia
    if (!this.emergencyContact || this.emergencyContact.trim() === '') {
      missingFields.push('Contacto de emergencia');
      if (tabWithError === 'general') tabWithError = 'domicilio';
    }

    // Validar Municipio de residencia
    if ((
      !this.municipalityIdId || String(this.municipalityIdId).trim() === ''
    ) && (
      !this.municipalityIdIdSearch || String(this.municipalityIdIdSearch).trim() === ''
    )) {
      missingFields.push('Municipio de residencia');
      if (tabWithError === 'general') tabWithError = 'domicilio';
    }

    // Validar Estado de residencia
    if ((
      !this.stateIdId || String(this.stateIdId).trim() === ''
    ) && (
      !this.stateIdIdSearch || String(this.stateIdIdSearch).trim() === ''
    )) {
      missingFields.push('Estado de residencia');
      if (tabWithError === 'general') tabWithError = 'domicilio';
    }

    return {
      isValid: missingFields.length === 0,
      missingFields,
      tabWithError
    };
  }

  async onSubmit() {
    // Marcar que se intentó guardar el formulario
    this.formSubmitted = true;

    // Validar campos requeridos
    const validation = this.validateRequiredFields();

    if (!validation.isValid) {
      // Mostrar error con los campos faltantes
      const fieldsText = validation.missingFields.join(', ');
      this.toastr.error(
        `Faltan los siguientes campos obligatorios: ${fieldsText}`,
        'Campos requeridos',
        {
          timeOut: 8000,
          positionClass: 'toast-top-right',
          closeButton: true,
          enableHtml: true
        }
      );

      // Cambiar a la pestaña donde está el error
      this.activeTab = validation.tabWithError;
      return;
    }

    // Map form fields to new API (Spanish) payload
    const payload: any = {
      // its removed: backend auto-generates this value
      nombre: this.firstName || null,
      apellidoPaterno: this.lastName || null,
      apellidoMaterno: this.middleName || null,
      puesto: this.position || null,
      bengala: this.bengala || null,
      estadoContratacion: this.stateIdSearch || this.stateId || null,
      regionImss: this.regionIMSS || null,
      nss: this.nss || null,
      rfc: this.rfc || null,
      curp: this.curp || null,
      calle: this.street || null,
      noExt: this.exteriorNumber || null,
      noInt: this.interiorNumber || null,
      colonia: this.neighborhood || null,
      municipio: this.municipalityIdIdSearch || this.municipalityIdId || null,
      estado: this.stateIdIdSearch || this.stateIdId || null,
      cp: this.postalCode || null,
      tel1: this.cellPhone || null,
      tel2: this.homePhone || null,
      correo: this.email || null,
      entidadNacimiento: this.birthEntitySearch || this.birthEntity || null,
      fechaNac: this.birthDate || null,
      nacionalidad: this.nationality || null,
      sexo: this.gender || null,
      matriculaCartilla: this.militaryCard || null,
      peso: this.weight || null,
      estatura: this.height || null,
      escolaridad: this.education || null,
      edoCivil: this.maritalStatus || null,
      telPadresEsposa: this.parentOrSpousePhone || null,
      contactoEmergencia: this.emergencyContact || null,
      fechaDeAlta: this.hireDate || null,
      fechaDeReingreso: this.rehireDate || null,
      fechaDeIngreso: this.entryDate || null,
      fechaDeBaja: this.fireDate || null,
      motivoDeBaja: this.fireReason || null,
      fechaReclutamiento: this.recruitmentDate || null,
      tipoSangre: this.bloodType || null,
      alergia: this.allergy || null,
      tipoArmado: this.tipoArmado || null,
      estatus: this.status || null,
      contratacion: this.hiringStatus || null,
      conImss: this.withIMSS || null,
      checkFiniquito: this.checkFiniquito || null,
      fechaFiniquito: this.fechaFiniquito || null,
      notaDeFiniquito: this.notaDeFiniquito || null,
      segob: this.segob || null,
      cuip: this.cuip || null,
      creditoInfonavit: this.creditoInfonavit || null,
    };


    this.isLoading = true;

    try {
      if (this.isEditMode && this.editingEmployeeId) {
        await this.employeeService.update(this.editingEmployeeId, payload);
        this.toastr.success('El empleado ha sido actualizado correctamente', 'Éxito', {
          timeOut: 3000,
          positionClass: 'toast-top-right',
          closeButton: true
        });
      } else {
        await this.employeeService.create(payload);
        this.toastr.success('El empleado ha sido creado correctamente', 'Éxito', {
          timeOut: 3000,
          positionClass: 'toast-top-right',
          closeButton: true
        });
      }

      // Navigate back to list
      this.router.navigate(['/hr/employee']);

    } catch (error: any) {
      console.error('Error saving employee:', error);

      // Manejar errores estructurados del backend
      // La estructura puede venir en error.error o error.response.data
      const errorData = error.error || error.response?.data;

      if (errorData && errorData.message) {
        const { message, type, statusCode } = errorData;

        // Verificar que message sea un array
        const errorMessages = Array.isArray(message) ? message : [message];


        // Manejar diferentes tipos de errores de validación
        if (type === 'FORMAT_VALIDATION' && statusCode === 400) {
          // Errores de formato (CURP, RFC, NSS inválidos)
          errorMessages.forEach((msg: string) => {
            this.toastr.error(msg, 'Error de Formato', {
              timeOut: 8000,
              positionClass: 'toast-top-right',
              closeButton: true
            });
          });

          // Cambiar a la pestaña relevante si hay errores de formato
          this.activeTab = 'general';

        } else if (type === 'DUPLICATE_VALIDATION' && statusCode === 409) {
          // Errores de duplicados (CURP, RFC, NSS ya existen)
          errorMessages.forEach((msg: string) => {
            this.toastr.warning(msg, 'Datos Duplicados', {
              timeOut: 10000,
              positionClass: 'toast-top-right',
              closeButton: true
            });
          });

          // Resaltar campos duplicados si es necesario
          this.highlightDuplicateFields();

        } else {
          // Otros errores de validación genéricos
          errorMessages.forEach((msg: string) => {
            this.toastr.error(msg, 'Error de Validación', {
              timeOut: 6000,
              positionClass: 'toast-top-right',
              closeButton: true
            });
          });
        }
      } else {
        // Error genérico cuando no hay estructura específica
        this.toastr.error(
          this.isEditMode
            ? 'Error al actualizar el empleado. Por favor, intenta de nuevo.'
            : 'Error al crear el empleado. Por favor, intenta de nuevo.',
          'Error',
          {
            timeOut: 5000,
            positionClass: 'toast-top-right',
            closeButton: true
          }
        );
      }
    } finally {
      this.isLoading = false;
    }
  }

  resetForm() {
    // Reset edit mode
    this.isEditMode = false;
    this.editingEmployeeId = null;

    // Reset all form fields
    this.firstName = ''; this.lastName = ''; this.middleName = ''; this.fileName = '';
    this.gender = ''; this.maritalStatus = ''; this.its = ''; this.militaryCard = '';
    this.nss = ''; this.curp = ''; this.rfc = ''; this.birthEntity = ''; this.birthId = '';
    this.birthDate = ''; this.nationality = ''; this.infonavitCredit = ''; this.stateId = '';
    this.bengala = '';

    this.fullName_contr = ''; this.its_contr = ''; this.service = ''; this.hireDate = '';
    this.fireDate = ''; this.fireReason = ''; this.rehireDate = ''; this.entryDate = '';
    this.position = ''; this.promotionDate = ''; this.commandLevel = ''; this.status = '';
    this.hiringStatus = ''; this.recruitmentDate = ''; this.weight = ''; this.height = '';
    this.education = ''; this.fitness = ''; this.notes = ''; this.tipoArmado = ''; this.withIMSS = '';
    this.regionIMSS = '';
    this.checkFiniquito = ''; this.fechaFiniquito = ''; this.notaDeFiniquito = ''; this.segob = ''; this.cuip = ''; this.creditoInfonavit = '';

    this.fullName_domicilio = ''; this.street = ''; this.exteriorNumber = ''; this.interiorNumber = '';
    this.neighborhood = ''; this.betweenStreets = ''; this.addressDescription = ''; this.addressReference = '';
    this.neighborhoodAndMunicipality = ''; this.postalCode = ''; this.zone = ''; this.homePhone = '';
    this.cellPhone = ''; this.otherPhone = ''; this.parentOrSpousePhone = ''; this.emergencyContact = '';
    this.bloodType = ''; this.allergy = ''; this.email = ''; this.municipalityIdId = ''; this.stateIdId = '';

    // Reset search/display helpers
    this.birthEntitySearch = '';
    this.bengalaSearch = '';
    this.stateIdSearch = '';
    this.positionSearch = '';
    this.municipalityIdIdSearch = '';
    this.stateIdIdSearch = '';

    this.showBirthEntityDropdown = false;
    this.showBengalaDropdown = false;
    this.showStateIdDropdown = false;
    this.showPositionDropdown = false;
    this.showMunicipalityDropdown = false;
    this.showStateIdIdDropdown = false;

    // Reset residence state ID
    this.selectedResidenceStateId = null;
  }

  // === MÉTODOS PARA CARGAR ESTADOS Y MUNICIPIOS DESDE CATALOG-STATE Y CATALOG-CITY ===
  async loadStates() {
    try {
      this.isLoadingStates = true;
      const params = { page: 1, pageSize: 1000 };
      const response = await this.catalogStateService.getList(params);

      if (response?.success && response?.data?.data) {
        this.states = response.data.data.map((state: any) => ({
          id: state.id,
          code: state.code,
          name: state.name,
          countryCode: state.countryCode
        }));
      } else {
        this.states = [];
        console.error('No se pudieron cargar los estados');
      }
    } catch (error) {
      console.error('Error cargando estados:', error);
      this.states = [];
    } finally {
      this.isLoadingStates = false;
    }
  }

  async loadMunicipalitiesByState(stateCode: string) {
    try {
      this.isLoadingMunicipalities = true;
      const params = { page: 1, pageSize: 10000, search: stateCode };
      const response = await this.catalogCityService.getList(params);

      if (response?.success && response?.data?.data) {
        this.municipalities = response.data.data
          .filter((city: any) => city.stateCode === stateCode)
          .map((city: any) => ({
            id: city.id,
            municipalityId: city.municipalityId,
            stateCode: city.stateCode,
            description: city.description
          }));
      } else {
        this.municipalities = [];
        console.error('No se pudieron cargar los municipios');
      }
    } catch (error) {
      console.error('Error cargando municipios:', error);
      this.municipalities = [];
    } finally {
      this.isLoadingMunicipalities = false;
    }
  }

  cancelEdit() {
    this.router.navigate(['/hr/employee']);
  }

  goBack() {
    this.router.navigate(['/hr/employee']);
  }

  // === MÉTODOS PARA CARGAR CATÁLOGOS DE DENKEN (SOLO DEPARTAMENTO Y PUESTO) ===
  async loadDenkenDepartments() {
    try {
      this.isLoadingDenkenDepartments = true;
      const response = await this.denkenDepartmentService.getList({ page: 1, pageSize: 1000 });
      if (response?.success && response?.data) {
        this.departmentsFromDenken = Array.isArray(response.data) ? response.data : (response.data.data || []);
      } else {
        this.departmentsFromDenken = [];
      }
    } catch (error) {
      console.error('Error cargando departamentos de Denken:', error);
      this.departmentsFromDenken = [];
    } finally {
      this.isLoadingDenkenDepartments = false;
    }
  }

  async loadDenkenPositions() {
    try {
      this.isLoadingDenkenPositions = true;
      const response = await this.denkenPositionService.getList({ page: 1, pageSize: 1000 });
      if (response?.success && response?.data) {
        this.positionsFromDenken = Array.isArray(response.data) ? response.data : (response.data.data || []);
      } else {
        this.positionsFromDenken = [];
      }
    } catch (error) {
      console.error('Error cargando puestos de Denken:', error);
      this.positionsFromDenken = [];
    } finally {
      this.isLoadingDenkenPositions = false;
    }
  }

  // Métodos para manejar cambios en los selects con buscador
  onBirthEntitySearchChange(searchTerm: string) {
    this.birthEntitySearch = searchTerm;
    this.showBirthEntityDropdown = true;
  }

  onBengalaSearchChange(searchTerm: string) {
    this.bengalaSearch = searchTerm;
    this.showBengalaDropdown = true;
  }

  onStateIdSearchChange(searchTerm: string) {
    this.stateIdSearch = searchTerm;
    this.showStateIdDropdown = true;
  }

  onPositionSearchChange(searchTerm: string) {
    this.positionSearch = searchTerm;
    this.showPositionDropdown = true;
  }

  onMunicipalityIdIdSearchChange(searchTerm: string) {
    this.municipalityIdIdSearch = searchTerm;
    this.showMunicipalityDropdown = true;
  }

  onStateIdIdSearchChange(searchTerm: string) {
    this.stateIdIdSearch = searchTerm;
    this.showStateIdIdDropdown = true;
  }

  // Selection handlers to apply value and hide dropdowns
  selectBirthEntity(state: any) {
    const value = state?.name || '';
    this.birthEntity = value;
    this.birthEntitySearch = value;
    this.showBirthEntityDropdown = false;
  }

  selectBengala(department: any) {
    const value = department?.des_dep || '';
    this.bengala = value;
    this.bengalaSearch = value;
    this.showBengalaDropdown = false;
  }

  selectContractState(state: any) {
    const text = state?.name || '';
    const code = state?.code || '';
    this.stateId = code || text;
    this.stateIdSearch = text || code;
    this.showStateIdDropdown = false;

    // Establecer automáticamente la Región IMSS basada en el estado de contratación
    this.updateRegionIMSS(text);
  }

  /**
   * Actualiza la Región IMSS automáticamente según el Estado de Contratación
   */
  updateRegionIMSS(estadoContratacion: string): void {
    if (!estadoContratacion) {
      return;
    }

    // Convertir a mayúsculas y limpiar espacios para la comparación
    const estado = estadoContratacion.toUpperCase().trim();

    // Región 1: JALISCO
    const regionJalisco = [
      'JALISCO',
      'NAYARIT',
      'ZACATECAS',
      'AGUASCALIENTES',
      'COLIMA',
      'MICHOACÁN',
      'MICHOACAN',
      'SAN LUIS POTOSI',
      'SAN LUIS POTOSÍ',
      'SINALOA'
    ];

    // Región 2: NUEVO LEÓN
    const regionNuevoLeon = [
      'NUEVO LEÓN',
      'NUEVO LEON',
      'TAMAULIPAS',
      'COAHUILA',
      'CHIHUAHUA',
      'SONORA',
      'BAJA CALIFORNIA',
      'BAJA CALIFORNIA SUR',
      'DURANGO'
    ];

    // Región 3: ESTADO DE MÉXICO
    const regionEstadoDeMexico = [
      'ESTADO DE MÉXICO',
      'ESTADO DE MEXICO',
      'CIUDAD DE MÉXICO',
      'CIUDAD DE MEXICO',
      'GUERRERO',
      'MORELOS',
      'PUEBLA',
      'TLAXCALA',
      'HIDALGO',
      'QUERÉTARO',
      'QUERETARO',
      'VERACRUZ',
      'OAXACA',
      'TABASCO',
      'CHIAPAS',
      'CAMPECHE',
      'YUCATÁN',
      'YUCATAN',
      'QUINTANA ROO'
    ];

    // Determinar la región IMSS
    if (regionJalisco.includes(estado)) {
      this.regionIMSS = 'JALISCO';
    } else if (regionNuevoLeon.includes(estado)) {
      this.regionIMSS = 'NUEVO LEÓN';
    } else if (regionEstadoDeMexico.includes(estado)) {
      this.regionIMSS = 'ESTADO DE MÉXICO';
    } else if (estado === 'GUANAJUATO') {
      this.regionIMSS = 'GUANAJUATO';
    } else {
      // Si no coincide con ninguna región, dejar vacío
      this.regionIMSS = '';
    }
  }

  selectPosition(pos: any) {
    const value = pos?.puesto || '';
    this.position = value;
    this.positionSearch = value;
    this.showPositionDropdown = false;
  }

  selectMunicipality(municipality: any) {
    const text = municipality?.description || '';
    this.municipalityIdId = text;
    this.municipalityIdIdSearch = text;
    this.showMunicipalityDropdown = false;
  }

  selectResidenceState(state: any) {
    const text = state?.name || '';
    const code = state?.code || '';
    this.stateIdId = text;
    this.stateIdIdSearch = text;
    this.showStateIdIdDropdown = false;

    // Guardar el código del estado para filtrar municipios
    this.selectedResidenceStateId = code || null;

    // Limpiar municipio seleccionado cuando cambia el estado
    this.municipalityIdId = '';
    this.municipalityIdIdSearch = '';

    // Cargar municipios filtrados por el código del estado seleccionado
    if (code) {
      this.loadMunicipalitiesByState(code);
    } else {
      this.municipalities = [];
    }
  }

  // Filtrar departamentos de Denken por término de búsqueda
  get filteredDenkenDepartments() {
    if (!this.bengalaSearch) {
      return this.departmentsFromDenken;
    }
    return this.departmentsFromDenken.filter(department =>
      department.des_dep.toLowerCase().includes(this.bengalaSearch.toLowerCase())
    );
  }

  // Filtrar puestos de Denken por término de búsqueda
  get filteredDenkenPositions() {
    if (!this.positionSearch) {
      return this.positionsFromDenken;
    }
    return this.positionsFromDenken.filter(position =>
      position.puesto.toLowerCase().includes(this.positionSearch.toLowerCase())
    );
  }

  // Filtrar estados por término de búsqueda para Entidad de Nacimiento
  get filteredStatesForBirth() {
    const term = (this.birthEntitySearch || '').toLowerCase();
    if (!term) return this.states;
    return this.states.filter((state: any) =>
      (state.name || '').toLowerCase().includes(term) ||
      (state.code || '').toLowerCase().includes(term)
    );
  }

  // Filtrar estados por término de búsqueda para Estado de Contratación
  get filteredStatesForContract() {
    const term = (this.stateIdSearch || '').toLowerCase();
    if (!term) return this.states;
    return this.states.filter((state: any) =>
      (state.name || '').toLowerCase().includes(term) ||
      (state.code || '').toLowerCase().includes(term)
    );
  }

  // Filtrar estados por término de búsqueda para Estado de Residencia
  get filteredStatesForResidence() {
    const term = (this.stateIdIdSearch || '').toLowerCase();
    if (!term) return this.states;
    return this.states.filter((state: any) =>
      (state.name || '').toLowerCase().includes(term) ||
      (state.code || '').toLowerCase().includes(term)
    );
  }

  // Filtrar municipios por término de búsqueda
  get filteredMunicipalities() {
    const term = (this.municipalityIdIdSearch || '').toLowerCase();
    if (!term) return this.municipalities;
    return this.municipalities.filter((municipality: any) =>
      (municipality.description || '').toLowerCase().includes(term)
    );
  }

  // === MÉTODOS PARA DOCUMENTACIÓN ===

  /**
   * Cargar la documentación del empleado por ITS
   */
  async loadEmployeeDocumentation(): Promise<void> {
    if (!this.its) {
      console.warn('No hay ITS disponible para cargar la documentación');
      return;
    }

    this.isLoadingDocumentation = true;

    try {
      const response = await this.documentationService.getByIts(this.its);

      if (response.success && response.data) {
        // Cargar los datos existentes
        this.documentation = {
          ...this.documentation,
          ...response.data
        };
      } else {
        // No existe documentación para este empleado, inicializar con valores por defecto
        this.documentation = {
          solicitud_empleo_original: false,
          solicitud_empleo_copia: false,
          acta_nacimiento_original: false,
          acta_nacimiento_copia: false,
          comprobante_estudios_original: false,
          comprobante_estudios_copia: false,
          comprobante_domicilio_original: false,
          comprobante_domicilio_copia: false,
          carta_antecedentes_np_original: false,
          carta_antecedentes_np_copia: false,
          recom_personales_original: false,
          recom_personales_copia: false,
          recom_laborales_original: false,
          recom_laborales_copia: false,
          carta_baja_laboral_original: false,
          carta_baja_laboral_copia: false,
          cartilla_smn_original: false,
          cartilla_smn_copia: false,
          certificado_medico_original: false,
          certificado_medico_copia: false,
          alta_imss_original: false,
          alta_imss_copia: false,
          ine_original: false,
          ine_copia: false,
          curp_original: false,
          curp_copia: false,
          rfc_original: false,
          rfc_copia: false,
          infonavit_original: false,
          infonavit_copia: false,
          licencia_original: false,
          licencia_copia: false,
          reconocimiento_original: false,
          reconocimiento_copia: false
        };
      }
    } catch (error: any) {
      // Si el error es 404, significa que no existe documentación, lo cual es normal
      if (error?.status === 404) {
        this.documentation = {
          solicitud_empleo_original: false,
          solicitud_empleo_copia: false,
          acta_nacimiento_original: false,
          acta_nacimiento_copia: false,
          comprobante_estudios_original: false,
          comprobante_estudios_copia: false,
          comprobante_domicilio_original: false,
          comprobante_domicilio_copia: false,
          carta_antecedentes_np_original: false,
          carta_antecedentes_np_copia: false,
          recom_personales_original: false,
          recom_personales_copia: false,
          recom_laborales_original: false,
          recom_laborales_copia: false,
          carta_baja_laboral_original: false,
          carta_baja_laboral_copia: false,
          cartilla_smn_original: false,
          cartilla_smn_copia: false,
          certificado_medico_original: false,
          certificado_medico_copia: false,
          alta_imss_original: false,
          alta_imss_copia: false,
          ine_original: false,
          ine_copia: false,
          curp_original: false,
          curp_copia: false,
          rfc_original: false,
          rfc_copia: false,
          infonavit_original: false,
          infonavit_copia: false,
          licencia_original: false,
          licencia_copia: false,
          reconocimiento_original: false,
          reconocimiento_copia: false
        };
      } else {
        console.error('Error cargando documentación:', error);
        this.toastr.error('Error al cargar la documentación del empleado', 'Error', {
          timeOut: 5000,
          positionClass: 'toast-top-right',
          closeButton: true
        });
      }
    } finally {
      this.isLoadingDocumentation = false;
    }
  }

  /**
   * Guardar o actualizar la documentación del empleado
   */
  async saveDocumentation(): Promise<void> {
    console.log("Guardar documentación");
    if (!this.its) {
      this.toastr.warning('No hay ITS disponible para guardar la documentación', 'Advertencia', {
        timeOut: 5000,
        positionClass: 'toast-top-right',
        closeButton: true
      });
      return;
    }

    this.isSavingDocumentation = true;

    try {
      // Preparar el payload
      const payload: EmployeeDocumentation = {
        employee_its: this.its,
        solicitud_empleo_original: this.documentation.solicitud_empleo_original || false,
        solicitud_empleo_copia: this.documentation.solicitud_empleo_copia || false,
        acta_nacimiento_original: this.documentation.acta_nacimiento_original || false,
        acta_nacimiento_copia: this.documentation.acta_nacimiento_copia || false,
        comprobante_estudios_original: this.documentation.comprobante_estudios_original || false,
        comprobante_estudios_copia: this.documentation.comprobante_estudios_copia || false,
        comprobante_domicilio_original: this.documentation.comprobante_domicilio_original || false,
        comprobante_domicilio_copia: this.documentation.comprobante_domicilio_copia || false,
        carta_antecedentes_np_original: this.documentation.carta_antecedentes_np_original || false,
        carta_antecedentes_np_copia: this.documentation.carta_antecedentes_np_copia || false,
        recom_personales_original: this.documentation.recom_personales_original || false,
        recom_personales_copia: this.documentation.recom_personales_copia || false,
        recom_laborales_original: this.documentation.recom_laborales_original || false,
        recom_laborales_copia: this.documentation.recom_laborales_copia || false,
        carta_baja_laboral_original: this.documentation.carta_baja_laboral_original || false,
        carta_baja_laboral_copia: this.documentation.carta_baja_laboral_copia || false,
        cartilla_smn_original: this.documentation.cartilla_smn_original || false,
        cartilla_smn_copia: this.documentation.cartilla_smn_copia || false,
        certificado_medico_original: this.documentation.certificado_medico_original || false,
        certificado_medico_copia: this.documentation.certificado_medico_copia || false,
        alta_imss_original: this.documentation.alta_imss_original || false,
        alta_imss_copia: this.documentation.alta_imss_copia || false,
        ine_original: this.documentation.ine_original || false,
        ine_copia: this.documentation.ine_copia || false,
        curp_original: this.documentation.curp_original || false,
        curp_copia: this.documentation.curp_copia || false,
        rfc_original: this.documentation.rfc_original || false,
        rfc_copia: this.documentation.rfc_copia || false,
        infonavit_original: this.documentation.infonavit_original || false,
        infonavit_copia: this.documentation.infonavit_copia || false,
        licencia_original: this.documentation.licencia_original || false,
        licencia_copia: this.documentation.licencia_copia || false,
        reconocimiento_original: this.documentation.reconocimiento_original || false,
        reconocimiento_copia: this.documentation.reconocimiento_copia || false
      };

      // Verificar si ya existe documentación
      let response;
      try {
        const existingDoc = await this.documentationService.getByIts(this.its);
        // Si existe, actualizar
        if (existingDoc.success && existingDoc.data) {
          response = await this.documentationService.update(this.its, payload);
          this.toastr.success('Documentación actualizada correctamente', 'Éxito', {
            timeOut: 3000,
            positionClass: 'toast-top-right',
            closeButton: true
          });
        }
      } catch (error: any) {
        // Si no existe (error 404), crear nueva
        if (error?.status === 404) {
                    console.log("actualizar");

          response = await this.documentationService.create(payload);
          this.toastr.success('Documentación creada correctamente', 'Éxito', {
            timeOut: 3000,
            positionClass: 'toast-top-right',
            closeButton: true
          });
        } else {
          throw error;
        }
      }

      // Recargar la documentación
      await this.loadEmployeeDocumentation();

    } catch (error: any) {
      console.error('Error guardando documentación:', error);
      this.toastr.error(
        error?.error?.message || 'Error al guardar la documentación. Por favor, intenta de nuevo.',
        'Error',
        {
          timeOut: 5000,
          positionClass: 'toast-top-right',
          closeButton: true
        }
      );
    } finally {
      console.log("Finalizando guardado de documeaaaantación");
      this.isSavingDocumentation = false;
    }
  }
}

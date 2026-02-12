import { CommonModule } from '@angular/common';
import { Component, computed, effect, EventEmitter, inject, Input, isSignal, OnInit, Output, Signal } from '@angular/core';
import { AbstractControl, AbstractControlOptions, FormArray, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { Fluid } from 'primeng/fluid';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { DatePicker } from 'primeng/datepicker';
import { CourtEntryService } from '@/services/court-entry.service';
import { TextareaModule } from 'primeng/textarea';
import { PeopleComponent } from '@/components/people/people.component';
import { CatalogList } from '@/api/catalog-list';
import { toSignal } from '@angular/core/rxjs-interop';
import { AudiencesService } from '@/services/audiences.service';
import { catchError, forkJoin, of } from 'rxjs';
import { MiscService } from '@/services/misc.service';
import { ServicesService } from '@/services/services.service';
import { Service } from '@/api/service';
import { OffendersService } from '@/services/offenders.service';
import { map, switchMap } from 'rxjs/operators';
import { AccordionModule } from 'primeng/accordion';
import { BadgeModule } from 'primeng/badge';
import { PeopleService } from '@/services/people.service';
import { People } from '@/api/people';
import { VehiclesService } from '@/services/vehicles.service';
import { Vehicle } from '@/api/vehicle';

@Component({
    selector: 'app-form-court-entry',
    templateUrl: './form-court-entry.component.html',
    imports: [CommonModule, ButtonModule, InputTextModule, ToastModule, ReactiveFormsModule, FormsModule, Fluid, TableModule, MessageModule, CardModule, SelectModule, DatePicker, TextareaModule, PeopleComponent, AccordionModule, BadgeModule],
    standalone: true
})
export class FormCourtEntryComponent implements OnInit {
    private formBuilder: FormBuilder = inject(FormBuilder);
    private router: Router = inject(Router);
    private route: ActivatedRoute = inject(ActivatedRoute);
    private messageService: MessageService = inject(MessageService);
    private courtEntryService: CourtEntryService = inject(CourtEntryService);
    private serviceService: ServicesService = inject(ServicesService);
    private offenderService: OffendersService = inject(OffendersService);
    private miscService: MiscService = inject(MiscService);
    private peopleService: PeopleService = inject(PeopleService);
    private vehicleService: VehiclesService = inject(VehiclesService);
    private formOptions: AbstractControlOptions = { validators: this.duplicateItem() };
    protected readonly isSignal = isSignal;
    readonly witnessSchema = {};
    service: Service;
    affected: People[];
    offenders: People[];
    offenderId: string;
    vehicle: Vehicle;
    form: FormGroup = this.formBuilder.group(
        {
            idCourtEntry: [null, [Validators.required]], // UUID usualmente es requerido
            startDate: [null],
            endDate: [null, [Validators.required]],
            sentence: [null, [Validators.required, Validators.maxLength(255)]],
            civilJudge: [null, [Validators.required, Validators.maxLength(150)]],
            secretary: [null, [Validators.required]],
            sanction: [null],
            sanctionVariant: [null],
            description: [null],
            observations: [null],
            witnesses: this.formBuilder.array([])
        },
        this.formOptions
    );
    formCourtEntry: FormGroup = this.formBuilder.group({
        entryDate: [null, [Validators.required]],
        offensives: this.formBuilder.array([])
    });
    listSentence = [
        {
            label: 'PROCEDENTE',
            value: 'procedente'
        },
        {
            label: 'IMPROCEDENTE',
            value: 'improcedente'
        }
    ];
    sentenceValue = toSignal<string | null>(this.form.get('sentence')!.valueChanges, {
        initialValue: this.form.get('sentence')?.value
    });
    sanctionSignal: Signal<CatalogList[] | []> = computed(() => {
        const id: string = this.sentenceValue();
        if (id && id === 'procedente') {
            return [
                { label: 'AMONESTACIÓN', value: 'amonestación' },
                { label: 'MULTA', value: 'multa' },
                { label: 'ARRESTO', value: 'arresto' },
                { label: 'MEDIDAS PARA MEJORAR LA CONVIVENCIA', value: 'medidas para mejorar la convivencia' },
                { label: 'MENOR', value: 'menor' }
            ];
        }
        return [];
    });
    //controlar si el control está habilitado o no dependiendo del valor de brands
    manageSanctionValueStatus = effect(() => {
        const list = this.sanctionSignal();
        const control = this.form.get('sanction');
        if (list && list.length > 0) {
            control?.enable({ emitEvent: false });
        } else {
            control?.disable({ emitEvent: false });
            control?.setValue(null, { emitEvent: false });
        }
    });
    sanctionValue = toSignal<string | null>(this.form.get('sanction')!.valueChanges, {
        initialValue: this.form.get('sanction')?.value
    });
    sanctionVariantSignal: Signal<CatalogList[] | []> = computed(() => {
        const id: string = this.sanctionValue();
        if (id && id === 'amonestación') {
            return [
                { label: 'PUBLICA', value: 'publica' },
                {
                    label: 'PRIVADA',
                    value: 'privada'
                }
            ];
        } else if (id && id === 'multa') {
            return [{ label: 'CAMPO ABIERTO', value: 'campo abierto' }];
        } else if (id && id === 'arresto') {
            var i = 0;
            var array: CatalogList[] = [];
            while (i < 37) {
                array.push({
                    label: i + ' HORA(S)',
                    value: i + ' hora(s)'
                });
                i += 1;
            }
            return array;
        } else if (id && id === 'medidas para mejorar la convivencia') {
            return [{ label: 'TRABAJO EN FAVOR DE LA COMUNIDAD', value: 'trabajo en favor de la comunidad' }];
        } else if (id && id === 'menor') {
            return [
                { label: 'SANCION PADRE', value: 'sancion padre' },
                {
                    label: 'SANCION MENOR',
                    value: 'sancion menor'
                }
            ];
        }
        return [];
    });
    manageSanctionVariantValueStatus = effect(() => {
        const list = this.sanctionVariantSignal();
        const listSentence = this.sanctionSignal();
        const lists = list.length > 0 && listSentence.length > 0;
        const control = this.form.get('sanctionVariant');
        if (lists) {
            control?.enable({ emitEvent: false });
        } else {
            control?.disable({ emitEvent: false });
            control?.setValue(null, { emitEvent: false });
        }
    });
    formFields = [
        {
            id: 'startDate',
            controlName: 'startDate',
            label: 'Fecha de Inicio',
            type: 'date'
        },
        {
            id: 'endDate',
            controlName: 'endDate',
            label: 'Fecha de Fin',
            type: 'date'
        },
        {
            id: 'civilJudge',
            controlName: 'civilJudge',
            label: 'Juez Cívico',
            type: 'text',
            maxLength: 150
        },
        {
            id: 'secretary',
            controlName: 'secretary',
            label: 'Secretario',
            type: 'text',
            maxLength: 150
        },
        {
            id: 'sentence',
            controlName: 'sentence',
            label: 'Sentencia',
            type: 'list',
            options: this.listSentence
        },
        {
            id: 'sanction',
            controlName: 'sanction',
            label: 'Sanción',
            type: 'list',
            options: this.sanctionSignal
        },
        {
            id: 'sanctionVariant',
            controlName: 'sanctionVariant',
            label: 'Variante de Sanción',
            type: 'list',
            options: this.sanctionVariantSignal
        },
        {
            type: 'invisible'
        },
        {
            id: 'description',
            controlName: 'description',
            label: 'Descripción Detallada',
            type: 'textarea'
        },
        {
            id: 'observations',
            controlName: 'observations',
            label: 'Observaciones',
            type: 'textarea'
        }
    ];
    _id: string | undefined;
    @Input() set id(value: string | undefined) {
        if (value) {
            this.miscService.startRequest();
            this._id = value;
            forkJoin({
                audience: this.audienceService.getByCourtEntryId(this.id),
                courtEntry: this.courtEntryService.getById(this.id)
            }).subscribe({
                next: (data) => {
                    if (data.audience) {
                        if (data.audience.witnesses && data.audience['witnesses'].length > 0) this.syncFormArrays(data.audience);
                        const cleanData = this.convertStringsToDates(data.audience);
                        this.form.patchValue(cleanData);
                    } else {
                        this.messageService.add({ severity: 'error', key: 'msg', summary: 'No se pudo encontrar el registro de la corte', life: 3000 });
                    }
                    if (data.courtEntry) {
                        if (data.courtEntry.offensives && data.courtEntry['offensives'].length > 0) this.syncFormArrays(data.courtEntry);
                        const cleanData = this.convertStringsToDates(data.courtEntry);
                        this.formCourtEntry.patchValue(cleanData);
                    } else {
                        this.messageService.add({ severity: 'error', key: 'msg', summary: 'No se pudo encontrar el registro de la corte', life: 3000 });
                    }
                    this.miscService.endRquest();
                },
                error: (error) => {
                    this.miscService.endRquest();
                    this.messageService.add({
                        key: 'msg',
                        severity: 'error',
                        detail: 'Error al guardar la corte, error: ' + error.error.message,
                        life: 3000
                    });
                }
            });
        }
    }
    @Output()
    formEmitted = new EventEmitter<{ formAudience; formCourtEntry }>();
    private audienceService: AudiencesService = inject(AudiencesService);
    get id(): string | undefined {
        return this._id;
    }
    constructor() {}
    ngOnInit() {
        this.miscService.startRequest();
        //puede recibir el id de la edición o el id de añadir
        var courtEntry: string = this.route.snapshot.params['idCourtEntry'] || this.route.snapshot.params['id'];
        //cuando se agrega
        if (courtEntry) {
            this.form.get('idCourtEntry').setValue(courtEntry);
        }
        this.loadCatalogs(courtEntry);
    }
    loadCatalogs(courtEntry:string) {
        this.courtEntryService
            .getById(courtEntry)
            .pipe(
                // 1. Obtener Court Entry
                switchMap((courtEntry) => {
                    if (!courtEntry) return of(null);
                    return this.offenderService.getById(courtEntry.idOffender);
                }),
                //Service
                switchMap((offender) => {
                    if (!offender || !offender.id_service) return of({ offender, service: null });

                    return this.serviceService.getById(offender.id_service).pipe(
                        // Usamos map para devolver AMBOS: el ofensor y el servicio
                        map((service) => ({ offender, service }))
                    );
                }),
                //Vehicle
                switchMap((data) => {
                    const involved = data.service?.involvedVehicle;
                    if (!involved?.idVehicle) return of({ ...data, vehicle: null });

                    return this.vehicleService.getById(involved.idVehicle).pipe(
                        map((vehicleDetail) => ({
                            ...data,
                            // Mezclamos: id, theftReport, deposit + marca, modelo, placas, etc.
                            vehicle: {
                                ...involved,
                                ...vehicleDetail
                            }
                        })),
                        catchError(() => of({ ...data, vehicle: involved })) // Si falla el catálogo, dejamos al menos la info del servicio
                    );
                }),
                // Personas
                switchMap((data) => {
                    if (!data || !data.service) return of(data);
                    // Guardamos los arreglos originales de la relación para mapearlos después
                    const originalAffectedRel = data.service.affected || [];
                    const originalOffendersRel = data.service.offenders || [];
                    const affectedRequests = originalAffectedRel.map((a: any) => this.peopleService.getById(a.idPeople).pipe(catchError(() => of(null))));
                    const offenderRequests = originalOffendersRel.map((o: any) => this.peopleService.getById(o.idPeople).pipe(catchError(() => of(null))));
                    if (affectedRequests.length === 0 && offenderRequests.length === 0) {
                        return of({ ...data, affected: [], offenders: [] });
                    }
                    return forkJoin({
                        affectedPeople: affectedRequests.length ? forkJoin(affectedRequests) : of([]),
                        offenderPeople: offenderRequests.length ? forkJoin(offenderRequests) : of([])
                    }).pipe(
                        map((res: { affectedPeople: any[]; offenderPeople: any[] }) => ({
                            ...data,
                            affected: originalAffectedRel
                                .map((rel, index) => ({
                                    ...rel,
                                    ...res.affectedPeople[index]
                                }))
                                .filter((p) => p.firstName),

                            offenders: originalOffendersRel
                                .map((rel, index) => ({
                                    ...rel,
                                    ...res.offenderPeople[index]
                                }))
                                .filter((p) => p.firstName)
                        }))
                    );
                })
            )
            .subscribe({
                next: (finalData: any) => {
                    if (finalData) {
                        this.service = finalData.service;
                        this.affected = finalData.affected;
                        this.offenders = finalData.offenders;
                        this.vehicle=finalData.vehicle;
                    }
                    this.miscService.endRquest();
                },
                error: (error) => {
                    this.miscService.endRquest();
                }
            });
    }
    private syncFormArrays(data: any) {
        if (data.witnesses) {
            const array = this.getWitnessArray();
            array.clear();
            data.witnesses.forEach(() => {
                array.push(this.addWitness());
            });
        }
        if (data.offensives) {
            const array = this.getOffensiveArray();
            array.clear();
            data.offensives.forEach(() => {
                array.push(this.addOffensive());
            });
        }
    }
    duplicateItem(): ValidatorFn {
        return (control: AbstractControl): ValidationErrors | null => {
            const formGroup = control as FormGroup;
            const uniqueValues = new Set<string>();
            let hasDuplicate = false;
            const fields = ['witnesses'];
            fields.forEach((field) => {
                const array = formGroup.get(field);
                if (array && array.value) {
                    array.value.forEach((item: any) => {
                        const itemId = item.idPeople;
                        if (itemId) {
                            if (uniqueValues.has(itemId)) {
                                hasDuplicate = true;
                            } else {
                                uniqueValues.add(itemId);
                            }
                        }
                    });
                }
            });
            return hasDuplicate ? { duplicateItem: true } : null;
        };
    }
    private convertStringsToDates(obj: any): any {
        if (obj === null || typeof obj !== 'object') {
            return obj;
        }
        if (Array.isArray(obj)) {
            return obj.map((item) => this.convertStringsToDates(item));
        }
        // Si es un objeto, iteramos sus llaves
        const processedObj: any = {};
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                const value = obj[key];

                // Validamos si el string tiene formato de fecha ISO
                if (typeof value === 'string' && this.isIsoDateString(value)) {
                    processedObj[key] = new Date(value);
                } else if (typeof value === 'object') {
                    // Llamada recursiva para objetos anidados o arreglos
                    processedObj[key] = this.convertStringsToDates(value);
                } else {
                    processedObj[key] = value;
                }
            }
        }
        return processedObj;
    }
    // Helper para detectar formato ISO (2026-01-23T18...)
    private isIsoDateString(value: string): boolean {
        const isoRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;
        return isoRegex.test(value);
    }
    getPeople(data: any, index: number, array: FormArray) {
        const group = array.at(index);
        //se añade nuevo valor
        if (data) {
            group.get('idPeople')?.setValue(data.id);
        }
        //se borra el valor de persona desde el front
        else {
            group.get('id')?.setValue(null);
            group.get('idPeople')?.setValue(null);
        }
    }
    getWitnessArray(): FormArray {
        return this.form.get('witnesses') as FormArray;
    }
    addWitness() {
        return this.formBuilder.group({
            id: [null],
            idPeople: [null]
        });
    }
    getOffensiveArray(): FormArray {
        return this.formCourtEntry.get('offensives') as FormArray;
    }
    addOffensive() {
        return this.formBuilder.group({
            type: [null],
            factor: [null]
        });
    }
    removeRow(array: FormArray, index: number) {
        array.removeAt(index);
    }
    addRow(array: any, newRow: any) {
        array.push(newRow);
    }
    onSubmit() {
        if (this.form.invalid) {
            this.messageService.add({
                key: 'msg',
                severity: 'error',
                detail: 'Formulario inválido',
                life: 3000
            });
            return;
        }
        let fields: [string] = ['witnesses'];
        let properties = this.form.value;
        var propertiesCourtEntry = this.formCourtEntry.value;
        this.deleteIdArray(fields, properties);
        fields = ['offensives'];
        this.deleteIdArray(fields, propertiesCourtEntry);
        this.formEmitted.emit({
            formAudience: properties,
            formCourtEntry: propertiesCourtEntry
        });
    }
    deleteIdArray(fields, properties) {
        fields.forEach((field) => {
            properties[field].forEach((anidateField) => {
                //si viene el id nulo, indica que es nuevo el registro
                if (anidateField.id === null || anidateField.id === '') {
                    delete anidateField.id;
                }
            });
        });
    }
    onCancel(event) {
        event.preventDefault();
        this.router.navigate(['/court-entry']);
    }
}

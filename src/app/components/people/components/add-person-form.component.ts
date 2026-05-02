import { AddressesComponent } from "@/components/addresses/addresses.component";
import { CommonModule } from "@angular/common";
import { ChangeDetectionStrategy, Component, input, output } from "@angular/core";
import { FormArray, FormGroup, ReactiveFormsModule } from "@angular/forms";
import { ButtonModule } from "primeng/button";
import { CardModule } from "primeng/card";
import { DatePicker } from "primeng/datepicker";
import { InputTextModule } from "primeng/inputtext";
import { MessageModule } from "primeng/message";
import { SelectModule } from "primeng/select";
import { Tooltip } from "primeng/tooltip";
import { ADD_PERSON_FIELDS, FingerKey, FingerThumbnail, FormFieldConfig, LEFT_FINGER_THUMBNAILS, RIGHT_FINGER_THUMBNAILS, TenFingerCapture } from "../models";
import { PhotoType } from "../people.component";

export interface AddressSelectedEvent{
    data: { id: string } | null;
    index: number;
    formArray: FormArray;
}

@Component({
    selector: 'app-add-person-form',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        ButtonModule,
        CardModule,
        DatePicker,
        InputTextModule,
        MessageModule,
        SelectModule,
        Tooltip,
        AddressesComponent
    ],
    templateUrl: './add-person-form.component.html'
})
export class AddPersonFormComponent{
    // Formulario
    readonly form = input.required<FormGroup>();
    readonly addressFormArray = input.required<FormArray>();

    // Huellas
    readonly enrolledFingers = input.required<TenFingerCapture>();
    readonly enrolledFingersCount = input.required<number>();
    readonly hasLeftHandFingers = input.required<boolean>();
    readonly hasRightHandFingers = input.required<boolean>();

    // Fotos
    readonly showPhotosSection = input.required<boolean>();
    readonly faceEnrollFrontPreview = input<string | null>(null);
    readonly faceEnrollLeftProfilePreview = input<string | null>(null);
    readonly faceEnrollRightProfilePreview = input<string | null>(null);

    // Eventos
    readonly enrollDialogOpen = output<void>();
    readonly fingerRemoved = output<FingerKey>();
    readonly photosSectionToggle = output<void>();
    readonly photoSelected = output<{ event: Event; type: PhotoType}>();
    readonly photoRemoved = output<PhotoType>();
    readonly addressSelected = output<AddressSelectedEvent>()
    readonly addressAdded = output<FormArray>();
    readonly addressRemoved = output<{ formArray: FormArray; index: number}>();
    readonly saveRequested = output<void>();

    // Constantes
    readonly addPersonFields: FormFieldConfig[] = ADD_PERSON_FIELDS;
    readonly leftFingerThumbnails: FingerThumbnail[] = LEFT_FINGER_THUMBNAILS;
    readonly rightFingerThumbnails: FingerThumbnail[] = RIGHT_FINGER_THUMBNAILS;

    getEnrolledFingerImage(fingerKey: FingerKey): string{
        return this.enrolledFingers()[fingerKey] ?? '';
    }
}

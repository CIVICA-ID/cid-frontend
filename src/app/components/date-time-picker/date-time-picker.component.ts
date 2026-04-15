import { CommonModule } from '@angular/common';
import { Component, forwardRef, Input } from '@angular/core';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';
import { DatePicker } from 'primeng/datepicker';

@Component({
    selector: 'app-date-time-picker',
    standalone: true,
    imports: [CommonModule, FormsModule, DatePicker],
    template: `
        <p-datepicker
            [inputId]="inputId"
            [ngModel]="value"
            (ngModelChange)="handleChange($event)"
            [showTime]="true"
            [hourFormat]="'24'"
            [showIcon]="showIcon"
            [fluid]="fluid"
            [appendTo]="appendTo"
            [placeholder]="placeholder"
            [disabled]="disabled"
            [inputStyleClass]="invalid ? 'ng-invalid ng-dirty' : ''"
        />
    `,
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => DateTimePickerComponent),
            multi: true
        }
    ]
})
export class DateTimePickerComponent implements ControlValueAccessor {
    @Input() inputId = '';
    @Input() placeholder = 'Seleccionar fecha y hora';
    @Input() showIcon = true;
    @Input() fluid = true;
    @Input() appendTo: string | HTMLElement | null = null;
    @Input() invalid = false;

    value: Date | null = null;
    disabled = false;

    private onChange: (value: Date | null) => void = () => {};
    private onTouched: () => void = () => {};

    writeValue(value: Date | null): void {
        this.value = value;
    }

    registerOnChange(fn: (value: Date | null) => void): void {
        this.onChange = fn;
    }

    registerOnTouched(fn: () => void): void {
        this.onTouched = fn;
    }

    setDisabledState(isDisabled: boolean): void {
        this.disabled = isDisabled;
    }

    handleChange(value: Date | null): void {
        this.value = value;
        this.onChange(value);
        this.onTouched();
    }
}

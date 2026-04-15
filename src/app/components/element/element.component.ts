import { CommonModule } from '@angular/common';
import { Component, Input, input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';

@Component({
    selector: 'app-element',
    templateUrl: './element.component.html',
    imports: [CommonModule, CardModule, FormsModule, ReactiveFormsModule, InputTextModule],
    standalone: true
})
export class ElementComponent implements OnInit {
    @Input() form!: FormGroup;
    constructor() {}

    ngOnInit() {
    }
}

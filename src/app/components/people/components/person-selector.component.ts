import { People } from "@/api/people";
import { CommonModule } from "@angular/common";
import { ChangeDetectionStrategy, Component, computed, input, output } from "@angular/core";
import { ButtonModule } from "primeng/button";
import { TableModule } from "primeng/table";
import { Tooltip } from "primeng/tooltip";


@Component({
    selector: 'app-person-selector',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [CommonModule, ButtonModule, TableModule, Tooltip],
    templateUrl: './person-selector.component.html'
})
export class PersonSelectorComponent{
    readonly selectedPerson = input<People | null>(null);

    readonly search = output<void>();
    readonly remove = output<void>();

    readonly displayName = computed(() => {
        const person = this.selectedPerson();
        if(!person) return 'Seleccionar Persona';
        return [person.firstName, person.paternalName, person.maternalName]
            .filter(Boolean)
            .join(' ');
    });
}

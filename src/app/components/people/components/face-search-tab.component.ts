import { CommonModule } from "@angular/common";
import { ChangeDetectionStrategy, Component, input, output } from "@angular/core";
import { ButtonModule } from "primeng/button";
import { MathResultCardComponent } from "../shared/match-result-card.component";
import { FaceSearchResult } from "@/services/face-recognition.service";


@Component({
    selector: 'app-face-search-tab',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [CommonModule, ButtonModule, MathResultCardComponent],
    templateUrl: './face-search-tab.component.html'
})
export class FaceSearchTabComponent{
    // Estado
    readonly step = input.required<number>();
    readonly previewUrl = input.required<string | null>();
    readonly isLoading = input.required<boolean>();
    readonly searchResult = input.required<FaceSearchResult | null>();
    readonly searchError = input.required<string>();
    readonly noMatchFound = input.required<boolean>();
    readonly isAwaitingConfirmation = input.required<boolean>();

    // Eventos
    readonly fileSelected = output<Event>();
    readonly searchRequested = output<void>();
    readonly matchConfirmed = output<boolean>();
    readonly addPersonRequested = output<void>();
    readonly backFromAdd = output<void>();
}

import { CommonModule } from "@angular/common";
import { ChangeDetectionStrategy, Component, input, output } from "@angular/core";
import { ButtonModule } from "primeng/button";
import { MathResultCardComponent } from "../shared/match-result-card.component";
import { MatchResult, SearchFingerType } from "@/services/fingerprint.service";
import { FingerSearchOption, LEFT_FINGER_SEARCH_OPTIONS, RIGHT_FINGER_SEARCH_OPTIONS } from "../models";
import { formatElapsedTime, getScoreColorClass } from '../models/fingerprint.models';


@Component({
    selector: 'app-fingerprint-search-tab',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [CommonModule, ButtonModule, MathResultCardComponent],
    templateUrl: './fingerprint-search-tab.component.html'
})
export class FingerprintSearchTabComponent{
    // Estado
    readonly step = input.required<number>();
    readonly selectedFinger = input.required<SearchFingerType | null>();
    readonly selectedFingerLabel = input.required<string | null>();
    readonly previewUrl = input.required<string | null>();
    readonly isLoading = input.required<boolean>();
    readonly searchResult = input.required<MatchResult | null>();
    readonly searchError = input.required<string>();
    readonly isAwaitingConfirmation = input.required<boolean>();
    readonly noMatchFound = input.required<boolean>();

    // Eventos
    readonly fingerSelected = output<string>();
    readonly captureRequested = output<void>();
    readonly fileSelected = output<Event>();
    readonly searchRequested = output<void>();
    readonly matchConfirmed = output<boolean>();
    readonly addPersonRequested = output<void>();
    readonly backFromAdd = output<void>();

    // Constantes
    readonly leftFingerOptions: FingerSearchOption[] = LEFT_FINGER_SEARCH_OPTIONS;
    readonly rightFingerOptions: FingerSearchOption[] = RIGHT_FINGER_SEARCH_OPTIONS;

    getScoreColor(score: number): string{
        return getScoreColorClass(score);
    }

    formatTime(ms: number): string{
        return formatElapsedTime(ms);
    }
}

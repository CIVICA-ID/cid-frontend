import {Component} from '@angular/core';

@Component({
    selector: '[app-footer]',
    standalone: true,
    template: `
        <div class="layout-footer">
            <div class="footer-logo-container">
                <img src="/logos_blanco_negro/logo3x.png" alt="CIVICA ID Logo"/>
                <span class="footer-app-name">CIVICA ID</span>
            </div>
            <span class="footer-copyright">&#169; {{ currentYear }} CIVICA ID</span>
        </div>
    `
})
export class AppFooter {
    currentYear = new Date().getFullYear();
}

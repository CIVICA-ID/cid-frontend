import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { PageTitleComponent } from '@shared/page-title/page-title.component';
import { LUCIDE_ICONS, LucideAngularModule, LucideIconProvider, icons } from 'lucide-angular';
import { Router, ActivatedRoute } from '@angular/router';
import { EmployeeService } from "../module/service";
import { EmployeeDocumentationService, EmployeeDocumentation } from '../../employee-documentation/employee-documentation.service';

@Component({
  selector: 'app-employee-view',
  standalone: true,
  imports: [
    CommonModule,
    PageTitleComponent,
    LucideAngularModule
  ],
  templateUrl: './template.html',
  styles: ``,
  providers: [
    { provide: LUCIDE_ICONS, multi: true, useValue: new LucideIconProvider(icons) },
    EmployeeService,
    EmployeeDocumentationService
  ]
})
export class ViewComponent implements OnInit {
  employee: any = null;
  employeeId: number | null = null;
  loading = true;
  error = false;
  activeTab: 'general' | 'contratacion' | 'domicilio' | 'documentacion' = 'general';
  documentation: EmployeeDocumentation | null = null;
  isLoadingDocumentation = false;

  private employeeService = inject(EmployeeService);
  private documentationService = inject(EmployeeDocumentationService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.employeeId = Number(params['id']);
        this.loadEmployee(this.employeeId);
      } else {
        this.router.navigate(['/hr/employee']);
      }
    });
  }

  async loadEmployee(employeeId: number) {
    try {
      this.loading = true;
      this.error = false;

      const response = await this.employeeService.getProfileById(employeeId);

      if (response?.success && response?.data.data) {
        this.employee = response.data.data;
        // Cargar documentación si el empleado tiene ITS
        if (this.employee.its) {
          await this.loadDocumentation(this.employee.its);
        }
      } else {
        this.error = true;
      }
    } catch (error) {
      console.error('Error loading employee:', error);
      this.error = true;
    } finally {
      this.loading = false;
    }
  }

  editEmployee() {
    if (this.employeeId) {
      this.router.navigate(['/hr/employee/edit', this.employeeId]);
    }
  }

  backToList() {
    this.router.navigate(['/hr/employee']);
  }

  setActiveTab(tab: 'general' | 'contratacion' | 'domicilio' | 'documentacion') {
    this.activeTab = tab;
  }

  // Utility methods for display
  formatDate(dateString: string): string {
    if (!dateString) return 'No especificado';
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? 'No especificado' : date.toLocaleDateString('es-ES');
  }

  formatValue(value: any): string {
    if (value === null || value === undefined || value === '') {
      return 'No especificado';
    }
    return String(value);
  }

  formatBoolean(value: any): string {
    if (value === true || value === 'true' || value === '1' || value === 1 || (typeof value === 'string' && value.toUpperCase() === 'SI')) {
      return 'Sí';
    } else if (value === false || value === 'false' || value === '0' || value === 0 || (typeof value === 'string' && value.toUpperCase() === 'NO')) {
      return 'No';
    }
    return 'No especificado';
  }

  // Métodos para documentación
  async loadDocumentation(its: string): Promise<void> {
    this.isLoadingDocumentation = true;

    try {
      const response = await this.documentationService.getByIts(its);

      if (response.success && response.data) {
        this.documentation = response.data;
      } else {
        // No existe documentación, inicializar vacío
        this.documentation = null;
      }
    } catch (error: any) {
      // Si el error es 404, significa que no existe documentación (normal)
      if (error?.status === 404) {
        this.documentation = null;
      } else {
        console.error('Error loading documentation:', error);
        this.documentation = null;
      }
    } finally {
      this.isLoadingDocumentation = false;
    }
  }

  getDocumentsList() {
    return [
      { key: 'solicitud_empleo', label: '1. Solicitud de empleo' },
      { key: 'acta_nacimiento', label: '2. Acta de nacimiento' },
      { key: 'comprobante_estudios', label: '3. Comprobante de estudios' },
      { key: 'comprobante_domicilio', label: '4. Comprobante de domicilio' },
      { key: 'carta_antecedentes_np', label: '5. Carta de antecedentes no penales' },
      { key: 'recom_personales', label: '6. Recomendaciones personales' },
      { key: 'recom_laborales', label: '7. Recomendaciones laborales' },
      { key: 'carta_baja_laboral', label: '8. Carta de baja laboral' },
      { key: 'cartilla_smn', label: '9. Cartilla del Servicio Militar Nacional' },
      { key: 'certificado_medico', label: '10. Certificado médico' },
      { key: 'alta_imss', label: '11. Alta IMSS' },
      { key: 'ine', label: '12. INE' },
      { key: 'curp', label: '13. CURP' },
      { key: 'rfc', label: '14. RFC' },
      { key: 'infonavit', label: '15. Crédito Infonavit' },
      { key: 'licencia', label: '16. Licencia de conducir' },
      { key: 'reconocimiento', label: '17. Reconocimientos' }
    ];
  }

  hasOriginal(key: string): boolean {
    if (!this.documentation) return false;
    return (this.documentation as any)[`${key}_original`] === true;
  }

  hasCopy(key: string): boolean {
    if (!this.documentation) return false;
    return (this.documentation as any)[`${key}_copia`] === true;
  }

  getCompletedCount(): number {
    if (!this.documentation) return 0;

    const fields = [
      'solicitud_empleo_original', 'solicitud_empleo_copia',
      'acta_nacimiento_original', 'acta_nacimiento_copia',
      'comprobante_estudios_original', 'comprobante_estudios_copia',
      'comprobante_domicilio_original', 'comprobante_domicilio_copia',
      'carta_antecedentes_np_original', 'carta_antecedentes_np_copia',
      'recom_personales_original', 'recom_personales_copia',
      'recom_laborales_original', 'recom_laborales_copia',
      'carta_baja_laboral_original', 'carta_baja_laboral_copia',
      'cartilla_smn_original', 'cartilla_smn_copia',
      'certificado_medico_original', 'certificado_medico_copia',
      'alta_imss_original', 'alta_imss_copia',
      'ine_original', 'ine_copia',
      'curp_original', 'curp_copia',
      'rfc_original', 'rfc_copia',
      'infonavit_original', 'infonavit_copia',
      'licencia_original', 'licencia_copia',
      'reconocimiento_original', 'reconocimiento_copia'
    ];

    return fields.filter(field => (this.documentation as any)[field] === true).length;
  }

  getTotalCount(): number {
    return 34; // 17 documentos × 2 (original + copia)
  }

  getCompletionPercentage(): number {
    return Math.round((this.getCompletedCount() / this.getTotalCount()) * 100);
  }
}

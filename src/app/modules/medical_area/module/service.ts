import { Injectable, inject } from "@angular/core";
import { ServiceService, ApiResponse } from "@/services/service.service";

export interface Interface {
  id: number;
  // Agrega aquí los campos de tu entidad
}

export interface InterfaceFilters {
  search?: string;
  status?: string;
  // Agrega aquí los filtros que uses
}

@Injectable({
  providedIn: 'root'
})
export class Service {
  private readonly endpoint = "/name_module"; // Cambia esto por el endpoint real de tu API
  private readonly service = inject(ServiceService);

  getList(filters?: InterfaceFilters): Promise<ApiResponse<Interface[]>> {
    return this.service.fetch<Interface[]>(filters ?? {}, this.endpoint, 'get');
  }

  getById(id: number): Promise<ApiResponse<Interface>> {
    return this.service.fetch<Interface>({}, `${this.endpoint}/${id}`, 'get');
  }

  create(data: Partial<Interface>): Promise<ApiResponse<Interface>> {
    return this.service.fetch<Interface>(data, this.endpoint, 'post');
  }

  update(id: number, data: Partial<Interface>): Promise<ApiResponse<Interface>> {
    return this.service.fetch<Interface>(data, `${this.endpoint}/${id}`, 'patch');
  }

  delete(id: number): Promise<ApiResponse<void>> {
    return this.service.fetch<void>({}, `${this.endpoint}/${id}`, 'delete');
  }
}

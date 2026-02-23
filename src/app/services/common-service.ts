import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class CommonService {
  public isSidebarCollapsed: boolean = false;

  // Used to hide sidebar on specific routes
  public hideOtherInfo: boolean = false;

  constructor() {}

  // Toggle sidebar
  toggleSidebar(): void {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
  }

  // Force close sidebar
  closeSidebar(): void {
    this.isSidebarCollapsed = true;
  }

  // Force open sidebar
  openSidebar(): void {
    this.isSidebarCollapsed = false;
  }
  
}

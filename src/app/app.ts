import { Component, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { CommonService } from './services/common-service';
import { Header } from './layout/header/header';
import { Sidebar } from './layout/sidebar/sidebar';
import { Footer } from './layout/footer/footer';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet , Header, Sidebar, Footer],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  // protected readonly title = signal('Test');

  public isCollapsed: boolean = false;
  public siderWidth: number = 220;
  private resizing = false;
  public id = -1;

  private router = inject(Router);
  public _commonService = inject(CommonService);

  ngOnInit(): void {
    if (performance.navigation.type === 1) {
      this.router.navigate(['/']);
    }
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        const url = event.urlAfterRedirects || event.url;
        const isHomeRoute = url === '/' || url.toLowerCase().startsWith('/home');
        this._commonService.hideOtherInfo = !isHomeRoute;
      }
    });
  }

  startResize(): void {
    this.resizing = true;
  }

  onSideResize(event: MouseEvent): void {
    if (!this.resizing) return;

    cancelAnimationFrame(this.id);

    this.id = requestAnimationFrame(() => {
      this.siderWidth = event.clientX;
    });
  }

  stopResize(): void {
    this.resizing = false;
  }


}

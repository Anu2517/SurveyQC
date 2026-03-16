import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonService } from './services/common-service';
import { Header } from './layout/header/header';
import { Sidebar } from './layout/sidebar/sidebar';
import { Footer } from './layout/footer/footer';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Header, Sidebar, Footer],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  public isCollapsed = false;
  public siderWidth = 220;

  private resizing = false;
  private animationFrameId = -1;

  private router = inject(Router);
  private destroyRef = inject(DestroyRef);
  public commonService = inject(CommonService);

  ngOnInit(): void {
    const navEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (navEntry?.type === 'reload') {
      this.router.navigate(['/']);
    }

    this.router.events
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(event => {
        if (event instanceof NavigationEnd) {
          const url = event.urlAfterRedirects || event.url;
          const isHomeRoute = url === '/' || url.toLowerCase().startsWith('/home');
          this.commonService.hideOtherInfo = !isHomeRoute;
        }
      });
  }

  startResize(): void {
    this.resizing = true;
  }

  onSideResize(event: MouseEvent): void {
    if (!this.resizing) return;
    cancelAnimationFrame(this.animationFrameId);
    this.animationFrameId = requestAnimationFrame(() => {
      this.siderWidth = event.clientX;
    });
  }

  stopResize(): void {
    this.resizing = false;
  }
}

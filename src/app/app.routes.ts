import { Routes } from '@angular/router';

/**
 * Application routes with lazy loading for better performance
 * Main home page is eagerly loaded, while chart/report pages are lazy loaded
 */
export const routes: Routes = [
  {
    path: '',
    redirectTo: 'Home',
    pathMatch: 'full'
  },
  {
    path: 'Home',
    loadComponent: () => import('./Pages/home/home').then(m => m.Home)
  },
  {
    path: 'vendors-charts',
    loadComponent: () => import('./Pages/home/pie-chart/pie-chart').then(m => m.PieChart)
  },
  {
    path: 'error-summary',
    loadComponent: () => import('./Pages/home/error-summary-charts/error-summary-charts').then(m => m.ErrorSummaryCharts)
  },
  {
    path: 'view-report',
    loadComponent: () => import('./Pages/home/view-errorreport-summary/view-errorreport-summary').then(m => m.ViewErrorReportSummary)
  },
  {
    path: '**',
    redirectTo: 'Home'
  }
];

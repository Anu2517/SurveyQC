import { Routes } from '@angular/router';
import { Home } from './Pages/home/home';
import { PieChart } from './Pages/home/pie-chart/pie-chart';
import { ErrorSummaryCharts } from './Pages/home/error-summary-charts/error-summary-charts';
import { ViewErrorReportSummary } from './Pages/home/view-errorreport-summary/view-errorreport-summary';

export const routes: Routes = [
    { path: '', redirectTo: 'Home', pathMatch: 'full' },
    { path: 'Home', component: Home },
    { path: 'vendors-charts', component: PieChart},
    { path: 'error-summary', component: ErrorSummaryCharts},
    { path: 'view-report', component: ViewErrorReportSummary}
];

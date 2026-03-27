import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { EChartsOption } from 'echarts';
import { CommunicationService } from '../../../services/communication-service';
import { CommonService } from '../../../services/common-service';
import { Router } from '@angular/router';
import { SurveyError } from '../../../enums/SurveyError';
import { SurveyErrorColors } from '../../../enums/SurveyErrorColors';
import { NgxEchartsDirective } from 'ngx-echarts';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SelectModule } from 'primeng/select';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ButtonModule } from 'primeng/button';
import { ErrorItem, ErrorSummaryData } from '../../../models/chart-types';

const CHART_VIEWS = {
  OVERALL: 'Overall Summary',
  PER_PROVIDER: 'Error Summary Per Service Provider'
} as const;

type ChartView = typeof CHART_VIEWS[keyof typeof CHART_VIEWS];

@Component({
  selector: 'app-error-summary-charts',
  imports: [CommonModule, NgxEchartsDirective, FormsModule, SelectModule, ButtonModule],
  templateUrl: './error-summary-charts.html',
  styleUrl: './error-summary-charts.css',
})
export class ErrorSummaryCharts implements OnInit, OnDestroy {
  public chartOption: EChartsOption = {};
  public totalSurveys: number = 0;
  public selectedView = signal<ChartView>(CHART_VIEWS.OVERALL);
  public providerCharts: { title: string; option: EChartsOption }[] = [];

  public viewOptions = [
    { label: CHART_VIEWS.OVERALL, value: CHART_VIEWS.OVERALL },
    { label: CHART_VIEWS.PER_PROVIDER, value: CHART_VIEWS.PER_PROVIDER }
  ];

  private rawData: ErrorSummaryData | null = null;

  public router = inject(Router);
  private communicationService = inject(CommunicationService);
  public commonService = inject(CommonService);

  ngOnInit() {
    this.commonService.isSidebarCollapsed = true;
    this.loadChart();
  }

  ngOnDestroy() {
    this.commonService.isSidebarCollapsed = false;
  }

  goBack() {
    this.router.navigate(['Home']);
  }

  onViewChange(view: ChartView) {
    this.selectedView.set(view);
    if (!this.rawData) return;
    if (this.selectedView() === CHART_VIEWS.OVERALL) {
      this.buildOverallChart(this.rawData);
    } else {
      this.buildPerProviderCharts(this.rawData);
    }
  }

  private getErrorLabel(errorCode: number): string {
    const key = SurveyError[errorCode] as string;
    if (!key) return `Unknown Error (${errorCode})`;
    return key
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/Q C/g, 'QC')
      .trim();
  }

  loadChart() {
    this.communicationService.getErrorSummary().subscribe((data) => {
      const summary = data as ErrorSummaryData;
      if (!summary?.errorSummary) return;
      this.rawData = summary;
      this.buildOverallChart(summary);
    });
  }

  private buildOverallChart(data: ErrorSummaryData): void {
    const filtered = data.errorSummary.filter((e: ErrorItem) => e.count > 0);
    this.totalSurveys = filtered.reduce((sum: number, e: ErrorItem) => sum + e.count, 0);
    this.chartOption = this.createChartOption('Overall Summary', filtered, this.totalSurveys);
  }

  private buildPerProviderCharts(data: ErrorSummaryData) {
    const providers = Object.entries(data.errorSummaryPerServiceProvider || {});
    this.providerCharts = providers.map(([provider, errors]: [string, ErrorItem[]]) => {
      const filtered = errors.filter((e: ErrorItem) => e.count > 0);
      const total = filtered.reduce((sum: number, e: ErrorItem) => sum + e.count, 0);
      return {
        title: this.commonService.formatName(provider),
        option: this.createChartOption(this.commonService.formatName(provider), filtered, total)
      };
    }).filter(p => p.option);
  }

  private createChartOption(name: string, errors: ErrorItem[], total: number): EChartsOption {
    return {
      backgroundColor: '#060f17',
      tooltip: {
        trigger: 'item',
        formatter: '{a} <br/>{b}: {c} ({d}%)'
      },
      legend: {
        orient: 'vertical',
        right: 20,
        top: 'middle',
        textStyle: { color: '#ccc', fontSize: 12 },
        icon: 'rect',
        itemWidth: 14,
        itemHeight: 14
      },
      title: {
        text: total.toString(),
        subtext: 'Total Surveys',
        top: '44%',
        left: '39%',
        textAlign: 'center' as const,
        textStyle: { color: '#fff', fontSize: 36, fontWeight: 'bold' },
        subtextStyle: { color: '#aaa', fontSize: 13 }
      },
      series: [
        {
          name,
          type: 'pie',
          radius: ['45%', '75%'],
          center: ['40%', '50%'],
          avoidLabelOverlap: true,
          label: {
            show: true,
            position: 'inside',
            color: '#fff',
            fontSize: 11,
            formatter: '{c} ({d}%)'
          },
          labelLine: { show: false },
          emphasis: {
            label: { show: true, fontSize: 14, fontWeight: 'bold' }
          },
          data: errors.map((e: ErrorItem) => ({
            name: this.getErrorLabel(e.surveyErrorEnum),
            value: e.count,
            itemStyle: {
              color: SurveyErrorColors[e.surveyErrorEnum as SurveyError] || 'rgba(128,128,128,0.8)'
            }
          }))
        }
      ]
    };
  }

  data: ReportData[] = [
    { id: 1, name: 'Test A', status: 'Completed', date: '2025-06-25' },
    { id: 2, name: 'Test B', status: 'Pending', date: '2025-06-24' },
  ];

  generatePDF(): void {
    const doc = new jsPDF();

    doc.setFontSize(16);
    doc.text('Report Summary', 14, 20);

    autoTable(doc, {
      startY: 30,
      head: [['ID', 'Name', 'Status', 'Date']],
      body: this.data.map(item => [item.id, item.name, item.status, item.date]),
    });

    doc.save('report.pdf');
  }

}

export interface ReportData {
  id: number;
  name: string;
  status: string;
  date: string;
}
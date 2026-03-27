import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { NgxEchartsDirective } from 'ngx-echarts';
import { EChartsOption } from 'echarts';
import html2pdf from 'html2pdf.js';
import { CommunicationService } from '../../../services/communication-service';
import { CommonService } from '../../../services/common-service';
import { ErrorItem, ProviderApproval, ProviderReport, PdfOptions } from '../../../models/chart-types';
import { SurveyError } from '../../../enums/SurveyError';
import { SurveyErrorColors } from '../../../enums/SurveyErrorColors';
import { DataMissingEnum } from '../../../enums/DataMissingEnum';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-view-errorreport-summary',
  imports: [CommonModule, NgxEchartsDirective, ButtonModule],
  templateUrl: './view-errorreport-summary.html',
  styleUrl: './view-errorreport-summary.css'
})
export class ViewErrorReportSummary implements OnInit, OnDestroy {

  public providerReports: ProviderReport[] = [];

  private communicationService = inject(CommunicationService);
  public commonService = inject(CommonService);
  private router = inject(Router);

  dateForPrintView: Date = new Date();

  ngOnInit() {
    this.commonService.isSidebarCollapsed = true;
    this.loadReport();
  }

  ngOnDestroy() {
    this.commonService.isSidebarCollapsed = false;
  }

  goBack() {
    this.router.navigate(['error-summary']);
  }

  private getErrorLabel(errorCode: number): string {
    const key = SurveyError[errorCode] as string;
    if (!key) return `Unknown Error (${errorCode})`;
    return key.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/Q C/g, 'QC').trim();
  }

  private getDataMissingLabel(code: number): string {
    const key = DataMissingEnum[code] as string;
    if (!key) return `Unknown (${code})`;
    return key
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/Calc/g, '(Calc)')
      .replace(/Reference/g, 'Reference')
      .trim();
  }

  private createChartOption(providerName: string, errors: ErrorItem[], total: number): EChartsOption {
    return {
      backgroundColor: '#ffffff',
      tooltip: { trigger: 'item', formatter: '{a} <br/>{b}: {c} ({d}%)' },
      legend: {
        orient: 'vertical',
        right: 10,
        top: 'middle',
        textStyle: { color: '#333', fontSize: 11 },
        icon: 'rect',
        itemWidth: 12,
        itemHeight: 12
      },
      title: {
        text: total.toString(),
        subtext: 'Total Surveys',
        top: '42%',
        left: '37%',
        textAlign: 'center' as const,
        textStyle: { color: '#111', fontSize: 28, fontWeight: 'bold' },
        subtextStyle: { color: '#666', fontSize: 12 }
      },
      series: [{
        name: providerName,
        type: 'pie',
        radius: ['45%', '72%'],
        center: ['38%', '50%'],
        avoidLabelOverlap: true,
        label: {
          show: true,
          position: 'inside',
          color: '#fff',
          fontSize: 10,
          formatter: '{c} ({d}%)'
        },
        labelLine: { show: false },
        emphasis: { label: { show: true, fontSize: 13, fontWeight: 'bold' } },
        data: errors.map((e: ErrorItem) => ({
          name: this.getErrorLabel(e.surveyErrorEnum),
          value: e.count,
          itemStyle: {
            color: SurveyErrorColors[e.surveyErrorEnum as SurveyError] || 'rgba(128,128,128,0.8)'
          }
        }))
      }]
    };
  }

  loadReport() {
    showLoader(true, 'Loading Report');
    this.communicationService.getErrorSummary().subscribe((data: any) => {
      showLoader(false);
      if (!data) return;

      const approvalMap = new Map<string, ProviderApproval>();
      (data.surveyApprovalSummaryPerServiceProvider || []).forEach((a: any) => {
        approvalMap.set(a.serviceProvider, a as ProviderApproval & { serviceProvider?: string });
      });

      const missingMap: Map<string, ErrorItem[]> = new Map();
      Object.entries(data.dataMissingErrorsPerServiceProvider || {}).forEach(([provider, errors]: any) => {
        missingMap.set(provider, (errors as ErrorItem[]).filter((e: ErrorItem) => e.count > 0));
      });

      this.providerReports = Object.entries(data.errorSummaryPerServiceProvider || {}).map(
        ([provider, errors]: [string, any]) => {
          const filtered = (errors as ErrorItem[]).filter((e: ErrorItem) => e.count > 0);
          const total = filtered.reduce((sum: number, e: ErrorItem) => sum + e.count, 0);
          const approval = approvalMap.get(provider) || null;
          const missingErrors = missingMap.get(provider) || [];
          const autoApprovedPct = approval && approval.totalSurveys > 0
            ? ((approval.autoApprovedSurveys / approval.totalSurveys) * 100).toFixed(2)
            : '0.00';

          return {
            providerName: this.commonService.formatName(provider),
            errors: filtered.map((e: ErrorItem) => ({
              label: this.getErrorLabel(e.surveyErrorEnum),
              count: e.count,
              percentage: total > 0 ? ((e.count / total) * 100).toFixed(2) + '%' : '0%'
            })),
            approvalSummary: approval ? {
              totalSurveys: approval.totalSurveys,
              autoApprovedSurveys: approval.autoApprovedSurveys,
              gyroSurveys: approval.gyroSurveys,
              percentageAutoApproved: autoApprovedPct + '%'
            } : null,
            missingDataErrors: missingErrors.map((e: any) => ({
              label: this.getDataMissingLabel((e as any).dataMissing)
            })),
            chartOption: this.createChartOption(
              this.commonService.formatName(provider),
              filtered,
              total
            )
          };
        }
      );
    });
  }

  async generatePDF() {

    const element = document.querySelector('.report-wrapper') as HTMLElement;

    if (!element) {
      console.error('Report wrapper not found');
      return;
    }

    const options: PdfOptions = {
      margin: 10,
      filename: 'Vendor_Report.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        scrollY: 0
      },
      jsPDF: {
        unit: 'mm',
        format: 'a4',
        orientation: 'portrait'
      },
      pagebreak: {
        mode: ['avoid-all', 'css', 'legacy']
      }
    };

    await html2pdf().set(options).from(element).save();
  }
}
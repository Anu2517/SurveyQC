import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgxEchartsDirective } from 'ngx-echarts';
import { ButtonModule } from 'primeng/button';
import { EChartsOption } from 'echarts';
import { CommonService } from '../../../services/common-service';
import { Router } from '@angular/router';
import { PieChartData } from '../../../models/WellBore/SystemSummaryInfo';
import { ProcessSummary, WellboreInfo } from '../../../models/WellBore/WellBoreInfoModel';

@Component({
  selector: 'app-pie-chart',
  imports: [
    CommonModule,
    NgxEchartsDirective,
    ButtonModule
  ],
  templateUrl: './pie-chart.html',
  styleUrls: ['./pie-chart.css']
})
export class PieChart implements OnInit, OnDestroy {
  public allPieChartOption: EChartsOption[] = [];
  public pieChartData: PieChartData[] = [];
  public commonService = inject(CommonService);
  private router = inject(Router);

  ngOnInit() {
    this.commonService.isSidebarCollapsed = true;
    this.preparePieChartData();
  }

  ngOnDestroy() {
    this.commonService.isSidebarCollapsed = false;
  }

  goBack(): void {
    this.router.navigate(['Home']);
  }

  onChartClick() {
    this.commonService.isSidebarCollapsed = true;
  }

  preparePieChartData() {
    this.pieChartData = this.commonService.wellBoreArr.reduce((acc: PieChartData[], item: WellboreInfo) => {
      if (!Array.isArray(item?.processSummary)) return acc;

      item.processSummary.forEach((summary: ProcessSummary) => {
        const serviceCompany = summary?.name || "Unknown Company";
        const totalSurveys = summary?.totalSurveys || 0;

        let autoApproved = summary?.totalAutoApprovedSurveys || 0;
        let userApproved = summary?.totalUserApprovedSurveys || 0;
        let autoRejected = summary?.totalAutoRejectedSurveys || 0;
        let userRejected = summary?.totalUserRejectedSurveys || 0;
        let unknown = summary?.totalUnknownSurveys || 0;

        const existingCompany = acc.find(group => group.serviceCompany === serviceCompany);

        if (existingCompany) {
          existingCompany.autoApproved += autoApproved;
          existingCompany.userApproved += userApproved;
          existingCompany.autoRejected += autoRejected;
          existingCompany.userRejected += userRejected;
          existingCompany.unknown += unknown;
          existingCompany.totalSurveys += totalSurveys;
        } else {
          acc.push({ serviceCompany, totalSurveys, autoApproved, userApproved, autoRejected, userRejected, unknown });
        }
      });

      return acc;
    }, []);

    this.generateChartOptions();
  }

  generateChartOptions(): void {
    const colorMapping: Record<string, string> = {
      "Auto Approved": "rgba(26, 245, 37, 0.45)",
      "User Approved": "rgba(100, 160, 190, 0.8)",
      "Auto Rejected": "rgba(180, 60, 60, 0.8)",
      "User Rejected": "rgba(200, 90, 60, 0.8)",
      "Unknown": "rgba(68, 65, 65, 0.904)"
    };

    this.allPieChartOption = this.pieChartData.map(data => ({
      tooltip: {
        trigger: 'item',
        formatter: '{a} <br/>{b}: {c} ({d}%)'
      },
      legend: {
        orient: 'vertical',
        right: '0',
        top: 'top',
        textStyle: { color: '#fff' },
      },
      series: [
        {
          name: this.commonService.formatName(data.serviceCompany),
          type: 'pie',
          radius: '95%',
          left: 0,
          label: {
            show: true,
            position: 'inside',
            color: '#eee',
            formatter: '{c} ({d}%)'
          },
          labelLine: { show: true },
          data: [
            { name: "Auto Approved", value: data.autoApproved, itemStyle: { color: colorMapping["Auto Approved"] } },
            { name: "User Approved", value: data.userApproved, itemStyle: { color: colorMapping["User Approved"] } },
            { name: "Auto Rejected", value: data.autoRejected, itemStyle: { color: colorMapping["Auto Rejected"] } },
            { name: "User Rejected", value: data.userRejected, itemStyle: { color: colorMapping["User Rejected"] } },
            { name: "Unknown", value: data.unknown, itemStyle: { color: colorMapping["Unknown"] } }
          ].filter(item => item.value > 0)
        }
      ]
    })) as EChartsOption[];
  }
}
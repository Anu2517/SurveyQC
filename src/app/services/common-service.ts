import { EventEmitter, Injectable } from '@angular/core';
import { CommunicationService } from './communication-service';
import { SignalrService } from './signalr-service';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { finalize } from 'rxjs';
import { SurveyStatus } from '../models/WellBore/SurveyStatus';
import { FacLimit } from '../models/WellBore/FacLimit';
import { ProcessConfiguration } from '../models/WellBore/ProcessConfiguration';
import { WellboreInfo } from '../models/WellBore/WellBoreInfoModel';
// import * as XLSX from 'xlsx';
// import { saveAs } from 'file-saver';
// import { NzNotificationService } from 'ng-zorro-antd/notification';


@Injectable({
  providedIn: 'root'
})
export class CommonService {

  public isSidebarCollapsed: boolean = false;
  // public wellBoreArr: Array<any> = new Array<any>(); // wells
  wellBoreArr: any[] = [];
  public filteredWellBoreArr: Array<any> = new Array<any>();
  public dashboardLayout = ["Card", "Grid", "Map"]
  public pieChartStatus: boolean = false;
  public errorSummaryStatus: boolean = false;
  public simulationStatus: boolean = false;

  // "Panel"
  public selectedDashboardLayout: string = "Card"
  public isAutoRefreshEnable: boolean = false;
  public surveyStatusEnum = SurveyStatus;
  public surveyTypeArr: Array<any> = Array<any>();
  public selectedVendor: string | null = "All Vendors";
  public vendorsArr: Array<any> = new Array<any>()
  public searchText: string = '';
  public selectedSurveyType: number = -1
  public emitPieChartStatus: EventEmitter<boolean> = new EventEmitter<boolean>()
  public emitWitsmlStatus: EventEmitter<boolean> = new EventEmitter<boolean>()
  public emitSelectedWellboreId: EventEmitter<string> = new EventEmitter<string>()
  public emitSelectedWellboreIdForCharts: EventEmitter<string> = new EventEmitter<string>()
  public emitSelectedWellboreIdForReport: EventEmitter<string> = new EventEmitter<string>()
  public emitErrorSummaryReport: EventEmitter<string> = new EventEmitter<string>()
  public showWitsmlConnectionStatusMessage: string = ''
  public facConfiguration!: FacLimit;
  public hideOtherInfo: boolean = false
  public isFilterApplied: EventEmitter<boolean> = new EventEmitter<boolean>()
  public processConfigData!: ProcessConfiguration;
  public lastSelectedWellboreId: string | null = null;

  public minFilterByAutoRejectedSurveys: number | null = null;
  // public startDate: Date = new Date()
  // public endDate: Date = new Date()
  public startDate: Date | null = null;
  public endDate: Date | null = null;
  AutoRejectedSurveys: number | null = null;

  constructor(private _communicationService: CommunicationService, private _signalrService: SignalrService, private router: Router, private _message: MessageService) {
    this.emitWitsmlStatus.subscribe(data => {
      if (data) {
        this.generateSurveyType()
        this.startProcessing()
        this.updateWellBoreState()
        this.getMonitorWellBores();
        this.showWitsmlConnectionStatusMessage = ''
      }
      else {
        this.showWitsmlConnectionStatusMessage = 'WITSML configuration is not set up. Please update and try again.'
      }
    })
  }

  public startProcessing(): void {
    debugger;
    // showLoader(true, 'Processing Wells');

    this._communicationService.startProcessing()
      .pipe(
        // finalize(() => showLoader(false))
      )
      .subscribe(
        () => {
          this.getMonitorWellBores();
        },
        (err: unknown) => {
          console.error('Start processing failed:', err);
        }
      );
  }


  getMonitorWellBores() {
    //showLoader(true, 'Fetching Wells...');
    this._communicationService.getMonitoredWellbores().subscribe(
      (data: WellboreInfo[]) => {
      //  showLoader(false);

        this.wellBoreArr = data
          .map(well => ({
            ...well,
            processSummary: this.transformProcessSummary(well.processSummary),
            wellboreInfo: {
              ...well.wellboreInfo,
              serviceCompanyInfos: this.transformServiceCompanyInfos(well.wellboreInfo?.serviceCompanyInfos)
            }
          }))
          .sort((a, b) =>
            (a.wellboreInfo?.wellId?.value ?? '')
              .localeCompare(b.wellboreInfo?.wellId?.value ?? '')
          );
        console.log('wellBoreArr', this.wellBoreArr);
        this.updateWellboreData();
      },
      (err) => {
        //showLoader(false);
      }
    );
  }


  updateWellBoreState() {
    this._signalrService.wellboreProcessState.subscribe(data => {

      this._communicationService.getWellboreState(data).subscribe(wellbore => {
        let wellboreIndex = this.wellBoreArr.findIndex(x => x.wellboreInfo.wellboreId.value === data);

        const updatedWellbore = {
          ...wellbore,
          processSummary: this.transformProcessSummary(wellbore.processSummary),
          wellboreInfo: {
            ...wellbore.wellboreInfo,
            serviceCompanyInfos: this.transformServiceCompanyInfos(wellbore.wellboreInfo?.serviceCompanyInfos)
          }
        };

        if (wellboreIndex > -1) {
          this.wellBoreArr[wellboreIndex] = updatedWellbore;
        } else {
          this.wellBoreArr.push(updatedWellbore);
        }

        this.updateWellboreData();
      });
    });
  }

  transformProcessSummary(processSummary: any): any[] {
    if (!processSummary) return [];

    return Object.keys(processSummary).map(key => ({
      name: key,
      totalSurveys: processSummary[key]?.totalSurveys ?? 0,
      totalAutoRejectedSurveys: processSummary[key]?.totalAutoRejectedSurveys ?? 0,
      totalAutoApprovedSurveys: processSummary[key]?.totalAutoApprovedSurveys ?? 0,
      totalUserApprovedSurveys: processSummary[key]?.totalUserApprovedSurveys ?? 0,
      totalUserRejectedSurveys: processSummary[key]?.totalUserRejectedSurveys ?? 0,
      totalUnknownSurveys: processSummary[key]?.totalUnknownSurveys ?? 0
    }));
  }

  transformServiceCompanyInfos(serviceCompanyInfos: any): any[] {
    debugger;
    if (!serviceCompanyInfos) return [];

    return Object.keys(serviceCompanyInfos).map(key => ({
      name: key,
      serviceCompany: serviceCompanyInfos[key]?.serviceCompany ?? null,
      azimuthReference: serviceCompanyInfos[key]?.azimuthReference ?? null,
      magneticDeclinationUsed: serviceCompanyInfos[key]?.magneticDeclinationUsed ?? null,
      gridConvergenceUsed: serviceCompanyInfos[key]?.gridConvergenceUsed ?? null,
      azimuthVerticalSection: serviceCompanyInfos[key]?.azimuthVerticalSection ?? null
    }));
  }

  formatName(name: string): string {
    return name
      .replace(/^[^_]+_/, '')
      .replace(/[^a-zA-Z0-9 ]/g, '')
      .replace(/\s+/g, '  ')
      .trim();
  }

  updateWellboreData() {
    this.filteredWellBoreArr = [...this.wellBoreArr];

    const uniqueVendors = new Map<string, string>();

    this.wellBoreArr.forEach((well: any) => {
      well.processSummary?.forEach((info: any) => {
        if (info?.name) {
          const lowerCaseName = info.name.toLowerCase();

          if (!uniqueVendors.has(lowerCaseName)) {
            uniqueVendors.set(lowerCaseName, info.name);
          }
        }
      });
    });

    this.vendorsArr = [
      { value: 'All Vendors', label: 'All Vendors' },
      ...Array.from(uniqueVendors.values()).map(name => ({ value: name, label: this.formatName(name) }))
    ];

    this.updateTime();
    this.applyFilters();
  }

  generateSurveyType() {
    this.surveyTypeArr = [
      { key: 'All Surveys', value: -1 },
      ...Object.keys(SurveyStatus)
        .filter(key => isNaN(Number(key)))
        .map(key => ({ key, value: SurveyStatus[key as keyof typeof SurveyStatus] }))
    ];
  }

  updateTime() {
    let filterDates = this.filteredWellBoreArr
      .map(rig => new Date(rig.lastSurveyReceivedTime))
      .filter(date => !isNaN(date.getTime()));

    let startDate = filterDates.length ? new Date(Math.min(...filterDates.map(date => date.getTime()))) : null;
    let endDate = filterDates.length ? new Date(Math.max(...filterDates.map(date => date.getTime()))) : null;

    this.startDate = startDate
    this.endDate = endDate

  }

  applyFilters(fromUser: boolean = false) {
    this.filteredWellBoreArr = [...this.wellBoreArr];

    if (this.selectedVendor && this.selectedVendor !== 'All Vendors') {
      this.filteredWellBoreArr = this.filteredWellBoreArr.filter(well =>
        well.processSummary?.some((summary: any) => summary?.name === this.selectedVendor)
      );
    }


    if (this.selectedSurveyType !== -1) {
      this.filteredWellBoreArr = this.filteredWellBoreArr.filter(wellbore => {
        if (!wellbore.processSummary || wellbore.processSummary.length === 0) {
          return false;
        }

        return wellbore.processSummary.some((summary: any) => {
          const getValue = (field: number | undefined): number => (field ? Number(field) : 0);

          switch (this.selectedSurveyType) {
            case SurveyStatus.Unknown:
              return getValue(summary.totalUnknownSurveys) > 0;
            case SurveyStatus.AutoApproved:
              return getValue(summary.totalAutoApprovedSurveys) > 0;
            case SurveyStatus.AutoRejected:
              return getValue(summary.totalAutoRejectedSurveys) > 0;
            case SurveyStatus.UserApproved:
              return getValue(summary.totalUserApprovedSurveys) > 0;
            case SurveyStatus.UserRejected:
              return getValue(summary.totalUserRejectedSurveys) > 0;
            default:
              return false;
          }
        });
      });
    }

    if (this.startDate || this.endDate) {
      const startDate = this.startDate ? new Date(this.startDate) : null;
      const endDate = this.endDate ? new Date(this.endDate) : null;

      this.filteredWellBoreArr = this.filteredWellBoreArr.filter(wellbore => {
        const rigDate = new Date(wellbore.lastSurveyReceivedTime);
        if (startDate && endDate) {
          return rigDate >= startDate && rigDate <= endDate;
        } else if (startDate) {
          return rigDate >= startDate;
        } else if (endDate) {
          return rigDate <= endDate;
        }
        return true;
      });
    }

    if (this.searchText) {
      const searchText = this.searchText.toLowerCase();
      this.filteredWellBoreArr = this.filteredWellBoreArr.filter(well =>
        well.wellboreInfo?.wellboreId?.value?.toLowerCase().includes(searchText) ||
        well.processSummary?.some((element: any) =>
          element.name.toLowerCase().includes(searchText)
        )
      );
    }


    if (this.minFilterByAutoRejectedSurveys != null) { // covers null & undefined
      const minAutoRejected = this.minFilterByAutoRejectedSurveys;

      this.filteredWellBoreArr = this.filteredWellBoreArr.filter(well => {
        if (!well.processSummary || well.processSummary.length === 0) {
          return false;
        }

        return well.processSummary.some((summary: any) => {
          const autoRejectedValue = Number(summary.totalAutoRejectedSurveys) || 0;
          return !isNaN(autoRejectedValue) && autoRejectedValue >= minAutoRejected;
        });
      });
    }

    if (this.minFilterByAutoRejectedSurveys != null) {

      const minValue = this.minFilterByAutoRejectedSurveys;

      this.filteredWellBoreArr = this.filteredWellBoreArr.filter(well => {
        if (!well.processSummary || well.processSummary.length === 0) {
          return false;
        }

        return well.processSummary.some((summary: any) => {
          const autoRejectedValue = Number(summary.totalAutoRejectedSurveys) || 0;
          return autoRejectedValue >= minValue;
        });
      });

    }

    this.filteredWellBoreArr.sort((a, b) => a.wellboreInfo.wellId.value.localeCompare(b.wellboreInfo.wellId.value));

    this.isFilterApplied.emit(fromUser ? false : true);

  }


  randomUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  getFormattedDate(dateTime: any): Date | null {
    if (dateTime) {
      return dateTime ? new Date(dateTime) : null;
    }
    else {
      return null
    }
  }

  formatLatitude(latitude: string | number): string {
    if (latitude === null || latitude === undefined) return '-';
    const lat = typeof latitude === 'string' ? parseFloat(latitude) : latitude;
    const latDirection = lat >= 0 ? 'N' : 'S';
    return `${Math.abs(lat).toFixed(4)}° ${latDirection}`;
  }

  formatLongitude(longitude: string | number): string {
    if (longitude === null || longitude === undefined) return '-';
    const lon = typeof longitude === 'string' ? parseFloat(longitude) : longitude;
    const longDirection = lon >= 0 ? 'E' : 'W';
    return `${Math.abs(lon).toFixed(4)}° ${longDirection}`;
  }


  viewWellboreSurveys(wellboreId: string): void {
    this.router.navigateByUrl('view-surveys').then(() => {
      this.lastSelectedWellboreId = wellboreId;
      this.emitSelectedWellboreId.emit(wellboreId);
    });
  }

  viewWellboreCharts(wellboreId: string): void {
    this.router.navigateByUrl('view-charts').then(() => {
      this.emitSelectedWellboreIdForCharts.emit(wellboreId);
    });
  }

  viewWellboreReport(well: any): void {
    this.router.navigateByUrl('view-report').then(() => {
      this.emitSelectedWellboreIdForReport.emit(well);
    });
  }

  viewVendorBasedErrorReport() {
    this.router.navigateByUrl('view-errorreport-summary').then(() => {
      this.emitErrorSummaryReport.emit();
    })
  }

  // public exportToExcel(fileName: string): void {
  //   const dataToExport = this.filteredWellBoreArr.map((well) => {
  //     const summary = well.processSummary?.[0] || {};
  //     return {
  //       'Well ID': well.wellboreInfo?.wellboreId?.value,
  //       'Service Company': well.wellboreInfo?.serviceCompanyInfos?.map(sc => sc.name).join(', '),
  //       'Last Survey Received': this.getFormattedDateTime(well.lastSurveyReceivedTime),
  //       'Latitude': this.formatLatitude(well.wellboreInfo.latitude.value),
  //       'Longitude': this.formatLongitude(well.wellboreInfo.longitude.value),
  //       'Total Surveys': well.totalSurveys,
  //       'Survey Summary': well.processSummary.map(survey => survey.name).join(', '),
  //       'Auto Approved': summary.totalAutoApprovedSurveys,
  //       'User Approved': summary.totalUserApprovedSurveys,
  //       'Auto Rejected': summary.totalAutoRejectedSurveys,
  //       'Total User Rejected': summary.totalUserRejectedSurveys,
  //       'Unknown Surveys': summary.totalUnknownSurveys,
  //     };
  //   });
  //   const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(dataToExport);
  //   const columnWidth = 18
  //   ws['!cols'] = new Array(Object.keys(dataToExport[0]).length).fill({ wch: columnWidth });
  //   const wb: XLSX.WorkBook = XLSX.utils.book_new();
  //   XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
  //   const wbout: ArrayBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  //   saveAs(new Blob([wbout], { type: 'application/octet-stream' }), `${fileName}.xlsx`);
  // }

  getFormattedDateTime(date: any): string {
    if (!date) return '';
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = String(d.getFullYear() % 100).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
  }

  showNotification(status: 'success' | 'info' | 'warning' | 'error' | 'blank', title: string, subtitle: string) {
    this._message.add({
      severity: status === 'blank' ? undefined : status,
      summary: title,
      detail: subtitle
    });
  }

}

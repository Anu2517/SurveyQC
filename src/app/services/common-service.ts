import { Injectable } from '@angular/core';
import { Subject, switchMap } from 'rxjs';
import { CommunicationService } from './communication-service';
import { SignalrService } from './signalr-service';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { SurveyStatus } from '../models/WellBore/SurveyStatus';
import { FacLimit } from '../models/WellBore/FacLimit';
import { ProcessConfiguration } from '../models/WellBore/ProcessConfiguration';
import { ProcessSummary, ServiceCompanyInfo, WellboreInfo } from '../models/WellBore/WellBoreInfoModel';
import { LoggerService } from './logger.service';

@Injectable({
  providedIn: 'root'
})
export class CommonService {

  public isSidebarCollapsed: boolean = false;
  wellBoreArr: WellboreInfo[] = [];
  public filteredWellBoreArr: WellboreInfo[] = [];
  public dashboardLayout = ["Card", "Grid", "Map"]
  public pieChartStatus: boolean = false;
  public simulationStatus: boolean = false;

  // "Panel"
  public selectedDashboardLayout: string = "Card"
  public isAutoRefreshEnable: boolean = false;
  public surveyStatusEnum = SurveyStatus;
  public surveyTypeArr: { key: string; value: number }[] = [];
  public selectedVendor: string | null = "All Vendors";
  public vendorsArr: { value: string; label: string }[] = [];
  public searchText: string = '';
  public selectedSurveyType: number = -1
  public emitWitsmlStatus = new Subject<boolean>();
  public emitSelectedWellboreId = new Subject<string>();
  public emitSelectedWellboreIdForCharts = new Subject<string>();
  public showWitsmlConnectionStatusMessage: string = ''
  public facConfiguration!: FacLimit;
  public hideOtherInfo: boolean = false
  public isFilterApplied = new Subject<boolean>();
  public processConfigData!: ProcessConfiguration;
  public lastSelectedWellboreId: string | null = null;

  public minFilterByAutoRejectedSurveys: number | null = null;
  public startDate: Date | null = null;
  public endDate: Date | null = null;

  constructor(
    private _communicationService: CommunicationService,
    private signalrService: SignalrService,
    private router: Router,
    private message: MessageService,
    private logger: LoggerService
  ) {
    this.emitWitsmlStatus.subscribe(data => {
      if (data) {
        this.generateSurveyType()
        this.startProcessing()
        this.updateWellBoreState()
        this.showWitsmlConnectionStatusMessage = ''
      }
      else {
        this.showWitsmlConnectionStatusMessage = 'WITSML configuration is not set up. Please update and try again.'
      }
    })
  }

  /**
   * Start processing wellbores from WITSML
   */
  public startProcessing(): void {
    showLoader(true, 'Processing Wells');
    this._communicationService.startProcessing()
      .subscribe({
        next: () => {
          showLoader(false)
          this.getMonitorWellBores();
        },
        error: (err: unknown) => {
          showLoader(false);
          this.logger.error('Start processing failed:', err);
        }
      });
  }

  /**
   * Fetch monitored wellbores and update state
   */
  getMonitorWellBores() {
    showLoader(true, 'Fetching Wells...');
    this._communicationService.getMonitoredWellbores().subscribe({
      next: (data: WellboreInfo[]) => {
        showLoader(false);
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
        this.logger.debug('Wellbore data loaded', this.wellBoreArr);
        this.updateWellboreData();
      },
      error: (err) => {
        showLoader(false);
        this.logger.error('Failed to fetch monitored wellbores', err);
      }
    });
  }

  /**
   * Subscribe to SignalR wellbore state updates
   */
  updateWellBoreState(): void {
    this.signalrService.wellboreProcessState
      .pipe(
        switchMap(data =>
          this._communicationService.getWellboreState(data)
        )
      )
      .subscribe((wellbore: WellboreInfo) => {
        const wellboreId = wellbore?.wellboreInfo?.wellboreId?.value;
        const wellboreIndex = this.wellBoreArr.findIndex(
          x => x.wellboreInfo.wellboreId.value === wellboreId
        );

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
  }

  /**
   * Transform process summary from API format to application format
   * @param processSummary - Process summary from API (object or array)
   * @returns Array of process summary objects
   */
  transformProcessSummary(
    processSummary: Record<string, ProcessSummary> | ProcessSummary[] | null | undefined
  ): ProcessSummary[] {

    if (!processSummary) return [];

    // If API already returned array
    if (Array.isArray(processSummary)) {
      return processSummary;
    }

    // If API returned object
    return Object.keys(processSummary).map((key) => {
      const item = processSummary[key];

      return {
        name: key,
        totalSurveys: item?.totalSurveys ?? 0,
        totalAutoRejectedSurveys: item?.totalAutoRejectedSurveys ?? 0,
        totalAutoApprovedSurveys: item?.totalAutoApprovedSurveys ?? 0,
        totalUserApprovedSurveys: item?.totalUserApprovedSurveys ?? 0,
        totalUserRejectedSurveys: item?.totalUserRejectedSurveys ?? 0,
        totalUnknownSurveys: item?.totalUnknownSurveys ?? 0
      };
    });
  }

  /**
   * Transform service company information from API format
   * @param serviceCompanyInfos - Service company info from API
   * @returns Array of service company info objects
   */
  transformServiceCompanyInfos(
    serviceCompanyInfos: Record<string, ServiceCompanyInfo> | ServiceCompanyInfo[] | null | undefined
  ): ServiceCompanyInfo[] {

    if (!serviceCompanyInfos) return [];

    if (Array.isArray(serviceCompanyInfos)) {
      return serviceCompanyInfos;
    }

    return Object.keys(serviceCompanyInfos).map((key) => {
      const item = serviceCompanyInfos[key];

      return {
        name: key,
        serviceCompany: item?.serviceCompany ?? null,
        azimuthReference: item?.azimuthReference ?? null,
        magneticDeclinationUsed: item?.magneticDeclinationUsed ?? null,
        gridConvergenceUsed: item?.gridConvergenceUsed ?? null,
        azimuthVerticalSection: item?.azimuthVerticalSection ?? null
      };
    });
  }

  /**
   * Format vendor/service company name for display
   * @param name - Raw name from API
   * @returns Formatted name
   */
  formatName(name: string): string {
    return name
      .replace(/^[^_]+_/, '')
      .replace(/[^a-zA-Z0-9 ]/g, '')
      .replace(/\s+/g, '  ')
      .trim();
  }

  /**
   * Update wellbore data and refresh filters/vendors
   */
  updateWellboreData() {
    this.filteredWellBoreArr = [...this.wellBoreArr];

    const uniqueVendors = new Map<string, string>();

    this.wellBoreArr.forEach((well: WellboreInfo) => {
      well.processSummary?.forEach((info: ProcessSummary) => {
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

  /**
   * Generate survey type dropdown options from enum
   */
  generateSurveyType() {
    this.surveyTypeArr = [
      { key: 'All Surveys', value: -1 },
      ...Object.keys(SurveyStatus)
        .filter(key => isNaN(Number(key)))
        .map(key => ({ key, value: SurveyStatus[key as keyof typeof SurveyStatus] }))
    ];
  }

  /**
   * Calculate date range from filtered wellbores
   */
  updateTime() {
    let filterDates = this.filteredWellBoreArr
      .map(rig => new Date(rig.lastSurveyReceivedTime))
      .filter(date => !isNaN(date.getTime()));

    let startDate = filterDates.length ? new Date(Math.min(...filterDates.map(date => date.getTime()))) : null;
    let endDate = filterDates.length ? new Date(Math.max(...filterDates.map(date => date.getTime()))) : null;

    this.startDate = startDate
    this.endDate = endDate

  }

  /**
   * Apply all active filters to wellbore data
   * @param fromUser - Whether filter was triggered by user action
   */
  applyFilters(fromUser: boolean = false) {
    this.filteredWellBoreArr = [...this.wellBoreArr];

    if (this.selectedVendor && this.selectedVendor !== 'All Vendors') {
      this.filteredWellBoreArr = this.filteredWellBoreArr.filter(well =>
        well.processSummary?.some((summary: ProcessSummary) => summary?.name === this.selectedVendor)
      );
    }


    if (this.selectedSurveyType !== -1) {
      this.filteredWellBoreArr = this.filteredWellBoreArr.filter(wellbore => {
        if (!wellbore.processSummary || wellbore.processSummary.length === 0) {
          return false;
        }

        return wellbore.processSummary.some((summary: ProcessSummary) => {
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

        return well.processSummary.some((summary: ProcessSummary) => {
          const autoRejectedValue = Number(summary.totalAutoRejectedSurveys) || 0;
          return !isNaN(autoRejectedValue) && autoRejectedValue >= minAutoRejected;
        });
      });
    }

    this.filteredWellBoreArr.sort((a, b) =>
      (a.wellboreInfo.wellId.value ?? '')
        .localeCompare(b.wellboreInfo.wellId.value ?? '')
    );
    this.isFilterApplied.next(!fromUser);
  }

  /**
   * Generate random UUID v4
   * @returns UUID string
   */
  randomUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  getFormattedDate(dateTime: string | Date | null): Date | null {
    if (dateTime) {
      return dateTime ? new Date(dateTime) : null;
    }
    else {
      return null
    }
  }

  formatLatitude(latitude: string | number | null): string {
    if (latitude === null || latitude === undefined) return '-';
    const lat = typeof latitude === 'string' ? parseFloat(latitude) : latitude;
    const latDirection = lat >= 0 ? 'N' : 'S';
    return `${Math.abs(lat).toFixed(4)}° ${latDirection}`;
  }

  formatLongitude(longitude: string | number | null): string {
    if (longitude === null || longitude === undefined) return '-';
    const lon = typeof longitude === 'string' ? parseFloat(longitude) : longitude;
    const longDirection = lon >= 0 ? 'E' : 'W';
    return `${Math.abs(lon).toFixed(4)}° ${longDirection}`;
  }


  /**
   * Navigate to wellbore surveys view
   * @param wellboreId - Wellbore identifier
   */
  viewWellboreSurveys(wellboreId: string): void {
    this.router.navigateByUrl('view-surveys').then(() => {
      this.lastSelectedWellboreId = wellboreId;
      this.emitSelectedWellboreId.next(wellboreId);
    });
  }

  /**
   * Navigate to wellbore charts view
   * @param wellboreId - Wellbore identifier
   */
  viewWellboreCharts(wellboreId: string): void {
    this.router.navigateByUrl('view-charts').then(() => {
      this.emitSelectedWellboreIdForCharts.next(wellboreId);
    });
  }

  /**
   * Navigate to wellbore report view
   * @param well - Wellbore data
   */
  viewWellboreReport(well: WellboreInfo): void {
    this.router.navigateByUrl('view-report');
  }

  /**
   * Show notification toast
   * @param status - Notification type
   * @param title - Notification title
   * @param subtitle - Notification detail message
   */
  showNotification(status: 'success' | 'info' | 'warning' | 'error' | 'blank', title: string, subtitle: string) {
    this.message.add({
      severity: status === 'blank' ? undefined : status,
      summary: title,
      detail: subtitle
    });
  }

}

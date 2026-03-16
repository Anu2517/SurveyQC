import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { environment } from '../../../environments/environment';
import { CommonService } from '../../services/common-service';
import { SignalrService } from '../../services/signalr-service';
import { CommunicationService } from '../../services/communication-service';
import { SystemSummaryInfo } from '../../models/WellBore/SystemSummaryInfo';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { SelectModule } from 'primeng/select';
import { MessageModule } from 'primeng/message';
import { requestStatus } from '../../utils/request-status-utils';

@Component({
  selector: 'app-sidebar',
  imports: [
    CommonModule,
    FormsModule,
    InputTextModule,
    SelectModule,
    DatePickerModule,
    ButtonModule,
    MessageModule
  ],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
})
export class Sidebar implements OnInit {

  public commonService = inject(CommonService);
  private signalRService = inject(SignalrService);
  private communicationService = inject(CommunicationService);

  public serverConnectionLight = toSignal(this.signalRService.isServerConnected$, { initialValue: false });
  public environment = environment;
  public applicationVersion!: string;
  public simulationStatus: boolean = false;
  public surveyCounts: SystemSummaryInfo = new SystemSummaryInfo();
  surveyStatus = requestStatus();
  private destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    this.getVersion();
    this.getSurveysSummary();
    this.communicationService.getSimulationModeStatus()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(data => {
        this.commonService.simulationStatus = data;
        this.simulationStatus = data;
      });
  }

  getVersion(): void {
    this.communicationService.getVersion()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((data: any) => {
        this.applicationVersion = data;
      });
  }

  resetFilters(): void {
    this.commonService.selectedVendor = 'All Vendors';
    this.commonService.selectedSurveyType = -1;
    this.commonService.startDate = null;
    this.commonService.endDate = null;
    this.commonService.searchText = '';
    this.commonService.minFilterByAutoRejectedSurveys = null;
    this.commonService.applyFilters();
  }

  updateSurveyCounts(data: SystemSummaryInfo): void {
    this.surveyCounts.totalAutoApprovedSurveys = data?.totalAutoApprovedSurveys || 0;
    this.surveyCounts.totalUserApprovedSurveys = data?.totalUserApprovedSurveys || 0;
    this.surveyCounts.totalAutoRejectedSurveys = data?.totalAutoRejectedSurveys || 0;
    this.surveyCounts.totalUserRejectedSurveys = data?.totalUserRejectedSurveys || 0;
    this.surveyCounts.totalUnknownSurveys = data?.totalUnknownSurveys || 0;
    this.surveyCounts.totalSurveys = data?.totalSurveys || 0;
  }

getSurveysSummary(): void {
  this.surveyStatus.loading();
  this.communicationService.getSummaryInformation().subscribe({
    next: (data: SystemSummaryInfo) => {
      if (data) {
        this.updateSurveyCounts(data);
        this.surveyStatus.success(data);
      }
    },
    error: (err) => {
      this.surveyStatus.error(err);
      this.commonService.showNotification(
        'error',
        'Survey Summary Error',
        this.surveyStatus.errorMessage() || 
        'Failed to load summary information. Please try again later.'
      );
    }
  });

}
}
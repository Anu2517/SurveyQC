import { Component, OnInit } from '@angular/core';
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

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    InputTextModule,
    SelectModule,
    DatePickerModule,
    ButtonModule
  ],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
})
export class Sidebar implements OnInit {

  public serverConnectionLight: boolean = false;
  public environment = environment;
  public applicationVersion!: string;
  public simulationStatus: boolean = false;
  public surveyCounts: SystemSummaryInfo = new SystemSummaryInfo();

  constructor(
    public _commonService: CommonService,
    private signalRService: SignalrService,
    private _communicationService: CommunicationService
  ) { }

  ngOnInit(): void {
    this.getVersion();
    this.getSurveysSummary();
    this.subscribeToConnectionStatus();
    this._communicationService.getSimulationModeStatus().subscribe(data => {
      this._commonService.simulationStatus = data;
      this.simulationStatus = data;
    });
  }

  getVersion(): void {
    this._communicationService.getVersion().subscribe((data: any) => {
      this.applicationVersion = data;
    });
  }

  subscribeToConnectionStatus(): void {
    this.signalRService.isServerConnected$.subscribe((data: boolean) => {
      this.serverConnectionLight = data;
    });
  }

  resetFilters(): void {
    this._commonService.selectedVendor = 'All Vendors';
    this._commonService.selectedSurveyType = -1;
    this._commonService.startDate = null;
    this._commonService.endDate = null;
    this._commonService.searchText = '';
    this._commonService.minFilterByAutoRejectedSurveys = null;
    this._commonService.filteredWellBoreArr = [
      ...this._commonService.wellBoreArr
    ];
  }

  updateSurveyCounts(data: SystemSummaryInfo): void {
    this.surveyCounts.totalAutoApprovedSurveys = data?.totalAutoApprovedSurveys || 0;
    this.surveyCounts.totalUserApprovedSurveys = data?.totalUserApprovedSurveys || 0;
    this.surveyCounts.totalAutoRejectedSurveys = data?.totalAutoRejectedSurveys || 0;
    this.surveyCounts.totalUserRejectedSurveys = data?.totalUserRejectedSurveys || 0;
    this.surveyCounts.totalUnknownSurveys = data?.totalUnknownSurveys || 0;
    this.surveyCounts.totalSurveys = data?.totalSurveys || 0;
  }

  // simulationModeStatus(): void {
  //   this._communicationService.getSimulationModeStatus().subscribe(data => {
  //     this._commonService.simulationStatus = data; 
  //     this.simulationStatus = data;                
  //   });
  // }

  getSurveysSummary(): void {
    this._communicationService.getSummaryInformation().subscribe(
      (data: SystemSummaryInfo) => {
        if (data) {
          this.updateSurveyCounts(data);
        }
      }
    );
  }
}
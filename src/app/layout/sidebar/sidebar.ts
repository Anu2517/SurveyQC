import { Component } from '@angular/core';
import { environment } from '../../../environments/environment';
import { CommonService } from '../../services/common-service';
import { SignalrService } from '../../services/signalr-service';
import { CommunicationService } from '../../services/communication-service';
import { SystemSummaryInfo } from '../../models/WellBore/SystemSummaryInfo';

@Component({
  selector: 'app-sidebar',
  imports: [],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
})
export class Sidebar {
  public serverConnectionLight: boolean = false;
  public environment = environment;
  public applicationVersion!: string;
  public simulationStatus: boolean = false;
  public surveyCounts: SystemSummaryInfo = new SystemSummaryInfo();

  constructor(
    public _commonService: CommonService,
    private signalRService: SignalrService,
    private _communicationService: CommunicationService
  ) {
    this.getVersion();
    this.subscribeToConnectionStatus();
    this.simulationModeStatus();
  }

  getVersion() {
    this._communicationService.getVersion().subscribe((data: any) => {
      this.applicationVersion = data;
    });
  }

  subscribeToConnectionStatus(): void {
    this.signalRService.isServerConnected$.subscribe((data: any) => {
      this.serverConnectionLight = data;
    });
  }

  // resetFilters() {
  //   this._commonService.selectedVendor = 'All Vendors';
  //   this._commonService.selectedSurveyType = -1;
  //   this._commonService.startDate = null;
  //   this._commonService.endDate = null;
  //   this._commonService.searchText = '';
  //   this._commonService.minFilterByAutoRejectedSurveys = null;
  //   this._commonService.filteredWellBoreArr = [...this._commonService.wellBoreArr];
  // }

  simulationModeStatus() {
    this._communicationService.getSimulationModeStatus().subscribe(data => {
      this.simulationStatus = data;
    });
  }

}

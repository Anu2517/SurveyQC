import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CommonService } from '../../../services/common-service';
import { CommunicationService } from '../../../services/communication-service';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { TableModule } from 'primeng/table';
import { ServiceCompanyInfo, WellboreInfo } from '../../../models/WellBore/WellBoreInfoModel';

@Component({
  selector: 'app-grid',
  standalone: true,
  imports: [CommonModule, ButtonModule, TooltipModule, TableModule],
  templateUrl: './grid.html',
  styleUrl: './grid.css'
})
export class Grid {

  constructor(
    public _commonService: CommonService,
    private _communicationService: CommunicationService
  ) {}

  getAllServiceCompanyNames(companies: ServiceCompanyInfo[]): string {
    return companies.map(company => this._commonService.formatName(company?.name)).join(', ');
  }

  InitiateRunMSA(well: WellboreInfo) {
    this._communicationService.ProcessWellboreForMSA(well.wellboreInfo.wellboreId.value).subscribe((data: boolean) => {
      if (data) {
        this._commonService.showNotification('success', 'MSA Initiated for ' + well.wellboreInfo.wellboreId.value, '');
      } else {
        this._commonService.showNotification('error', 'Failed to Initiate MSA for ' + well.wellboreInfo.wellboreId.value, '');
      }
    });
  }

}
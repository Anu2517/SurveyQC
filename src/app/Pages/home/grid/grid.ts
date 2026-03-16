import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CommonService } from '../../../services/common-service';
import { CommunicationService } from '../../../services/communication-service';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { TableModule } from 'primeng/table';
import { ServiceCompanyInfo, WellboreInfo } from '../../../models/WellBore/WellBoreInfoModel';

@Component({
  selector: 'app-grid',
  imports: [CommonModule, ButtonModule, TooltipModule, TableModule],
  templateUrl: './grid.html',
  styleUrl: './grid.css'
})
export class Grid {

  public commonService = inject(CommonService);
  private communicationService = inject(CommunicationService);

  getAllServiceCompanyNames(companies: ServiceCompanyInfo[]): string {
    return companies.map(company => this.commonService.formatName(company?.name)).join(', ');
  }

  initiateRunMSA(well: WellboreInfo): void {
    this.communicationService.processWellboreForMSA(well.wellboreInfo.wellboreId.value!).subscribe((data: boolean) => {
      if (data) {
        this.commonService.showNotification('success', 'MSA Initiated for ' + well.wellboreInfo.wellboreId.value, '');
      } else {
        this.commonService.showNotification('error', 'Failed to Initiate MSA for ' + well.wellboreInfo.wellboreId.value, '');
      }
    });
  }

}
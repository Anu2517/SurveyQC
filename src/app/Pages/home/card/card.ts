import { Component } from '@angular/core';
import { CommonService } from '../../../services/common-service';
import { CommunicationService } from '../../../services/communication-service';
import { ScrollerModule } from 'primeng/scroller';
import { TooltipModule } from 'primeng/tooltip';
import { ButtonModule } from 'primeng/button';
import { CommonModule, DatePipe } from '@angular/common';

@Component({
  selector: 'app-card',
  imports: [ScrollerModule, TooltipModule, ButtonModule, DatePipe, CommonModule],
  templateUrl: './card.html',
  styleUrl: './card.css',
})
export class Card {

  constructor(public _commonService: CommonService, private _communicationService: CommunicationService) {
    this._commonService.getMonitorWellBores();
  }

  getAllServiceCompanyNames(companies: any[]): string {
    return companies.map(company => this._commonService.formatName(company?.name)).join(', ');
  }

  InitiateRunMSA(well: any) {
    this._communicationService.ProcessWellboreForMSA(well.wellboreInfo.wellboreId.value).subscribe((data: any) => {
      if(data){
        this._commonService.showNotification('success', 'MSA Initiated for '+ well.wellboreInfo.wellboreId.value, '')
      }
      else{
        this._commonService.showNotification('error', 'Failed to Initiate MSA for '+ well.wellboreInfo.wellboreId.value, '')
      }

    });
  }

}

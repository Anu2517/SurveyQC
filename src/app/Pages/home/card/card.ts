import { Component, inject, OnInit } from '@angular/core';
import { CommonService } from '../../../services/common-service';
import { CommunicationService } from '../../../services/communication-service';
import { ScrollerModule } from 'primeng/scroller';
import { TooltipModule } from 'primeng/tooltip';
import { ButtonModule } from 'primeng/button';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-card',
  imports: [ScrollerModule, TooltipModule, ButtonModule, DatePipe],
  templateUrl: './card.html',
  styleUrl: './card.css',
})
export class Card implements OnInit {
  public commonService = inject(CommonService);
  private communicationService = inject(CommunicationService);

  ngOnInit(): void { }

  getAllServiceCompanyNames(companies: any[]): string {
    return companies.map(company => this.commonService.formatName(company?.name)).join(', ');
  }

  initiateRunMSA(well: any): void {
    this.communicationService.processWellboreForMSA(well.wellboreInfo.wellboreId.value).subscribe((data: boolean) => {
      if(data){
        this.commonService.showNotification('success', 'MSA Initiated for '+ well.wellboreInfo.wellboreId.value, '')
      }
      else{
        this.commonService.showNotification('error', 'Failed to Initiate MSA for '+ well.wellboreInfo.wellboreId.value, '')
      }

    });
  }

}

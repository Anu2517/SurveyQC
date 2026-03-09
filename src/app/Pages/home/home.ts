import { Component, inject } from '@angular/core';
import { CommonService } from '../../services/common-service';
import { CommonModule } from '@angular/common';
import { Card } from './card/card';
import { Grid } from './grid/grid';
import { Map } from './map/map';

@Component({
  selector: 'app-home',
  imports: [CommonModule, Card, Grid, Map],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home {
  public _commonService = inject(CommonService);

}

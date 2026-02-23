import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class CommunicationService {
  private http = inject(HttpClient);

  public getVersion(): Observable<any> {
    return this.http.get(
      environment.baseUrl + 'version/GetVersion',
      { responseType: 'text' }
    );
  }

  public getSummaryInformation(): Observable<any> {
    return this.http.get(
      environment.baseUrl + 'wells/get-system-summary-information'
    );
  }

  public getSimulationModeStatus(): Observable<any> {
    return this.http.get(
      environment.witsmlUrl + 'job-manager/is-simulation-mode'
    );
  }
  
}

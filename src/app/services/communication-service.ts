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

  public startProcessing(): Observable<any> {
    return this.http.get(environment.witsmlUrl + 'job-manager/start-processing');
  }

  //wellBore

  public getCompressedWell() {
    return this.http.get('welldata.json')
  }

  public getMonitoredWellbores(): Observable<any> {
    return this.http.get(environment.baseUrl + 'wells/get-monitored-wellbores');
  }

  public getWellboreState(wellboreId: any): Observable<any> {
    return this.http.get(`${environment.baseUrl}wells/get-wellbore-state?wellboreId=${wellboreId}`);
  }

  public getWellboreSurveys(wellboreId: any): Observable<any> {
    return this.http.get(`${environment.baseUrl}wells/get-wellbore-surveys?wellboreId=${wellboreId}`);
  }

  public updateWellboreSurveyStatus(surveys: any): Observable<any> {
    return this.http.post(environment.baseUrl + 'wells/update-wellbore-survey-status', surveys);
  }

  public ProcessWellboreForMSA(wellboreId: any): Observable<any> {
    return this.http.post(environment.baseUrl + 'MSAProcessor/Process-Wellbore-MSA',
      JSON.stringify(wellboreId),
      { headers: { 'Content-Type': 'application/json' } }
    );
  }

  //SurveyQueue
  public getSurveyQueue(): Observable<any> {
    return this.http.get(environment.baseUrl + 'process-manager/get-survey-queue');
  }

  //email
  public getEmailConfiguration(): Observable<any> {
    return this.http.get(environment.baseUrl + 'configuration-manager/get-email-configuration');
  }

  public updateEmailConfiguration(config: any): Observable<any> {
    return this.http.post(environment.baseUrl + 'configuration-manager/update-email-configuration', config);
  }

  //Settings 
  public getWitsmlConnection(): Observable<any> {
    return this.http.get(environment.witsmlUrl + 'witsml/get-witsml-connection');
  }

  public isWitsmlConnectionValid(): Observable<any> {
    return this.http.get(environment.witsmlUrl + 'witsml/active-witsml-connection-valid');
  }

  public updateWitsmlConnection(payload: any): Observable<any> {
    return this.http.post(environment.witsmlUrl + 'witsml/update-witsml-connection', payload);
  }

  public testWitsmlConnection(payload: any): Observable<any> {
    return this.http.post(environment.witsmlUrl + 'witsml/test-witsml-connection', payload);
  }

  //Overall Summary Charts
  public getErrorSummmary() {
    return this.http.get(environment.baseUrl + 'process-manager/get-error-summary');
  }

  //FacLimits
  public getFacLimits(): Observable<any> {
    return this.http.get(environment.baseUrl + 'configuration-manager/get-fac-limits');
  }

  public updateFacLimits(config: any): Observable<any> {
    return this.http.post(environment.baseUrl + 'configuration-manager/update-fac-limits', config);
  }

  public getProcessConfiguration(): Observable<any> {
    return this.http.get(environment.baseUrl + 'configuration-manager/get-process-configuration');
  }

  public updateProcessConfiguration(payload: any): Observable<any> {
    return this.http.post(environment.baseUrl + 'configuration-manager/update-process-configuration', payload);
  }
}

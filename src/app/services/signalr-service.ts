import { EventEmitter, Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { environment } from '../../environments/environment';
import { HubConnection, HubConnectionBuilder, HubConnectionState } from '@microsoft/signalr';

@Injectable({
  providedIn: 'root',
})
export class SignalrService {
  public isServerConnectedSubject = new BehaviorSubject<boolean>(false);
  isServerConnected$ = this.isServerConnectedSubject.asObservable();

  // Survey count updates (used in sidebar)
  public wellboreSurveysCounts: EventEmitter<any> = new EventEmitter();

  private connection!: HubConnection;
  public signalRUrl: string = environment.signalRUrl;
  private reconnecting = false;

  constructor() {
    this.createConnection();
    this.startConnection();
  }

  private createConnection() {
    this.connection = new HubConnectionBuilder()
      .withUrl(this.signalRUrl)
      .build();

    this.connection.onclose(() => {
      this.handleDisconnect();
    });
  }

  private handleDisconnect() {
    this.isServerConnectedSubject.next(false);
    localStorage.setItem('isServerConnected', 'false');
    this.reconnecting = false;

    setTimeout(() => this.startConnection(), 60000);
  }

  private async startConnection(): Promise<void> {

    if (this.connection.state !== HubConnectionState.Disconnected || this.reconnecting) {
      return;
    }

    this.reconnecting = true;

    try {
      await this.connection.start();
      this.setupConnection();
    } catch (error) {
      this.handleDisconnect();
    } finally {
      this.reconnecting = false;
    }
  }

  private setupConnection() {

    this.isServerConnectedSubject.next(true);
    localStorage.setItem('isServerConnected', 'true');

    this.setupEventListeners();
  }

  private setupEventListeners() {

    // Sidebar survey count update
    this.connection.on("SystemSummaryInformation", (wellboreId: string, value: any) => {
      this.wellboreSurveysCounts.emit({
        wellboreId,
        value
      });
    });
  }
  
}

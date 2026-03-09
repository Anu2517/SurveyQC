import { Component, ViewChild, TemplateRef, ViewContainerRef, EmbeddedViewRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as L from 'leaflet';
import 'leaflet.markercluster';
import { CommonService } from '../../../services/common-service';
import { CommunicationService } from '../../../services/communication-service';
import { ProcessSummary, WellboreInfo } from '../../../models/WellBore/WellBoreInfoModel';

@Component({
  selector: 'app-map',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './map.html',
  styleUrl: './map.css'
})
export class Map {

  @ViewChild('popupTemplate', { static: true }) popupTemplate!: TemplateRef<any>;
  @ViewChild('markerTemplate', { static: true }) markerTemplate!: TemplateRef<any>;
  @ViewChild('clusterTemplate', { static: true }) clusterTemplate!: TemplateRef<any>;

  public mapInstance!: L.Map;
  public popupRig: WellboreInfo | null = null;
  private markerClusterGroup!: L.MarkerClusterGroup;

  constructor(
    public _commonService: CommonService,
    private _communicationService: CommunicationService,
    private _viewContainerRef: ViewContainerRef
  ) { }

  ngOnInit(): void {
    this._commonService.isFilterApplied.subscribe((data: any) => {
      if (this._commonService.selectedDashboardLayout === 'Map' && data == false) {
        this.reinitializeMap();
      } else if (this._commonService.selectedDashboardLayout === 'Map' && this._commonService.isAutoRefreshEnable) {
        this.reinitializeMap();
      }
    });
  }

  ngAfterViewInit(): void {
    this.initializeMap();
  }

  private renderTemplate(template: TemplateRef<any>, context: any): HTMLElement {
    this._viewContainerRef.clear();
    const view: EmbeddedViewRef<any> = this._viewContainerRef.createEmbeddedView(template, context);
    view.detectChanges();
    const wrapper = document.createElement('div');
    view.rootNodes.forEach((node: any) => wrapper.appendChild(node));
    return wrapper;
  }

  getServiceCompanies(rig: WellboreInfo | null): string {
    return rig?.wellboreInfo?.serviceCompanyInfos
      ? Object.values(rig.wellboreInfo.serviceCompanyInfos)
        .map(c => this._commonService.formatName(c.name)).join(', ')
      : 'N/A';
  }

  getProcessSummary(rig: WellboreInfo | null): ProcessSummary[] {
    return Object.values(rig?.processSummary || {});
  }

  onRunMSA(): void {
    const wellboreId = this.popupRig?.wellboreInfo?.wellboreId?.value;
    this._communicationService.ProcessWellboreForMSA(wellboreId).subscribe((data: any) => {
      this._commonService.showNotification(
        data ? 'success' : 'error',
        (data ? 'MSA Initiated for ' : 'Failed to Initiate MSA for ') + wellboreId,
        ''
      );
    });
  }

  onViewSurveys(): void {
    const id = this.popupRig?.wellboreInfo?.wellboreId?.value ?? '';
    this._commonService.viewWellboreSurveys(id);
  }

  onViewCharts(): void {
    const id = this.popupRig?.wellboreInfo?.wellboreId?.value ?? '';
    this._commonService.viewWellboreCharts(id);
  }

  onViewReport(): void {
    if (this.popupRig) this._commonService.viewWellboreReport(this.popupRig);
  }

  reinitializeMap(): void {
    if (this.mapInstance) {
      this.mapInstance.eachLayer((layer: L.Layer) => this.mapInstance.removeLayer(layer));
      this.mapInstance.off();
      this.mapInstance.remove();
    }
    const mapContainer = document.getElementById('map');
    if (mapContainer && mapContainer.hasChildNodes()) {
      mapContainer.innerHTML = '';
    }
    this.initializeMap();
  }

  initializeMap(): void {
    const initialCenter: L.LatLngExpression = [24.0, 45.0];
    const initialZoom = 6;

    this.mapInstance = new L.Map('map', {
      center: initialCenter,
      zoom: initialZoom,
      minZoom: 1,
      maxZoom: 15,
      worldCopyJump: true
    });

    this.addTileLayer();
    this.addResetControl(initialCenter, initialZoom);
    this.addMarkers();

    setTimeout(() => {
      this.mapInstance.invalidateSize();
    }, 100);
  }

  private addTileLayer(): void {
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      opacity: 1,
      zoomOffset: 0,
      maxZoom: 50,
      minZoom: 0,
      detectRetina: true,
      noWrap: false,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    }).addTo(this.mapInstance);
  }

  private addResetControl(center: L.LatLngExpression, zoom: number): void {
    const resetControl = new L.Control({ position: 'topright' });
    resetControl.onAdd = (map: L.Map) => {
      const div = L.DomUtil.create('div', 'leaflet-bar leaflet-control leaflet-control-custom');
      const btn = document.createElement('button');
      btn.className = 'reset-btn';
      btn.textContent = 'Reset';
      btn.onclick = () => map.setView(center, zoom);
      div.appendChild(btn);
      return div;
    };
    resetControl.addTo(this.mapInstance);
  }

  private addMarkers(): void {
    if (!this.mapInstance || !this._commonService.filteredWellBoreArr?.length) return;

    if (this.markerClusterGroup) {
      this.mapInstance.removeLayer(this.markerClusterGroup);
      this.markerClusterGroup.clearLayers();
    }

    this.markerClusterGroup = L.markerClusterGroup({
      showCoverageOnHover: false,
      maxClusterRadius: 80,
      spiderfyOnMaxZoom: true,
      zoomToBoundsOnClick: true,
      spiderLegPolylineOptions: { weight: 1.5, color: '#333', opacity: 0.7 },
      iconCreateFunction: (cluster) => this.getClusterIcon(cluster),
    });

    this._commonService.filteredWellBoreArr.forEach((rig: WellboreInfo) => {
      const latitude = rig?.wellboreInfo?.latitude?.value;
      const longitude = rig?.wellboreInfo?.longitude?.value;
      if (latitude == null || longitude == null) return;
      this.markerClusterGroup.addLayer(this.createMarker(rig, latitude, longitude));
    });

    this.mapInstance.addLayer(this.markerClusterGroup);
  }

  private getClusterIcon(cluster: L.MarkerCluster): L.DivIcon {
    let hasAnyAutoRejected = false;
    let hasAnyUserRejected = false;

    cluster.getAllChildMarkers().forEach((marker: any) => {
      const rig = this._commonService.filteredWellBoreArr?.find(
        (r: any) => r?.wellboreInfo?.wellboreId?.value?.trim() === marker.wellboreId
      );
      if (!rig || !Array.isArray(rig.processSummary)) return;
      rig.processSummary.forEach((summary: any) => {
        if (summary?.totalAutoRejectedSurveys > 0) hasAnyAutoRejected = true;
        if (summary?.totalUserRejectedSurveys > 0) hasAnyUserRejected = true;
      });
    });

    const color = hasAnyAutoRejected
      ? 'rgba(247, 39, 39, 0.8)'
      : hasAnyUserRejected
        ? 'rgba(140, 4, 4, 0.8)'
        : 'rgba(0, 153, 51, 0.8)';

    const el = this.renderTemplate(this.clusterTemplate, {
      color,
      count: cluster.getChildCount()
    });

    return L.divIcon({
      html: el.innerHTML,
      className: '',
      iconSize: [40, 40]
    });
  }

  private createMarker(rig: WellboreInfo, latitude: number, longitude: number): L.Marker {
    const color = this.getStatusColor(rig);
    const label = rig.wellboreInfo.wellId.value;

    const el = this.renderTemplate(this.markerTemplate, { color, label });

    const customIcon = L.divIcon({
      className: 'custom-leaflet-marker',
      iconSize: [20, 20],
      html: el.innerHTML
    });

    const marker = L.marker([latitude, longitude], { icon: customIcon }) as any;
    marker.wellboreId = rig?.wellboreInfo?.wellboreId?.value ?? '';

    marker.on('click', () => {
      this.popupRig = rig;
      const popupEl = this.renderTemplate(this.popupTemplate, {});
      marker.bindPopup(popupEl).openPopup();
    });

    return marker;
  }

  private getStatusColor(rig: WellboreInfo): string {
    let color = 'rgba(2, 255, 12, 0.6)';
    if (rig.processSummary) {
      Object.values(rig.processSummary).forEach((summary: any) => {
        if ((summary.totalUserRejectedSurveys ?? 0) > 0) {
          color = 'red';
        } else if ((summary.totalAutoRejectedSurveys ?? 0) > 0) {
          color = 'rgba(247, 39, 39, 0.644)';
        }
      });
    }
    return color;
  }
}
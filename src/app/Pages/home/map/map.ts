import { Component, ViewChild, TemplateRef, ViewContainerRef, EmbeddedViewRef, ElementRef, DestroyRef, inject, AfterViewInit, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import * as L from 'leaflet';
import 'leaflet.markercluster';
import { CommonService } from '../../../services/common-service';
import { CommunicationService } from '../../../services/communication-service';
import { ProcessSummary, WellboreInfo } from '../../../models/WellBore/WellBoreInfoModel';

const DEFAULT_MAP_CENTER: L.LatLngExpression = [24.0, 45.0];
const DEFAULT_MAP_ZOOM = 6;
const MAP_MIN_ZOOM = 1;
const MAP_MAX_ZOOM = 15;
const MAP_RESIZE_DELAY = 100;

@Component({
  selector: 'app-map',
  imports: [CommonModule],
  templateUrl: './map.html',
  styleUrl: './map.css'
})
export class Map implements OnInit, AfterViewInit {

  @ViewChild('mapContainer', { static: true })
  mapContainer!: ElementRef<HTMLDivElement>;

  @ViewChild('popupTemplate', { static: true }) popupTemplate!: TemplateRef<any>;
  @ViewChild('markerTemplate', { static: true }) markerTemplate!: TemplateRef<any>;
  @ViewChild('clusterTemplate', { static: true }) clusterTemplate!: TemplateRef<any>;

  public mapInstance!: L.Map;
  public popupRig: WellboreInfo | null = null;
  private markerClusterGroup!: L.MarkerClusterGroup;
  private destroyRef = inject(DestroyRef);
  public commonService = inject(CommonService);
  private communicationService = inject(CommunicationService);
  private viewContainerRef = inject(ViewContainerRef);

  ngOnInit(): void {
    this.commonService.isFilterApplied
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((data: any) => {
        if (this.commonService.selectedDashboardLayout === 'Map' && data == false) {
          this.reinitializeMap();
        } else if (this.commonService.selectedDashboardLayout === 'Map' && this.commonService.isAutoRefreshEnable) {
          this.reinitializeMap();
        }
      });
  }

  ngAfterViewInit(): void {
    this.initializeMap();
  }

  private renderTemplate(template: TemplateRef<any>, context: any): HTMLElement {
    this.viewContainerRef.clear();
    const view: EmbeddedViewRef<any> = this.viewContainerRef.createEmbeddedView(template, context);
    view.detectChanges();
    const wrapper = document.createElement('div');
    view.rootNodes.forEach((node: any) => wrapper.appendChild(node));
    return wrapper;
  }

  getServiceCompanies(rig: WellboreInfo | null): string {
    return rig?.wellboreInfo?.serviceCompanyInfos
      ? Object.values(rig.wellboreInfo.serviceCompanyInfos)
        .map(c => this.commonService.formatName(c.name)).join(', ')
      : 'N/A';
  }

  getProcessSummary(rig: WellboreInfo | null): ProcessSummary[] {
    return Object.values(rig?.processSummary || {});
  }

  onRunMSA(): void {
    const wellboreId = this.popupRig?.wellboreInfo?.wellboreId?.value;
    if (!wellboreId) return;
    this.communicationService.processWellboreForMSA(wellboreId).subscribe((data: boolean) => {
      this.commonService.showNotification(
        data ? 'success' : 'error',
        (data ? 'MSA Initiated for ' : 'Failed to Initiate MSA for ') + wellboreId,
        ''
      );
    });
  }

  onViewSurveys(): void {
    const id = this.popupRig?.wellboreInfo?.wellboreId?.value ?? '';
    this.commonService.viewWellboreSurveys(id);
  }

  onViewCharts(): void {
    const id = this.popupRig?.wellboreInfo?.wellboreId?.value ?? '';
    this.commonService.viewWellboreCharts(id);
  }

  onViewReport(): void {
    if (this.popupRig) this.commonService.viewWellboreReport(this.popupRig);
  }

  reinitializeMap(): void {
    if (this.mapInstance) {
      this.mapInstance.eachLayer((layer: L.Layer) => this.mapInstance.removeLayer(layer));
      this.mapInstance.off();
      this.mapInstance.remove();
    }
    const container = this.mapContainer.nativeElement;
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }

    this.initializeMap();
  }

  initializeMap(): void {
    this.mapInstance = new L.Map(this.mapContainer.nativeElement, {
      center: DEFAULT_MAP_CENTER,
      zoom: DEFAULT_MAP_ZOOM,
      minZoom: MAP_MIN_ZOOM,
      maxZoom: MAP_MAX_ZOOM,
      worldCopyJump: true
    });

    this.addTileLayer();
    this.addResetControl(DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM);
    this.addMarkers();

    setTimeout(() => {
      this.mapInstance.invalidateSize();
    }, MAP_RESIZE_DELAY);
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
    if (!this.mapInstance || !this.commonService.filteredWellBoreArr?.length) return;

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

    this.commonService.filteredWellBoreArr.forEach((rig: WellboreInfo) => {
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
      const rig = this.commonService.filteredWellBoreArr?.find(
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
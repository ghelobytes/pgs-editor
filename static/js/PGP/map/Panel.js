Ext.define('PGP.map.Panel', {
	extend: 'Ext.panel.Panel',
	alias: 'widget.pgp-map-panel',
	title: 'Preview',
	width: 100,
	height: 100,
	layout: 'fit',
	minWidth: 500,
	region: 'east',
	map: null,
	split: true,	
	listeners: {
		afterrender: function () {
			var wh = this.ownerCt.getSize();
			Ext.applyIf(this, wh);
			
			var pgp_basemap_cache = new OpenLayers.Layer.NAMRIA(
				'NAMRIA Basemap',
				'http://202.90.149.252/ArcGIS/rest/services/Basemap/PGS_Basemap/MapServer',
				{
					isBaseLayer: true
				}
			);
			
			var municipal_boundary = new OpenLayers.Layer.WMS( 
				'Admin Boundary',
				'http://geoserver.namria.gov.ph/geoserver/geoportal/wms', 
				{
					layers: 'geoportal:adminbnd_munic',
					transparent: true 
				},
				{
					isBaseLayer: false,
					opacity: 0.5
				}
			);

			this.map = new OpenLayers.Map(
				// render the map to the body of this panel
				this.body.dom.id,
				{ 
					controls: [
						new OpenLayers.Control.Navigation(),
						//new OpenLayers.Control.LayerSwitcher(),
						new OpenLayers.Control.Zoom(),
						//new OpenLayers.Control.MousePosition({
						//	displayProjection: 'EPSG:4326'
						//})
					],
					fallThrough: true,
					projection: 'EPSG:900913',
					theme: null
				}
			);

			this.map.addLayers([pgp_basemap_cache]);
			this.map.zoomToMaxExtent();	
			
		},
		// The resize handle is necessary to set the map!
		resize: function () {
			var size = [document.getElementById(this.id + "-body").offsetWidth, document.getElementById(this.id + "-body").offsetHeight];
			this.map.updateSize(size);
		}
	},
	getMap: function(){
		console.log('getMap', this.map);
		return this.map;
	}
});
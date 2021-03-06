Ext.Loader.setConfig({
	disableCaching: true,
    enabled: true,
    paths: {
        PGP:'js/PGP'
    } 
});


Ext.require('Ext.window.Window');
Ext.require('PGP.layer.Uploader');
Ext.require('PGP.layer.Manager');
Ext.require('PGP.map.Panel');


Ext.onReady(function() {
   
	Ext.create('Ext.container.Viewport', {
	    layout: 'fit',
		items: [
			{
				xtype: 'pgp-layer-manager',
				//wmsService: 'http://202.90.149.232:80/geoserver/geoportal/wms',
				wmsService: 'http://202.90.149.232/geoserver/wms'
			}
		]
		
	});
	
});
Ext.Loader.setConfig({
	disableCaching: true,
    enabled: true,
    paths: {
        PGP:'js/PGP'
    } 
});


Ext.require('PGP.layer.Manager');

Ext.onReady(function() {
   
	Ext.create('Ext.container.Viewport', {
	    layout: 'fit',
		items: [
			{
				xtype: 'pgp-layer-manager'
			}
		]
		
	});
	
});
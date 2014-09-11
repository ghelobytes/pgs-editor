Ext.Loader.setConfig({
	enabled: true,
	// Don't set to true, it's easier to use the debugger option to disable caching
	disableCaching: false,
	paths: {
		'PGP': '../app/',
		'GeoExt': '../lib/geoext/',
	}
});


Ext.require([

	'Ext.Panel',
    'Ext.grid.*',
    'Ext.data.*',
    'Ext.util.*',
    'Ext.state.*',
    'Ext.form.*',
	'PGP.common.Utilities',
	'PGP.view.Header',
	
	
	
	
    'Ext.data.writer.Json',
    'Ext.grid.Panel',
    'GeoExt.data.reader.WmsCapabilities',
    'GeoExt.data.WmsCapabilitiesLayerStore',
    'GeoExt.panel.Map',
	
]);


Ext.define('PGP.view.MyComponent', {
	alias: 'widget.pgp_mycomponent',
	extend: 'Ext.Container',
	tbar: {
		xtype: 'toolbar',
	    items: [
	        {
	            text: 'Button'
	        },
	        {
	            xtype: 'splitbutton',
	            text : 'Split Button'
	        },
	        '->',
	        {
	            xtype    : 'textfield',
	            name     : 'field1',
	            emptyText: 'enter search term'
	        }
	    ]
	},
	showLayerList: false,
	getLayerMetadata: function(layer_name, style){
		return PGP.common.Utilities.queryTableAsJson("select * from configuration.layer_metadata where layer_name = '" + layer_name + "' and style = '" + style + "'");
	},
	getLayerAttributes: function(layer_name){
		return PGP.common.Utilities.queryTableAsJson("select column_name from information_schema.columns where table_name='" + layer_name + "';");
	},
	// from https://gist.github.com/sente/1083506
	prettyPrintXML: function(xml){
	
	    var formatted = '';
	    var reg = /(>)(<)(\/*)/g;
	    xml = xml.replace(reg, '$1\r\n$2$3');
	    var pad = 0;
	    //jQuery.each(xml.split('\r\n'), function(index, node) {
		Ext.each(xml.split('\r\n'), function(node) {
		
	        var indent = 0;
	        if (node.match( /.+<\/\w[^>]*>$/ )) {
	            indent = 0;
	        } else if (node.match( /^<\/\w/ )) {
	            if (pad != 0) {
	                pad -= 1;
	            }
	        } else if (node.match( /^<\w[^>]*[^\/]>.*$/ )) {
	            indent = 1;
	        } else {
	            indent = 0;
	        }

	        var padding = '';
	        for (var i = 0; i < pad; i++) {
	            padding += '  ';
	        }

	        formatted += padding + node + '\r\n';
	        pad += indent;
  
		});

	    return formatted;

	},
	initComponent: function() {
		
		var me = this;
		
		
		
		
		
		// uploading
		
		
		
		
		
		
		
		
		// http://stackoverflow.com/questions/7152219/extjs-4-problem-trying-to-do-update-on-deeply-nested-json-data
		Ext.override(Ext.data.writer.Json,{
			getRecordData: function(record) {
		    	Ext.apply(record.data,record.getAssociatedData());
				return record.data;
		    }
		});
		
		Ext.define('Config', {
		    extend:'Ext.data.Model',
		    fields:[
		        'attribute',
		        'alias'
		    ]
		});
		Ext.define('LayerConfig', {
			extend: 'Ext.data.Model',
			fields:[
				'layer_name', 
				'style',
				'title',
				'description',
				'date_updated',
				'tags',
				'agency',
				'sector',
				'tiled',
				'listed',
				'sld',
				'metadata',
				{ name: 'config', persist: true }
			],
			hasMany: [
		        {
		            name:'config',
		            model: 'Config',
		            associationKey:'config'
		        }
		    ],										
			proxy: {
				type: 'rest',
				url : '/webapi/editor/layerconfig/'
			}
		});
		
		Ext.define('Ext.ux.CustomTrigger', {
			extend: 'Ext.form.field.Trigger',
			alias: 'widget.customtrigger',
			initComponent: function () {
				var me = this;
				// native ExtJS class & icon
				me.triggerCls = 'x-form-clear-trigger';
				me.callParent(arguments);
			},
			// override onTriggerClick
			onTriggerClick: function() {
				this.setRawValue('');
				layerListStore.clearFilter();
			}
		});
	
		var me = this;
		var loadRecord;
		
		var attributeStore = Ext.create('Ext.data.Store', {
			fields: ['column_name']
		});
		
		var layerListStore = Ext.create('Ext.data.Store', {
			fields:['id','layer_name','title'],
			proxy: {
				type: 'ajax',
				url: '/webapi/editor/layerconfig/',
				reader: {
					type: 'json'
				}
			}
		});
		layerListStore.load();
		
		
		var search = {
			xtype: 'customtrigger',
			emptyText: 'Filter layers',
			padding: 10,
			listeners: {
				change: function(me, newValue, oldValue){
					layerListStore.clearFilter();
					layerListStore.filter([
						{
							filterFn: function(item) { 
								return (item.data["title"] + ' ' + item.data["layer_name"]).toLowerCase().indexOf(newValue.toLowerCase()) > -1;
								//return item.get("age") > 10; 
							}
						}
					]);
				}
			}
		};

		var grid = Ext.create('Ext.grid.Panel',{
			title: 'Layers',
			region: 'west',
			flex: 0.75/3,
			split: true,
			collapsible: true,
			store: layerListStore,
			columns: [
				{ text: 'Title',  dataIndex: 'title', flex: 1}
			],
			hideHeaders: true,
			border: false,
			dockedItems: [
				search
			],
			listeners: {
				
				select: function(control, item){
					var id = item.data["id"];
					Ext.ModelManager.getModel('LayerConfig').load(id, {
						success: function(record, operation) {							
							currentRecord = record;
							var pnlGeneral = Ext.getCmp('pnlGeneral');
							pnlGeneral.loadRecord(currentRecord);
							
							var attribGrid = Ext.getCmp('attribGrid');
							attribGrid.reconfigure(currentRecord.config());
						}
					});
					var layer_name = item.data["layer_name"];
					var data = me.getLayerAttributes(layer_name).result;
					
					attributeStore.loadData(data);

				}
			}
		});
		
		grid.setVisible(this.showLayerList);
		
		var required = '<span style="color:red;font-weight:bold" data-qtip="Required">*</span>';
		var datasetContact = [{
			xtype: 'textfield',
			fieldLabel: 'Name', 
			name: 'dc_individualName',
			tooltip: 'Fill your Name',
			afterLabelTextTpl: required,
			width:350,	
			allowBlank: false,
			emptyText: 'Who will be the point of contact?'
		},{
			xtype: 'textfield',
			fieldLabel: 'Organization',
			name: 'dc_organisationName',
			id: '2',
			width: 350, 
		},{
			xtype: 'textfield',
			fieldLabel: 'Position',
			name: 'dc_positionName',
			width: 350,	
		},{
			xtype: 'textfield',
			fieldLabel: 'Telephone No',
			width: 250,       
		},{
			xtype: 'textfield',
			fieldLabel: 'Fax No',
			width: 250,	
		}, {
			xtype: 'textareafield',			
			fieldLabel: 'Address',
			id: '6',
			width: 350,		
		},{
			xtype: 'textfield',
			fieldLabel: 'City',
			id: '7',
			width: 350,
		},{
			xtype: 'textfield',
			fieldLabel: 'State/Province',
			id: '8',
			width: 350,
		},{
			xtype: 'textfield',
			fieldLabel: 'Zip/Postal Code',
			id: '9',
			width: 350,	
		}, {
			xtype: 'textfield',
			fieldLabel: 'Country',
			id: '10',
			width: 350,
		}, {
			xtype: 'textfield',
			fieldLabel: 'Email Address',
			id: '11',
			width: 350,	
			allowBlank: false ,	
			afterLabelTextTpl: required,
			vtype: 'email',
			emailRe: /^([a-zA-Z0-9_\.\-])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/,
		}];
		
		var metadataEditor = {
			xtype: 'tabpanel',
			defaults: {
				margin: 10
			},
			items: [
				{ 
					title: 'Dataset contact' ,
					items: datasetContact
				},
				{ 
					title: 'Panel2' 
				},
				{ 
					title: 'Panel3' 
				},
				{ 
					title: 'Panel4' 
				},
				{ 
					title: 'Panel5' 
				}
				
			]
		};
		
		metadataEditor = {
							xtype: 'textarea',
							anchor: '100% 100%',
							name: 'metadata',
							fieldStyle: {
								fontFamily: 'courier new',
								fontSize: '11px'
							}
						};

		var tabpanel = {
			xtype:'tabpanel',
			title: 'Layer: denr_aqms',
			//activeTab: 2,
			defaults: {
				margin: 10
			},
			items: [{
					title: 'General',
					defaults:{
						width: 500
					},
					items:[
						{
							xtype: 'textfield',
							name: 'layer_name',
							fieldLabel: 'Layer name',
							readOnly: true
						},{
							xtype: 'textfield',
							name: 'style',
							fieldLabel: 'Style'
						},{
							xtype: 'textfield',
							name: 'title',
							fieldLabel: 'Title'
						},{
							xtype: 'textareafield',
							name: 'description',
							fieldLabel: 'Description'
						},{
							xtype: 'datefield',
							name: 'date_updated',
							fieldLabel: 'Date updated'
						},{
							xtype: 'combo',
							name: 'cmbAgency',
							fieldLabel: 'Agency'
						},{
							xtype: 'combo',
							name: 'cmbSector',
							fieldLabel: 'Category'
						},{
							xtype: 'textfield',
							name: 'tags',
							fieldLabel: 'Tags'
						},{
							xtype: 'checkboxfield',
							name: 'tiled',
							fieldLabel: 'Tiled'
		
						},{
							xtype: 'checkboxfield',
							name: 'listed',
							fieldLabel: 'Listed'
						}
					]
				},
				{
					title: 'Attributes',
					items:[
					{
						xtype: 'grid',
						id: 'attribGrid',
						viewConfig: {
							markDirty: false
						},
					    columns: [
					        { header: 'Attribute',  dataIndex: 'attribute', flex: 0.5 },
					        { header: 'Alias', dataIndex: 'alias', editor: 'textfield', flex: 2.5 },
							{
				                xtype: 'actioncolumn',
				                width: 30,
				                sortable: false,
				                menuDisabled: true,
				                items: [{
				                    icon: '/resources/img/remove.png',
				                    tooltip: 'Delete Plant',
				                    handler: function(grid, rowIndex){
								        grid.getStore().removeAt(rowIndex);
								    }
				                }]
				            }
					    ],
					    selType: 'cellmodel',
						plugins: [
						   Ext.create('Ext.grid.plugin.CellEditing', {
						       clicksToEdit: 1
						   })
						]
					},
					{
						xtype: 'panel',
						margin: '5 0 5 0',
						layout: 'hbox',
						defaults: {
							margin: 5
						}, 
						items:[
							{
								xtype: 'combo',
								id: 'cmbAttribute',
								store: attributeStore,
								emptyText: 'attribute',
								displayField: 'column_name',
								valueField: 'column_name',
								editable: false,
								queryMode: 'local'
							},
							{
								xtype: 'textfield',
								id: 'txtAlias',
								emptyText: 'alias'
							},
							{
								xtype: 'button',
								text: 'Add',
								handler: function(){
									var cmbAttribute = Ext.getCmp('cmbAttribute');
									var txtAlias = Ext.getCmp('txtAlias');
									var configStore = currentRecord.config();
									var newItem = {
										attribute: cmbAttribute.getValue(),
										alias: txtAlias.getValue()
									};
									configStore.add(newItem);
								}
							}
							
						]
					}]
				},{
					title: 'Style',
					layout: 'anchor',
					items:[
						{
							xtype: 'textarea',
							anchor: '100% 100%',
							name: 'sld',
							fieldStyle: {
								fontFamily: 'courier new',
								fontSize: '11px'
							}
						}
					]
				},{
					title: 'Metadata',
					layout: 'anchor',
					items: metadataEditor
				}],
				flex: 2/3
		};
		
		var formPanel = Ext.create('Ext.form.Panel', {
			id:'pnlGeneral',
			title: 'General',
			region: 'center',
			bodyPadding: 5,
			layout: 'fit',
			fieldDefaults: {
				labelAlign: 'left',
				labelWidth: 100
			},
			dockedItems: [{
				xtype: 'toolbar',
				dock: 'top',
			    width: 400,
			    items: [
			        {
			            text: 'Save',
						handler: function(){
							
							formPanel.getForm().updateRecord(currentRecord);
							currentRecord.save({
								success: function(record, operation){
									Ext.Msg.alert({
										title: 'Status',
										msg: 'Changes saved successfully.',
										icon: Ext.Msg.QUESTION,
										buttons: Ext.Msg.OK,
									});
								}
							});
			
						}
			        },
			        {
			            text: 'Cancel',
						handler: function(){
					
							currentRecord.reject();
						}
			        }
			    ]
			}],
			items: [
				tabpanel
			]
		});
		
        var content = Ext.create('Ext.Panel',{
			itemId: 'mypanel',
 			region: 'east', 
 			split: true,
 			border: false,
 			title: 'Map',
 			flex: 2/3
         });

		
		Ext.apply(this, {
			items: [
				grid,
				formPanel,
				content
			]
		});
		
		
		this.callParent(arguments);
		
		
		
		
		
		
		
		
	}

});



var map;

Ext.onReady(function(){	
	
	// Entry point
	Ext.create('Ext.Viewport', {
        layout: 'border',
        title: 'Ext Layout Browser',
        items: [{
			xtype: 'pgp_header',
			region: 'north',
			title: 'PGP Map Editor'
		},{
			xtype: 'pgp_mycomponent',
			region: 'center',
			layout: 'border',
			showLayerList: true
		}],
		renderTo: Ext.getBody()
    });


	
	
});


function createMap(){

	var mapExtent = new OpenLayers.Bounds(
						13020672, 521106.59375,
						14091012, 2661799.75
					);
	
	map = new OpenLayers.Map('mapContainer', {
		maxExtent:mapExtent,
		projection: 'EPSG:3857',
		controls: [
			new OpenLayers.Control.Navigation(
				{dragPanOptions: {enableKinetic: true}}
			),
			new OpenLayers.Control.LayerSwitcher(), 
			new OpenLayers.Control.PanZoomBar(),
			new OpenLayers.Control.MousePosition()]
	});
	
	
	var gnis = new OpenLayers.Layer.WMS(
		"geoportal:mgd_geodeticcontrol - Tiled", "http://geoserver.namria.gov.ph/geoserver/geoportal/wms",
		{
			LAYERS: 'geoportal:adminbnd_prov',
			STYLES: '',
			format: 'image/png',
			tiled: true,
			tilesOrigin : map.maxExtent.left + ',' + map.maxExtent.bottom
		},
		{
			buffer: 0,
			displayOutsideMaxExtent: true,
			isBaseLayer: true,
			yx : {'EPSG:3857' : false}
		} 
	);
	
	map.addLayer(gnis);
	
	map.zoomToExtent(mapExtent);
	
	return map;

}








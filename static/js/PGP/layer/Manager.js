Ext.define('PGP.layer.Manager', {
	extend: 'Ext.panel.Panel',
	alias: 'widget.pgp-layer-manager',
	layout: 'border',
	wmsService: null,
	layerId: null,
	initComponent: function(){
		
		this.items = this.buildItems();
		this.callParent(arguments);
	},
	buildItems: function(){
		var items = [
			this.createLeftPanel(),
			this.createMiddlePanel(),
			this.createRightPanel()
		]
		return items;
	},
	createLeftPanel: function(){
		var me = this;
		var grid = Ext.create('Ext.grid.Panel',{
			xtype: 'grid',
			region: 'west',
			split: true,
			minWidth: 280,
			width: 280,
			flex: 0,
			title: 'Layers',
			hideHeaders: true,
			tbar: [
				{ 
					xtype: 'textfield', 
					emptyText: 'filter',
					flex: 1,
					triggers: {
						clear: {
							cls: 'x-form-clear-trigger',
							handler: function(){
								this.setRawValue(null);
							}
						}
					}
				}
			],
			tools: [
				{
					type: 'plus',
					handler: me.uploadLayer
				}
			],
			store: {
				fields: ['layer_name', 'title', 'description']
			},
			columns: [
				{ text: 'Title', dataIndex: 'title', flex: 1 }
			],
			listeners: {
				select: function(comp, rec){
					// get layer details
					me.loadLayerDetails(rec.get('layer_name'));
				}
			}
		});
		me.loadLayers(grid);
		return grid;
	
	},
	createMiddlePanel: function(){
		var me = this;
		
		var panel = {
			xtype: 'tabpanel',
			itemId: 'middlePanel',
			title: 'Settings',
			region: 'center',
			flex: 1.5,
			items: me.createTabs(),
			buttons: [
				{
					glyph: 'xe600@icomoon',
					text: 'Delete layer',
					scale: 'medium',
					handler: me.deleteLayer,
					scope: me
				},
				{xtype: 'tbfill'},
				{
					text: 'Save',
					glyph: 'xe604@icomoon',
					scale: 'large',
					handler: me.save,
					scope: me
				}
			],
			viewModel: {},
			bind: {
				title: 'Settings of <b>{title}</b>'
			}
		};
		return panel;
	},
	createRightPanel: function(){
		return Ext.create('PGP.map.Panel',{});
	},
	loadLayers: function(grid){
		var data = [];
		Ext.Ajax.request({
			url: '/layers',
			success: function(result){
				var obj = Ext.decode(result.responseText);
				grid.getStore().loadData(obj);
			},
			failure: function(error){
				
			}
		});
	},
	createTabs: function(){
		var me = this;
		var items = [
			{
				title: 'General',
				layout: {
					type: 'vbox',
					align: 'stretch',
					pack: 'start'
				},
				items: [
					{
						xtype: 'panel',
						title: 'Layer properties',
						bodyPadding: 20,
						padding: '20 20 10 20',
						defaults: {
							labelWidth: 100
						},
						layout: {
							type: 'vbox',
							align: 'stretch'
						},
						items: [
							{
								xtype: 'textfield',
								fieldLabel: 'Layer name',
								readOnly: true,
								disabled: true,
								bind: '{layer_name}'
							},
							{
								xtype: 'textfield',
								fieldLabel: 'Title',
								bind: '{title}'
							},
							{
								xtype: 'textarea',
								fieldLabel: 'Description',
								height: 100,
								bind: '{description}'
							},
							{
								xtype: 'textfield',
								itemId: 'tags',
								fieldLabel: 'Tags',
								bind: '{tags}'
							},
							{
								xtype: 'fieldcontainer',
								layout: 'hbox',
								items: [
								
									{
										xtype: 'datefield',
										fieldLabel: 'Date updated',
										bind: '{date_updated}'
									},
									{
										xtype: 'checkboxfield',
										boxLabel: 'Enabled',
										labelAlign: 'left',
										padding: '0 0 0 15',
										bind: '{listed}'
									},
									{
										xtype: 'checkboxfield',
										padding: '0 0 0 15',
										labelAlign: 'left',
										boxLabel: 'Tiled',
										bind: '{tiled}'
									}
								]
							
							}
						]
					},
					{
						xtype: 'grid',
						itemId: 'attributes',
						title: 'Visible attributes',
						padding: '10 20 20 20',
						flex: 1,
						store: Ext.create('Ext.data.Store',{
							fields: ['attribute', 'alias']
						}),
						//disableSelection: true,
						columns: [
							{
								xtype: 'rownumberer',
								header: 'No',
								width: 55,
								align: 'center'
							},
							{
								header: 'Attribute',
								itemId: 'attributeColumn',
								dataIndex: 'attribute',
								flex: 1
							},
							{
								header: 'Alias',
								dataIndex: 'alias',
								flex: 2,
								editor: {
									xtype: 'textfield',
									allowBlank: false
								}
							}
															
						],
						plugins: [
							{
								ptype: 'cellediting',
								plugindId: 'cellediting',
								clicksToEdit: 2
							}
						],
						viewConfig: {
							plugins: {
								ptype: 'gridviewdragdrop',
								dragText: 'Drag and drop to reorder appearance of properties'
							}
						},
						buttonAlign: 'left',
						tools: [
							{
								text: 'Add',
								type: 'plus',
								handler: function(){
									me.showAttributeListWindow();
								}
							},
							{
								text: 'Remove',
								type: 'minus',
								handler: function(){
									var grid = me.down('#attributes');
									var selection = grid.getSelectionModel().getSelection();
									
									if(selection.length > 0){
									
										selection = selection[0];
										grid.getStore().remove(selection);
									
									}
									
									
								}
							}
						],
						bind: '{attributes}'
					}
				]
			},
			{
				title: 'Style',
				layout: 'fit',
				padding: '5',
				tbar: [
					'->',
					{
						xtype: 'filefield',
						itemId: 'sldFilefield',
						targetTextArea: 'sld',
						buttonText: 'Load SLD file',
						buttonOnly: true,
						width: 105,
						listeners: {
							afterrender: me.handleAfterRender
						},
						buttonConfig:{
							style: {
								backgroundColor: 'red'
							}
						}
					}
				],
				items: {
					xtype: 'textarea',
					itemId: 'sld',
					inputAttrTpl: 'wrap="off"',
					fieldStyle: {
						fontFamily: 'courier new',
						fontSize: '12px',
						overflow: 'auto'
					},
					bind: '{sld}',
					listeners: {
					
						specialkey: function(field, e){
							if (e.getKey() == e.TAB) {
								e.stopEvent();
								var el = field.inputEl.dom;
								if (el.setSelectionRange) {
									var withIns = el.value.substring(0, el.selectionStart) + '    ';
									var pos = withIns.length;
									el.value = withIns + el.value.substring(el.selectionEnd, el.value.length);
									el.setSelectionRange(pos, pos);
								}
								else if (document.selection) {
									document.selection.createRange().text = '    ';
								}
							 }
						 }
					
					
					}
				}
			},
			{
				title: 'Metadata',
				layout: 'fit',
				padding: '5',
				tbar: [
					'->',
					{
						xtype: 'filefield',
						targetTextArea: 'metadata',
						inputAttrTpl: 'wrap="off"',
						buttonText: 'Load Metadata file',
						buttonOnly: true,
						width: 140,
						listeners: {
							afterrender: me.handleAfterRender
						}
					}
				],
				items: {
					xtype: 'textarea',
					itemId: 'metadata',
					fieldStyle: {
						fontFamily: 'courier new',
						fontSize: '12px'
					},
					bind: '{metadata}'
				}
			},
			{
				title: 'Permission'
			}
		
		];
		return items;
	},
	save: function(){
		var me = this;
		var p = me.down('#middlePanel');
		var data = me.getData();
		
		Ext.Ajax.request({
			method: 'PUT',
			url: '/layer/' + me.getLayerId(),
			jsonData: data,
			success: function(res){
				// success doesn't mean the sql statement succeeded
				// check for errors
				var obj = Ext.decode(res.responseText);
				if(obj.success){
					me.updateMapPreview();
					Ext.MessageBox.show({
						msg: 'Changes saved to database.',
						buttons: Ext.MessageBox.OK,
						icon: Ext.MessageBox.INFO
					});
				} else {
					console.log(obj.error);
				}
			},
			failure: function(error){
				console.log(error);
			}
		});
	
	},	
	getData: function(){
		var me = this;
		var p = me.down('#middlePanel');
		
		var retVal = {
			layer_name: p.viewModel.getData()['layer_name'], 
			title: p.viewModel.getData()['title'], 
			description: p.viewModel.getData()['description'], 
			date_updated: p.viewModel.getData()['date_updated'], 
			tags: p.viewModel.getData()['tags'], 
			//config: data.config, 
			style: p.viewModel.getData()['style'], 
			agency: p.viewModel.getData()['agency'], 
			sector: p.viewModel.getData()['sector'], 
			tiled: p.viewModel.getData()['tiled'], 
			listed: p.viewModel.getData()['listed'], 
			sld: p.viewModel.getData()['sld'], 
			metadata: p.viewModel.getData()['metadata']
		};
		
		// then attributes
		var attributes = [];
		for(var item in p.viewModel.getStore('attributes').getData().items) {
			item = p.viewModel.getStore('attributes').getData().items[item];
			attributes.push({attribute: item.getData()['attribute'], alias: item.getData()['alias']});
		}
		retVal['config'] = JSON.stringify(attributes);
		
		return retVal;
	
	},
	setData: function(data){
		var me = this;
		var p = me.down('#middlePanel');
		
		var viewConfig = {
			data: {
				
				layer_name: data.layer_name, 
				title: data.title, 
				description: data.description, 
				date_updated: (data.date_updated?new Date(data.date_updated):null), 
				tags: data.tags, 
				style: data.style, 
				agency: data.agency, 
				sector: data.sector, 
				tiled: data.tiled, 
				listed: data.listed, 
				sld: data.sld, 
				metadata: data.metadata

			},
			stores: {
				attributes: {
					fields: ['attribute', 'alias'],
					data: Ext.decode(data.config)
				}
			}
		};

		p.viewModel.setData(viewConfig.data);
		p.viewModel.setStores(viewConfig.stores);
		
		me.layerId = data.layer_name;
		
		// update map preview
		me.updateMapPreview(true);
		
	},
	handleAfterRender: function(comp) {
		var me = this.up('pgp-layer-manager');
		
		var targetTextArea = this.targetTextArea;
		
		comp.fileInputEl.dom.addEventListener('change', function(event){
			var file = event.target.files[0];
			var reader = new FileReader();
			reader.onload = function(event){
				me.queryById(targetTextArea).setValue(event.target.result);
			};
			reader.onerror = function(){
				Ext.MessageBox.show({
				   title: 'Error!',
				   msg: 'An error occurred trying to read the file.',
				   buttons: Ext.MessageBox.OK,
				   icon: Ext.MessageBox.WARNING
			   });
			};
			reader.readAsText(file);
		});
	},	
	loadLayerDetails: function(layerName){
		var me = this;
		Ext.Ajax.request({
			url: '/layer/' + layerName,
			success: function(result){
				var layer;
				var obj = Ext.decode(result.responseText);
				if(obj.length > 0) {
					layer = obj[0];
				}
				
				me.setData(layer);
				
			},
			failure: function(error){
				console.log(error);
			}
		});
	},
	getLayerId: function(){
		return this.layerId;
	},
	showAttributeListWindow: function(){
		var me = this;
		var grid = me.down('#attributes');
	
		Ext.Ajax.request({
			url: '/layer/' + me.getLayerId() + '/attributes',
			success: function(response){
				
				var obj = Ext.decode(response.responseText);
				var list = [];
				for(var item in obj){
					list.push(obj[item]['column_name']);
				}
			
				var win = Ext.create('Ext.window.Window', {
					title: 'Select attribute to add',
					modal: true,
					width: 300,
					height: 170,
					bodyPadding: 10,
					layout: 'form',
					border: false,
					items: [
						{
							xtype: 'combo',
							itemId: 'attribute',
							store: list,
							fieldLabel: 'Attribute',
							editable: false,
							listeners: {
								select: function(){
									this.nextSibling().setValue(this.getValue());
								}
							}
						},
						{
							xtype: 'textfield',
							itemId: 'alias',
							fieldLabel: 'Alias'
						}
					],
					buttons: [
						{
							text: 'Ok',
							handler: function(){
							var attribute = win.down('#attribute').getValue();
							var alias = win.down('#alias').getValue();
							
							grid.getStore().add({attribute: attribute, alias: alias});
								win.close();
							}
						}
					]
				
				}).show();
				
				
				
			}, 
			failure: function(error){
			}
		});
	
		
	
	
	},
	uploadLayer: function(){
		Ext.create('Ext.window.Window', {
			modal: true,
			layout: 'fit',
			width: 400,
			height: 300,
			items: {
				xtype: 'pgp-layer-uploader',
				title: '',
				listeners: {
					uploaded: function(success, msg){
						if(success){
							Ext.Msg.alert('Success', msg);
						} else {	
							Ext.Msg.alert('Failure', msg);
						}
					}
				}
			},
			title: 'Data upload wizard'
		}).show();
	},
	updateMapPreview: function(zoomToExtent){
		var me = this;
		var layer_name = me.getLayerId();
		
		var map = me.down('pgp-map-panel').getMap();
		
		var layer = new OpenLayers.Layer.WMS( 
			layer_name,
			me.wmsService, 
			{
				layers: 'geoportal:' + layer_name,
				transparent: true,
				rand: Math.random()
			},
			{
				isBaseLayer: false,
				opacity: 0.75
			}
		);
		
		// remove all layers except NAMRIA basemap
		for(var i=0; i<map.layers.length;i++){
			var l = map.layers[i];
			if(!l.isBaseLayer)
				map.removeLayer(l);	
		}
		
		// zoom to layer's extent
		if(zoomToExtent){
			Ext.Ajax.request({
				url: 'layer/' + layer_name + '/extent',
				success: function(res){
					var obj = Ext.decode(res.responseText);
					var extent = new OpenLayers.Bounds(obj.xmin, obj.ymin, obj.xmax, obj.ymax);
					map.zoomToExtent(extent);
				},
				failure: function(err){
				}
			});
		}
		
		// add the layer
		map.addLayer(layer);
		
	},
	deleteLayer: function(){
		var me = this;
	
		Ext.MessageBox.show({
			title:'Wait!',
			message: 'Are you sure you want to delete this layer? <br/>This is an irreversible process unless </br>you have invented a time machine.',
			buttons: Ext.MessageBox.YESNO,
			icon: Ext.Msg.QUESTION,
			fn: function(btn) {
				if(btn === 'yes') {
					proceedDelete();
				}else{
					console.log('No pressed');
				}
			}
		});
	
		function proceedDelete(){
			Ext.Ajax.request({
				method: 'DELETE',
				url: '/layer/' + me.getLayerId(),
				success: function(res){
					// success doesn't mean the sql statement succeeded
					// check for errors
					var obj = Ext.decode(res.responseText);
					if(obj.success)
						Ext.MessageBox.show({
							msg: 'Changes saved to database.',
							buttons: Ext.MessageBox.OK,
							icon: Ext.MessageBox.INFO
						
						});
					else
						console.log(obj.error);
				},
				failure: function(error){
					console.log(error);
				}
			});
		}
	},
	foo: function(){}
});










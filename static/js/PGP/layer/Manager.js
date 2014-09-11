Ext.define('PGP.layer.Manager', {
	extend: 'Ext.panel.Panel',
	alias: 'widget.pgp-layer-manager',
	layout: 'border',
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
			title: '[Layer]',
			region: 'center',
			flex: 1.5,
			items: me.createTabs(),
			buttons: [
				{
					text: 'Save',
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
		var panel = {
			xtype: 'panel',
			region: 'east',
			title: 'Map',
			split: true,
			minWidth: 600,
			flex: 1
		};
		return panel;
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
					align: 'stretch'
				},
				bodyPadding: 30,
				defaults: {
					labelWidth: 100
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
					
					},
					
					{
						xtype: 'textfield',
						itemId: 'tags',
						fieldLabel: 'Tags',
						bind: '{tags}'
					},
					{
						xtype: 'fieldset',
						layout: 'fit',
						padding: '0 5 5 5',
						title: 'Visible attributes',
						items: {
							xtype: 'grid',
							itemId: 'attributes',
							store: Ext.create('Ext.data.Store',{
								fields: ['attribute', 'alias']
							}),
							columns: [
								{
									header: 'Name',
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
								Ext.create('Ext.grid.plugin.CellEditing', {
									clicksToEdit: 1
								})
							],
							bind: '{attributes}'
						},
						flex: 1
						
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
						targetTextArea: 'sld',
						buttonText: 'Load SLD file',
						buttonOnly: true,
						width: 105,
						listeners: {
							afterrender: me.handleAfterRender
						}
					}
				],
				items: {
					xtype: 'textarea',
					itemId: 'sld',
					fieldStyle: {
						fontFamily: 'courier new',
						fontSize: '12px'
				   },
				   bind: '{sld}'
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
				title: 'Data'
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
				if(obj.success)
					console.log('Update success!')
				else
					console.log(obj.error);
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
	
	foo: function(){}
});


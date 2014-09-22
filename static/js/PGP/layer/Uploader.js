Ext.define('PGP.layer.Uploader', {
	extend: 'Ext.form.Panel',
	alias: 'widget.pgp-layer-uploader',
	title: 'Data upload wizard',
	layout: 'card',
	defaultType: 'panel',
	defaults: {
		border: false,
		bodyPadding: '0 10 0 10'
	},
	initComponent: function(){
		this.items = this.buildItems();
		this.callParent(arguments);
	},
	buildItems: function(){
		var me = this;
		
		return [
			{
				itemId: 'step1',
				layout: {
					type: 'vbox',
					align : 'stretch',
					pack  : 'start'
				},
				items: [
					{
						html: '<h3>Step 1 of 2: Select files to upload</h3>',
						border: false,
						padding: '0 0 5 5'
					},
					{
						layout: {
							type: 'vbox',
							align: 'center',
							pack: 'center'
						},
						border: false,
						height: 50,
						items: {
							xtype: 'filefield',
							name: 'upload',
							buttonOnly: true,
							width: 120,
							buttonText: 'Browse local file',
							buttonConfig: {
								width: 120,
								height: 30
							},
							listeners: {
								change: function(c){
									var s = c.getValue();
									s = c.getValue().substring((s.indexOf('\\')>-1?s.lastIndexOf('\\'):s.lastIndexOf('/'))+1,s.length);
								
									me.down('#fileName').setHtml(s);
								}
							}
						}
					},
					{
						layout: {
							type: 'vbox',
							align: 'center',
							pack: 'center'
						},
						border: false,
						height: 50,
						items: {
							xtype: 'component',
							itemId: 'fileName',
							html:'[No files selected yet]',
							style: 'font-size: 18pt; color: #909090;'
						}
					}
					
					

				],
				buttons: [
					{
						text: 'Next',
						scale: 'medium',
						handler: function(){
							me.move('step2');
						}
					}
				]
			},
			{
				itemId: 'step2',
				items: [
					{
						html: '<h3>Step 2 of 2: Describe the data</h3>',
						border: false,
						padding: '0 0 5 5'
					},
					{
						layout: 'form',
						border: false,
						items: [
							
							{
								xtype: 'textfield',
								name: 'title',
								fieldLabel: 'Title',
								value: '_my title'
							},
							{
								xtype: 'textarea',
								name: 'description',
								fieldLabel: 'Description',
								value: 'my description'
							},
							{
								xtype: 'combo',
								name: 'srs',
								fieldLabel: 'Spatial ref. system',
								store: me.getSrsList(),
								displayField: 'name',
								valueField: 'srid',
								editable: false
							}
						
						
						]
					}
				],
				buttons: [
					{
						text: 'Previous',
						scale: 'medium',
						handler: function(){
							me.move('step1');
						}
					},
					{
						text: 'Upload!',
						scale: 'medium',
						handler: function(){
							//me.move('step3');
							me.upload();
						}
					}
				]
			}
			
			/*
			{
				itemId: 'step3',
				items: [
					{
						html: '<h3>Step 3 of 3: Define CRS</h3>',
						border: false,
						padding: '0 0 5 5'
					}
				],
				buttons: [
					{
						text: 'Previous',
						scale: 'medium',
						handler: function(){
							me.move('step2');
						}
					},
					{
						text: 'Upload',
						scale: 'medium',
						handler: function(){
							//me.move('step3');
						}
					}
				]
			}
			*/
		
		];
	},
	move: function(to){
		var me = this;
		me.getLayout().setActiveItem(to);
		
		
	},
	upload: function(){
		var me = this;
		me.submit({
			method: 'POST',
			enctype: 'multipart/form-data',
			url: '/layer/upload',
			success: function(form, action){
				me.fireEvent('uploaded', true, action.result.msg);
			},
			failure: function(form, action){
				me.fireEvent('uploaded', false, action.result.msg);
			}
		});
		
	},
	getSrsList: function(){
	
		return  Ext.create('Ext.data.Store', {
			fields: ['name', 'srid'],
			data : [
				{name: 'WGS 84', srid: 'EPSG:4326'},
				{name: 'Web mercator', srid: 'EPSG:3857'},
				{name: 'PRS92', srid: 'EPSG:4683'}
			]
		});
	
	}
	
});






















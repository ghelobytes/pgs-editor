Ext.define('PGP.layer.Uploader', {
	extend: 'Ext.panel.Panel',
	alias: 'widget.pgp-layer-uploader',
	title: 'Data upload wizard',
	layout: 'card',
	defaultType: 'panel',
	defaults: {
		border: false,
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
				items: [
					{
						html: '<h3>Step 1 of 3: Select files to upload</h3>',
						text: 'xxxx',
						border: false,
						padding: '0 0 5 5'
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
						html: '<h3>Step 2 of 3: Define layer settings</h3>',
						border: false,
						padding: '0 0 5 5'
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
						text: 'Next',
						scale: 'medium',
						handler: function(){
							me.move('step3');
						}
					}
				]
			},
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
		
		
		];
	},
	move: function(to){
		var me = this;
		me.getLayout().setActiveItem(to);
		
		
	}
});






















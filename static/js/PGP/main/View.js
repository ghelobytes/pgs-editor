Ext.define("PGP.main.View", {
	extend: 'Ext.tab.Panel',
	alias: 'widget.pgp-main-view',

	tabBarHeaderPosition: 1,
	headerPosition: 'left',
	tabRotation: 0,
	titleRotation: 0,
	
	ui: 'navigation',
    cls: 'exec-menu-navigation',
	

	header: {
        layout: {
            align: 'stretchmax'
        },
        title: {
            text: 'PGP',
            textAlign: 'center',
            flex: 0,
            minWidth: 80
        },
        tools: [{
            type: 'gear',
            plugins: 'responsive',
            width: 120,
            margin: '0 0 0 0',
            handler: 'onSwitchTool',
            responsiveConfig: {
                'width < 768 && tall': {
                    visible: true
                },
                'width >= 768': {
                    visible: false
                }
            }
        }]
    },
	tabBar: {
        flex: 1,
        layout: {
            align: 'stretch',
            overflowHandler: 'none'
        }
    },
	items: [
		{
			title: 'Layers'
		},
		{
			title: 'Security'
		},
		{
			title: 'tab 3'
		}
	]
});
// REMEMBER to set GDAL_DATA

//var CONN_STRING = 'postgres://postgres:@dm1n1$tr@t0r@192.168.8.20:5432/geoportal';
var CONN_STRING = 'postgres://postgres:@localhost:5432/geoportal';

var GEOSERVER_REST = 'http://admin:admin@localhost:8080/geoserver/rest';
//var GEOSERVER_REST = 'http://admin:@dm1n1$tr@t0r@202.90.149.232/geoserver/rest';

var OGR2OGR_DESTINATION = 'PG:host=localhost user=postgres dbname=geoportal';
//var OGR2OGR_DESTINATION = 'PG:host=192.168.8.20 user=postgres password=@dm1n1$tr@t0r dbname=geoportal';

var GEOMETRY_NAME = 'wkb_geometry';

var SCHEMA = 'public';

var GEOSERVER_WORKSPACE = 'geoportal';
var GEOSERVER_STORE = 'geoportal';

var DEFAULT_SLD = multilineWrapper(function(){/*
<?xml version="1.0" encoding="ISO-8859-1"?>
<StyledLayerDescriptor version="1.0.0" 
	xsi:schemaLocation="http://www.opengis.net/sld StyledLayerDescriptor.xsd" 
	xmlns="http://www.opengis.net/sld" 
	xmlns:ogc="http://www.opengis.net/ogc" 
	xmlns:xlink="http://www.w3.org/1999/xlink" 
	xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <NamedLayer>
	<Name>Philippine Geoportal Project</Name>
	<UserStyle>
	  <Title>Point, Line, Polgygon default style</Title>
	  <FeatureTypeStyle>
		<Rule>
		  <PointSymbolizer>
			<Graphic>
			  <Mark>
				<WellKnownName>circle</WellKnownName>
				<Fill>
				  <CssParameter name="fill">#FF0000</CssParameter>
				</Fill>
			  </Mark>
			  <Size>6</Size>
			</Graphic>
		  </PointSymbolizer>
		  <LineSymbolizer>
			<Stroke>
			  <CssParameter name="stroke">#000000</CssParameter>
			  <CssParameter name="stroke-width">3</CssParameter>    
			</Stroke>
		  </LineSymbolizer>
		  <PolygonSymbolizer>
			<Fill>
			  <CssParameter name="fill">#000080</CssParameter>
			</Fill>
		  </PolygonSymbolizer>
		</Rule>
	  </FeatureTypeStyle>
	</UserStyle>
  </NamedLayer>
</StyledLayerDescriptor>
	*/});


var PORT = 8000;


var express = require('express');
var app = express();


var bodyParser = require('body-parser');
var session = require('express-session');
var cookieParser = require('cookie-parser');


var pg = require('pg');

var multiparty = require('connect-multiparty')
var ogr2ogr = require('ogr2ogr')
var fs = require('fs')

var rest = require('restler');
var crypto = require('crypto');


//=============== START ===============//

startServer();

//================ METHOD ===============//

function testRemoveLayer(){
	removeLayer('_ghelo_0371b','public','geoportal','geoportal', function(success, data){
		console.log(success, data);
	});
}

function setupConfig(){

	app.use(bodyParser.json());
	app.use(cookieParser()); // required before session.
	app.use(session({ 
		secret: 'g30p0rt@l',
		resave: true,
		saveUninitialized: true
	}));

	app.use(multiparty());

}

function setupRoutes() {

	// test
	app.get('/test', function(req, res){
		res.send('It\'s alive!');
	});

	// serve static files
	app.use('/', express.static(__dirname + '/../static'));


	// get a layer
	app.get('/layer/:layer_name', function(req, res){
		query('select * from configuration.layer_metadata where layer_name = $1',[req.params.layer_name],function(result, err){
			res.json(result.rows?result.rows:result);
		});
	});

	// get attributes of a layer
	app.get('/layer/:layer_name/attributes', function(req, res){
		query('select column_name from information_schema.columns where table_schema = \'public\' and table_name = $1',[req.params.layer_name],function(result, err){
			res.json(err?err:result.rows);
		});
	});

	// get list of layer
	app.get('/layers/:mode?', function(req, res){
		var sql = '';
		if(req.params.mode === 'full')
			sql = 'select * from configuration.layer_metadata order by title;';
		else
			sql = 'select layer_name, title, description from configuration.layer_metadata order by title;';
		
		query(sql,[],function(result, err){
			res.json(err?err:result.rows);
		});
	});

	// update a layer
	app.put('/layer/:layer_name', function(req, res){
		var layer_name = req.params.layer_name;
		var data = req.body;
		
		var sql = '' +
		' update configuration.layer_metadata ' +
		'    set title=$1, description=$2, date_updated=$3, tags=$4, ' +
		' 	     config=$5, style=$6, agency=$7, sector=$8, tiled=$9, listed=$10, ' +
		' 	     sld=$11, metadata=$12 ' +
		' where layer_name = $13 ';	
		
		query(sql,[data.title,data.description,data.date_updated,data.tags, 
				   data.config, layer_name, data.agency, data.sector, data.tiled, 
				   data.listed, data.sld, data.metadata, layer_name],
			function(result, err){
			
			if(!err) {
				res.json({success: true});
				
				var geoserverPayload = {
					featureType:{
						title: data.title,
						abstract: data.description,
						enabled: data.listed
					}
				};
		
				// update geoserver layer details
				updateGeoserver(layer_name, geoserverPayload, function(success, data){
					console.log(success, data);
				});
				
				// update associated geoserver style definition
				setGeoserverStyle(layer_name, data.sld, function(success, data){
					console.log(success, data);
				});
						
			}else{

				res.json({success: false, error: err});
				
				
			}
		});
		
	});

	// upload a layer
	app.options('/layer/upload', enableCors, optionsHandler('POST'))
	app.post('/layer/upload', enableCors, function (req, res, next) {

		var user_name = '_ghelo';
		var table_schema = 'public';
		var random = crypto.randomBytes(20).toString('hex').substring(0,6);;
		var table_name = user_name + '_' + random;
		
		var srs = req.body.srs?req.body.srs:'EPSG:4326';	
		var geoserverPayload = {
			featureType:{
				name: table_name,
				title: req.body.title,
				abstract: req.body.description,
				srs: srs,
				projectionPolicy: 'FORCE_DECLARED'
			}
		};
		
		
		var opt = ['-s_srs', srs, '-nln', table_schema + '.' + table_name, '-lco', 'DROP_TABLE=IF_EXISTS', '-lco', 'GEOMETRY_NAME=' + GEOMETRY_NAME];
		
		var ogr = ogr2ogr(req.files.upload.path)
			.skipfailures()
			//.project(srs, srs)
			.format('PostgreSQL')
			.destination(OGR2OGR_DESTINATION)
			.options(opt);
		
		var sf = ogr.stream();
		
		/*
		sf.on('error', function(err){
			next();
		});
		*/
		
		sf.on('error', next);
		
		sf.on('data',function(data){
		});
		
		sf.on('end',function(){

			checkTableWasAdded(table_name, table_schema, function(success){
				if(success){
					
					registerTable(geoserverPayload, function(success){
						if(success){
							
							// create style
							createStyle(table_name, function(success, data){
								// update associated geoserver style definition
								setGeoserverStyle(table_name, DEFAULT_SLD, function(success, data){
									assignStyle(table_name, function(success, data){
										console.log(success, data);
									});
								});
							
							});
							
						
							// add to pgp layer list
							addLayerToPgpList(res, geoserverPayload, function(success){
								if(success){
									res.json({success: true, msg: 'The layer was added to PGP list.'});
								} else {
									res.json({success: false, msg: 'Failed to add layer to PGP list.'});
									// clean up: unregister, drop database
									/*
									removeLayer(table_name, table_schema, 'geoportal', 'postgis', function(err){
									
										console.log('Dropped table ' + table_schema + '.' + table_name);
									
									});
									*/
								}
							});
						} else {
							res.json({success: false, msg: 'Failed to register the layer to Geoserver.'});
							// clean up: drop database
						}
					});
					
				} else {
					res.json({success: false, msg: 'Failed to add the layer to the catalog.'});
				}
			});
		});
		
		res.on('end', function(){ 
			// clean up files
			fs.unlink(req.files.upload.path);
		});
		
	});


	// get a style
	app.get('/style/:layer_name.sld', enableCors, function(req, res){
		var sql = 'select sld from configuration.layer_metadata where layer_name = $1';
		query(sql, [req.params.layer_name],function(result, err){
			if(!err && result.rows.length > 0){
				res.set('Content-Type', 'text/plain');
				res.end(result.rows[0].sld);
			}else{
				res.end();
			}
		});
	});
	
	// delete a layer
	app.delete('/layer/:layer_name', function(req, res){
		console.log('DELETE requested');
		removeLayer(req.params.layer_name, SCHEMA  , GEOSERVER_WORKSPACE, GEOSERVER_STORE, function(success, data){
			if(success){
				res.json({success: true});
			}else{
				res.json({success: false});
			}
		});

	});

}

function startServer(){

	setupConfig();
	setupRoutes();
	
	var server = app.listen(PORT, function(){

		console.log('Listening on port %d', server.address().port);
		console.log('GDAL_DATA = ' + process.env.GDAL_DATA);
	});
}




//=============== FUNCTIONS ===============//


function multilineWrapper(f){
	return (f.toString().match(/[^]*\/\*([^]*)\*\/\}$/)[1]).trim();
}

// set style
function setGeoserverStyle(layer_name, sld, callback){
	var url = GEOSERVER_REST + '/styles/' + layer_name;

	console.log(url);

	var options = {
		headers: {
			'Content-Type': 'application/vnd.ogc.sld+xml'
		},
		data: sld
	};
	
	rest.put(url, options)
	.on('complete', function(data, response) {
		if (response.statusCode != 200) {
			msg = 'COMPLETE BUT ' + response.statusCode + ': [update layer] ';
			callback(false, {msg: msg});	
		} else {
			msg = 'SUCCESS: [update layer] ';
			callback(true, {msg: msg});
		}
	}).
	on('error',function(err, response){
		msg = 'ERROR: [update layer] ';
		callback(false, {msg: msg, err: err});
		
	}).
	on('fail',function(data, response){
		msg = 'FAIL: [update layer] ';
		callback(false, {msg: msg, err: data});
	});
}


// update geoserver layer
function updateGeoserver(layer_name, payload, callback){
	var url = GEOSERVER_REST + '/workspaces/' + GEOSERVER_WORKSPACE + '/datastores/' + GEOSERVER_STORE + '/featuretypes/' + layer_name + '.json';
	console.log(url);	
	rest.putJson(url, payload)
	.on('complete', function(data, response) {
		if (response.statusCode != 200) {
			msg = 'COMPLETE BUT ' + response.statusCode + ': [update layer] ';
			callback(false, {msg: msg});	
		} else {
			msg = 'SUCCESS: [update layer] ';
			callback(true, {msg: msg});
		}
	}).
	on('error',function(err, response){
		msg = 'ERROR: [update layer] ';
		callback(false, {msg: msg, err: err});
		
	}).
	on('fail',function(data, response){
		msg = 'FAIL: [update layer] ';
		callback(false, {msg: msg, err: data});
	});
}

// remove layer
function removeLayer(layer_name, schema, workspace, store, finalCallback){
	
	function callback(success, data){
	}
	
	function unregisterFromGeoserver(){
		var url = GEOSERVER_REST + '/layers/' + layer_name + '?recurse=true';
		rest.del(url, null)
		.on('complete', function(data, response) {
			if (response.statusCode != 200) {
				msg = 'COMPLETE BUT ' + response.statusCode + ': [unregister layer] ';
				callback(false, {msg: msg});	
			} else {
				msg = 'SUCCESS: [unregister layer] ';
				callback(true, {msg: msg});
			}
		}).
		on('error',function(err, response){
			msg = 'ERROR: [unregister layer] ';
			callback(false, {msg: msg, err: err});
			
		}).
		on('fail',function(data, response){
			msg = 'FAIL: [unregister layer] ';
			callback(false, {msg: msg});
		});
	};
	
	function removeFromPgpList(){
		query('delete from configuration.layer_metadata where layer_name = $1;', [layer_name], function(result, err){
			if(!err){
				msg = 'SUCCESS: [delete from pgp list] ';
				callback(true, {msg: msg});
			} else {
				msg = 'FAIL: [delete from pgp list] ';
				callback(false, {msg: msg, err: err});
			}
		});
	};
	
	function dropTableFromCatalog(){
		query('drop table ' + schema + '.' + layer_name,[],function(result, err){
			if(!err){
				msg = 'SUCCESS: [drop table] ';
				callback(true, {msg: msg});
			} else {
				msg = 'FAIL: [drop table] ';
				callback(false, {msg: msg, err: err});
			}
		});
	};
	
	removeFromPgpList();
	unregisterFromGeoserver();
	dropTableFromCatalog();
	
	finalCallback(true, {msg: 'Request sent.'});
	 

}

// register table to Geoserver 
function registerTable(payload, callback){
	var url = GEOSERVER_REST + '/workspaces/' + GEOSERVER_WORKSPACE + '/datastores/' + GEOSERVER_STORE + '/featuretypes.json?recalculate=nativebbox,latlonbbox';
	rest.postJson(url, payload)
	.on('complete', function(data, response) {
		if (response.statusCode == 201) {
			
			callback(true);
			//addLayerToPgpList(res, payload);
			
		} else {
			console.log(response);
			callback(false);
			//res.json({success: false, msg: 'Failed to publish layer in Geoserver.'});

		}
	}).
	on('error',function(err, response){
		console.log('ERROR', err);
	}).
	on('fail',function(data, response){
		console.log('FAIL', data);
	});
}


// create style in Geoserver 
function createStyle(layer_name, callback){
	var url = GEOSERVER_REST + '/styles';
	var payload = { 
		style: {
			name: layer_name,
			filename: layer_name + '.sld'
		}
	};
	rest.postJson(url, payload)
	.on('complete', function(data, response) {
		if (response.statusCode == 201) {
			
			callback(true);
			//addLayerToPgpList(res, payload);
			
		} else {
			console.log(response);
			callback(false);
			//res.json({success: false, msg: 'Failed to publish layer in Geoserver.'});

		}
	}).
	on('error',function(err, response){
		console.log('ERROR', err);
	}).
	on('fail',function(data, response){
		console.log('FAIL', data);
	});
}


// asign style
function assignStyle(layer_name, callback){
	var url = GEOSERVER_REST + '/layers/' + GEOSERVER_WORKSPACE + ':' + layer_name;
	var payload = { 
		layer: {
			defaultStyle: {
				name: layer_name
			}
		}
	};
	rest.putJson(url, payload)
	.on('complete', function(data, response) {
		if (response.statusCode == 201) {
			
			callback(true);
			//addLayerToPgpList(res, payload);
			
		} else {
			console.log(response);
			callback(false);
			//res.json({success: false, msg: 'Failed to publish layer in Geoserver.'});

		}
	}).
	on('error',function(err, response){
		console.log('ERROR', err);
	}).
	on('fail',function(data, response){
		console.log('FAIL', data);
	});
}

// check if table was added to database
function checkTableWasAdded(table_name, table_schema, callback){
	query('select * from information_schema.tables where table_name = $1 and table_schema = $2', [table_name, table_schema], function(result, err){
		if(result.rowCount > 0){
			callback(true);
		} else {
			callback(false);
		}
	});
};

// add to PGP list
function addLayerToPgpList(res, payload, callback){

	var sql = 'insert into configuration.layer_metadata(layer_name, title, description, style, sld) values($1,$2,$3,$1,$4)';

	query(sql,[payload.featureType.name, payload.featureType.title, payload.featureType.abstract, DEFAULT_SLD], function(result, err){
		if(err){
			callback(false);
		} else {
			callback(true);
		}
	});

}


// middleware for handling CORS
function enableCors (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header('Access-Control-Allow-Methods', 'POST');
  res.header("Access-Control-Allow-Headers", "X-Requested-With");
  next();
}

function optionsHandler(methods) {
  return function(req, res, next) {
    res.header('Allow', methods);
    res.send(methods);
  };
}

function query(sql, params, callback){
	pg.connect(CONN_STRING, function(err, client, done) {
		if(err) {
			return console.error('error fetching client from pool', err);
		}
		client.query(sql, params, function(err, result) {
			done();
			if(err) {
				//console.log(err);
				callback(result, err);
			} else {
				callback(result);			
			}
		});
	});
}; 



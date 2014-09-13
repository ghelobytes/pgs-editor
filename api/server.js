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


//================ CONFIG ===============//

app.use(bodyParser.json());
app.use(cookieParser()); // required before session.
app.use(session({ 
	secret: 'g30p0rt@l',
	resave: true,
	saveUninitialized: true
}));

app.use(multiparty());


//=============== ROUTES ===============//

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
	
	var sql = "" +
	" update configuration.layer_metadata " +
	"    set title=$1, description=$2, date_updated=$3, tags=$4, " +
	" 	     config=$5, style=$6, agency=$7, sector=$8, tiled=$9, listed=$10, " +
	" 	     sld=$11, metadata=$12 " +
	" where layer_name = $13 ";	
	
	query(sql,[data.title,data.description,data.date_updated,data.tags, data.config, data.style, data.agency, data.sector, data.tiled, data.listed, data.sld, data.metadata, layer_name],
		function(result, err){
		
		if(err)
			res.json({success: false, error: err});
		else
			res.json({success: true});
	});
	
});


// upload a layer
app.options('/layer/upload', enableCors, optionsHandler('POST'))
app.post('/layer/upload', enableCors, function (req, res, next) {

	var table_name = 'public._ghelobytes@yahoo_com_12345';
	
	var opt = ['-nln', table_name, '-lco', 'DROP_TABLE=IF_EXISTS', '-lco', 'WRITE_EWKT_GEOM=ON'];
	
	var ogr = ogr2ogr(req.files.upload.path)
				.skipfailures()
				.format('PostgreSQL')
				.options(opt);
	
	var sf = ogr.stream();
	
	sf.on('error', next);
	
	var output = [];
	sf.on('data',function(data){
		output.push(data);
	});
	
	sf.on('end',function(){
		var sql = output.join('\n');

		query(sql,[], function(result, err){
		
			if(err)
				res.json({success: false, error: err});
			else
				res.json({success: true, msg: 'Successfully uploaded data!', data: output.join('\n')});
		});

	});
	
	res.on('end', function(){ 
		// clean up files
		fs.unlink(req.files.upload.path);
	});
	
});

//=============== FUNCTIONS ===============//

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





//=============== START ===============//
var server = app.listen(PORT, function(){

	console.log('Listening on port %d', server.address().port);

});


var query = function(sql, params, callback){
	//var CONN_STRING = 'postgres://postgres:@dm1n1$tr@t0r@192.168.8.20:5432/geoportal';

	var CONN_STRING = 'postgres://postgres:@localhost:5432/geoportal';

	
	pg.connect(CONN_STRING, function(err, client, done) {
		if(err) {
			return console.error('error fetching client from pool', err);
		}
		client.query(sql, params, function(err, result) {
			done();
			if(err) {
				console.log(err);
				callback(result, err);
			} else {
				callback(result);			
			}
		});
	});
}; 

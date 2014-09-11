var PORT = 8000;

var express = require('express');
var app = express();

var bodyParser = require('body-parser');
var session = require('express-session');
var cookieParser = require('cookie-parser');


var pg = require('pg');





//================ CONFIG ===============//

app.use(bodyParser());
app.use(cookieParser()) // required before session.
app.use(session({ secret: 'g30p0rt@l'}));



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
	
	console.log(data);
	
	query(sql,[data.title,data.description,data.date_updated,data.tags, data.config, data.style, data.agency, data.sector, data.tiled, data.listed, data.sld, data.metadata, layer_name],
		function(result, err){
		
		if(err)
			res.json({success: false, error: err});
		else
			res.json({success: true});
	});
	
});


//=============== FUNCTIONS ===============//









//=============== START ===============//
var server = app.listen(PORT, function(){

	console.log('Listening on port %d', server.address().port);

});


var query = function(sql, params, callback){
	var CONN_STRING = 'postgres://postgres:@dm1n1$tr@t0r@192.168.8.20:5432/geoportal';

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


var PersonalityInsightsV3 = require('watson-developer-cloud/personality-insights/v3');

var speechToTextV1 = require('watson-developer-cloud/speech-to-text/v1');

var express = require('express');
var app = express();
var mysql = require('mysql');
var cookieParser = require('cookie-parser');



var con = mysql.createConnection({
	host: "localhost",
	user: "Abdelrahman",
	password: "123456789",
	database: "data_gathering"
});

var PersonalityInsights = new PersonalityInsightsV3(
    {
        url: 'https://gateway-wdc.watsonplatform.net/personality-insights/api',
		iam_apikey: 'movoO0RALv_nClFy598ipfNYBO9DWA1R9nojmexJA6No',
		version: '2017-10-13'
    }
);

var SpeechToText = new speechToTextV1({
	url: 'https://gateway-lon.watsonplatform.net/speech-to-text/api',
	iam_apikey : '2p7qErSa1doSccOiC8C7GSfLvyxF6ss3NGWHJBaQD6zF'
});

var multer = require('multer');

var upload = multer({storage: multer.diskStorage({

	filename: (req, file, cb) => {
		cb(null, file.fieldname + '-' + Date.now() + '.wav');
	},

	destination: (req, file, cb)=>{
		console.log("hereeeeeeeeeeeeeeeeee");
		cb(null, './audios');
	}
})});



var password = 123456789;

app.use(express.urlencoded({extended:true}));
app.use(cookieParser());
app.use(upload.any());


app.post('/user',(req, res)=>{
	
	
	con.query("insert into user values(?,?,'{}', NOW())", [req.body['name'], req.body['role']],
	(err)=>{
		if(err){
			console.log(err);
			res.send({status: 1});
		}
		else{
			res.cookie("name", req.body['name']);
			res.cookie("role", req.body['role']);
			res.send({status: 0});
		}
	});
});

app.get(['/Profile.html', '/Customize.html', '/Users.html'], (req, res, next)=>{
	console.log("middleware");
	console.log(req.cookies['password']);

	if(req.cookies['password'] != password){
		res.cookie('password', '');
		req.url = 'index.html'
	}
	next();
})

app.get('/Profile.html',(req, res, next)=>{

	res.cookie("user", req.query['user']);
	next();

});

app.post('/login', (req, res)=>{
	if(req.body['password'] == password){	
		res.cookie('password', password);
		res.send({status: 0});
	}
	else{
		res.send({status: 1});
	}
});

app.use(express.static("../Front end/"));

app.get('/question', (req,res)=>{

	if(req.query['id']){
		var id = req.query['id'];
	
		con.query("select * from question where id = ? and deleted = 0", [id], 
			(err, result)=>{
			if(err)
				throw err;
			else{
				res.send(result);
			}
		});
	}
	else if(req.query['role']){
		var role = req.query['role'];
		con.query("select * from question inner join role on name = role_name\
		where (role_name = ? or general = 1) and question.deleted = 0", [role], 
			(err, result)=>{
			if(err)
				throw err;
			else{
				res.send(result);
			}
		});
	}
	else{
		con.query("select * from (select * from question where deleted = 0) as x right outer join role\
		on name = role_name where role.deleted = 0;", 
			(err, result)=>{
			if(err)
				throw err;
			else{
				var json = {};
				result.forEach(e => {
					if(!json[e['name']]){
						json[e['name']] = {};
					}
					if(e['text'] != null){
						json[e['name']][e['id']] = e['text'];
					}
				});
				res.send(json);
			}
		});
	}
	
});


app.post('/question', function(req,res){

	con.query("insert into question(text, role_name, deleted)\
		 values(?,?,?);", [req.body['text'], req.body['role_name'], 0], 
		(err, result)=>{
		if(err)
			
			res.send({status: 1});
		else{
			res.send(
				{
					'id': result['insertId'],
					'status': '0'
					
				});
		
		}
	});

});


app.delete('/question', function(req,res){

	con.query("update question set deleted = 1 where id = ?", [req.query['id']], 
		(err, result)=>{
		if(err)
			throw err;
		else{
			res.send(result);
		}
	});

});

app.get('/role', function(req,res){
	con.query("select * from role where deleted = 0;", (err, result)=>{
		if(err){
			throw err;
		}
		else{
			res.send(result);
		}
	});	
});


app.post('/role', function(req,res){
	con.query("select * from role where name = ?", [req.body['name']], (err, result)=>{
		if(err){
			res.send({status: 3});
		}
		else if(result[0]){
			if(result[0]['deleted'] == 0){
				res.send({status: 1});
			}
			else{
				con.query("update role set deleted = 0, general = ? where name = ?;"
				, [(req.body['general'] * 1) == 1, req.body['name']], 
					(err)=>{
						if(err)
						{
							console.log(err);
							res.send({status: 2});
						}
						else{
							res.send({status: 0});
					}
				});
			}
		}
		else{
			console.log(req.body['name'] + " " + req.body['general']);
			con.query("insert into role values(?, ?, ?);", [req.body['name'], 0, 
			(req.body['general'] * 1) == 1], 
				(err)=>{
					if(err)
						res.send({status: 4});
					else{
						res.send({status: 0});
				}
			});
		}
	});

	

});


app.delete('/role', function(req,res){
	con.query("update role set deleted = 1 where name = ?;", [req.query['name']], (err)=>{
		if(err)
			res.send({status: 1});
		else{
			con.query("update question set deleted = 1 where role_name = ?;", [req.query['name']], (error=>{
				if(error){
					throw error;
				}
				else{
					res.send({status: 0});
				}
			}));
		}
	});
});

app.post('/answer', function(req, res){
	var data = JSON.parse(req.body['data']);
	//console.log(data);
	var username = data['username'];
	var answers = data['answers'];
	var params = [];
	var ansString = "";
	Object.keys(answers).forEach(key => {
		params.push([username, key, answers[key]]);
		ansString += answers[key] + "\n";
	});
	
	//console.log(params);
	//console.log("String: " + ansString);

	con.query("insert into answer(username, question_id, text) values ?", [params], 
		(err)=>{
			if(err){
				console.log(err);
				res.send({status: 1});
			}
			else{
				var profileParams = {
					content: ansString,
					content_type: "text/plain",
					raw_scores: true
				}
				PersonalityInsights.profile(profileParams, (err, profile)=>{
					if(err){
						console.log(err);
						res.send({status: 2});
					}
					else{
						profile = JSON.stringify(profile, null, 2);
						con.query("update user set insights = ? where name = ?", [profile, username],
						(err)=>{
							if(err){
								console.log(err);
								res.send({status: 3});
							}
							else {
								res.send({status: 0});
							}
						});
					}
				});
				
			}
	});
});

app.get('/user', function(req,res){
	
	if(req.query['name']){
		
		var name = req.query['name'];
		con.query("select question.text as question, answer.text as answer\
		 from answer inner join question\
		on question_id = id where username = ?;", [name],
		(err, result1)=>{
			if(err){
				console.log(err);
				res.send({status: 1});
			}
			else{
				con.query("select insights from user where name = ?;", [name], 
				(err, result2)=>{
					if(err){
						console.log({status: 2});
					}
					else{
						res.send({watson: JSON.parse(result2[0]['insights']), answers: result1});
					}
				});
			}
		});

	}
	else{
		con.query("select name, role_name as role, submission_date as date from user;", (err, result)=>{
			if(err){
				throw err;
			}
			else{
				res.send(result);
			}
		});	
	}
	
});

app.delete('/user', function(req,res){
	con.query("delete from user where name = ?;", [req.query['name']],(err, result)=>{
		if(err){
			res.send({status: 1});
		}
		else{
			res.send({status: 0});
		}
	});	
});



app.post('/uploadAudio', (req, res)=>{
	
	

	console.log(req.files[0]);
	var result = "this is your answer to the question of id: " + req.body['id'];
	res.send(result);
});

app.listen(3000);


var speech = require('@google-cloud/speech');


var config = {
	encoding: 'LINEAR16',
	sampleRateHertz: 16000,
	languageCode: 'en-US',
};

var request = {
	config: config,
};

var websocket = require('ws');
var wss = new websocket.Server({port: 3010});

wss.on('connection', (client)=>{

	
	var speechClient = new speech.v1.SpeechClient({
		projectId: 'sunny-caldron-246613',
		keyFile: '../../../Google speech key/sunny-caldron-246613-6c58c01cc255.json'
	});
	
	const stream = speechClient.streamingRecognize(request);
	
	stream.on('data', (data)=>{
		console.log("here");
		console.log(data.results[0].alternatives[0].transcript);
		client.send(data.results[0].alternatives[0].transcript);
	});
	
	
	client.on('message', (voiceData)=>{

		if(voiceData == -1){
			client.close();
			stream.end();
		}
		else{

			console.log(voiceData);
			stream.write(voiceData);
		}
	});

});

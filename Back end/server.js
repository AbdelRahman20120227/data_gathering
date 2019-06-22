var bodyParser = require('body-parser');
var express = require('express');
var app = express();
var mysql = require('mysql');

var con = mysql.createConnection({
	host: "localhost",
	user: "root",
	password: "12345678",
	database: "data_gathering"
});

app.use(express.static("../Front end/"));
app.use(bodyParser.urlencoded({extended:true}));

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
});


app.post('/role', function(req,res){

	con.query("select * from role where name = ?", [req.body['name']], (err, result)=>{
		if(err){
			throw err;
		}
		else if(result[0]){
			if(result[0]['deleted'] == 0){
				res.send({status: 1});
			}
			else{
				con.query("update role set deleted = 0 where name = ?;", [req.body['name']], 
					(err)=>{
						if(err)
							res.send({status: 2});
						else{
							res.send({status: 0});
					}
				});
			}
		}
		else{
			con.query("insert into role values(?, ?);", [req.body['name'], 0], 
				(err)=>{
					if(err)
						res.send({status: 2});
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

app.listen(3000);

// var request = require('request');
// var cheer = require('cheerio');
// var db = require('./db');
var adminHelper = require('./adminHelper');
// var cricApi = require('./cricApi');
var async = require('async');
var bodyParser = require('body-parser');
// var scoreBoardHelp = require('./scoreBoardHelp');
// var noodle = require("noodlejs");
var http = require('http');
var express = require('express');
var expressSession = require('express-session');
var app = express();
var server = http.createServer(app)
var chat_room = require('socket.io')(server);
var redis = require('redis');
var client1 = redis.createClient();
var Leaderboard = require('leaderboard');
var cons = require('consolidate');
server.listen(3000);
app.use(bodyParser.urlencoded({extended : true}));
app.use(bodyParser.json());
app.use(expressSession({
  secret: 'cricketopia',
  resave: false,
  saveUninitialized: true
}))
app.use("views", express.static(__dirname + '/views'));
app.use("/scripts", express.static(__dirname + '/scripts'));
// app.engine("html",require('ejs').renderFile);
app.engine('html', cons.swig);
app.set('view engine', 'html');

app.get("/",function(req,res){
	res.render("index.html")
})
app.get("/dashboard",function(req,res){
	if(req.session.isUserLoggedIn)
		res.render("dashboard.html")
	else
		res.render("index.html",{"status":"UnAuthorized Entry"})
})
app.get("/viewMatch",function(req,res){
	if(req.session.isUserLoggedIn)
		res.render("viewMatch.html")
	else
		res.render("index.html",{"status":"UnAuthorized Entry"})
})
app.get("/manOfTheMatch",function(req,res){
	if(req.session.isUserLoggedIn)
		res.render("manOfTheMatch.html")
	else
		res.render("index.html",{"status":"UnAuthorized Entry"})
})

app.get("/logOut",function(req,res){
	req.session.destroy(function(err) {
	  // cannot access session here
	})
	res.render("index.html")
})
app.get("/matchView",function(req,res){
	res.render("viewMatch.html")
})
app.get("/createMatch",function(req,res){
	if(req.session.isUserLoggedIn)
		res.render("createMatch.html")
	else
		res.render("index.html",{"status":"UnAuthorized Entry"})
})
app.get("/scoreboard",function(req,res){
	if(req.session.isUserLoggedIn)
		res.render("scoreboard.html",{matchId:req.params.matchId})
	else
		res.render("index.html",{"status":"UnAuthorized Entry"})
})
app.get("/scoreboard/:matchId/:teamNo",function(req,res){
	if(req.session.isUserLoggedIn)
		res.render("scoreboard.html",{matchId:req.params.matchId,teamNo:req.params.teamNo})
	else
		res.render("index.html",{"status":"UnAuthorized Entry"})
})
app.post("/scoreboard",function(req,res){
	if(req.session.isUserLoggedIn){
		console.log(req.body)
		adminHelper.updateScoreboard(req.body,function(matches){
			console.log("scoreboard updated")
			// res.render("viewMatch.html")
			// res.redirect("/scoreboard/" + req.body.matchId + "/" + req.body.teamNo)
		})
	}
	else
		res.render("index.html",{"status":"UnAuthorized Entry"})
})
app.post("/createMatch",function(req,res){
	if(req.session.isUserLoggedIn){
		console.log(req.body)
		adminHelper.createMatch(req.body,function(matches){
			console.log("match saved")
			res.render("viewMatch.html")
		})
		//res.render("createMatch.html")
	}
	else
		res.render("index.html",{"status":"UnAuthorized Entry"})
})
app.get("/editMatch/:matchId",function(req,res){
	if(req.session.isUserLoggedIn){
		var matchId = req.params.matchId;
		console.log(matchId);
		adminHelper.getMatchDetails(matchId,function(matchDetails){
			console.log(matchDetails)
			// socket.emit("getMatchDetails",matchDetails);
			res.render("editMatch.html",matchDetails)
		})
	}
	else
		res.render("index.html",{"status":"UnAuthorized Entry"})
})
app.post("/editMatch",function(req,res){
	if(req.session.isUserLoggedIn){
		console.log(req.body)
		adminHelper.createMatch(req.body,function(matches){
			console.log("match saved")
			res.render("viewMatch.html")
		})
		//res.render("createMatch.html")
	}
	else
		res.render("index.html",{"status":"UnAuthorized Entry"})
})

app.post("/",function(req,res){
	var userName = req.body.userName;
	var password = req.body.password;
	if(userName == "admin" && password == "pass"){
		req.session.isUserLoggedIn = true;
		res.redirect("/dashboard")
	}
	else
		res.render("index.html",{"status":"Invalid username/passowrd"})
})
chat_room.sockets.on("connection",function(socket){
	socket.on("getMatches",function(data){
		adminHelper.getAllMatches(function(matches){
			if(matches.length){
				socket.emit("getMatches",matches);
			}
		})
	})
	socket.on("getMatchDetails",function(data){
		var matchId = data.matchId;
		adminHelper.getMatchDetails(matchId,function(matchDetails){
			console.log(matchDetails)
			socket.emit("getMatchDetails",matchDetails);
		})
	})
	socket.on("getAllTeams",function(data){
		adminHelper.getAllTeams(function(teams){
			// console.log(teams)
			if(teams.length){
				socket.emit("getAllTeams",teams);
			}
		})
	})
	socket.on("getTeamDetails",function(data){
		var teamId = data.teamId;
		var teamNo = data.teamNo;
		adminHelper.getTeamDetails(teamId,function(teamDetails){
			socket.emit("getTeamDetails",{teamDetails:teamDetails,teamNo:teamNo});
		})
	})
	socket.on("updateMOM",function(data){
		adminHelper.updateMOM(data,function(teamDetails){
			socket.emit("updateMOM","");
		})
	})
	socket.on("getMom",function(data){
		adminHelper.getMOM(data,function(playerId){
			socket.emit("getMom",{playerId:playerId});
		})
	})
	socket.on("getScoreboard",function(data){
		adminHelper.getScoreboard(data.matchId,function(scoreboard){
			socket.emit("getScoreboard",JSON.parse(scoreboard));
		})
	})

})
// adminHelper.updateScoreboard()
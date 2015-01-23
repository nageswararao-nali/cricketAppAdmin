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
app.get("/matchSimulation",function(req,res){
	if(req.session.isUserLoggedIn)
		res.render("matchSimulation.html")
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
app.get("/matchCancellation",function(req,res){
	if(req.session.isUserLoggedIn)
		res.render("matchCancellation.html",{matchId:req.params.matchId})
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
	socket.on("matchCancelled",function(data){
		console.log(data.matchId)
		adminHelper.matchCancelled(data.matchId,data.matchName,function(){
			socket.emit("matchCancelled",{});
		})
	})
	socket.on("createLocalMatch",function(data){
		adminHelper.createLocalMatch(function(){
			console.log("local match saved")
			socket.emit("createLocalMatch",{})
		})
	})
	socket.on("playingSquadLocal",function(data){
		console.log(data.matchId);
		adminHelper.playingSquadLocalMatch(data.matchId,function(status){
			socket.emit("playingSquadLocal",{statuss:status})
		})
	})
	socket.on("liveMatchLocal",function(data){
		adminHelper.liveMatchLocal(data.matchId)
		setTimeout(function(){
			livescore(data.matchId,socket)
			setInterval(function(){
				livescore(data.matchId,socket)
			},2000)
		},20000)

	})
	socket.on("getScore",function(data){
			setInterval(function(){
				livescore(data.matchId,socket)
			},4000)

	})

})
// adminHelper.updateScoreboard()
function livescore(matchId,socket){
   	var scorearray = [];
    client1.get('match_day_' + matchId + '',function(err,matchindex){
    if(err){console.log(err)}
  	else{
        if(matchindex>0){
        	var i=0,n=matchindex;
        	console.log("index is " + n)
        	function getScoresLoop(i){
        		var ind = i+1;
        		client1.get('scoreboard_'+matchId+'_day_' + ind,function (err,res){
	              	if(err){console.log('error in getLiveScore '+err)}
	                else
	                {
						if(res){
							var res = JSON.parse(res);
							scorearray.push(res)
							i++;
							console.log("index length " + i + " === " + n)
			        		if(i != n)
			        			getScoresLoop(i)
			        		else{
			        			socket.emit("scoreboard",scorearray);
			        		}
							// socket.emit("scoreboard",res);
							// console.log('response at getLiveScore '+s.matchId);
						}else{
							console.log("res not found")
						}
	                }
	            })
        		
        	}getScoresLoop(i)
          // console.log('matchindex is '+matchindex);
          
          /*var i = 1, n = matchindex;
          function index(i){
              redis.get('scoreboard_'+matchId+'_day_'+i,function (err,res){
              if(err){console.log('error in getLiveScore '+err)}
                else
                {
                  if(res){
                    var s = JSON.parse(res);
                    //console.log('s s'+s);
                    scorearray.push(res);
                    if(i != n){
                      i++;
                      index(i)
                    }
                    else
                    {
                      
                    }

                    
                   // console.log('response at getLiveScore '+s.matchId);
                  }
                }
            })

          }index(i)*/

          
        }
        else
        {
          client.emit('getLiveScore',"no match");
        }
      }
  })

}
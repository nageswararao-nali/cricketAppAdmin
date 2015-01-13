var db = require("./db");
var fs = require('fs');

getTeamWisePlayers()
function getTeamWisePlayers(){
	db.Team_Info.find({},function(err,teams){
		if(teams){
			
			var i=0,n = teams.length;
			function teamLoop(i){
				var dir = __dirname + "/images/" + teams[i].teamName;
				if (!fs.existsSync(dir)){
				    fs.mkdirSync(dir);
				}
				getTeamInfo(teams[i].teamId,teams[i].teamName,function(){
					i++;
					if(i != n)
						teamLoop(i)
				})
				
			}teamLoop(i)
		}
	})
}
function getTeamInfo(teamId,teamName,callback){
  db.Team_Info.findOne({teamId:teamId},{_id:0,players:1},function(err,teamInfo){
    if(err){
      console.log("error in getting team info " + err);
    }
    else{
      if(teamInfo){
      	var i=0,n = teamInfo.players.length;
      	var playerList = [];
      	function playerLoop(i){
      		var playerDetail = {};
      		getPlayerName(teamInfo.players[i],function(playerName){
      			playerDetail.playerName = playerName;
      			var dir = __dirname + "/images/" + teamName + "/" + playerName;
				if (!fs.existsSync(dir)){
				    fs.mkdirSync(dir);
				}
      			i++;
	      		if(i == n)
	      			callback(playerList)
	      		else
	      			playerLoop(i)
      		})
      		
      	}playerLoop(i)
      }else{
      	console.log(teamInfo)
      	console.log("team not found")
      }
    } 
  })
}
function getPlayerName(playerId,callback){
  db.Player_Profile.findOne({playerId:playerId},{fullname:1,_id:0},function(err,playerName){
    if(err){
      console.log("error in getting player profile in getPlayerName function" + err)
    }else{
      if(playerName){
        callback(playerName.fullname)
      }else{
      	callback()
      }
    }
  })
}
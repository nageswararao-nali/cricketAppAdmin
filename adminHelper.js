var db = require("./db");
var redis = require('redis');
var client1 = redis.createClient();
exports.getAllMatches = function(callback){
	db.Match_Shedule.find({"team1:teamId":{$ne:''},"team2:teamId":{$ne:''}},{matchId:1,mtype:1,"team1.teamName":1,"team2.teamName":1,_id:0},{sort:{matchId:"desc"}},function(err,matches){
		if(err){
			console.log("error in getting matches " + err)
		}else{
			if(matches){
				callback(matches) 
			}else{
				console.log("No mathces found")
				callback([])
			}
		}
	})
}
exports.getMatchDetails = function(matchId,callback){
	var matchDetails = {};
	db.Match_Shedule.findOne({matchId:matchId},function(err,matchInfo){
		if(err){
			console.log("error in getting matches " + err)
		}else{
			if(matchInfo){
				matchDetails.matchId = matchId;
				matchDetails.matchName = matchInfo.team1.teamName + ' Vs ' + matchInfo.team2.teamName;
				matchDetails.mtype = matchInfo.mtype;
				matchDetails.StartDate = matchInfo.StartDate;
				matchDetails.EndDate = matchInfo.EndDate;
				matchDetails.seriesName = matchInfo.series_name;
				matchDetails.team1Id = matchInfo.team1.teamId;
				matchDetails.team1Name = matchInfo.team1.teamName;
				matchDetails.team2Id = matchInfo.team2.teamId;
				matchDetails.team2Name = matchInfo.team2.teamName;
				
				matchDetails.team1Players = matchInfo.team1.teamName;
				matchDetails.team2Players = matchInfo.team2.teamName;
				
				getMatchSquad(matchId,function(squadInfo){
					matchDetails.squadInfo = squadInfo;
					getMatchTeams(matchInfo.team1.teamId,matchInfo.team2.teamId,function(teamInfo){
						matchDetails.teamInfo = teamInfo;
						callback(matchDetails)
					})
				})
				
			}else{
				console.log("No mathces found")
				callback({})
			}
		}
	})
}
function getMatchSquad(matchId,callback){
	db.MatchPlayers.findOne({matchId:matchId},{teams:1,_id:0},function(err,matchInfo){
		if(err){
			console.log("error in getting matches " + err)
		}else{
			if(matchInfo){
				var squadArray = [];
				if(matchInfo.teams.length){
					var i=0,n = matchInfo.teams.length;
					function teamLoop(i){
						var squadTeam = {}
						getSquadTeamInfo(matchInfo.teams[i].players,function(plauerList){
							squadTeam["team" + matchInfo.teams[i].teamId] = plauerList;
							squadArray.push(squadTeam)
							i++;
							if(i == n)
								callback(squadArray)
							else
								teamLoop(i)
						})
					}teamLoop(i)
				}else{
					callback(null)
				}
			}else{
				callback(null);
			}
		}
	})
}
function getSquadTeamInfo(players,callback){
	var i=0,n = players.length;
	var playerList = [];
  	function playerLoop(i){
  		var playerDetail = {};
  		getPlayerName(players[i].playerId,function(playerName){
  			playerDetail.playerId = players[i].playerId;
  			playerDetail.playerName = playerName;
  			playerList.push(playerDetail)
  			i++;
      		if(i == n)
      			callback(playerList)
      		else
      			playerLoop(i)
  		})
  		
  	}playerLoop(i)
}
function getMatchTeams(team1Id,team2Id,callback){
	var teamPlayersArray = [];
	getTeamInfo(team1Id,function(playerList){
		var team1Obj = {};
		team1Obj["team" + team1Id] = playerList;
		teamPlayersArray.push(team1Obj)
		getTeamInfo(team2Id,function(playerList){
			var team2Obj = {};
			team2Obj["team" + team2Id] = playerList;
			teamPlayersArray.push(team2Obj)
			callback(teamPlayersArray)
		})
	})
}
function getTeamInfo(teamId,callback){
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
      			playerDetail.playerId = teamInfo.players[i];
      			playerDetail.playerName = playerName;
      			playerList.push(playerDetail)
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
exports.getAllTeams = function(callback){
	db.Team_Info.find({},{teamId:1,teamName:1,_id:0},{sort:{teamName:"asc"}},function(err,teams){
		if(err){
			console.log("error in getting teams " + err)
		}else{
			if(teams){
				callback(teams) 
			}else{
				console.log("No teams found")
				callback([])
			}
		}
	})
}
exports.getTeamDetails = function(teamId,callback){
	getTeamInfo(teamId,function(playerList){
		callback(playerList)
	})
}
exports.createMatch = function(matchDetails,callback){
	if(matchDetails.matchId){
		var matchId = matchDetails.matchId;
		saveMatchSchedule(matchId,matchDetails,function(){
			console.log(matchDetails)
			saveMatchSquad(matchId,matchDetails,function(){
				console.log("completed")
				callback()
			})
		})
	}else{
		db.AdminData.findOne({propertyName:"matchIds"},function(err,admin){
			if(err)
				console.log("error in getting admin " + err)
			else{
				if(admin){
					var matchId = parseInt(admin.propertyValue);
					updateMatchId(matchId);
					saveMatchSchedule(matchId,matchDetails,function(){
						console.log(matchDetails)
						saveMatchSquad(matchId,matchDetails,function(){
							console.log("completed")
							callback()
						})
					})

				}else{
					var matchProperty = new db.AdminData({propertyName:"matchIds",propertyValue:"1000001"})
					matchProperty.save(function(err,doc){
						if(err)
							console.log("error in saving admin")
						else{
							console.log(doc)
						}
					})
				}
			}
		})
	}
	
}
function updateMatchId(matchId){
	newmatchId = matchId + 1;
	db.AdminData.update({propertyName:"matchIds"},{$set:{propertyValue:newmatchId}},function(err,uadmin){
		if(err)
			console.log("error in getting admin " + err)
		else{
			console.log(uadmin)
		}
	})
}
function saveMatchSchedule(matchId,matchDetails,callback){
	db.Match_Shedule.findOne({matchId:matchId},function(err,match){
		if(err)
			console.log("error in getting match details")
		else{
			if(match){
				match.mtype = matchDetails.mtype;
				match.series_id = '';
				match.series_name = matchDetails.seriesName;
				match.MatchNo = '';
				var match_start_date = new Date(matchDetails.matchStartDate)
				var match_end_date = new Date(matchDetails.matchEndDate)
				match.StartDate = match_start_date.toISOString();
				match.EndDate = match_end_date.toISOString();
				console.log(match.StartDate + " ==== " + match.EndDate)
				match.save();
				callback();
			}else{
				match_object = {};team_object = {};
				match_object.matchId = matchId;
				match_object.mtype = matchDetails.mtype;
				match_object.series_id = '';
				match_object.series_name = matchDetails.seriesName;
				match_object.MatchNo = '';
				var match_start_date = new Date(matchDetails.matchStartDate)
				var match_end_date = new Date(matchDetails.matchEndDate)
				match_object.StartDate = match_start_date.toISOString();
				match_object.EndDate = match_end_date.toISOString();
				match_object.team1 = {}
				match_object.team2 = {}
				match_object.team1.teamId = matchDetails.team1;
				getTeamName(matchDetails.team1,function(teamName){
					match_object.team1.teamName = teamName;
					match_object.team2.teamId = matchDetails.team2;
					getTeamName(matchDetails.team2,function(teamName){
						match_object.team2.teamName = teamName;
						var match_shedule_info = new db.Match_Shedule(match_object);
					    match_shedule_info.save(function(err, recs){
					    	if(err)
					    		console.log("error in saving match")
					    	else{
					    		console.log("match saved sussfully")
					    		callback();
					    	}
					    });
					})
				})
			}
		}
	})
}
function getTeamName(teamId,callback){
	db.Team_Info.findOne({teamId:teamId},{teamName:1,_id:0},function(err,teamData){
	    if(err){
	      console.log("error in getting player profile in getPlayerName function" + err)
	    }else{
	      if(teamData){
	        callback(teamData.teamName)
	      }else{
	      	callback()
	      }
	    }
  	})
}
function saveMatchSquad(matchId,matchDetails,callback){
	var squadObj = {};
	squadObj.matchId = matchId;
	squadObj.teams = [];
	buildTeamPlayerInfo(matchDetails.team1,matchDetails.team1Players,function(teamData){
		squadObj.teams.push(teamData)
		buildTeamPlayerInfo(matchDetails.team2,matchDetails.team2Players,function(teamData){
			squadObj.teams.push(teamData)
			db.MatchPlayers.findOne({matchId:matchId},function(err,match){
				if(err)
					console.log("error in getting match squad " + err)
				else{
					if(match){
						match.teams = squadObj.teams;
						match.save();
						callback();
					}else{
						var matchPlayers = db.MatchPlayers(squadObj)
						matchPlayers.save(function(err, recs){
					    	if(err)
					    		console.log("error in saving squad")
					    	else{
					    		console.log("squad saved sussfully")
					    		callback();
					    	}
					    });
					}
				}
			})
			
			// callback(squadObj);
		})
	})

}
function buildTeamPlayerInfo(teamId,mplayers,callback){
	var team = {},players = [];
	team.teamId = teamId;
	team.players = [];
	for(var i=0;i<mplayers.length;i++){
		var player = {
					"matchFantasyPoints" : 10,
					"highestBid" : 10,
					"averageBid" : 10,
					"playerId" : null
				};
		player.playerId = mplayers[i];
		players.push(player);
	}
	team.players = players;
	callback(team)
}
exports.updateMOM = function(momData,callback){
	var matchId = momData.matchId;
	var mom = momData.mom;
	client1.set("manOfTheMatch_" + matchId + "_mom",mom)
	callback();
}
exports.getMOM = function(matchData,callback){
	var matchId = matchData.matchId;
	client1.get("manOfTheMatch_" + matchId + "_mom",function(err,playerId){
			console.log(playerId)
		if(playerId){
			callback(playerId)
		}else{
			callback(null)
		}
	})
}
exports.updateScoreboard = function(data,callback){
	/*var data = { matchId: '1000019',
  teamNo: '4',
  battingPlayers: [ '3991', '62576', '4176', '3480', '5132' ],
  comment: [ 'b Rehman', 'b Rehman', 'not out', 'not out', '' ],
  runs: [ '12', '23', '34', '45', '', '', '', '', '', '', '', '', '', '', '' ],
  balls: [ '10', '11', '12', '13', '' ],
  fours: [ '1', '2', '3', '4', '' ],
  six: [ '1', '2', '3', '4', '' ],
  sr: [ '2', '3', '4', '5', '' ],
  runner: '3991',
  extra_comment: '(b 4, lb 2, w 4, nb 9)',
  extra_runs: '12',
  total_comment: '(4 wickets; 90 overs)',
  total_runs: '156',
  extra_runs_comment: '(4.21 runs per over)',
  bowlingPlayers: 
   [ '3755',
     '4250',
     '4987',
     '11916',
     '30047',
     '14024',
     '3934',
     '27042',
     '25123',
     '34967' ],
  overs: [ '2', '5', '7', '', '', '', '', '', '', '' ],
  maidens: [ '1', '2', '3', '', '', '', '', '', '', '' ],
  wickets: [ '1', '1', '', '', '', '', '', '', '', '' ],
  econ: [ '1.2', '2.3', '3.4', '', '', '', '', '', '', '' ] };*/
  /*if(data.battingPlayers.length>0 && data.comment.length>0 && data.runs.length>0 && data.balls.length>0 && data.runs.length>0 && data.fours.length>0 
  	&& data.six.length>0 && data.sr.length>0 && data.bowlingPlayers.length>0 && data.overs.length>0
  	 && data.maidens.length>0 && data.bruns.length>0 && data.wickets.length>0){*/
	  	var scoreObj = {};
		scoreObj.match_name = data.matchId;
		scoreObj.match_type = data.matchId;
		scoreObj.fIndex = data.fIndex;
		scoreObj.keeper = data.keeper;
		scoreObj.match_batting_player = data.batting;
		scoreObj.match_batting_runner = data.runner;
		scoreObj.match_bowler = data.bowling;
		scoreObj.extras = {};
		scoreObj.extras.comment = data.extra_comment;
		scoreObj.extras.Runs = data.extra_runs;
		scoreObj.total = {};
		scoreObj.total.comment = data.total_comment;
		scoreObj.total.Runs = data.total_runs;
		scoreObj.total.RunRate = data.extra_runs_comment;
		scoreObj.batting_info = {};
		scoreObj.batting_info.teamId = data.battingTeamId;
		scoreObj.batting_info.batsman_info = [];
		getBatting(data,function(battingContent){
			scoreObj.batting_info.batsman_info = battingContent;
			scoreObj.bowling_info = {};
			scoreObj.bowling_info.teamId = data.bowlingTeamId;
			scoreObj.bowling_info.bowler_info = [];
			getBowling(data,function(bowlingContent){
				scoreObj.bowling_info.bowler_info = bowlingContent
				console.log(JSON.stringify(scoreObj));
				client1.set("scoreboard_" + data.matchId + "_day_" + data.fIndex,JSON.stringify(scoreObj));
				client1.set("match_day_" + data.matchId,data.fIndex)
				callback();
			})
		})
	/*}else{
		callback()
	}*/
	

}
function getBatting(data,callback){
	/*{ matchId: '1000017',
  teamNo: '1',
  keeper: '3733',
  findex: '1',
  battingPlayers: [ '4196', '10073', '10025', '10064' ],
  battingPlayerNames: 
   [ 'Aaron James Finch',
     'Alexander James Doolan',
     'Benjamin Colin James Cutting',
     'Ben Robert Dunk' ],
  cdd_4196_d: [ 'c', 'b' ],
  cdv_4196: [ 'Alastair Nathan Cook', 'Alexander Daniel Hales' ],
  runs: [ '2', '0', '0', '0' ],
  balls: [ '0', '0', '0', '0' ],
  fours: [ '0', '0', '0', '0' ],
  six: [ '0', '0', '0', '0' ],
  sr: [ '0', '0', '0', '0' ],
  cdd_10073_d: [ 'c', 'b' ],
  cdv_10073: [ 'Alastair Nathan Cook', 'Alexander Daniel Hales' ],
  cdd_10025_d: [ '' ],
  cdd_10064_d: [ '' ],
  extra_comment: '',
  extra_runs: '',
  total_comment: '',
  total_runs: '',
  extra_runs_comment: '',
  bowlingPlayers: [ '3733', '22878', '10130' ],
  bowlingPlayerNames: 
   [ 'Alastair Nathan Cook',
     'Alexander Daniel Hales',
     'Benjamin Andrew Stokes' ],
  overs: [ '0', '0', '0' ],
  maidens: [ '0', '0', '0' ],
  bruns: [ '0', '0', '0' ],
  wickets: [ '0', '0', '0' ],
  econ: [ '0', '0', '0' ] }*/


	console.log("in sub")
	var i=0,n=data.battingPlayers.length;
	var battingContent = [];
	function battingLoop(i){
		var playerId = data.battingPlayers[i];
		var comment = "";
		var keeper = data.keeper;
		var cs = data["cdd_"+playerId+"_d"];
		var cv = data["cdv_"+playerId+"_d"];
		if(cs.length>0 && cv !== undefined){
			console.log("in if")
			for(var j=0;j<cs.length;j++){
				if(cs[j] == "not out" || cs[j] == "lbw"){
					comment = comment + cs[j] + " ";
				}else if(cs[j] == "run out"){
					comment = " " + comment + cs[j] + " (";
					for(var k=0;d<cv.length;k++){
						if(cv[j] == keeper)
							comment = comment + " †" + cv[j] + " ";
						else
							comment = comment + cv[k] + "/";
					}
					comment = comment.substring(0, comment.length - 1);
					comment = comment + ")";
			
				}else{
					if(cv[j] == keeper)
						comment = comment + cs[j] + " †" + cv[j] + " ";
					else
						comment = comment + cs[j] + " " + cv[j] + " ";
				} 
			}
		}else if(cs.length>0){
			console.log(" in else if ")
			if(cs[0] == "not out"){
				comment = comment + cs[0] + " ";
			}
		}
		comment = comment.trim();
		console.log("length is ---------- " + cs.length)
		var battingPlayerObj = {
			// playerName : data.battingPlayerNames[i],
			batsman_comment:comment,
			batsman_link:null,
			playerId:playerId,
			batsman_batting_info : {  
			  Comment:comment,
			  Runs:data.runs[i],
			  Minutes:null,
			  Balls:data.balls[i],
			  fours:data.fours[i],
			  sixes:data.six[i],
			  StrikeRate:data.sr[i]
			}
		}
		battingContent.push(battingPlayerObj)
		i++;
		if(i == n)
			callback(battingContent)
		else
			battingLoop(i)
	}battingLoop(i)
}
function getBowling(data,callback){
	var i=0,n=data.bowlingPlayers.length;
	var bowlingContent = [];
	function bowlingLoop(i){
		var bowlingPlayerObj = {
			playerId:data.bowlingPlayers[i],
           	// playerName:data.bowlingPlayerNames[i],
           	bowler_bowling_info:{  
              Overs:data.overs[i],
              Maidens:data.maidens[i],
              Runs:data.bruns[i],
              Wickets:data.wickets[i],
              EconemyRates:data.econ[i],
              DotBalls:null,
              Fours:null,
              sixes:null
           }
       }
		bowlingContent.push(bowlingPlayerObj)
		i++;
		if(i == n)
			callback(bowlingContent)
		else
			bowlingLoop(i)
	}bowlingLoop(i)
}
exports.getScoreboard = function(matchId,callback){
	client1.get("scoreboard_" + matchId + "_day_1",function(err,sdata){
		if(err)
			console.log("error in getting score form redis " + err)
		else{
			callback(sdata)
		}
	});
}
function getFantasyIndex(matchId,callback){
	client1.get("match_day_" + matchId,function(err,fIndex){
		if(err)
			console.log("redis get error " + err)
		else{
			if(fIndex == null)
			{
				callback(fIndex)
			}
		}
	})
}
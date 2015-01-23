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
				if(matchInfo.otherInfo === undefined){
					matchDetails.otherInfo = {};
					matchDetails.otherInfo.cricmatchUrl = " ---- ";
				}else{
					matchDetails.otherInfo = matchInfo.otherInfo;
				}
				
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
				match.otherInfo = {};
				var cricUrl = matchDetails.matchUrl;
				match.otherInfo.cricmatchUrl = cricUrl;
				match.otherInfo.cricmatchId = cricUrl.split("/").pop().split(".")[0];
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
				match_object.matchStatus = 'pending';
				var match_start_date = new Date(matchDetails.matchStartDate)
				var match_end_date = new Date(matchDetails.matchEndDate)
				match_object.StartDate = match_start_date.toISOString();
				match_object.EndDate = match_end_date.toISOString();
				match_object.otherInfo = {};
				var cricUrl = matchDetails.matchUrl;
				match_object.otherInfo.cricmatchUrl = cricUrl;
				match_object.otherInfo.cricmatchId = cricUrl.split("/").pop().split(".")[0];
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
	buildTeamPlayerInfo(matchId,matchDetails.team1,matchDetails.team1Players,function(teamData){
		client1.sadd("squad_" + matchId + "_teams",matchDetails.team1)
		squadObj.teams.push(teamData)
		buildTeamPlayerInfo(matchId,matchDetails.team2,matchDetails.team2Players,function(teamData){
			client1.sadd("squad_" + matchId + "_teams",matchDetails.team2)
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
function buildTeamPlayerInfo(matchId,teamId,mplayers,callback){
	var team = {},players = [];
	team.teamId = teamId;
	team.players = [];
	var i=0,n=mplayers.length;
	function playerLoop(i){
		var player = {
					"matchFantasyPoints" : 10,
					"highestBid" : 10,
					"averageBid" : 10,
					"playerId" : null,
					"playerName" : null
				};
		player.playerId = mplayers[i];
		getPlayerName(mplayers[i],function(playerName){
			player.playerName = playerName;
			client1.sadd("squad_" + matchId + "_team" + teamId,mplayers[i])
			console.log("squad." + matchId + "." + teamId + "." + mplayers[i])
			client1.hmset("squad." + matchId + "." + teamId + "." + mplayers[i],player,function(err,arg){
				console.log(arg)
				players.push(player);
				i++;
				if(i != n)
					playerLoop(i)
				else{
					team.players = players;
					callback(team)
				}
			})
		})
	}playerLoop(i)
	
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
  	var scoreObj = {};
	scoreObj.matchId = data.matchId;
	scoreObj.match_name = data.matchName;
	scoreObj.match_type = data.matchType;
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
exports.matchCancelled = function(matchId,matchName,callback){
	getMatchPlayers(matchId,function(unPlayedPlayers){
		var i=0,ni=unPlayedPlayers.length;
		if(unPlayedPlayers.length){
			function playerLoop(i){
				getPlayerName(unPlayedPlayers[i],function(playerName){
					var notificationMessage = "for " + matchName + " match cancellation, you have credited your credits for player " + playerName;
					console.log(unPlayedPlayers[i] + " playerid " + matchId)
					db.Player_Bid_Info.findOne({matchId:matchId,playerId:unPlayedPlayers[i]},function(err1,bidInfoDoc){
					    if(err1){
					      console.log("error in getting matches getMatchTeamNames" + err1)
					    }else{
							if(bidInfoDoc){
								var j=0,nj = bidInfoDoc.bidInfo.length;
								function bidUserLoop(j){
									console.log(bidInfoDoc.bidInfo[j].FBID + " ==== " + bidInfoDoc.bidInfo[j].bidAmount);
									db.userSchema.update({_id:bidInfoDoc.bidInfo[j].FBID},{$inc:{Credits:bidInfoDoc.bidInfo[j].bidAmount}},function(err,updated){
										if(err)
											console.log("error in updating user credits " + err)
										else{
											console.log(updated)
											sendNotification(notificationMessage,bidInfoDoc.bidInfo[j].FBID,function(){
												j++;
												if(j != nj)
													bidUserLoop(j);
												else{
													bidInfoDoc.remove()
													i++;
													if(i != ni)
														playerLoop(i)
													else
														callback()
												}
											})
										}
									})
								}bidUserLoop(j)
							}else{
								i++;
								if(i != ni)
									playerLoop(i)
								else
									callback()
							}
				      	}
			      	})
				})
			}playerLoop(i)
		}else{
			callback()
		}
		
	})
	
}
function getMatchPlayers(matchId,callback){
	var bidPlayersList = [];
	db.Player_Bid_Info.find({matchId:matchId},{playerId:1,_id:0},function(err1,bidPlayers){
	    if(err1){
	      console.log("error in getting matches getMatchTeamNames" + err1)
	    }else{
	      if(bidPlayers.length){
	        var i=0,ni=bidPlayers.length;
	        function teamsLoop(i){
	        	bidPlayersList.push(bidPlayers[i].playerId);
	        	i++;
    			if(i != ni)
    				teamsLoop(i)
    			else
    				callback(bidPlayersList)
	        }teamsLoop(i)
	      }else{
	      	callback(bidPlayersList)
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

// local match creation
exports.createLocalMatch = function(callback){
	db.AdminData.findOne({propertyName:"matchIds"},function(err,admin){
		if(err)
			console.log("error in getting admin " + err)
		else{
			if(admin){
				var matchId = parseInt(admin.propertyValue);
				updateMatchId(matchId);
				saveLocalMatchSchedule(matchId,function(team1Id,team2Id,team1Name,team2Name){
					console.log("in n1")
					console.log(team1Id + " === " + team2Id)
					saveLocalMatchSquad(matchId,team1Id,team2Id,function(){
						console.log("completed")
						var notificationMessage = team1Name + " Vs " + team2Name + " match strartd. Start bidding";
						sendSquadAnouncecNotification(notificationMessage,function(){
							callback()
							
						})
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
function saveLocalMatchSchedule(matchId,callback){
	var matchTypeList = ['odi','test','Twenty20'];
	match_object = {};team_object = {};
	match_object.matchId = matchId;
	
	match_object.mtype = 'odi';
	match_object.series_id = '';
	match_object.series_name = '';
	match_object.MatchNo = '';
	match_object.matchStatus = 'pending';
	match_object.local = true;
	var match_start_date = new Date(new Date().getTime() + 24 * 60 * 60 * 1000);
	var match_end_date = new Date(new Date().getTime() + 2 * 24 * 60 * 60 * 1000);
	match_object.StartDate = match_start_date.toISOString();
	match_object.EndDate = match_end_date.toISOString();
	/*match_object.otherInfo = {};
	var cricUrl = matchDetails.matchUrl;
	match_object.otherInfo.cricmatchUrl = cricUrl;
	match_object.otherInfo.cricmatchId = cricUrl.split("/").pop().split(".")[0];*/
	match_object.team1 = {}
	match_object.team2 = {}
	db.Team_Info.find({},{teamId:1,teamName:1,_id:0},function(err,teams){
		if(err)
			console.log("error in getting teams " + err)
		else{
			if(teams.length){
				var teamLength = teams.length - 1;
				getRandomNumber(0,teamLength,function(team1No){
					var team1No = team1No;
					function getTeam2No(){
						getRandomNumber(0,teamLength,function(team2No){
							var team2No = team2No;
							if(team1No == team2No)
								getTeam2No()
							else{
								match_object.team1.teamId = teams[team1No].teamId;
								match_object.team1.teamName = teams[team1No].teamName;
								match_object.team2.teamId = teams[team2No].teamId;
								match_object.team2.teamName = teams[team2No].teamName;
								var match_shedule_info = new db.Match_Shedule(match_object);
								match_shedule_info.save(function(err, recs){
							    	if(err)
							    		console.log("error in saving match")
							    	else{
							    		console.log("match saved sussfully")
							    		callback(teams[team1No].teamId,teams[team2No].teamId,teams[team1No].teamName,teams[team2No].teamName);
							    	}
							    });
							}
						})
					}
					getTeam2No();
				})
			}
		}
	})
}
function getRandomNumber(min,max,callback){
	var randomnumber = Math.floor(Math.random() * (max - min + 1)) + min;
	callback(randomnumber);
}
function saveLocalMatchSquad(matchId,team1Id,team2Id,callback){
	var squadObj = {};
	squadObj.matchId = matchId;
	squadObj.teams = [];
	getLocalTeamPlayers(team1Id,function(team1Players){
		var team1Players = team1Players;
		console.log("team1 players " + team1Players)
		getLocalTeamPlayers(team2Id,function(team2Players){
			var team2Players = team2Players;
			console.log("in match squad n2")
			buildTeamPlayerInfo(matchId,team1Id,team1Players,function(teamData){
				console.log("in build match players n1")
				client1.sadd("squad_" + matchId + "_teams",team1Id)
				squadObj.teams.push(teamData)
				buildTeamPlayerInfo(matchId,team2Id,team2Players,function(teamData){
					console.log("in build match players n2")
					client1.sadd("squad_" + matchId + "_teams",team2Id)
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
		})	
	})
	
}
function getLocalTeamPlayers(teamId,callback){
	console.log("here")
	var squadPlayers = [];
	getRandomNumber(11,15,function(playerLength){
		var playerLength = playerLength;
		db.Team_Info.findOne({teamId:teamId},{players:1,_id:0},function(err,team){
			if(err)
				console.log("error in getting squad players " + err)
			else{
				if(team){
					var n = playerLength,l = team.players.length;
					function playerLoop(){
						getRandomNumber(0,l - 1,function(i){
							squadPlayers.push(team.players[i]);
							squadPlayers = squadPlayers.filter(function(elem, pos) {
							    return squadPlayers.indexOf(elem) == pos;
							})
							if(squadPlayers.length != n)
								playerLoop()
							else
								callback(squadPlayers) ;
						})
					}playerLoop()
				}else{
					callback(squadPlayers)
				}
			}
		})
	})
}
function sendSquadAnouncecNotification(notificationMessage,callback){
	var pDate = new Date();
	var uDate = pDate.setDate(pDate.getDate() - 3) // 3 days before date
	// db.userSchema.find({loginDate:{$lte:uDate}},{_id:1},function(err,users){
	db.userSchema.find({},{_id:1},function(err,users){
		if(err){
			console.log("error in getting users " + err)
		}else{
			if(users.length){
				console.log(users.length)
				var j=0,nj=users.length;
				for(var i=0;i<users.length;i++){
					console.log(users[i]._id)
					var notification = {};
					notification.user = users[i]._id;
					notification.message = notificationMessage;
					notification.createDate = new Date();
					console.log(notification)
					var notifications = new db.Notifications(notification);
					notifications.save(function(err,recs){
						if(err){
							console.log("error in saving notification " + err)
						}else{
							console.log("save notification ")
							j++;
							if(j == nj){
								/*sendSquadAnouncecNotificationToFollowedUsers(notificationMessage,function(){
									callback()
								})*/
								callback()
							}
						}
					})
				}
			}else{
				console.log(" no users found ")
			}
		}
	})
}
// local match final squad
exports.playingSquadLocalMatch = function(matchId,callback){
	db.Match_Shedule.findOne({matchId:matchId,local:{$exists:true}},function(err,match){
		if(err){
			console.log("error in getting match " + err)
		}else{
			if(match){
				db.MatchPlayers.findOne({matchId:matchId},function(err,matchSquad){
					if(err)
						console.log("error in getting match squad " + err)
					else{
						var team1Players = matchSquad.teams[0].players.slice(0,11);
						var team2Players =matchSquad.teams[1].players.slice(0,11);
						var teams = [],team1Info = {},team2Info = {};
						team1Info.teamId = matchSquad.teams[0].teamId;
						team1Info.players = team1Players
						team2Info.teamId = matchSquad.teams[1].teamId;
						team2Info.players = team2Players
						teams[0] = team1Info;
						teams[1] = team2Info;
						matchSquad.teams[0].players = team1Players
						matchSquad.teams[1].players = team2Players
						db.MatchPlayers.update({matchId:matchId},{teams:teams},function(err,mSquad){
							if(err)
								console.log("error in getting match squad " + err)
							else{
								console.log(mSquad)
								notificationMessage = "";
								updateMatchFinalSquad(notificationMessage,matchId,function(){
									callback(0)
								})
							}
						})
					}
				})
			}else{
				callback(1)
			}
		}
	})
}
//send unplayed players credits back to users

function updateMatchFinalSquad(notificationMessage,matchId,callback){
	var unPlayedPlayers = [];
	getMatchSquadPlayers(matchId,function(squadPlayers){
			console.log(squadPlayers)
		getMatchBidPlayers(matchId,function(bidPlayers){
			Array.prototype.diff = function(a) {
			    return this.filter(function(i) {return a.indexOf(i) < 0;});
			};

			unPlayedPlayers = bidPlayers.diff(squadPlayers);
			if(unPlayedPlayers.length){
				sendBackCredits(notificationMessage,unPlayedPlayers,matchId)
				callback();
			}else{
				callback()
			}
		})
	})
	
}
function getMatchSquadPlayers(matchId,callback){
	db.MatchPlayers.findOne({matchId:matchId},function(err1,match){
	    if(err1){
	      console.log("error in getting matches getMatchTeamNames" + err1)
	    }else{
	      if(match){
	      	var squadPlayers = [];
	        var i=0,ni=match.teams.length;
	        function teamsLoop(i){
	        	var j=0,nj = match.teams[i].players.length;
	        	function playerLoop(j){
	        		squadPlayers.push(match.teams[i].players[j].playerId);
	        		j++;
	        		if(j != nj)
	        			playerLoop(j)
	        		else{
	        			i++;
	        			if(i != ni)
	        				teamsLoop(i)
	        			else
	        				callback(squadPlayers)
	        		}
	        	}playerLoop(j)
	        }teamsLoop(i)
	      }
	    } 
  	})
}
function getMatchBidPlayers(matchId,callback){
  	var bidPlayersList = [];
	db.Player_Bid_Info.find({matchId:matchId},{playerId:1,_id:0},function(err1,bidPlayers){
	    if(err1){
	      console.log("error in getting matches getMatchTeamNames" + err1)
	    }else{
	      if(bidPlayers.length){
	        var i=0,ni=bidPlayers.length;
	        function teamsLoop(i){
	        	bidPlayersList.push(bidPlayers[i].playerId);
	        	i++;
    			if(i != ni)
    				teamsLoop(i)
    			else
    				callback(bidPlayersList)
	        }teamsLoop(i)
	      }else{
	      	callback(bidPlayersList)
	      }
	    } 
  	})
}
function sendBackCredits(notificationMessage,unPlayedPlayers,matchId){
	var i=0,ni=unPlayedPlayers.length;
	if(ni){
		var notificationMessage = "";
		function playerLoop(i){
			console.log(unPlayedPlayers[i] + " playerid " + matchId)
			getPlayerName(unPlayedPlayers[i],function(playerName){
				notificationMessage.replace("playerName",playerName)
				db.Player_Bid_Info.findOne({matchId:matchId,playerId:unPlayedPlayers[i]},function(err1,bidInfoDoc){
				    if(err1){
				      console.log("error in getting matches getMatchTeamNames" + err1)
				    }else{
						if(bidInfoDoc){
							var j=0,nj = bidInfoDoc.bidInfo.length;
							function bidUserLoop(j){
								console.log(bidInfoDoc.bidInfo[j].FBID + " ==== " + bidInfoDoc.bidInfo[j].bidAmount);
								db.userSchema.update({_id:bidInfoDoc.bidInfo[j].FBID},{$inc:{Credits:bidInfoDoc.bidInfo[j].bidAmount}},function(err,updated){
									if(err)
										console.log("error in updating user credits " + err)
									else{
										console.log(updated)
										sendNotification(notificationMessage,bidInfoDoc.bidInfo[j].FBID,function(){
											j++;
											if(j != nj)
												bidUserLoop(j);
											else{
												bidInfoDoc.remove()
												i++;
												if(i != ni)
													playerLoop(i)
											}
										})
									}
								})
							}bidUserLoop(j)
						}else{
							i++;
							if(i != ni)
								playerLoop(i)
						}
			      	}
		      	})
			})
			
			
		}playerLoop(i)
	}
	
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

// auto live match local

var matchScoreboard = {},currentPlayingTeam,currentBatPlayingPlayers=[],currentOutPlayers=[],currentBallPlayingPlayers=[],matchStartTime = new Date(),batsman_info = [],keeper,bowler_info = [];
var battingPlayers,bowlingPlayers,bowler;
var outInfo = ["b","c","st","lbw","run out"],numBowlers;
var intervals,intervalCount = 1;
var gmatchSquad,gmatchId,team1Id,team2Id,gmtype;
var mainChangeTeam,localChangeTeam;
exports.liveMatchLocal = function(matchId,callback){
	db.Match_Shedule.findOne({matchId:matchId},function(err,matchDetails){
		if(err)
			console.log("error in getting match " + err)
		else{
			if(matchDetails){
				db.MatchPlayers.findOne({matchId:matchId},function(err,matchSquad){
					if(err)
						console.log("error in getting match squad " + err)
					else{
						if(matchSquad){
							gmatchId = matchId;
							gmtype = matchDetails.mtype;
							gmatchSquad = matchSquad;
							console.log("gmatch squad in main " + gmatchSquad)
							matchScoreboard.matchId = matchId;
							matchScoreboard.match_name = matchDetails.team1.teamName + " Vs " + matchDetails.team2.teamName;
							matchScoreboard.match_type = matchDetails.team1.teamName + " Vs " + matchDetails.team2.teamName;
							var mtype = matchDetails.mtype;
							if(mtype != 'test'){
								intervals = 2;
							}else{
								intervals = 5;
							}
							team1Id = matchDetails.team1.teamId;
							team2Id = matchDetails.team2.teamId;
							changeTeam(matchId,matchDetails.team1.teamId,matchDetails.team2.teamId,function(){
								var i = j = 1;
								/*buildBatting(matchSquad,i)
								setInterval(function(){
									i++;
									buildBatting(matchSquad,i)
								},2000)*/
								buildBowling(matchSquad,mtype,j)
								mainChangeTeam = setInterval(function(){
									j++;
									console.log("call from main")
									buildBowling(matchSquad,mtype,j)
								},2000)
							})
							/*var inter = setInterval(function(){
								changeTeam(matchSquad,matchId,matchDetails.team1.teamId,matchDetails.team2.teamId,function(){
									intervalCount++;
									console.log(intervalCount + " ----- " + intervals)
									if(intervalCount == intervals)
										clearInterval(inter)
								});
							},10000)*/
				
						}
					}
				})
				
			}else{
				callback(matchScoreboard)
			}
		}
	})
}
function buildBowling(matchSquad,mtype,ids){
	if(currentBallPlayingPlayers.length){
		var i=0,n = currentBallPlayingPlayers.length;
		function currentBallPlayingPlayersLoop(i){
			var playerId = currentBallPlayingPlayers[i].playerId;
			var st = currentBallPlayingPlayers[i].startTime
			var stl = currentBallPlayingPlayers[i].playTime
			var cDate = new Date();
			if((cDate-st) > (stl * 10000) && playerId == bowler){
				getNextBowler(matchSquad,mtype,function(){
					var bowlerObj = currentBallPlayingPlayers[i];
					currentBallPlayingPlayers.splice(i,1);
					bowlerObj.startTime = new Date();
					console.log(bowler + " === " + bowlerObj.overs)
					bowlerObj.overs = parseInt(bowlerObj.overs) + 1;
					getRandomNumber(1,2,function(playTime){
						bowlerObj.playTime = playTime;
					})
					currentBallPlayingPlayers.push(bowlerObj)
					i++;
					if(i != n)
						currentBallPlayingPlayersLoop(i)
					else{
						// buildScoreboard();
						buildBatting(matchSquad,ids)
						console.log(currentBallPlayingPlayers)
					}
				})
			}else{
				console.log(playerId + " is not out")
				getPlayerName(playerId,function(playerName){
					console.log("in player name " + playerId)
					var bowllingPlayer = {},bowler_bowling_info = {};
					bowllingPlayer.playerName = playerName;
					bowllingPlayer.playerId = playerId;

					bowler_bowling_info.Overs = ids * 1;
					bowler_bowling_info.Runs = ids * 1;
					bowler_bowling_info.Maidens = ids * 2;
					bowler_bowling_info.Wickets = ids * 3;
					bowler_bowling_info.Fours = ids * 4;
					bowler_bowling_info.sixes = ids * 5;
					bowler_bowling_info.EconemyRates = ids * 6;
					bowler_bowling_info.DotBalls = ids * 6;
					bowllingPlayer.bowler_bowling_info = bowler_bowling_info;
					if(bowler_info.length){
						var j = 0,nj = bowler_info.length;
						function bowlerLoop(j){
							if(bowler_info[j].playerId == playerId){
								// console.log("j value is " + j)
								// console.log(batsman_info[j])
								// console.log("-------------------------------------------------------")
								getBowlerOvers(bowler_info[j].playerId,function(overs){
									bowllingPlayer.bowler_bowling_info.Overs = overs;
									bowler_info.splice(j,1);
									bowler_info.push(bowllingPlayer)
									j++;
									if(j != nj)
										bowlerLoop(j)
									else{
										// console.log(batsman_info)
										i++;
										if(i != n)
											currentBallPlayingPlayersLoop(i)
										else{
											// buildScoreboard()
											buildBatting(matchSquad,ids)
											console.log(currentBallPlayingPlayers)
										}
									}	
								})
							}else{
								j++;
								if(j != nj)
									bowlerLoop(j)
								else{
									bowler_info.push(bowllingPlayer)
									// console.log(batsman_info)
									i++;
									if(i != n)
										currentBallPlayingPlayersLoop(i)
									else{
										// buildScoreboard();
										buildBatting(matchSquad,ids)
										console.log(currentBallPlayingPlayers)
									}
								}	
							}
						}bowlerLoop(j)
					}else{
						bowler_info.push(bowllingPlayer)
						// console.log(batsman_info)
						i++;
						if(i != n)
							currentBallPlayingPlayersLoop(i)
						else{
							// buildScoreboard();
							buildBatting(matchSquad,ids)
							console.log(currentBallPlayingPlayers)
						}
					}

				})
				
			}
			
		}currentBallPlayingPlayersLoop(i)
	}else{
		if(mtype == "test")
			numBowlers = 9;
		else
			numBowlers = 5;
		var a=0,na=numBowlers;
		function BowLoop(a){
			var currentBatPlayer = {},currentRunPlayer = {};
			getRandomNumber(0,bowlingPlayers.length - 1,function(playerIndex){
				console.log(bowlingPlayers.length + " == " + playerIndex)
				console.log(bowlingPlayers)
				bowler = bowlingPlayers[playerIndex].playerId;
				currentBatPlayer.playerId = bowlingPlayers[playerIndex].playerId;
				currentBatPlayer.startTime = new Date();
				currentBatPlayer.overs = 0;
				getRandomNumber(1,2,function(playTime){
					currentBatPlayer.playTime = playTime;
				})
				currentBallPlayingPlayers.push(currentBatPlayer)
				bowlingPlayers.splice(playerIndex,1)
				// console.log("index is " + playerIndex)
				// console.log(currentBallPlayingPlayers)
				// console.log(" ------------ ")
				// console.log(bowlingPlayers)
				// console.log("-------------------------------------------")

				a++
				if(a != na)
					BowLoop(a);
			})
		}BowLoop(a)
	}
}
function getBowlerOvers(playerId,callback){
	var i=0,n=currentBallPlayingPlayers.length;var overs = 0;
	function currentBallPlayingPlayersLoop(i){
			var cPlayerId = currentBallPlayingPlayers[i].playerId;
			var st = currentBallPlayingPlayers[i].startTime
			var stl = currentBallPlayingPlayers[i].playTime
			var cDate = new Date();
			if(playerId == cPlayerId){
				overs = currentBallPlayingPlayers[i].overs;
				callback(overs)
			}else{
				i++;
				if(i != n)
					currentBallPlayingPlayersLoop(i)
				else{
					callback(overs)
				}
			}
			
		}currentBallPlayingPlayersLoop(i)
}
function getNextBowler(matchSquad,mtype,callback){
	if(mtype == "test")
		numOvers = 25;
	else if(mtype == "odi")
		numOvers = 10;
	else
		numOvers = 4;
	var i = j = 0;
	function playerLoop(j){
		console.log("j value is " + j)
		getRandomNumber(j,currentBallPlayingPlayers.length - 1,function(playerIndex){
			if(currentBallPlayingPlayers[playerIndex].playerId == bowler || currentBallPlayingPlayers[playerIndex].overs == numOvers)
				playerLoop(j);
			else{
				bowler = currentBallPlayingPlayers[playerIndex].playerId;
				callback()
			}
			/*i++;
			if(i == numBowlers){
				checkBolwlingComplete()
			}*/
		})
	}playerLoop(j)
	function checkBolwlingComplete(){
		var i = j = 0,n = currentBallPlayingPlayers.length;
		function pLoop(i){
			if(currentBallPlayingPlayers[i].overs == numOvers)
				j++;
			i++;
			if(i != n)
				pLoop()
			else{
				console.log("j value in check fun is " + j)
				if(j == n)
					matchCompleted(matchSquad)
				else
					playerLoop(j);
			}
		}
	}

}
function buildScoreboard(){
	client1.get("match_day_" + gmatchId,function(err,fIndex){
		if(err)
			console.log("error in getting findex" + err)
		else{
			if(fIndex){
				var batting_info = {}, bowling_info = {};
				if(currentPlayingTeam == team1Id){
					batting_info.teamId = team1Id;
					bowling_info.teamId = team2Id;
				}else{
					batting_info.teamId = team2Id;
					bowling_info.teamId = team1Id;
				}
				batting_info.batsman_info = batsman_info;
				// console.log(batting_info)
				bowling_info.bowler_info = bowler_info;
				matchScoreboard.batting_info = batting_info;
				matchScoreboard.bowling_info = bowling_info;
				// console.log("***********************************************************************************************************************************************************************************************************")
				// console.log(fIndex)
				// console.log(matchScoreboard)
				client1.set("scoreboard_" + gmatchId + "_day_" + fIndex,JSON.stringify(matchScoreboard));
			}
		}
	})
}
function matchCompleted(matchSquad){
	console.log("innings " + intervalCount +" == " + intervals)
	if(intervalCount != intervals){
		clearInterval(mainChangeTeam)
		clearInterval(localChangeTeam)
		console.log("gmatch squad in match completed " + matchSquad)
		changeTeam(gmatchId,team1Id,team2Id,function(){
			intervalCount++;
			var i = j = 1;
			/*buildBatting(gmatchSquad,i)
			setInterval(function(){
				i++;
				buildBatting(gmatchSquad,i)
			},2000)*/
			// buildBowling(gmatchSquad,gmtype,j)
			setTimeout(function(){
				localChangeTeam = setInterval(function(){
					j++;
					console.log("call from innings")
					buildBowling(gmatchSquad,gmtype,j)
				},2000)
			},60000)
		})
	}else{
		clearInterval(mainChangeTeam)
		clearInterval(localChangeTeam)
		console.log("*************************************")
		console.log("Match Completed");
		console.log("*************************************")
	}
}
function buildBatting(matchSquad,ids){
	console.log("in batting " + matchSquad.teams[0].players.length)
	console.log("in bow " + matchSquad.teams[1].players.length)
	
	/*var battingTeam = currentPlayingTeam;
	if(matchSquad.teams[0].teamId == battingTeam){
		battingPlayers = matchSquad.teams[0].players;
		bowlingPlayers = matchSquad.teams[1].players;
	}
	else{
		battingPlayers = matchSquad.teams[1].players;
		bowlingPlayers = matchSquad.teams[0].players;
	}
	if(keeper)*/
	if(currentBatPlayingPlayers.length){
		console.log("in if")
		console.log("bat playing players " + currentBatPlayingPlayers.length)
		console.log("batting players " + battingPlayers.length)
		var i = 0,n = currentBatPlayingPlayers.length;
		function currentBatPlayingPlayersLoop(i){
			var playerId = currentBatPlayingPlayers[i].playerId;
			var st = currentBatPlayingPlayers[i].startTime
			var stl = currentBatPlayingPlayers[i].playTime
			var cDate = new Date();
			if((cDate-st) > (stl * 10000)){
				console.log(currentBatPlayingPlayers[i].playerId + " is out")
				var j = 0,nj = batsman_info.length;
				function batsmanLoop(j){
					if(batsman_info[j].playerId == playerId && batsman_info[j].batsman_comment == "not out"){
						// console.log("j value is " + j)
						// console.log(batsman_info[j])
						// console.log("-------------------------------------------------------")
						getOutComment(bowlingPlayers,function(outComment){
							console.log("comment is " + outComment)
							var outPlayerInfo = batsman_info[j];
							outPlayerInfo.batsman_comment = outComment;
							outPlayerInfo.batsman_batting_info.Comment = outComment;
							batsman_info.splice(j,1);
							batsman_info.push(outPlayerInfo)

							j++;
							if(j != nj)
								batsmanLoop(j)
							else{
								console.log(batsman_info)
								i++;
								if(i != n)
									currentBatPlayingPlayersLoop(i)
								else{
									checkBattingPlayers();
								}
							}
						})
							
					}else if(batsman_info[j].playerId == playerId){
						// push out player to current out players array
						currentOutPlayers.push(playerId);
						currentOutPlayers = currentOutPlayers.filter(function (e, i, arr) {
						    return currentOutPlayers.lastIndexOf(e) === i;
						});
						j++;
						if(j != nj)
							batsmanLoop(j)
						else{
							i++;
							if(i != n)
								currentBatPlayingPlayersLoop(i)
							else{
									checkBattingPlayers();
								}
						}
					}else{
						j++;
						if(j != nj)
							batsmanLoop(j)
						else{
							i++;
							if(i != n)
								currentBatPlayingPlayersLoop(i)
							else{
									checkBattingPlayers();
								}
						}	
					}
				}batsmanLoop(j)
				/*i++;
				if(i != n)
					currentBatPlayingPlayersLoop(i)*/

			}else{
				console.log(playerId + " is not out")
				getPlayerName(playerId,function(playerName){
					console.log("in player name " + playerId)
					var notOutBattingPlayer = {},batsman_batting_info = {};
					notOutBattingPlayer.playerName = playerName;
					notOutBattingPlayer.batsman_comment = "not out";
					notOutBattingPlayer.batsman_link = "";
					notOutBattingPlayer.playerId = playerId;

					batsman_batting_info.Comment = "not out";
					batsman_batting_info.Runs = ids * 1;
					batsman_batting_info.Minutes = ids * 2;
					batsman_batting_info.Balls = ids * 3;
					batsman_batting_info.fours = ids * 4;
					batsman_batting_info.sixes = ids * 5;
					batsman_batting_info.StrikeRate = ids * 6;
					notOutBattingPlayer.batsman_batting_info = batsman_batting_info;
					if(batsman_info.length){
						var j = 0,nj = batsman_info.length;
						function batsmanLoop(j){
							if(batsman_info[j].playerId == playerId){
								// console.log("j value is " + j)
								// console.log(batsman_info[j])
								// console.log("-------------------------------------------------------")
								batsman_info.splice(j,1);
								batsman_info.push(notOutBattingPlayer)
								j++;
								if(j != nj)
									batsmanLoop(j)
								else{
									// console.log(batsman_info)
									i++;
									if(i != n)
										currentBatPlayingPlayersLoop(i)
									else{
										checkBattingPlayers();
									}
								}	
							}else{
								j++;
								if(j != nj)
									batsmanLoop(j)
								else{
									batsman_info.push(notOutBattingPlayer)
									// console.log(batsman_info)
									i++;
									if(i != n)
										currentBatPlayingPlayersLoop(i)
									else{
										checkBattingPlayers();
									}
								}	
							}
						}batsmanLoop(j)
					}else{
						batsman_info.push(notOutBattingPlayer)
						// console.log(batsman_info)
						i++;
						if(i != n)
							currentBatPlayingPlayersLoop(i)
						else{
							checkBattingPlayers();
						}
					}

				})
				
			}
			// console.log(batsman_info)
		}currentBatPlayingPlayersLoop(i)
		function checkBattingPlayers(){
			buildScoreboard();
			if(battingPlayers.length < 1 && batsman_info.length == 11){
				console.log("match completed from bat all out")
				console.log(battingPlayers)
				console.log("bats man info")
				console.log(batsman_info)
				buildScoreboard();
				checkAllOut(function(){
					matchCompleted(matchSquad);
					
				})
			}else{
				console.log((batsman_info.length - currentOutPlayers.length) + " length ")
				if((batsman_info.length - currentOutPlayers.length) <= 1){
					getRandomNumber(0,battingPlayers.length -1,function(playerIndex){
						var currentBatPlayer = {};
						currentBatPlayer.playerId = battingPlayers[playerIndex].playerId;
						currentBatPlayer.startTime = new Date();
						getRandomNumber(1,5,function(playTime){
							currentBatPlayer.playTime = playTime;
						})
						currentBatPlayingPlayers.push(currentBatPlayer)
						battingPlayers.splice(playerIndex,1)
						console.log(batsman_info)
					})
				}
			}
		}
	}else{
		
		/*twoDifferentIndexes(battingPlayers,function(playerIndex,playerIndex1){
			
			currentRunPlayer.playerId = battingPlayers[playerIndex1].playerId;
			currentRunPlayer.startTime = new Date();
			getRandomNumber(1,5,function(playTime){
				currentRunPlayer.playTime = playTime;
			})
			
			currentBatPlayingPlayers.push(currentRunPlayer)
			
			battingPlayers.splice(playerIndex1,1)
			console.log(currentBatPlayingPlayers)
			console.log(" ------------ ")
		})*/
		function selBat(i){
			var currentBatPlayer = {},currentRunPlayer = {};
			getRandomNumber(0,battingPlayers.length - 1,function(playerIndex){
				console.log("player index is " + playerIndex)
				currentBatPlayer.playerId = battingPlayers[playerIndex].playerId;
				currentBatPlayer.startTime = new Date();
				getRandomNumber(1,5,function(playTime){
					currentBatPlayer.playTime = playTime;
				})
				currentBatPlayingPlayers.push(currentBatPlayer)
				battingPlayers.splice(playerIndex,1)
				if(i != 1)
					selBat(1)
			})
		}selBat(0)
	}
	

}
function checkAllOut(callback){
	var j = i = 0,nj = batsman_info.length;
	function batsmanLoop(j){
		if(batsman_info[j].batsman_comment == "not out"){
			i++;
		}
		j++;
		if(j != nj)
			batsmanLoop(j)
		else{
			if(i <= 1)
				callback();
		}

	}batsmanLoop(j)
		
}
function getOutComment(bowlingPlayers,callback){
	var comment = "";
	console.log("keeper is " + keeper)
	// ["b","c","st","lbw","run out"];
	getRandomNumber(0,4,function(outInfoIndex){
		var c = outInfo[outInfoIndex];
		if(outInfoIndex != 0){
			console.log("c is " + c)
			if(c == "st"){
				getPlayerName(keeper,function(playerName){
					comment = comment + c + " †" + playerName;
					getPlayerName(bowler,function(playerName){
						comment = comment + " b " + playerName;
						callback(comment)
					})
				})
			}else if(c == "lbw"){
				comment = comment + c;
				getPlayerName(bowler,function(playerName){
					comment = comment + " b " + playerName;
					callback(comment)
				})
			}else if(c == "c"){
				getRandomNumber(0,bowlingPlayers.length - 1,function(catchPlayerIndex){
					console.log(bowlingPlayers.length)
					console.log(bowlingPlayers)
					var catchPlayerId = bowlingPlayers[catchPlayerIndex].playerId;
					getPlayerName(catchPlayerId,function(playerName){
						if(catchPlayerId == keeper)
							playerName = " †" + playerName; 
						comment = comment + c + " " + playerName;
						getPlayerName(bowler,function(playerName){
							comment = comment + " b " + playerName;
							callback(comment)
						})
					})
				})
			}else{
				twoDifferentIndexes(bowlingPlayers,function(rPlayerIndex,rPlayerIndex1){
					comment = comment + c + " ";
					var rPlayerId = bowlingPlayers[rPlayerIndex].playerId;
					getPlayerName(rPlayerId,function(playerName){
						comment = comment + "(" + playerName + ",";
						var rPlayerId = bowlingPlayers[rPlayerIndex1].playerId;
						getPlayerName(rPlayerId,function(playerName){
							comment = comment + playerName + ")";
							callback(comment)
						})
					})
				})
			}
		}else{
			getPlayerName(bowler,function(playerName){
				comment = comment + " b " + playerName;
				callback(comment)
			})
		}
	})
}
function twoDifferentIndexes(battingPlayers,callback){
	getRandomNumber(0,battingPlayers.length - 1,function(playerIndex){
		var playerIndex = playerIndex;
		// player1 = battingPlayers[playerIndex];
		function playerLoop(){
			getRandomNumber(0,battingPlayers.length - 1,function(playerIndex1){
				if(playerIndex1 == playerIndex)
					playerLoop();
				else{
					callback(playerIndex,playerIndex1)
				}
			})
		}playerLoop()
	})
}
function changeTeam(matchId,team1Id,team2Id,callback){
	console.log("match squad is +++++++++++++++++++++++++++")
	db.MatchPlayers.findOne({matchId:matchId},function(err,matchSquad){
		if(err)
			console.log("error in getting match squad " + err)
		else{
			if(matchSquad){
				if(currentPlayingTeam == team1Id)
					currentPlayingTeam = team2Id
				else
					currentPlayingTeam = team1Id;
				if(matchSquad.teams[0].teamId == currentPlayingTeam){
					battingPlayers = matchSquad.teams[0].players;
					bowlingPlayers = matchSquad.teams[1].players;
				}
				else{
					battingPlayers = matchSquad.teams[1].players;
					bowlingPlayers = matchSquad.teams[0].players;
				}
				console.log("in change team --------------------------------------------------------------------------------------------------------")
				
				console.log("battingPlayers length is " + battingPlayers.length)
				console.log(bowlingPlayers)
				getRandomNumber(0,bowlingPlayers.length - 1,function(keeperIndex){
					console.log(bowlingPlayers.length);
					console.log(bowlingPlayers);
					keeper = bowlingPlayers[keeperIndex].playerId;
				})
				client1.get("match_day_" + matchId,function(err,fIndex){
					if(err)
						console.log("error in getting findex" + err)
					else{
						if(fIndex){
							fIndex = parseInt(fIndex) + 1;
							client1.set("match_day_" + matchId,fIndex)
						}else{
							fIndex = 1;
							client1.set("match_day_" + matchId,fIndex)
						}
						currentBatPlayingPlayers = [];
						currentBallPlayingPlayers = [];
						currentOutPlayers = [];
						batsman_info = [];
						bowler_info = [];
						console.log(currentPlayingTeam + " === " + fIndex)
						callback()
					}
				})
			}else{
				console.log("squad not found")
			}
		}
	})
	
}

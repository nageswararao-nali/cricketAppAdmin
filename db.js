var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/mydatabase',function(err, db){
	if(err)
		console.log(err)
	else
		console.log(db)
});

exports.Match_Shedule = mongoose.model('MatchSchedule' , {
		"matchId" : Number,
		"otherInfo" : Object,
		"mtype" : String,
		"series_id" : String,
		"series_name" : String,
		"MatchNo" : String,
		"StartDate" : Date,
		"EndDate" : Date,
		"team1" : Object,
		"team2" : Object

	},"MatchSchedule")
exports.Team_Info = mongoose.model('TeamInfo' , {
		"teamId" : Number,
		"teamName" : String,
		"teamShortName" : String,
		"teamLogoPath" : String,
        "teamLogoSmallPath" : String,
        "teamFlagPath" : String,
        "teamSmallFlagPath" : String,
        "teamRoundFlagPath" : String,
        "teamSmallRoundFlagPath" : String,
        "teamLargeRoundFlagPath" : String,
        "players" : Array

	},"TeamInfo")
exports.Player_Profile = mongoose.model('PlayerProfile' , {
		"playerId" : Number,
		"pic_url" : String,
		"image" : String,
		"otherInfo" : Object,
		"teamId" : Number,
		"firstName" : String,
		"lastName" : String,
		"country" : String,
		"fullname": String,
		"batting_info" : Object,
		"bowling_info" : Object,
		"approved" : Number // 0-non,1-level1 approve,2-need to update,3-approved
	},"PlayerProfile")
exports.Player_Profile_Updation = mongoose.model('PlayerProfileUpdation' , {
		"playerId" : Number,
		"otherInfo" : Object,
		"updated" : Number // 0-non,1-updated
	},"PlayerProfileUpdation")
exports.MatchPlayers = mongoose.model('MatchPlayers' , {
		"matchId" : Number,
		"teams" : Array
},"MatchPlayers")
exports.MatchScoreCard = mongoose.model('MatchScoreCard' , {
		"matchId" : Number,
		"scorecard" : Object
},"MatchScoreCard")
exports.News = mongoose.model('News' , {
		"newsId" : String,
		"pubDate" : String,
		"link" : String,
		"title" : String,
		"description" : String,
		"content" : String
},"News")
exports.Player_Bid_Info = mongoose.model( 'PlayerBidInfo',{
         "matchId": Number,
         "playerId" : Number,
         "bidInfo" : Array,
         "fantasyPoints": Array
},"PlayerBidInfo");
exports.Notifications = mongoose.model( 'Notifications',{
         "user": String,
         "message" : String,
         "createDate" : Date,
},"Notifications");
var Schema   = mongoose.Schema;
var userSchema = new Schema({
        _id : String,
        FBNAME : String,
        FBPIC:String,
        FBCITY:String,
        FBCOUNTRY:String,
        deviceToken:String,
        EMAIL : String,
        Credits : Number,
        FriendsList : Array,
        CreditsInfo : Array,
        fantasyPoints : Array
});
var userSchemacol = "UserSchema"
exports.userSchema = mongoose.model('UserSchema', userSchema, userSchemacol );
exports.MatchFollowers = mongoose.model('MatchFollowers',{
         "matchId": Number,
         "users" : Array,
         "createDate" : Date,
},"MatchFollowers");
exports.AdminData = mongoose.model('AdminData' , {
		"propertyName" : String,
		"propertyValue" : String
	},"AdminData")
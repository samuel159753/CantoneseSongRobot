const Discord = require('discord.js');
const token = { token }
const questionlist = { questionlist }
const prefix = "!!"
//const database = require('./database.json')
const axios = require('axios')
const { GoogleSpreadsheet } = require('google-spreadsheet');

var question = [];

var playerId = [];
var playerName = [];
var order = [];
var gameStage = "stop";
var questionNumber = 0;
var counter = 0
var shufflelist = []
var ss = ""
var score = []
var temparr = []
var tipsNumber = 0
var totalround = 10 // 題目的數量，暫定為 10
var joiningtime = 10 // 加入時間，暫定為 10秒
var hinttime = 10 // 每個提示出現時間，暫定為 10秒
var answertime = 15 // 答題時間，暫定為 15秒
var previousansname = ""
var ok = 0
var answered = []
var questionnos = []

var questionTimer;
var answerTimer;

/**
 * @param  {String} docID the document ID
 * @param  {String} sheetID the google sheet table ID
 * @param  {String} credentialsPath the credentials path defalt is './credentials.json'
 */
async function getData(docID, sheetID, credentialsPath = './cantopopbot.json') {
  const result = [];
  const doc = new GoogleSpreadsheet(docID);
  const creds = require(credentialsPath);
  await doc.useServiceAccountAuth(creds);
  await doc.loadInfo();
  const sheet = doc.sheetsById[sheetID];
  const rows = await sheet.getRows();
  for (row of rows) {
    result.push(row._rawData);
  }
  return result;
};

module.exports = {
  getData,
};

(async () => {
  const resp = await getData(questionlist, '0');
  dataLength = resp.length
  for(var i = 0;i < dataLength/5; i++){
    question.push([[],[],[],[],[]])
    question[i][0] = resp[5*i]
    question[i][1] = resp[5*i+1]
    question[i][2] = resp[5*i+2]
    question[i][3] = resp[5*i+3]
    question[i][4] = resp[5*i+4]
  }
})();

const client = new Discord.Client();

// 連上線時的事件
client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

// 當 Bot 接收到訊息時的事件
client.on("message", async message => {
  if (message.author.bot) return;

  if (message.content.startsWith(`${prefix}stop`)) {
    clearInterval(questionTimer);
    gameStage = "stop";
    return;
  } 

  if (gameStage == "stop"){
  if (!message.content.startsWith(prefix)) return;

  if (message.content.startsWith(`${prefix}start`)) {
    ready(message);
    return;
  } else {
    var ID2=message.channel.send("You need to enter a valid command!");
  }
  }

  else if (gameStage == "ready"){
    if(message.content == "join"){
      if(playerId.includes(message.author.id) == false){
        playerId.push(message.author.id);
        playerName.push(message.author.username);
        message.channel.send(message.author.username + " 加入了遊戲")
        score.push([0,0,0])
      }
    }
  }

  else if (gameStage == "question"){
    if(message.content == "."){
      if(playerId.includes(message.author.id) == true && !answered.includes(message.author.username) && order.length == 0){
        answered.push(message.author.username);
        order.push(message.author.username);
        pleaseAnswer(message,0);
      }
      else if(playerId.includes(message.author.id) == true && !answered.includes(message.author.username) && order.length > 0){
        answered.push(message.author.username);
        order.push(message.author.username);
      }
    }
  }

  else if (gameStage == "answer"){
    if (message.author.username == order[0]) {
      if(question[questionNumber][0].includes(message.content)){
        Correct(message);
      }else {
        Wrong(message);
      }
      return;
    }else if (message.content == "."){
      if(playerId.includes(message.author.id) == true && !answered.includes(message.author.username) && order.length == 0){
        answered.push(message.author.username);
        order.push(message.author.username);
        pleaseAnswer(message,0);
      }
      else if(playerId.includes(message.author.id) == true && !answered.includes(message.author.username) && order.length > 0){
        answered.push(message.author.username);
        order.push(message.author.username);
      }
    }
  }
});

  function ready(message){
    message.channel.send('請參加者在 10 秒內進入遊戲');
    score = [];
    playerId = [];
    playerName = [];
    order = [];
    gameStage = "ready";
    setTimeout(function(){
      message.channel.send("即將開始");
      setTimeout(function(){
        gameStage = "question";
        shufflelist = [];
        for(var i = 0;i < dataLength/5; i++){
          shufflelist.push(i)
        }
        shuffle(shufflelist)
        questionNumber = shufflelist[0];
        counter = 0
        start(message);
      }, 2000);
    }, joiningtime*1000);
  }

  function getquestionnos(){
    questionnos = []
    templist = []
    for(var i = 0; i < question[questionNumber][2].length; i++){ templist.push(i) }
    shuffle(templist)
    questionnos.push(templist[0])
    questionnos.push(templist[1])
    questionnos.push(getRandomInt(0,question[questionNumber][1].length-1))
  }

  function start(message){
    tipsNumber = 1;
    answered = []
    getquestionnos()
    message.channel.send(`
第 ${counter+1} 題
1. ${question[questionNumber][2][questionnos[0]]}
2.
3.`)
    counting(message)
  }

  function start2(message){
    clearInterval(questionTimer);
    if (tipsNumber == 2) {
      message.channel.send(`
第 ${counter+1} 題
1. ${question[questionNumber][2][questionnos[0]]}
2. ${question[questionNumber][2][questionnos[1]]}
3.`);
      counting(message)
    }else if (tipsNumber == 3) {
      message.channel.send(`
第 ${counter+1} 題
1. ${question[questionNumber][2][questionnos[0]]}
2. ${question[questionNumber][2][questionnos[1]]}
3. ${question[questionNumber][1][questionnos[2]]}`);
      counting(message)
    }else if (tipsNumber == 4) {
      message.channel.send("沒有人答對，正確答案是：" + question[questionNumber][0][0] + " " + question[questionNumber][4][0]);
      NextRound(message);
    }
  }

  function counting(message){
    questionTimer = setInterval(function(){
      if (gameStage == "question"){
        tipsNumber++;
        start2(message)
      }
    }, hinttime*1000);
  }

  function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1) + min); //The maximum is inclusive and the minimum is inclusive
  }

  function shuffle(a) {
    var m = a.length, t, i;
    while (m) {
      i = Math.floor(Math.random() * m--);
      t = a[m];
      a[m] = a[i];
      a[i] = t;
    }
    return a;
  }


  function NextRound(message){
    clearInterval(questionTimer);
    clearTimeout(answerTimer);
    order = [];
    counter++;
    questionNumber = shufflelist[counter];
    setTimeout(function(){
      gameStage = "question";
      if (counter >= totalround/2){
        ranking(message);
      }
      if (counter < totalround){
        start(message);
      }
    }, 3000);
  }

  function ranking(message){
    if (counter == totalround){
      ss = `最終排行：
`
    }else {
      ss = `目前排行：
`
    }
    temparr = []
    for(var i = 0;i < playerName.length; i++){
      temparr.push([score[i][2],playerName[i]]);
    }
    temparr.sort(function(a,b){ return a<b });
    ddd = 0;
    for(var i = 0;i < playerName.length; i++){
      if (i == 0){
        ss += `${1}. ${temparr[i][0]} - ` + temparr[i][1] + `
`;        
      }else if (temparr[i][0] == temparr[i-1][0]){
        ss += `${ddd+1}. ${temparr[i][0]} - ` + temparr[i][1] + `
`;
      }else {
        ddd = i;
        ss += `${i+1}. ${temparr[i][0]} - ` + temparr[i][1] + `
`;
      }

    }
    message.channel.send(ss)
    if (counter == totalround){
      ss = `恭喜 `
      var bb = 0;
      for(var i = 0;i < playerName.length; i++){
        if (temparr[0][0] != temparr[i][0]) { break; }
        if (bb == 1) { ss += `、` };
        ss += temparr[i][1];
        bb = 1;
      }
      ss += ` 獲勝！`
      message.channel.send(ss)
      clearInterval(questionTimer);
      gameStage = "stop";
    }
  }

  function Correct(message){
    message.react('✅')
    cc = playerName.indexOf(message.author.username)
    score[cc][0]++;
    score[cc][2] += (4 - tipsNumber);
    NextRound(message);
  }

  function Wrong(message){
    message.react('❌');
    cc = playerName.indexOf(message.author.username)
    score[cc][1]++;
    score[cc][2] -= 2;
    clearTimeout(answerTimer);
    previousansname = order[0];
    order.shift();
    if(order.length == 0){
      gameStage = "question";
    }else{
      pleaseAnswer(message,2);
    }
  }

  function NoAns(message){
    cc = playerName.indexOf(message.author.username)
    score[cc][1]++;
    score[cc][2] -= 2;
    clearTimeout(answerTimer);
    previousansname = order[0];
    order.shift();
    if(order.length == 0){
      message.channel.send(previousansname + " 沒有回答，視同答錯。");
      gameStage = "question";
    }else{
      pleaseAnswer(message,1);
    }
  }

  function pleaseAnswer(message,ss){
    if (ss == 0){
      message.channel.send(order[0] + " 請在 15 秒內回答：");
    }else if (ss == 1){
      message.channel.send(previousansname + " 沒有回答，" + order[0] + " 請在 15 秒內回答：");
    }else if (ss == 2){
      message.channel.send(previousansname + " 答錯了，" + order[0] + " 請在 15 秒內回答：");
    }
    gameStage = "answer";
    answerTimer = setTimeout(function(){
      NoAns(message);
    }, answertime*1000);
  }

client.login(token);

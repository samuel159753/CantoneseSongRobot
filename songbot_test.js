const Discord = require('discord.js');
const { token } = require('./token.json');
const { prefix } = require('./config.json');
//const database = require('./database.json')
const axios = require('axios')

var question = [[],[],[]]; // [TipsNumber][questionNumber]
var answer = [];
var singer = [];

var playerId = [];
var playerName = [];
var order = [];
var gameStage = "stop";
var questionNumber = 0;

var questionTimer;
var answerTimer;

axios.get('https://sheets.googleapis.com/v4/spreadsheets/1uJgaXeSVt9opLpXOt8ShLOaeV5ynncfQzcJLvvOHZV8/values/1?key=AIzaSyBXbGZBtIW1CQFHMMn8gymi6nQfdWBon9s')
.then(response =>{
    var dataLength = JSON.parse(JSON.stringify(response.data))['values'].length;
    for(var i = 1;i < dataLength; i++){
      question[0].push(JSON.parse(JSON.stringify(response.data))['values'][i][1]);
      question[1].push(JSON.parse(JSON.stringify(response.data))['values'][i][2]);
      question[2].push(JSON.parse(JSON.stringify(response.data))['values'][i][3]);
      answer.push(JSON.parse(JSON.stringify(response.data))['values'][i][4]);
      singer.push(JSON.parse(JSON.stringify(response.data))['values'][i][5]);
    }});

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
    if(playerId.includes(message.author.id) == false){
      playerId.push(message.author.id);
      playerName.push(message.author.username);
      message.channel.send(message.author.username + "加入了遊戲")
      }
  }

  else if (gameStage == "question"){
    if(playerId.includes(message.author.id) == true && order.length == 0){
      order.push(message.author.username);
      pleaseAnswer(message);
    }
    else if(playerId.includes(message.author.id) == true && order.length > 0){
      order.push(message.author.username);
    }
  }

  else if (gameStage == "answer"){
    if (message.author.username == order[0]) {
      if(message.content == answer[questionNumber]){
        Correct(message);
      }else {
        Wrong(message);
      }
      return;
    }
  }


});

  function ready(message){
    message.channel.send('請參加者在5秒內進入遊戲');
    gameStage = "ready";
    setTimeout(function(){
      message.channel.send("即將開始");
      setTimeout(function(){
        gameStage = "question";
        start(message);
      }, 2000);
    }, 5000);
  }

  function start(message){
      var tipsNumber = 1;
      message.channel.send(
`

1. ${question[0][questionNumber]}
2.
3.
`
).then((sentMessage) => {
  questionTimer = setInterval(function(){
    if(gameStage == "question")tipsNumber++;
    if (tipsNumber == 2) {
      sentMessage.edit(
`
1. ${question[0][questionNumber]}
2. ${question[1][questionNumber]}
3.
`
      );
    }else if (tipsNumber == 3) {
      sentMessage.edit(
`
1. ${question[0][questionNumber]}
2. ${question[1][questionNumber]}
3. ${question[2][questionNumber]}
`
      );
    }else if (tipsNumber == 5) {
      message.channel.send("正確答案是:" + answer[questionNumber] + " " + singer[questionNumber]);
      Correct(message);
    }
  }, 7000)
});
  }

  function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1) + min); //The maximum is inclusive and the minimum is inclusive
  }

  function Correct(message){
    message.react('✅')
    clearInterval(questionTimer);
    clearTimeout(answerTimer);
    order = [];
    questionNumber = getRandomInt(0,19);
    setTimeout(function(){
      gameStage = "question";
      start(message);
    }, 3000);
  }

  function Wrong(message){
    message.channel.send('❌');
    clearTimeout(answerTimer);
    order.shift();
    if(order.length == 0){
      gameStage = "question";
    }else{
      pleaseAnswer(message);
    }
  }

  function pleaseAnswer(message){
    message.channel.send(order[0] + " 請在10秒內回答：");
    gameStage = "answer";
    answerTimer = setTimeout(function(){
      Wrong(message);
    }, 10000);
  }

client.login(token);

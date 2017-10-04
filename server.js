var MONGODB_URL = "";
var express = require('express');
var app = express();
var mongo = require('mongodb').MongoClient;
var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
var endpoint = "https://api.qwant.com/api/search/images?count=";

app.use(express.static('views'));

app.get("/", function (req, res) {
  res.send("index.html");
})

app.get("/latest", function (req, res) {
  mongo.connect(MONGODB_URL, function(err, db) {
    if (err) throw err;
    var collection = db.collection("latest");
    collection.find().sort({$natural: -1}).limit(10).toArray(function(err, documents) {
      if (err) throw err;
      if (documents.length === 0) {
        res.send({ error: "There is no recent search record" });
      } else {
        res.send(documents);
      }
    })
  }) 
})

app.get("/imagesearch/:keyword/:offset", function (req, res) {
  var keyword = req.params.keyword;
  var count = req.params.offset;
  var url = endpoint + count + "&offset=1&q=" + keyword;
  var json = getJson(url);
  var result = [];
  insert(keyword, new Date(Date.now()));
  for (var i = 0; i < count; i++) {
    result[i] = {
      image: json.data.result.items[i].media,
      title: json.data.result.items[i].title,
      thumbnail: json.data.result.items[i].thumbnail,
      context: json.data.result.items[i].url
    }
  }
  res.send(result);
})

function getJson(url) {
  var xmlHttp = new XMLHttpRequest();
  xmlHttp.open("GET", url, false);
  xmlHttp.send(null);
  return JSON.parse(xmlHttp.responseText);
}

function insert(term, when) {
  mongo.connect(MONGODB_URL, function(err, db) {
    if (err) throw err;
    var collection = db.collection("latest");
    collection.insert({
      term: term, 
      when: when
    }, function(err) {
      if (err) throw err;
      db.close();
    })
  })
}

app.listen(8080, function() {
  console.log("Server start at port: 8080");
});

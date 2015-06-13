var express = require('express');
var router = express.Router();
var mf = require("../models/modelFunctions.js");
var periodicTable = require("../models/periodicTable.js");
var senateSeating = require("../models/senateSeating.js");
var worldMap = require("../models/worldMap.json");
var async = require('async');
var bs = require("binary-search");
var jsonSocket = require('json-socket');

router.get('/', function(req, res, next) {
  res.render('main', { title: 'World Map' });
});

router.get('/periodic', function(req, res, next) {
  res.render('main', { title: 'Periodic Table' });
});

router.get('/senate', function(req, res, next) {
  res.render('main', { title: 'US Senate Seating' });
});

router.get('/topojson', function(req, res, next) {
  res.render('topojson', { title: 'topo' });
});

function filterClosure(sortedKeys, result, mapType) {
  var book = null;
  if (mapType === "Periodic Table"){
    book = periodicTable.book;
  }
  else if (mapType === "US Senate Seating"){
    book = senateSeating.book;
  }
  else {
    book = worldMap;
  }
  return function(item, callback) {
    if ( bs(sortedKeys, item, function(a,b){return a-b;}) > 0 || (result[item] < 0.4) ){
      var test = book[item];
      test["properties"] = {
        "stroke": "#090909",
        "stroke-width": 1,
        "fill": (result[item] < 0.4)? "#fcae91" :
                (result[item] < 0.6)? "#fb6a4a" :
                (result[item] < 0.8)? "#de2d26" : "#a50f15"
        };
      callback(null, test);
    }
    else
      callback(null, 'false');
    };
}

function filterClosureN(sortedKeys, result, mapType) {
  var book = null;
  if (mapType === "Periodic Table"){
    book = periodicTable.book;
  }
  else if (mapType === "US Senate Seating"){
    book = senateSeating.book;
  }
  else {
    book = worldMap;
  }
  return function(item, callback) {
    if ( bs(sortedKeys, item, function(a,b){return a-b;}) > 0 || (result[item] < 0.4) ){
      var test = {};
      test["key"] = item;
      test["properties"] = {
        "stroke": "#090909",
        "stroke-width": 1,
        "fill": (result[item] < 0.4)? "#fcae91" :
                (result[item] < 0.6)? "#fb6a4a" :
                (result[item] < 0.8)? "#de2d26" : "#a50f15"
        };
      callback(null, test);
    }
    else
      callback(null, 'false');
    };
}

router.get('/heatmap', function(req, res, next) {
  var options = {
        host: '165.124.181.53',
        port: 8080,
        path: '/wikisr/sr/map/sID/'+req.query.key+'/langID/1',
        method: 'GET',
        headers: {
           'Content-Type': 'application/json'
           }
       };

  mf.getJSON(options, function(statusCode, result){
      var keys = null;
      var mapType = decodeURIComponent(req.query.mapType);
      console.log(mapType);
      if (mapType === "Periodic Table")
        keys = Object.keys(periodicTable.book);
      else if (mapType === "US Senate Seating")
        keys = Object.keys(senateSeating.book);
      else
        keys = Object.keys(worldMap);

      var resultKeys = Object.keys(result);
      var sortedKeys = resultKeys.sort(function(a,b){return a-b;});

      if (mapType == "Periodic Table" || mapType == "US Senate Seating"){
        var filterC = filterClosure(sortedKeys, result, req.query.mapType);
        async.map(keys, filterC, function(err, geoJson){
          if (!err)
            res.json({"type":"FeatureCollection", "features":geoJson.filter(function(a){
              return a!=='false';
            })});
          else
            console.log(err);
          });
        }
      else{
        var filterC = filterClosureN(sortedKeys, result, req.query.mapType);
        async.map(keys, filterC, function(err, geoJson){
          if (!err)
            res.json(geoJson.filter(function(a){
              return a!=='false';
            }));
          else
            console.log(err);
          });
      }
    });
});

router.get('/srapi/:id', function(req, res, next) {
  var options = {
        host: '165.124.181.35',
        port: 8080,
        path: '/wikifier/wiki/title/suggest/'+encodeURIComponent(req.params.id.replace(/\ /g,'_')),
        method: 'GET',
        headers: {
           'Content-Type': 'application/json'
           }
       };

  mf.getJSON(options, function(statusCode, result){
      var array = new Array();
      for (var i in result.response) {
           if (result.response[i]['titleId'] != -1){
           array.push(result.response[i]);
         }
       }
       res.json(array);
    });
});

module.exports = router;

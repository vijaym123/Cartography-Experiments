$(document).ready(function(){
  var topLayer=null;
  var topicQuery = new Bloodhound({
    datumTokenizer: Bloodhound.tokenizers.obj.whitespace('title'),
    queryTokenizer: Bloodhound.tokenizers.whitespace,
    remote: '/srapi/%QUERY'
    });

  topicQuery.initialize();

  var myTypeahead = $('#remote .typeahead').typeahead(null, {
    name: 'topic-query',
    displayKey: 'title',
    source: topicQuery.ttAdapter()
    });

  myTypeahead.on('typeahead:selected',function(evt,data){
    var type = $('#selectedCartoType').text();
    var selectedMap = type.substring(4,type.length-3);
    waitingDialog.show('Loading Maps...', {dialogSize: 'sm'});
    $.get( "/heatmap?key="+data['titleId']+"&mapType="+selectedMap, function(k){
      console.log('k');
      })
      .done(function(geoJson) {
        if (map.hasLayer(topLayer)){
          map.removeLayer(topLayer);
        }

        if (selectedMap=="Periodic Table" || selectedMap=="US Senate Seating"){
          topLayer = L.geoJson(geoJson,{ style: L.mapbox.simplestyle.style });
        }
        else{
          var worldmapBook = [];
          $.each(geoJson, function( index, value ) {
            var test = book[value['key']];
            test["properties"] = value["properties"];
            worldmapBook.push(test);
          });
          topLayer = L.geoJson({"type":"FeatureCollection", "features": worldmapBook}, { style: L.mapbox.simplestyle.style })
        }
        topLayer.addTo(map);
        waitingDialog.hide();
      });
  });

  $('#button').click(function() {
    var query = $('#query').val();
    var option = $('#option').val();
    var data ={};
    data['query'] = query;
    data ['option'] = option;
    $.ajax({
      url: '/srapi',
      data: JSON.stringify(data),
      dataType: 'json',
      type: 'POST',
      contentType: 'application/json;charset=UTF-8',
      })
      .done  (function(data) { $("#content").html(data["result"]); })
      .fail  (function() { alert("Error"); });
    });
});

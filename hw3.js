
var mymap = L.map('mapid').setView([51.505, -0.09], 3);
var map_control = L.control.layers().addTo(mymap); 



var total_regions = new Set();
var total_cuisines = new Set();	

var tileset = L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw', {
    maxZoom: 18,
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
        '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
        'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
    id: 'mapbox/streets-v11'
}).addTo(mymap);



var table = new Tabulator("#example-table", {
    height:"400px",
    layout:"fitColumns",
    tooltipsHeader: false,
    pagination:"local",
    paginationSize: 10,
    movableColumns:true,
    columns:[
        {title:"Name", field:"name",headerFilter:true,headerFilterLiveFilter:false, sorter:"string", width:150},
        {title:"Year", field:"year", sorter:"number"},
        {title:"Latitude", field:"latitude", sorter:"number"},
        {title:"Longitude", field:"longitude", sorter:"number"},
        {title:"City", field:"city", sorter:"string"},
        {title:"Region", field:"region", sorter:"string"},
        {title:"Zip-code", field:"zipCode", sorter:"number"},
        {title:"Rating", field:"rating", formatter:"star", align:"center", width:100},
        {title:"Cuisine", field:"cuisine", sorter:"string"},
        {title:"Price", field:"price", sorter:"number"},
        {title:"URL", field:"url", sorter:"string", width:150},
    ],
});



//trigger download of data.csv file
$("#download-csv").click(function(){
    table.download("csv", "data.csv");
});



var mp = {one:1,two:2,three:3};
var reader_onload_count = 0;
function handleFiles(){
	let selectedFiles = document.getElementById('input').files;
	document.getElementById("inputblock").innerHTML = "processing please wait";
	for(let filenum=0; filenum<selectedFiles.length; filenum++){
		let num_of_stars = selectedFiles[filenum].name.split('-')[0];
		let reader = new FileReader();
		reader.onload = function (e) {
			
			let data=Papa.parse(reader.result,{header:true,skipEmptyLines:true, transform:function(val,field){
					if(field==="price" && val !=="N/A")
						val = val.split("").length;return val; }
					})["data"];
			for(let i = 0; i< data.length; i++){
				data[i]["rating"] = mp[num_of_stars]; 
			}	
		table.addData(data);
		reader_onload_count++;
		if(reader_onload_count===selectedFiles.length)
			loadData();
		};
		reader.readAsText(selectedFiles[filenum]);
	}
}
function loadData(){
	let final_data = table.searchData([]);
	
	createPieChart(final_data);
	createStackedbarChart(final_data);
	createColomnBarChart(final_data);
	createAdvanced1Chart();
	createAdvanced2Chart();
	document.getElementById("inputblock").style.display = "none";
    document.getElementById("everything").style.display = "block";
	createMap();
}

var name_to_stars = {'one': 1, 'two': 2, 'three': 3, 'Show All' : 4, 'Hide All' : 5};


/*
new code start
*/




var stars_to_names=["one","two","three","Show All","Hide All"];

function createMap(){/*
	mymap = L.map('mapid').setView([51.505, -0.09], 13);
	map_control = L.control.layers().addTo(mymap);
	tileset.addTo(mymap);*/
	mymap.invalidateSize();
	showOnlyRegion("");
}

function addRegionFromTable(region){
	let filters = region=== "" ? [] : [{field:"region",type:"=",value:region}];
	let data = table.searchData(filters);
	let layers = [L.layerGroup(),L.layerGroup(),L.layerGroup(),L.layerGroup(),L.layerGroup()];
	for(let i=0; i<data.length; i++){
		let rating = data[i]["rating"],
			latitude = parseFloat(data[i]['latitude']),
			longitude = parseFloat(data[i]['longitude']),
			marker = L.marker([latitude, longitude]).bindPopup(data[i]["name"]);
		layers[rating-1].addLayer(marker);
		layers[3].addLayer(marker);
	}
	return layers;
}
function showOnlyRegion(region){
	mymap.removeControl(map_control);
	mymap.eachLayer(layer=>{layer === tileset ? {} : mymap.removeLayer(layer);});
	let regionLayers = addRegionFromTable(region);//an array of layers 0-4 when 3 is all, last is none
	let new_control = L.control.layers({})
	for (let i=0; i<5; i++){
			new_control.addBaseLayer(regionLayers[i],stars_to_names[i]);
			mymap.addLayer(regionLayers[i]);
	}
	
	map_control = new_control.addTo(mymap);
	document.getElementsByClassName('leaflet-control-layers')[0].getElementsByTagName('input')[4].click();
}

/*
new code end
*/


function enterSearch(e){
	if(e.key === "Enter")Search();
}

function Search() {
    region = document.getElementById('search_input').value;
	showOnlyRegion(region);
	
}

/**/
//<!-- Chart code -->


function dataForPieChart(data){
	let values = {};
	for(let i =0; i < data.length; i++){
		let price = data[i]["price"];
		if(price === "N/A")
			continue;
		if (!values.hasOwnProperty(price))
			values[price] = 1;
		else
			values[price]++;
	}
	let values_array=[];
	for(let i in values){
		values_array.push({"price":i,"count":values[i]});
	}
	//console.log(values_array);
	return values_array;
}


function dataForStackedbarChart(data){
	let values = {regions:new Set(),data:[{category:"One Star"},{category:"Two Stars"},{category:"Three Stars"}]};
	for(let i = 0; i < data.length; i++){
		let region = data[i]["region"],
			stars = data[i]["rating"];
		values["regions"].add(region);
		if(!values["data"][stars-1].hasOwnProperty(region))
			values["data"][stars-1][region] = 1;
		else
			values["data"][stars-1][region]++;
	}
	total_regions = values["regions"];
	return values;
}


function createPieChart(data){
	am4core.ready(function() {

// Themes begin
		am4core.useTheme(am4themes_animated);
// Themes end

// Create chart instance
		var chart = am4core.create("piechartdiv", am4charts.PieChart);

// Add data
		chart.data = dataForPieChart(data); 

// Add and configure Series
		var pieSeries = chart.series.push(new am4charts.PieSeries());
		pieSeries.dataFields.value = "count";
		pieSeries.dataFields.category = "price";
		pieSeries.slices.template.stroke = am4core.color("#fff");
		pieSeries.slices.template.strokeWidth = 2;
		pieSeries.slices.template.strokeOpacity = 1;

// This creates initial animation
    pieSeries.hiddenState.properties.opacity = 1;
    pieSeries.hiddenState.properties.endAngle = -90;
    pieSeries.hiddenState.properties.startAngle = -90;

});



} // end am4core.ready()

function createStackedbarChart(data){
	am4core.ready(function() {

	// Themes begin
		am4core.useTheme(am4themes_animated);
	// Themes end

		var chart = am4core.create("stackedchartdiv", am4charts.XYChart);
		chart.hiddenState.properties.opacity = 0; // this creates initial fade-in
		let regionData = dataForStackedbarChart(data);
		chart.data =  regionData["data"];
		/*chart.data=[
			{
				category: "One Star",
				region1: 1,
				region2: 5
				//region3: 3
			},*/

		chart.colors.step = 2;
		chart.padding(30, 30, 10, 30);
		chart.legend = new am4charts.Legend();

		var categoryAxis = chart.xAxes.push(new am4charts.CategoryAxis());
		categoryAxis.dataFields.category = "category";
		categoryAxis.renderer.grid.template.location = 0;
		categoryAxis.renderer.grid.template.disabled = true;

		var valueAxis = chart.yAxes.push(new am4charts.ValueAxis());
		valueAxis.min = 0;
		//valueAxis.max = 100;
		valueAxis.renderer.grid.template.disabled = true;
		valueAxis.strictMinMax = true;
		valueAxis.calculateTotals = true;
		valueAxis.renderer.minWidth = 50;
		valueAxis.labelsEnabled = false;
		valueAxis.renderer.labels.template.disabled = true;
		/**/
		
		//console.log(regionData["regions"]);
		for(let region of regionData["regions"]){
			
			let series = chart.series.push(new am4charts.ColumnSeries());
			series.columns.template.width = am4core.percent(65);
			
			series.columns.template.tooltipText =
				"{name}: {valueY}";
			series.name = region;
			series.dataFields.categoryX = "category";
			series.dataFields.valueY = region;
			//series.dataFields.valueYShow = "totalPercent";
			series.dataItems.template.locations.categoryX = 0.5;
			series.stacked = true;
			series.tooltip.pointerOrientation = "vertical";

			let bullet = series.bullets.push(new am4charts.LabelBullet());
			bullet.interactionsEnabled = false;
			bullet.label.text = "{valueY}";
			//bullet.label.fill = am4core.color("#ffffff");
			bullet.locationY = 0.5;
		}
		
		
		//chart.scrollbarX = new am4core.Scrollbar();
		chart.scrollbarY = new am4core.Scrollbar();/**/
		}
	);
	 // end am4core.ready()
}



function dataForColomnChart(data){
	let values = {};
	for(let i =0; i < data.length; i++){
		let cuisine = data[i]["cuisine"];
		if (!values.hasOwnProperty(cuisine))
			values[cuisine] = 1;
		else
			values[cuisine]++;
	}
	let values_array=[];
	for(let i in values){
		values_array.push({"cuisine":i,"count":values[i]});
		total_cuisines.add(i);
	}
	//console.log(values_array);
	return values_array;
}



function createColomnBarChart(data){
	am4core.ready(function() {

		// Themes begin
		am4core.useTheme(am4themes_animated);
		// Themes end

		// Create chart instance
		var chart = am4core.create("colomnchartdiv", am4charts.XYChart);

		// Add data
		chart.data =  dataForColomnChart(data);
		//console.log(dataForColomnChart(data));		
		var categoryAxis = chart.xAxes.push(new am4charts.CategoryAxis());
		categoryAxis.dataFields.category = "cuisine";
		categoryAxis.renderer.grid.template.location = 0;
		categoryAxis.renderer.grid.template.disabled = true;
		categoryAxis.renderer.minGridDistance = 0;
		//categoryAxis.renderer.labels.template.rotation = 90;
		//categoryAxis.renderer.labels.template.wrap = true;
		categoryAxis.renderer.labels.template.maxWidth = 120;
		categoryAxis.renderer.labels.template.wrap = true;
		//categoryAxis.renderer.labels.template.minWidth = 80;
		//categoryAxis.renderer.labels.template.tooltipText = "{category}: [bold]{value}[/]";
		categoryAxis.renderer.cellStartLocation = 0.1;
		categoryAxis.renderer.cellEndLocation = 0.9;
		
		/**/
		categoryAxis.events.on("sizechanged", function(ev) {
				var axis = ev.target;
				  var cellWidth = axis.pixelWidth / (axis.endIndex - axis.startIndex);
				  if (cellWidth < axis.renderer.labels.template.maxWidth) {
					axis.renderer.labels.template.rotation = 90;
					axis.renderer.labels.template.horizontalCenter = "left";
					axis.renderer.labels.template.verticalCenter = "middle";
				  }
				  else {
					axis.renderer.labels.template.rotation = 0;
					axis.renderer.labels.template.horizontalCenter = "middle";
					axis.renderer.labels.template.verticalCenter = "top";
				  }
				});/**/
		
		
		categoryAxis.renderer.labels.template.adapter.add("fill", function(fill, target) {
		  if (target.dataItem && target.dataItem.index & 2 == 2) {
			return am4core.color("rgb(255,255,255)");
		  }
		  return am4core.color("rgb(0, 0, 0)");
		});

		categoryAxis.renderer.labels.template.adapter.add("dy", function(dy, target) {
		  if (target.dataItem && target.dataItem.index & 2 == 2) {
			return dy + 25;
		  }
		  return dy;
		});/**/
		//categoryAxis.renderer.labels.template.fontSize = 20;
		
		//categoryAxis.
		chart.paddingBottom = 20;
		chart.paddingTop = 20;
		chart.paddingLeft = 20;
		chart.paddingRight = 20;
		var valueAxis = chart.yAxes.push(new am4charts.ValueAxis());
		valueAxis.calculateTotals = true;
		valueAxis.renderer.labels.template.adapter.add("text", function(text) {
				return text + "%";
				});
		// Create series
		var series = chart.series.push(new am4charts.ColumnSeries());
		
		series.calculatePercent = true;
		series.dataFields.valueY = "count";
		series.dataFields.categoryX = "cuisine";
		series.dataFields.valueYShow = "percent";
		series.name = "count";
		series.columns.template.tooltipText = "{categoryX}: [bold]{valueY}[/]";
		series.columns.template.fillOpacity = .8;
		series.columns.template.adapter.add("fill", function(fill, target) {
		  if (target.dataItem && target.dataItem.index & 2 == 2) {
			return am4core.color("rgb(255,255,255)");
		  }
		  return am4core.color("rgb(0, 0, 0)");
		});

		var columnTemplate = series.columns.template;
		columnTemplate.strokeWidth = 2;
		columnTemplate.strokeOpacity = 1;

	}); // end am4core.ready()
}


/*excpect data for column first*/


function dataForAdvanced1Chart(){
	let values=[];
	for(let cuisine of total_cuisines){
		let data = table.searchData([{field:"cuisine",type:"=",value:cuisine},{field:"price",type:"!=",value:"N/A"}]);
		let sum = 0;
		for(let i=0; i<data.length; i++){
			sum+=data[i]["price"];
		}
		if(data.length)
			values.push({cuisine:cuisine,value:((sum/data.length).toFixed(2))});
	}
	return values;
	
}/**/
function createAdvanced1Chart(){
	am4core.ready(function() {
		// Themes begin
		am4core.useTheme(am4themes_animated);
		// Themes end

		var chart = am4core.create("advanced1chartdiv", am4plugins_forceDirected.ForceDirectedTree);
		var networkSeries = chart.series.push(new am4plugins_forceDirected.ForceDirectedSeries());

		let data = dataForAdvanced1Chart();/*
		  data.push({cuisine: "Node " + i, value:Math.random() * 50 + 10});
		}
		/**/
		chart.data = data;
		
		
		networkSeries.minSize = am4core.percent(5);
		networkSeries.minSize = am4core.percent(25);
		networkSeries.manyBodyStrength = -5;
		networkSeries.dataFields.value = "value";
		networkSeries.dataFields.name = "cuisine";
		networkSeries.dataFields.children = "children";
		networkSeries.nodes.template.tooltipText = "[bold]{name}:[/]{value}";
		networkSeries.nodes.template.fillOpacity = 1;
		networkSeries.dataFields.id = "name";
		networkSeries.dataFields.linkWith = "linkWith";


		networkSeries.nodes.template.label.text = "[bold black]{name}\navg:{value}[/]"
		networkSeries.fontSize = 14;

		var selectedNode;

		var label = chart.createChild(am4core.Label);
		label.text = "Click on cuisines to connect between them.\nRight combination will give a surprising result."
		label.x = 10;
		label.y = 10;
		label.fill = am4core.color("rgb(0,0,255)");
		label.isMeasured = false;


		networkSeries.nodes.template.events.on("up", function (event) {
		  var node = event.target;
		  if (!selectedNode) {
			node.outerCircle.disabled = false;
			node.outerCircle.strokeDasharray = "3,3";
			selectedNode = node;
		  }
		  else if (selectedNode == node) {
			node.outerCircle.disabled = true;
			node.outerCircle.strokeDasharray = "";
			selectedNode = undefined;
		  }
		  else {
			var node = event.target;

			var link = node.linksWith.getKey(selectedNode.uid);

			if (link) {
			  node.unlinkWith(selectedNode);
			}
			else {
			  node.linkWith(selectedNode, 0.2);
			}
		  }
		})

		}); // end am4core.ready()
}



function dataForAdvanced2Chart(){
	values=[];
	for(let region of total_regions){
		
		let sum = 0;
		let data = table.searchData([{field:"region",type:"=",value:region},{field:"price",type:"!=",value:"N/A"}]);
		for (let i=0; i < data.length; i++){
			sum += data[i]["price"];
		}
		

		if (data.length)
			values.push({"name":region,"value":(sum/data.length).toFixed(2),"latitude":parseFloat(data[0]["latitude"]),"longitude":parseFloat(data[0]["longitude"])});
		
			
	}
	return values;
}


function createAdvanced2Chart(){
	am4core.ready(function() {
		// Themes begin
		am4core.useTheme(am4themes_animated);
		// Themes end

		// Create map instance
		var chart = am4core.create("advanced2chartdiv", am4maps.MapChart);
		var title = chart.titles.create();
		title.text = "[bold font-size: 20]Expensiveness Distrebution[/]\n from existing data";
		title.textAlign = "middle";
		
		mapData = dataForAdvanced2Chart();
		chart.geodata = am4geodata_worldLow;
		// Set projection
		chart.projection = new am4maps.projections.Miller();

		// Create map polygon series
		var polygonSeries = chart.series.push(new am4maps.MapPolygonSeries());
		polygonSeries.exclude = ["AQ"];
		polygonSeries.useGeodata = true;
		polygonSeries.nonScalingStroke = true;
		polygonSeries.strokeWidth = 0.5;
		/**/
		var imageSeries = chart.series.push(new am4maps.MapImageSeries());
		imageSeries.data = mapData;
		imageSeries.dataFields.value = "value";

		var imageTemplate = imageSeries.mapImages.template;
		imageTemplate.propertyFields.latitude = "latitude";
		imageTemplate.propertyFields.longitude = "longitude";
		imageTemplate.nonScaling = true
		imageTemplate.layout = "absolute";

		var circle = imageTemplate.createChild(am4core.Circle);
		circle.fillOpacity = 0.7;
		//circle.propertyFields.fill = "color";
		circle.tooltipText = "{name}\n avg:[bold]{value}[/]";
		circle.radius = 5;

		imageSeries.heatRules.push({
		  "target": circle,
		  "property": "fill",
		  "min": am4core.color("rgb(0,0,255)"),
		  "max": am4core.color("rgb(255,0,0)"),
		  "dataField": "value"
		})
		var heatLegend = chart.createChild(am4charts.HeatLegend);
		heatLegend.series = imageSeries;
		heatLegend.width = am4core.percent(100);
		heatLegend.markerContainer.height = am4core.percent(80);
		heatLegend.position = "left";
		heatLegend.valign = "bottom";
		heatLegend.orientation = "vertical";
		heatLegend.markerCount = 7;
		
		heatLegend.valueAxis.renderer.labels.template.adapter.add("text", function(text, target) {
		  
		  for(let i=1; i<parseInt(text); i++)
			  text+="$";
		  return text;
		});/**/
		}); // end am4core.ready()
}
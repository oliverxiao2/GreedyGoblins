
//global
var global_mdfList = [];
var global_mdfObj = {fileName:"", obj:null};
var global_svgList = [];
var global_currentSVG = null;

/*function $(n){
	return document.querySelector(n);
}
function $$(n){
	return document.querySelectorAll(n);
}*/
function initUI(container){
	console.log("begin initializing ui...")
	if (container == "#div_channels"){
		let main = d3.select("#div_channels").select(".panel-body");
		main.select(".list-group").remove();
		let list = main.append("div").attr("class", "list-group");
		list.append("a").attr("class", "list-group-item").attr("href", "#").text("no channels yet!");
	}
	else if (container.slice(0,3) == "svg") {
		// initialize svg
	}
	// adjust the height of div_files
	if (true){
		$("#nav_001").height(50);
		$("#nav_001").width($(window).width());
		let _chart_width = $(window).width()-280;
		let _chart_height = $(window).height()-100;
		$("#div_files").height(_chart_height);
		$("#div_chart").height(_chart_height);
		$("#div_chart").css("left", $(window).width());
		$("#div_chart_left").width(240);
		$("#div_chart_left").height(_chart_height);
		$("#div_chart_right").width(_chart_width);
		$("#div_chart_right").height(_chart_height);
	}
	if ($("#div_files").outerHeight(true) < $(window).height()){
		let h = $(window).height()-80;
		//$("#div_files").height(h);
	};

	//add event listeners for ui componets
	//$("#mdfFileInput").addEventListener("change", readMDF);
}
initUI("");
function ajaxPost(n){
	if(n=="0-1"){
		var selectDAT = "";
		var reportType = $("input[name='reportType']:checked").val();
		var selectDArray = [];
		//收集选中的DAT文件列表，生成绘图视图中的下拉列表项
		//console.log($(".fileCheckbox"));
		for (let i of $(".fileCheckbox")){
			if (i.checked){
				selectDArray.push(i.value)
				$("#select_file").append($("<option>"+i.value+"</option>"));
				selectDAT += (encodeURI(i.value)+"|");
			}
		}
		console.log(selectDAT);
		//移动到绘图视图
		d3.select("#div_chart").style("display", "block");
		d3.select("#div_files").transition().duration(900).style("left", (-$(window).width())+"px");
		d3.select("#div_files").transition().delay(900).style("display", "none");
		d3.select("#div_chart").transition().duration(900).style("left", "0px");
		addChart();
		console.log("move 0 -> 1");
		$.ajax({
			url:"/polls/parse/",
			type:"get",
			data:{selectDAT:selectDAT, reportType:reportType},
			success: function(response){
				var fileName = $("#select_file").val();
				var data = response[fileName];
				console.log(data);
				$("#div_chart_left_0_channel").empty();
				if (data["chL"]){
					let group = d3.select("#div_chart_left_0_channel")
					for(let j=0; j<data["chL"].length;j++){
						let groupItem = group.append("div").attr("class", "list-group-item");
						groupItem.append("a").attr("data-toggle", "collapse")
											.attr("class", "list-group-item")
											.style("font-weight", "bold")
											.attr("href", "#"+data["chL"][j][0]+"___"+getASC(fileName)).text(data["chL"][j][0])
												.append("span")
												.attr("class", "badge")
												.style("float", "right")
												.text(data["chL"][j].length);
						let ul = groupItem.append("div")
															.attr("id", data["chL"][j][0]+"___"+getASC(fileName))
															.attr("class", "panel-collapse collapse")
																.append("ul")
																.attr("class", "list-group")
						for (let i=0;i<data["chL"][j].length;i++){
							ul.append("a")
								.attr("class", "list-group-item")
								.attr("draggable", "true")
								.attr("ondragstart", "handlerChDragStart(event)")
								.text(data["chL"][j][i]);
						}
					}
				}
			}
		});
	}
}
function getASC(s){
	var out = "";
	for (i in s){out += s[i].charCodeAt(0);}
	return out;
}
function handlerChDragStart(event){
	var channel = event.target.text;
	var fileName = $("#select_file").val();
	event.dataTransfer.setData("fileName", fileName);
	event.dataTransfer.setData("channel", channel);
}
function readMDF(event){
	var reader = new FileReader();
	//var progress = $("#font_mdfResult_progress");
	var file = event.target.files[0];
	reader.onload = function(e){
		var arrayBuffer = e.target.result;
		try     {var item = new MyMDF(new MDF(arrayBuffer)), finished = true;}
		catch(e){var item = null; finished = false;}
		finally {
			global_mdfObj.fileName = file.name;
			global_mdfObj.obj = item;
			//updateFileListTable(file.valueOf(), finished);
			if(finished){
				console.log("Succeed to read mdf database......")
				F5Channels("#div_channels", item);
			}
		}
		reader = null;
	};
	/*reader.onprogress = function(e){
		progress.value = e.loaded/e.total*100;
	}*/
	reader.readAsArrayBuffer(file);
}
function F5Channels(container, d){
	if (container == "#div_channels"){
		let chs = d.getChList().chs;
		let main = d3.select("#div_channels").select(".panel-body");
		main.select(".list-group").remove();
		let list = main.append("div").attr("class", "list-group");
		for (let i=0; i<chs.length; i++){
			let n = chs[i].shortSignalName.split("\\")[0]
			list.append("a")
					.attr("class", "list-group-item")
					.attr("href", "#div_drawArea")
					.attr("onclick", "global_currentSVG.addPlot('"+n+"', 0, false)")
					.text(n);
		}
	}
}
MyMDF = function(mdf){
	/*
	1.property
	version:
	author:
	org:
	project:
	comment:
	2.method
	chlist(chGIndex=-1, any=false)
		args
		chGIndex=-1: fetch all channels
		chGIndex>=0: fetch channel group of index i:
		return Object
		.ch
		.names
	ch(channelName):
	*/
		this.inputMdf= mdf;
		this.version = mdf.idBlock.versionNumber;
		this.author  = mdf.hdBlock.authorName;
		this.org     = mdf.hdBlock.organizationName;
		this.project = mdf.hdBlock.projectName;
		this.comment = mdf.hdBlock.fileComment.text;
		this.getChList  = function(chGIndex=-1, any=false){
			/*
				chGIndex = -1: return all channel groups;
				any = true: return including master channels and $$ ones
			*/
			let out = new Object;
			out.chs = [];
			out.names = [];
			out.detail = [];
			let currentChG = -1;
			let currentChID = -1;
			for (let datagroup of mdf.dgBlocks){
				for (let channelgroup of datagroup.cgBlocks){
					currentChG += 1;
					if (chGIndex==-1||chGIndex==currentChG){
						for (let channel of channelgroup.cnBlocks){
							currentChID += 1;
							out.chs.push(channel);
							out.names.push(channel.shortSignalName);
							out.detail.push(getDetail(channel, currentChG, currentChID))
						}
					}
				}
			}
			return out};
		this.getCh = function(channelName){
			/*
			.chX: time axis Object
			.chY: data axis Object
			.chGComment: channel group comment
			.dict: [{data:'', time:''}]
			*/
			var out = new Object;
			out.dict = [];
			var chGComment = '';
			var masterchannel = new Object;
			return(init()?out:null);
			function init(){
				for (let datagroup of mdf.dgBlocks){
					for (let channelgroup of datagroup.cgBlocks){
						chGComment = channelgroup.comment.text;
						for (let channel of channelgroup.cnBlocks){
							//record master channel
							if(channel.channelType) masterchannel = channel;
							if (channel.shortSignalName.split('\\',1)[0] == channelName){
								if(channel.channelType == 0){
									out.chGComment = chGComment;
									out.chY = channel;
									out.chX = masterchannel;
									for (let i = 0; i<masterchannel.rawDataArray.length; i++){
											out.dict.push({
												x:masterchannel.rawDataArray[i],
												y:channel.rawDataArray[i]
											});
									}
									return true;
								}
							}
						}
					}
				}
			}
		};
		this.calXY = function({X:X, Y:Y, x1:x1, y1:y1}){
			var out = new Object;
			out.index = [];
			out.value = [];
			if (Y){
				var dataY = this.getCh(Y).chY.rawDataArray;
				var dataX = (X?this.getCh(X).chY.rawDataArray : this.getCh(Y).chX.rawDataArray);
				if(x1){
					for(let i=0; i<dataX.length; i++){
						if (dataX[i] == x1){
							out.index.push(i);
							out.value.push(dataY[i]);
						}
					}
				}
				else if(y1){
					for(let i=0; i<dataY.length; i++){
						if (dataY[i] == y1){
							out.index.push(i);
							out.value.push(dataX[i]);
						}
					}
				}
			}
			return out;
		}
		/*for (let datagroup of mdf.dgBlocks){
			for (let channelgroup of datagroup.cgBlocks){
				for (let channel of channelgroup.cnBlocks){
				}
			}
		}*/

	};
function getDetail(channel=Object, chGIndex, chID){
	return item = {
		chGIndex: chGIndex,
		chID: chID,
		channelType: channel.channelType,
		name: channel.shortSignalName,
		descr: channel.signalDescription,
		samplingrate: channel.samplingRate,
		data: channel.rawDataArray,
		unit: channel.ccBlock.physicalUnit,
		conversion: channel.ccBlock.additionalConversionData,
		conversionType: channel.ccBlock.conversionType
	};
}
function resampling({
	dataArray:dataArray,
	ratio:ratio,
	keepPoints:keepPoints
	}){
	var out = []
	if (ratio>0){
		let r = Math.round(ratio);
		for (let i=0; i<dataArray.length; i++){
			if (i % r == 0) out.push(dataArray[i]);
		}
		return out;
	}
	else if (keepPoints>0){
		let interval = (dataArray.length-1)/(keepPoints-1);
		for (let i=0; i<keepPoints; i++){
			out.push(dataArray[Math.round(i*interval)]);
		}
		return out;
	}
}
function allowDrop(event){
	event.preventDefault();
}
function handlerOfDrop(event){
	event.preventDefault();
	var fileName = event.dataTransfer.getData("fileName");
	var channel = event.dataTransfer.getData("channel");
	$.ajax({
		url:"/polls/fetchChannel/",
		type:"get",
		data:{fileName:fileName, channel:channel},
		success: function(response){
			console.log(response);
			var ch = response["channel"];
			var d = response["data"];
			global_currentSVG.addPlot(channel=ch, area=0, active=false, data=d);
		}
	});
}
SVG = function(containerID, templateNo=0, config={}){
	var size = {width:895, height:600};
	if (templateNo==1){
		size = {width:895, height:600};
	}
	var padding = {top:20, bottom:30, left:60, right:15};
	zoom = d3.zoom()
		.scaleExtent([1, 10000])
		.translateExtent([ [0, 0], [size.width, size.height]])
		.on("zoom", zoomed)
	d3.select(containerID).append("p").append("br")
	var table = d3.select(containerID).append("table")
	this.table = table;
	let _row = table.append("tr")
	svg = _row.append("td")
				.append("svg")
					.attr("draggable", "true")
					.attr("ondragover", "allowDrop(event)")
					.attr("ondrop", "handlerOfDrop(event)")
					.attr("width", size.width)
					.attr("height", size.height);
	svg_rect = svg.append("rect")
								.attr("id", "zoom-layer")
								.attr("width", size.width)
								.attr("height", size.height)
								.style("visibility", "hidden")
								.attr("pointer-events", "all")
								.call(zoom);
	svg_clipPath = svg.append("g")
											.append("defs")
												.append("clipPath").attr("id", "clip1")
													.append("rect")
													.attr("width", size.width-padding.left-padding.right)
													.attr("height", 0.7*size.height-padding.top)
													.attr("transform", "translate("+padding.left+", "+padding.top+")")
	var _right_td =  _row.append("td").style("vertical-align", "top")
	var infoTable1 = _right_td.append("div")
														.attr("class", "infoTableContainder")
														.attr("style", "height:430px;")
														.append("table").attr("style", "margin-top:3px;");
	var infoTable2 = _right_td.append("div")
														.attr("class", "infoTableContainder")
														//.attr("style", "height:160px;border:1px solid #CCC")
														.append("table").attr("style", "margin-top:3px;");
	let thead = infoTable1
							.attr("width", 300)
							.attr("border", 1)
							.attr("bordercolor", "#AAA")
							.append("thead")
							.append("tr")
	thead.append("td").text("#")
	thead.append("td").text("Legend")
	thead.append("td").text("Channel")
	thead.append("td").text("Cursor1")
	infoTable1.body = infoTable1.append("tbody");
	thead = infoTable2
							.attr("width", 300)
							.attr("border", 1)
							.attr("bordercolor", "#AAA")
							.append("thead")
							.append("tr")
	thead.append("td").text("#")
	thead.append("td").text("Legend")
	thead.append("td").text("Channel")
	thead.append("td").text("Cursor1")
	infoTable2.body = infoTable2.append("tbody");

	var pathGroup1 = svg.append("g").attr("id", "svg_pathGroup1")
																	.attr("clip-path", "url(#clip1)")
	var x = d3.scaleLinear();
	var y = [d3.scaleLinear()];
	var x1, x2, y1, y2, xAxis1, xAxis2, yAxis1, yAxis2, line;
	init();
	function init(){
		//生成横坐标、总坐标
		if(true){

		}
		if(templateNo==1){
			x1 = d3.scaleLinear().domain([0, 1])
							.range([padding.left, size.width-padding.right])
							.nice();
			x2 = d3.scaleLinear().domain([0, 1])
							.range([padding.left, size.width-padding.right])
							.nice();
			y1 = d3.scaleLinear()
								.domain([0 ,1])
								.range([size.height*0.7, padding.top])
								.nice();
			y2 = d3.scaleLinear()
							.domain([0 ,1])
							.range([size.height-padding.bottom, size.height*0.7+padding.bottom])
							.nice();
			xAxis1 = d3.axisBottom(x1);
			xAxis2 = d3.axisBottom(x2);
			yAxis1 = d3.axisLeft(y1);
			yAxis2 = d3.axisLeft(y2);
			xGrid1 = d3.axisBottom(x1);
			xGrid2 = d3.axisBottom(x2);
			yGrid1 = d3.axisLeft(y1);
			yGrid2 = d3.axisLeft(y2);
			addXGrid(xGrid1, size.height*0.7, 10, padding.top-size.height*0.7)
			addXGrid(xGrid2, size.height-padding.bottom, 10, 2*padding.bottom-size.height*0.3);
			addYGrid(yGrid1, padding.left, 10, padding.left+padding.right-size.width);
			addYGrid(yGrid2, padding.left, 5, padding.left+padding.right-size.width);
			dom_Y1 = addYAxis(d3.axisLeft(y1), padding.left);
			dom_X1 = addXAxis(d3.axisBottom(x1), size.height*0.7);
			dom_X2 = addXAxis(d3.axisBottom(x1), size.height-padding.bottom);
			dom_Y2 = addYAxis(d3.axisLeft(y2).ticks(5), padding.left);
		}
		//svg.on("click", function(){alert("click!!!$$$")})
	}
	function zoomed(){
		var t = d3.event.transform;
		var xt = t.rescaleX(x1);
		var yt = t.rescaleY(y1);
		svg.select("#svg_pathGroup1").selectAll(".svg_path")
				.each(function(d){
					d3.select(this)
						.attr("d", line.x(function(d){return xt(d.x)}))
						.attr("d", line.y(function(d){return yt(d.y)}));
				})
		dom_X1.call(xAxis1.scale(xt));
		dom_Y1.call(yAxis1.scale(yt));
		console.log(x1.domain(), y1.domain())

	}
	function addXAxis(axis, position, len){
		//每张子图有且只有一条x轴
		var out = svg.append("g")
									.attr("class", "xAxis")
									.attr("transform", "translate(0, "+(position)+")")
									.attr("stroke-width", 1.0)
									.call(axis)
		return out
	}
	function addXGrid(axis, position, ticks, tickSize){
		let _axis = axis.ticks(ticks).tickSize(tickSize).tickFormat("");
		svg.append("g")
				.attr("class", "grid")
				.attr("z-index", -1)
				.attr("stroke-dasharray", "5, 5")
				.attr("transform", "translate(0, "+(position)+")")
				.call(_axis)
	}
	function addYAxis(axis, position){
		var out = svg.append("g")
									.attr("class", "yAxis")
									.attr("transform", "translate("+position+", 0)")
									.attr("stroke-width", 1.0)
									.call(axis)
		return out
	}
	function addYGrid(axis, position, ticks, tickSize){
		var _axis = axis.ticks(ticks).tickSize(tickSize).tickFormat("");
		svg.append("g")
				.attr("class", "grid")
				.attr("stroke-dasharray", "5, 5")
				.attr("transform", "translate("+position+", 0)")
				.call(_axis)
	}
	function addPath(data, channel, area=0, active=false){
		var existed = false;
		if (area==0){
			var t = infoTable1;
			var group = pathGroup1;
		}
		else if (area==1){
			var t = infoTable2;
			var group = pathGroup2;
		}
		for (item of t.body.selectAll(".legend_ch")._groups[0]){
			if (item.innerText == channel){
				existed = true;
				alert(item.innerText);
				break;
			}
		}
		if (existed == false){
			x1.domain(getNewDomain([x1.domain(), d3.extent(data, function(d){return d.x})])).nice();
			y1.domain(getNewDomain([y1.domain(), d3.extent(data, function(d){return d.y})])).nice();
			line = d3.line()
									.x(function(d){return x1(d.x)})
									.y(function(d){return y1(d.y)});
			// update infoTable
			var _id = t.body.selectAll("tr")._groups[0].length;
			var _row = t.body.append("tr").attr("height", "16px");
			_row.append("td").attr("style", "").text(_id);
			_row.append("td").attr("style", "")
					.style("padding", "3px")
						.append("svg")
						.attr("width", 20)
						.attr("height", 10)
							.append("rect")
							.attr("width", 20)
							.attr("height", 10)
							.attr("fill", getGoogleColor(_id));
			_row.append("td").attr("class", "legend_ch").text(channel);
			_row.append("td").attr("style", "").text("0");
			//append path
			group.append("g")
					.append("path")
					.attr("id", area+"___"+channel)
					.attr("class", "svg_path")
					.datum(data)
					.attr("d", line)
					.attr("fill", "none")
					.attr("stroke", getGoogleColor(_id))
					//.attr("stroke-linejoin", "round")
					.attr("stroke-linecap", "round")
					.attr("stroke-width", 1.3)
					.attr("pointer-events", "all")
					//.on("mouseover", handlerOfT1)
			// update x axis, y axis
			if (area==0){
				dom_X1.call(xAxis1.scale(x1));
				dom_Y1.call(yAxis1.scale(y1));
			}
		}
		else{

			alert("已经添加过此曲线");
		}
	}
	this.addPlot = function(channel, area=0, active=false, data=[]){
		var d;
		if (data.length==0) {
			d = global_mdfObj.obj.getCh(channel).dict;
		}
		else{
			d = data;
		}
		addPath(d, channel, area, active);
		//调整x轴 y轴
	}
	function getNewDomain(domainGroup=[]){
		var min = d3.min(domainGroup, function(d){return d[0]});
		var max = d3.max(domainGroup, function(d){return d[1]});
		return [min, max];
	}
	function fitPath(type=0){
		if (type==0){
		}
	}
	function getGoogleColor(n){
		var colors_g = ["#3366cc", "#dc3912", "#ff9900", "#109618", "#990099",
										"#0099c6", "#dd4477", "#66aa00", "#b82e2e", "#316395",
										"#994499", "#22aa99", "#aaaa11", "#6633cc", "#e67300",
										"#8b0707", "#651067", "#329262", "#5574a6", "#3b3eac"];
		return colors_g[n % colors_g.length];
	}
}

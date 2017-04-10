//global
var global_mdfList = [];
var global_mdfObj = {fileName:"", obj:null};
var global_svgList = [];
var global_currentSVG = null;
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
		$("#nav_001").width(window.screen.availWidth);

		let _chart_width = $(window).width()-280;
		let _chart_height = $(window).height()-55-12;
		$("#div_body_center").height(_chart_height);
		$("#p1_welcome").height(_chart_height);
		$("#p2_report").height(_chart_height-10);
		$("#p3_local").height(_chart_height);
		$("#div_files").height(_chart_height);
		$("#div_chart").height(_chart_height);
		$("#div_chart").css("left", $(window).width());
		$("#div_chart_left").height(_chart_height);
		$("#div_chart_right").width(_chart_width);
		$("#div_chart_right").height(_chart_height);
		console.log($("#div_files").height());
	}
	//add event listeners for ui componets
	//$("#mdfFileInput").addEventListener("change", readMDF);
}
initUI("");
function reportDOMer(parentD3){
	_t = parentD3.append("table")
									.attr("width", "100%");

	_td1 = _t.append("col").attr("width", "200px");
	_td2 = _t.append("col");
	_td1.append("div")
			.attr("id", "div_report_outline");
	_td2.append("div")
			.attr("id", "div_report_box");
}
function ajaxAutoReporter(action,...args){
	//读取自动生成图表需要的数据
	switch (action) {
		case "updateTemplateList":
		$.ajax({
			url:"/polls/ajaxFetch/",
			type:"get",
			data:{action:action},
			success: function(response){
				for (const [i, arg] of args.entries()){
					switch (i) {
						case 0:
							_mainFrame = d3.select("#"+arg);
							_mainFrame.empty();
							_table = _mainFrame.append("table")
																 .attr("width", "100%")
																 .attr("height", "100%");
							_table.append("col").attr("width", "400px");
							_table.append("col");
							_tr = _table.append("tr").style("vertical-align", "top");
							_td1 = _tr.append("td").style("padding-left", "5px");

							_td2 = _tr.append("td").style("padding-right", "5px");
							_editor = _td2.append("div")
														.attr("id", "div_report_editor")
														.attr("contenteditable", "true")
														//.attr("style", "width:1000px; height:600px;")



							reportTemplateListDOMer({parentD3:_td1, data:response["fileList"]})
							break;
						default:

					}
				}
			}
		});
			break;
		case "updateReportTemplate":
			$.ajax({
				url:"/polls/ajaxFetch/",
				type:"get",
				data:{action:action, reportFile: "reportA.json"},
				success: function(response){
					abc = response;
					console.log(response);
				}
			});
			break;
		default:
			return false;
	}
}
function reportTemplateListDOMer({
	parentID,
	parentD3,
	data
}){
	const parent = parentD3 || d3.select("#"+parentID);
	let _mf = parent.append("div")
									.style("height", "100%")
									.style("padding-bottom", "30px")
									.style("overflow-y", "scroll");

	const _id = (new Date()).getTime()
	_select = _mf.append("select")
							 .attr("class", "input-large form-control")
							 .attr("style", "width:200px")
							 .on("change", function(){
								 const _reportFile = event.target.value;
								 console.log("开始读取模板"+_reportFile)
								 if(true){
									 $.ajax({
										 url:"/polls/ajaxFetch/",
						 				type:"get",
						 				data:{action:"updateReportTemplate", reportFile:_reportFile},
						 				success: function(response){
						 					console.log("成功读取模板"+_reportFile+", 开始解析模板中的作图格式");
											reportTemplateBodyDOMer({
												parentD3: _mf,
		 										data: response["body"]["figures"]
		 								 });
										 new D3REPORT({parentID: "div_report_editor",data: response});
						 				}
									});
								 }
							 })
  _select.append("option").text("=== 选择报告模板 ===")
	for (const elem of data){
		_select.append("option")
					 .attr("value", elem["fileName"])
					 .text(elem["fileName"])}
}
function reportTemplateBodyDOMer({
	parentID,
	parentD3,
	data
}={}){
	let parent = parentD3 || d3.select("#"+parentID);
	let _mf = parent.append("form")
	for (const [i, elem] of data.entries()){
		let _id = (new Date()).getTime();
		let _mf_i = _mf.append("div").attr("class", "panel panel-default").style("margin-bottom", "3px");
		_head = _mf_i.append("div")
						.attr("class", "panel-heading")
		_head.append("i").attr("class", "icon-bar-chart").style("margin-right", "15px")
		_head.append("a")
						.attr("data-toggle", "collapse")
						.attr("href", "#collapse_"+_id+i)
						.style("font-size", "13px")
						.style("color", "black")
						.text(elem["title"])
		_mf_i_c = _mf_i.append("div")
									 .attr("id", "collapse_"+_id+i)
									 .attr("class", "panel-collapse collapse")
									 	.append("div")
										.attr("class", "panel-body")
		_mf_i_c1 = _mf_i_c.append("div").attr("class", "input-group")
		_mf_i_c1.append("span").attr("class", "input-group-addon")
						.text("图片编号")
		_mf_i_c1.append("input")
						.attr("type", "text")
						.attr("class", "form-control")
						.attr("value",elem["figureID"])

		_mf_i_c2 = _mf_i_c.append("div").attr("class", "input-group")
		_mf_i_c2.append("span").attr("class", "input-group-addon")
						.text("测量文件")
		_mf_i_c2.append("input")
						.attr("type", "text")
						.attr("class", "form-control")
						.attr("value", elem["fileName"])

		_ul = _mf_i_c.append("ul").attr("class", "list-group")
		const _g_style = ["primary", "success", "warning", "danger", "info"]
		for (const [i, chG] of elem["numChannelGroups"].entries()){
			if (i != (elem["numChannelGroups"].length-1)){
				let _g = _ul.append("li").attr("class", "list-group-item")
				for (const [j, ch] of chG.entries()){
					_g.append("span")
						.attr("class", "label label-"+_g_style[i%5])
						.attr("draggable", "true")
						.style("font-weight", "regular")
						.text(ch["name"])
					console.log(ch.length)
				}
			}
		}

		let _g_bit = _ul.append("li").attr("class", "list-group-item");
		for (const [i, bitG] of elem["bitChannels"].entries()){
			if (i != (elem["bitChannels"].length-1)){
				_g_bit.append("span")
							.attr("class", "label label-"+_g_style[(elem["numChannelGroups"].length)%5])
							.attr("draggable", "true")
							.style("font-weight", "regular")
							.text(bitG["name"])
			}
		}
	}
}
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
			dom_Y2 = addYAxis(d3.axisLeft(y2), padding.left);
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
D3REPORT = function({
	parentID     = "",
	parentD3,
	data         = {}
}){
	//类全局变量声明
	var parent, mainFrame;
	const reportID = "id_report"+(new Date()).getTime();
	//
	parent = parentD3 || d3.select("#"+parentID);
	mainFrame = parent.append("div")
										.attr("id", reportID)
										.attr("class", "css_d3Report")

	let _pages = data["body"]["pages"];
	const _pagesCount = _pages.length;
	for (const [i, elem] of _pages.entries()){
		let _frame = mainFrame.append("div").attr("class", "div_report_page");
		let _headerStr, _footerStr, _header, _footer, _body, _pageBreak
		if (i==0){
			_headerStr = data["header"]["firstPage"];
			_footerStr = data["footer"]["firstPage"];
		}
		else if (i==_pages.length-1) {
			_headerStr = data["header"]["lastPage"];
			_footerStr = data["footer"]["lastPage"];
		}
		else{
			_headerStr = data["header"]["body"];
			_footerStr = data["footer"]["body"];
		}
		if (_headerStr == ""){_headerStr = data["header"]["body"];}
		if (_footerStr == ""){_footerStr = data["footer"]["body"];}
		_footerStr = _footerStr.replace(/\{\$pageNo\$\}/, ""+(i+1))
		_headerStr = '<table>    <tbody>        <tr class="firstRow">            <td width="231" valign="middle" style="word-break: break-all;" align="center">                <span style="font-family: &quot;arial black&quot;, &quot;avant garde&quot;; font-size: 30px;">UAES</span>            </td>            <td width="231" valign="middle" style="word-break: break-all;" align="center">                <p>                    <span style="font-family: arial, helvetica, sans-serif;">开发报告</span>                </p>                <p>                    <span style="font-family: arial, helvetica, sans-serif;">Development Report</span>                </p>            </td>            <td width="231" valign="top" style="word-break: break-all;" align="center">                <p>                    <span style="font-family: arial, helvetica, sans-serif; font-size: 14px;">NE2</span>                </p>                <hr width="80%" noshade="noshade" size="1px"/>                <p>                    <span style="font-family: arial, helvetica, sans-serif; font-size: 14px;">（Dev. Dep）</span><br/>                </p>            </td>            <td width="231" valign="top" align="center" style="word-break: break-all;">                <p>                    <span style="font-family: arial, helvetica, sans-serif; font-size: 14px;">2017</span>                </p>                <hr width="80%" noshade="noshade" size="1px"/>                <p>                    <span style="font-family: arial, helvetica, sans-serif; font-size: 14px;">（Year/No.）<br/></span>                </p>            </td>        </tr>        <tr>            <td valign="top" rowspan="1" colspan="4" style="word-break: break-all;">                <span style="font-family: arial, helvetica, sans-serif; font-size: 14px;">Distribution: EAV1-Zhang Jing, EAO-Zhang Weiwei, customer via SA</span>            </td>        </tr>    </tbody></table><p>    <br/></p>'
			_header = _frame.append("div").attr("class", "css_d3Report_header").html(_headerStr);
			_body = _frame.append("div").attr("class", "css_d3Report_body").html(data["body"]["pages"][i]);
			_footer = _frame.append("div").attr("class", "css_d3Report_footer").html(_footerStr);
			if (i != _pages.length-1){
				_pageBreak = _frame.append("hr").attr("class", "css_d3Report_pageBreak").attr("noshade", "noshade").style("height", "5px");
			}
	}

	let _pGroup = $("#"+reportID+" p");
	for (let i=0; i<_pGroup.length; i++){
		let _m = _pGroup[i].innerText.match(/\{\$figureID\=[0-9]*\$\}/);
		if ( _m != null ){
			//正则表达式match返回的_m是一个数组
			const _id = "fID"+((new Date()).getTime()+i);
			const _fIndex = parseInt(_m[0].slice(11, -2))-1;
			_pGroup[i].setAttribute("id", _id)
			$("#"+_id).after("<div id='figure_"+_id+"'></div>");
			$("#"+_id).remove();
			new D3CHART({parentID:"figure_"+_id, data:data["body"]["figures"][_fIndex]})
		}
	}
	//解析template, 生成相应的dom树
	/*for (const [i, elem] of data["body"]["figures"].entries()){
		new D3CHART({parentID:reportID, data:elem})
	}*/
}
D3CHART = function({
	parentID     = "",
	parentD3,
	legTableID   = "",
	legTableCSS  = "",
	legColor     = "google10",
	infoTableID  = "",
	infoTableCSS = "css_infoTable",
	data         = {},
	width        = 1050,
	svgPadding   = {top:5, left:50, bottom:20, right:20}

}){
	//CHART类使用的全局变量全部在下面声明
	let figureGroup, d3LegTable, d3InfoTable;
	const parent = parentD3 || d3.select("#"+parentID);
	const mainFrame = parent.append("div")
											.attr("class", "css_d3Chart")
											.attr("contenteditable", "false");
	const marks = data["marks"];
	<!--生成图表标题-->
	mainFrame.append("p").attr("class", "css_chartTitle").text(data["title"]);

	figureGroup = mainFrame.append("div").attr("class", "css_figureGroup")
	<!--生成num类型图表-->
	let _indexFrom = 0;
	for (const i of data["numChannelGroups"]){
		new D3SVG({parentD3:figureGroup, svgWidth:width, dataGroup:i, marks:marks, indexFrom:_indexFrom});
		_indexFrom += i.length;
	}
	<!--生成bit类型图表（只有一张）-->
	new D3SVG({parentD3:figureGroup, svgWidth:width, dataGroup:data["bitChannels"], dataType:"bit", marks:marks, indexFrom:_indexFrom});
	<!--生成图例表格-->
	d3LegTable  = mainFrame.append("table")
												.attr("id", legTableID)
												.attr("class", legTableCSS)

	<!--生成文件信息表格-->
	d3InfoTable = mainFrame.append("table")
												.attr("id", infoTableID)
												.attr("class", infoTableCSS)
												.attr("width", width-svgPadding.left)
												.attr("style", "margin-left:"+svgPadding.left+"px;")
	d3InfoTable.append("col").attr("width", "600")
	d3InfoTable.append("col")
	let _InfoTr = d3InfoTable.append("tr")
	_InfoTr.append("td").append("textarea").attr("readonly", "readonly").text(data["fileInfo"]["comment"])
	_InfoTr.append("td").append("textarea").attr("readonly", "readonly").text(
		("Author:"+data["fileInfo"]["author"]+"\n"+
		"Veichle:"+data["fileInfo"]["subject"]+"\n"+
		"Project:"+data["fileInfo"]["project"]+"\n"+
		"Organization:"+data["fileInfo"]["organisation"]+"\n"+
		"Time:"+data["fileInfo"]["date"]+" "+data["fileInfo"]["time"]+"\n"+
		"FileName"+data["fileName"])
	);
}
D3SVG = function({
	parentID     = "",
	parentD3,
	svgID,
	svgCSS,
	svgWidth     = 1050,
	svgHeight    = 140,
	svgPadding   = {top:5, left:50, bottom:18, right:20},
	svgStyleID   = 0,
	widthRatio   = 0.62,
	dataGroup    = [],
	dataType     = 0,
	marks        = [],
	indexFrom    = 0
}){
	var parent, svg,x, xAxis, dom_xAxis, y1, y1Axis, dom_y1Axis, y2, y2Axis, dom_y2Axis, line, graphViewBox, borderLayer, shadeLayer, hideLayer, pathGroup, legendGroup, channelList=[], master, fontFamily, fontSize;
	fontFamily = "Consolas";
	fontSize = "13px";

	if (svgStyleID == 0){
		//有一条x轴，左右两侧最多两条y轴，一个遮罩层，一个隐藏层，一个曲线组
		//调整坐标范围
		_id = String(window.performance.now());
		graphViewBox = {"x1":svgPadding.left,
										"y1":(svgPadding.top+0.5),
										"x2":(widthRatio*svgWidth+0.5),
										"y2":(svgHeight-svgPadding.bottom)}
		x = d3.scaleLinear().range([graphViewBox.x1, graphViewBox.x2-0.5]);
		y1 = d3.scaleLinear().range([graphViewBox.y2, graphViewBox.y1-0.5]);
		y2 = d3.scaleLinear().range([graphViewBox.y2, graphViewBox.y1-0.5]);
		<!-- 取出x轴数据 -->
		master = dataGroup.pop();
		x.domain(d3.extent(master));
		for (const i of dataGroup){y1.domain(getNewDomain([y1.domain(), d3.extent(i["data"])]))};
		y1.nice();
		xAxis  = d3.axisBottom(x);
		y1Axis = (y1.ticks().length>4)?d3.axisLeft(y1).ticks(4):d3.axisLeft(y1);
		y2Axis = d3.axisRight(y2);
		//添加dom元素
		parent = parentD3 || d3.select("#"+parentID);
		let zoom = d3.zoom()
			.scaleExtent([1, 10000])
			.translateExtent([ [0, 0], [svgWidth, svgHeight]])
			.on("zoom", zoomed);
		svgID = svgID || _id;
		svg = parent.append("svg")
								.attr("width", svgWidth)
								.attr("height", svgHeight);
		actionLayer = svg.append("g")
											.append("rect")
											.attr("fill", "none")
											.style("visibility", "hidden")
											.attr("pointer-events", "all")
											.attr("width", graphViewBox.x2 - graphViewBox.x1)
											.attr("height", graphViewBox.y2 - graphViewBox.y1)
											.attr("transform", "translate("+svgPadding.left+","+svgPadding.top+")")
											.call(zoom)
		borderLayer = svg.append("g")
											.append("path")
											.attr("fill", "none")
											.attr("stroke", "black")
											.attr("stroke-width", 1.0)
											//.darum(_borderData)
											.attr("d", "M "+graphViewBox.x1+" "+(graphViewBox.y1)+" L "+(graphViewBox.x2)+" "+(graphViewBox.y1)+" L "+(graphViewBox.x2)+" "+(graphViewBox.y2))
											.call(zoom)

		shadeLayer  = svg.append("defs").append("clipPath").attr("id", "shadeLayer_"+_id)
										.append("rect").attr("width", graphViewBox.x2 - graphViewBox.x1)
										.attr("height", graphViewBox.y2 - graphViewBox.y1)
										.attr("transform", "translate("+svgPadding.left+","+svgPadding.top+")")

		dom_xAxis   = svg.append("g").attr("transform", "translate(0, "+(svgHeight-svgPadding.bottom)+")").style("font-family", fontFamily).attr("stroke-width", 1.0).call(xAxis);
		dom_y1Axis  = svg.append("g").attr("transform", "translate("+svgPadding.left+", 0)").style("font-family", fontFamily).attr("stroke-width", 1.0).call(y1Axis);
		dom_y2Axis  = svg.append("g").style("font-family", fontFamily).style("display", "none").call(y1Axis);
		pathGroup   = svg.append("g").attr("clip-path", "url(#shadeLayer_"+_id+")");
		legendGroup = svg.append("g").attr("transform", "translate("+(graphViewBox.x2+20)+", "+(graphViewBox.y1+10)+")");

		function zoomed(){
			var t = d3.event.transform;
			console.log(t);
			var xt = t.rescaleX(x);
			//var yt = t.rescaleY(y1);
			pathGroup.selectAll("path")
					.each(function(d){
						d3.select(this)
							.attr("d", line.x(function(d){return xt(d[0])}))
							//.attr("d", line.y(function(d){return yt(d[1])}));
					})
			dom_xAxis.call(xAxis.scale(xt));
			//dom_y1Axis.call(y1Axis.scale(yt));
			//console.log(x.domain(), y1.domain())
		}

		for (const [i, elem] of dataGroup.entries()){
			channelList.push(elem["name"])
			const data = elem["data"].map(function(value, index){return [master[index], value]});
			if (dataType == "num"){
				<!--num-->
			}
			else if (dataType == "bit"){
				<!--bit-->
				const _margin = 5;
				const _h = (graphViewBox.y2-graphViewBox.y1-(dataGroup.length+1)*_margin)/dataGroup.length;
				const _y2 = graphViewBox.y1+(i+1)*_h+(i+1)*_margin;
				y1.range([_y2, _y2 -_h]);
				dom_y1Axis.style("display", "none");
				const _newYAxis = svg.append("g").append("path")
															.attr("stroke", "black")
															.attr("stroke-width", 1.0)
															.attr("d", "M "+(graphViewBox.x1+0.5)+" "+(graphViewBox.y1)+" L "+(graphViewBox.x1+0.5)+" "+(graphViewBox.y2));
			}
			line = d3.line().x(function(d){return x(d[0])}).y(function(d){return y1(d[1])});
			<!--添加曲线-->
			pathGroup.append("g")
								.append("path")
								.attr("class", "css_SVGPath")
								.datum(data)
								.attr("d", line)
								.attr("fill", "none")
								.attr("stroke", getGoogleColor(i))
								.attr("stroke-linejoin", "round")
								.attr("stroke-linecap", "round")
								.attr("stroke-width", 1.3)
								.attr("pointer-events", "all");
			let _tmp = legendGroup.append("g")
														.style("font-size", fontSize)
														.style("font-family", fontFamily)
														.attr("transform", "translate(0, "+(i*20)+")");
			<!--添加图例-->
			for (let j=0; j<3; j++){
				switch (j) {
					case 0:
						_tmp.append("text").text((i+1+indexFrom)+".");
						break;
					case 1:
						_tmp.append("path")
								.attr("transform", "translate(23, 0)")
								.attr("stroke", getGoogleColor(i))
								.attr("stroke-width", "10px")
								.attr("d", "m 0 -3.5 h 20");
						break;
					case 2:
						_tmp.append("text")
								.attr("transform", "translate(45, 0)")
								.text(elem["name"]);
					default:
				}
			}
			<!--标记线数值-->
			for (let j=0; j<marks.length;j++){
				_tmp.append("text")
						.attr("transform", "translate("+(210+j*85)+", 0)")
						.text("| "+parseFloat(elem[marks[j]]).toFixed(3))
			}
		}
		<!-- 添加标记线 -->
		for (const [i, elem] of marks.entries()){
			addMark(i+1, elem, "red");
		}
	}

	function addMark(i, xi, color){
		const line = "M "+ x(xi) + " " + graphViewBox.y2 + "L " + x(xi) + " " + graphViewBox.y1;
		let _g = svg.append("g")
		_g.append("path")
			.attr("stroke", color)
			.attr("stroke-width", 2.5)
			.attr("stroke-opacity", 0.6)
			.attr("d", line);	}
}

function getNewDomain(domainGroup=[]){
	var min = d3.min(domainGroup, function(d){return d[0]});
	var max = d3.max(domainGroup, function(d){return d[1]});
	return [min, max];
}
function getGoogleColor(n){
	var colors_g = ["#3366cc", "#dc3912", "#ff9900", "#109618", "#990099",
									"#0099c6", "#dd4477", "#66aa00", "#b82e2e", "#316395",
									"#994499", "#22aa99", "#aaaa11", "#6633cc", "#e67300",
									"#8b0707", "#651067", "#329262", "#5574a6", "#3b3eac"];
	return colors_g[n % colors_g.length];
}

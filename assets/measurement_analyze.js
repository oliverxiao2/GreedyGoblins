Array.prototype.resampling = function(targetNum){
  const sourceNum = this.length;
  if (targetNum < sourceNum){
    const sampleInterval = (sourceNum - 1)/(targetNum - 1);
    let tempResult = [];
    for (let i=0; i<=sourceNum; i+=sampleInterval){
      tempResult.push(this[Math.round(i)]);
    }
    return tempResult;
  }
}


d3.selection.prototype.kkkkgoblinsD3Painter = function(){
    let root = this;
    this.state = "uninitialized";
    this.channelInquireResult = [];
    this.addedChannels = [];
    this.currentView = {};
    this.prevView = {};
    this.nextView = {};
    this.__proto__.initialize = initialize;
    this.__proto__.updateAxis = updateAxis;
    this.__proto__.addPlot = addPlot;

    let g_x1, g_x1Axis, g_tran_x1, g_tran_x1Axis,
        g_y1, g_y1Axis, g_tran_y1, g_tran_y1Axis,
        g_x2, g_x2Axis, g_tran_x2, g_tran_x2Axis,
        g_y2, g_y2Axis, g_tran_y2, g_tran_y2Axis,
        g_graph, g_transform,
        g_cursorGroup, g_cursorTable, g_floatCursor;



    this.get_channelList = function(mdf){
      if (d3["UAESMDA"]){
        if (d3["UAESMDA"].length>0){
          let out = [];

          // modify mdf object structure when mdf was created
          for (const dgBlock of mdf["dgBlocks"]){
            for (const cgBlock of dgBlock["cgBlocks"]){
              for (const cnBlock of cgBlock["cnBlocks"]){
                out.push({
                  name: cnBlock["shortSignalName"],
                  samplingRate : cnBlock["samplingRage"],
                  signalDescription: cnBlock["signalDescription"]
                })
              }
            }
          }

          return out;
        }
      }
    }

    // don't have return value
    // save the inquire result in root.channelInquireResult
    this.searchChannelsByRegExp = function(regexp, mdf){
      let resultCNBlocks = [];
      let currentCNBlock = null;
      let fr = new FileReader();
      fr.readAsArrayBuffer(mdf.parent);
      // === timer start
      const t1 = performance.now();
      fr.onload = function(e){
        // === start
        if (regexp == "*" || regexp == ""){
          console.log("Please input keywords...")
        }
        else{
          resultCNBlocks = mdf.searchChannelsByRegExp(regexp);
          for (const theCNBlock of resultCNBlocks){
            mdf.readDataBlockOf(theCNBlock, e.target.result);
            theCNBlock["rawDataArray"] = theCNBlock["ccBlock"].convertAll(theCNBlock["rawDataArray"]);
          }
        }

        root.channelInquireResult = resultCNBlocks;
        const t2 = performance.now();
        console.log(t2-t1);
        // === end
      }
    }

    this.add = function({
      type,
      dataset,
      dataType = 0
      }){
      if (type == "line"){
        // ==========
        // dataType:0
        // dataset = [data, data, ...]
        // data = {x:[x0, x1, ...], y:[y0, y1, ...]}
        // ==========
        // dataType:1
        // dataset = [cnBlock, cnBlock, ...]
        if (dataType === 0){

        }
        else if (dataType === 1) {
          for (const cn of dataset){
            const data_y = cn["phyDataArray"];
            const cnBlock_time = cn["parent"]["cnBlocks"][0];
            const data_time = cnBlock_time["ccBlock"].convertAll(cnBlock_time["rawDataArray"]);
          }
        }

      }
      else if (type == "scatter"){

      }
      else if (type == "bar") {

      }

    }

    this.on("dragover", function(){
      let event = d3.event;
      event.stopPropagation();
      event.preventDefault();
      event.dataTransfer.dropEffect = "copy";
    })

    this.on("drop", function(){
      let event = d3.event;
      event.preventDefault();
      let files = event.dataTransfer.files;
      if (files.length>0){
        for (let file of files){
          const t1 = performance.now();
          let fr = new FileReader();
          fr.readAsArrayBuffer(file);
          fr.onload = function(e){
            const r = e.target.result;
            let mdf = new MDF(r, false);

            // add a pointer to file
            mdf["parent"] = file;

            // add a property of "dataFilled"
            mdf["dataFilled"] = false;

            // save memory, delete arrayBuffer
            delete mdf["arrayBuffer"];

            // attach mdf object to respective file
            file["mdf"] = mdf;

            if (!d3.UAESMDF) d3.UAESMDF = [];
            d3.UAESMDF.push(file);

            console.log("time cost of loading "+ file.name +":", parseInt(performance.now()-t1), "ms");
          }
        }

        // End of read files
      }
    });
    // === 2. update domain of x axis(time axis in general)
    this.update_xAxis = function(viewMode){
      if (viweMode == "allShareX"){

      }
      else if (viewMode == "conditionAlign") {

      }

    }

    // === 3. update domain of y axis
    this.update_yAxis = function(viewMode){
      if (viewMode == "allShareY"){}
      else if (viewMode == "seperate"){}
    }

    return initialize({type:"line"});

    function initialize({
      type = "line",
      padding = {left:50,top:50,right:50,bottom:50},
      boxSize = {width:800,height:500},
      widthRatio = 0.9
      }){
      var parent, graph, svg, id, dataRegister=[],
          x1, x1Axis, dom_x1Axis, x2, x2Axis, dom_x2Axis, y1, y1Axis, dom_y1Axis, y2, y2Axis, dom_y2Axis,
          line, graphViewBox, shadeLayer, hideLayer,
          pathGroup, legendGroup, cursorGroup, channelList=[], fontFamily, fontSize, master, toolbar;
      graphViewBox = {"x1":padding.left,
                      "y1":(padding.top+0.5),
                      "x2":(widthRatio*boxSize.width+0.5),
                      "y2":(boxSize.height-padding.bottom)};
      parent = root, id = performance.now().toString().replace(".", "--");

      x1 = d3.scaleLinear().domain([0, 10]).range([graphViewBox.x1, graphViewBox.x2-0.5]);
      x2 = d3.scaleLinear().domain([0, 10]).range([graphViewBox.x1, graphViewBox.x2-0.5]);
      y1 = d3.scaleLinear().domain([0, 10]).range([graphViewBox.y2, graphViewBox.y1-0.5]);
      y2 = d3.scaleLinear().domain([0, 10]).range([graphViewBox.y2, graphViewBox.y1-0.5]);

      x1Axis = d3.axisBottom(x1).tickSize([6]);
      x2Axis = d3.axisTop(x2).tickSize([6]);
      y1Axis = d3.axisLeft(y1).tickSize([6]);//(y1.ticks().length>4)?d3.axisLeft(y1).ticks(4):d3.axisLeft(y1);
      y2Axis = d3.axisRight(y2).tickSize([6]);

      parent.append("br");
      graph = parent.append("div")
                    .attr("contenteditable", false)
                    .attr("oncontextmenu", "return false")
                    .attr("id", "id-d3-graph-"+id)
                    .attr("class", "css-d3-graph")
                    .on("mousedown", function(){
                      d3.activeGraph = d3.select(this);
                      console.log("click graph and activate it!");
                    });
      parent.append("br");
      d3.activeGraph = graph;
      g_graph = graph;

      $(graph.node()).keyup(function(event){

        // on mac, meybe there is no key of "delete"(keycode=46) but just "backspace"(keycode=8)
        if (event.which == 46 || event.which == 8) { // key = delete
          console.log("delete button pressed")
          // remove focused plot and ressponding legend
          let activePlot = d3.activeGraph.activePlot;
          console.log(activePlot)
          if (activePlot) {
            const id = activePlot.attr("id")
            activePlot.remove();

            let legend = d3.select("#"+id.replace("path", "pathLegend"));
            legend.remove();
          }
          else {
            // remove focused cursor
            let activeCursor = d3.activeGraph.activeCursor;
            if (activeCursor) {activeCursor.remove();}
          }

        }
      });

      svg = graph.append("svg")
                  .attr("id", "id-d3-graph-svg-"+id)
                  .attr("active", "true")
                  .attr("width", boxSize.width)
                  .attr("height", boxSize.height)
                  .attr("viewBox", "0 0 "+boxSize.width+" "+boxSize.height)


      // importtant! we have to bind this event to the whole window, otherwise the unexpected event will occurs!
      d3.select(window)
        .on("mouseup", function(){
          root.state = "pending";
        })
        .on("mousemove", function(){
          if (root.state == "zoom") d3Zoom();
        });

      shadeLayer  = svg.append("defs").append("clipPath").attr("id", "shadeLayer_"+id)
                       .append("rect").attr("width", graphViewBox.x2 - graphViewBox.x1)
                       .attr("height", graphViewBox.y2 - graphViewBox.y1)
                       .attr("transform", "translate("+padding.left+","+padding.top+")");


      dom_x1Axis = svg.append("g")
                      .attr("class", "css-d3-x1Axis")
                      .attr("draggable", true)
                      .attr("transform", "translate(0, "+(boxSize.height-padding.bottom)+")")
                      .style("font-family", fontFamily)
                      .attr("stroke-width", 1.0)
                      .call(x1Axis);
      dom_x2Axis = svg.append("g")
                      .attr("class", "css-d3-x2Axis")
                      .attr("transform", "translate(0, "+(padding.top)+")")
                      .style("font-family", fontFamily)
                      .attr("stroke-width", 1.0)
                      .call(x2Axis);
      dom_y1Axis = svg.append("g")
                      .attr("class", "css-d3-y1Axis")
                      .attr("transform", "translate("+padding.left+", 0)")
                      .style("font-family", fontFamily)
                      .attr("stroke-width", 1.0)
                      .call(y1Axis);
      dom_y2Axis = svg.append("g")
                      .attr("class", "css-d3-y2Axis")
                      .attr("transform", "translate("+ (graphViewBox.x2-0.5) +", 0)")
                      .style("font-family", fontFamily)
                      .attr("stroke-width", 1.0)
                      .call(y2Axis);
      actionLayer = svg.append("g")
                        .append("rect")
                        .attr("class", "css-d3-action")
                        .attr("fill", "none")
                        .attr("pointer-events", "all")
                        .attr("width", boxSize.width)
                        .attr("height", boxSize.height)
                        .on("mousemove", function(){
                          if (d3.cursorMode){
                            // hide/show and move float cursor
                            let offsetX = d3.event.offsetX, offsetY = d3.event.offsetY;
                            if (offsetX > graphViewBox.x2 || offsetX < graphViewBox.x1 || offsetY > graphViewBox.y2 || offsetY < graphViewBox.y1) {
                              // hide float cursor
                              d3.activeGraph.select(".css-d3-floatCursor").attr("stroke-opacity", 0);
                            } else {
                              // show float cursor
                              d3.activeGraph.select(".css-d3-floatCursor").attr("stroke-opacity", 1).attr("x", d3.event.offsetX);
                            }
                          }
                        })
                        .call(d3.zoom().scaleExtent([0.001, 1000]).on("zoom", lineGraphZoom))
                        .on("wheel.zoom", null);
      pathGroup   = svg.append("g").attr("clip-path", "url(#shadeLayer_"+id+")").attr("class", "css-d3-pathGroup");
      cursorGroup = svg.append("g").attr("class", "css-d3-cursorGroup").attr("clip-path", "url(#shadeLayer_"+id+")");
      floatCursor = cursorGroup.append("g").attr("class", "css-d3-floatCursor")
                      .append("rect")
                      .attr("width", 0.5)
                      .attr("height", graphViewBox.y2 - graphViewBox.y1)
                      .attr("x", graphViewBox.x1)
                      .attr("y", graphViewBox.y1)
                      .attr("stroke", "black")
                      .attr("stroke-opacity", 0)
                      .attr("fill", "none")
                      .on("click", function(){
                        if (d3.cursorMode == true) {
                          addCursor({
                            cursorType:"fixed",
                            x: d3.event.offsetX
                          });
                        }
                      });


      legendTable = document.createElement("table");
      legendTable.className = "css-d3-legendTable";
      legendTable.draggable = true;
      legendTable.spellcheck = false;
      document.getElementById("id-d3-graph-"+id).append(legendTable);
      $(legendTable).draggable();



      root.state = "initialized";
      root.__proto__.x1 = x1,
      root.__proto__.x1Axis = x1Axis,
      root.__proto__.dom_x1Axis = dom_x1Axis,

      root.__proto__.x2 = x2,
      root.__proto__.x2Axis = x2Axis,
      root.__proto__.dom_x2Axis = dom_x2Axis,

      root.__proto__.y1 = y1,
      root.__proto__.y1Axis = y1Axis,
      root.__proto__.dom_y1Axis = dom_y1Axis,

      root.__proto__.y2 = y2,
      root.__proto__.y2Axis = y2Axis,
      root.__proto__.dom_y2Axis = dom_y2Axis,


      root.__proto__.idPostfix = id,
      root.__proto__.graphViewBox = graphViewBox,
      root.__proto__.pathGroup = pathGroup,
      root.__proto__.legendTable = d3.select(legendTable),
      root.__proto__.cursorGroup = cursorGroup, root.__proto__.floatCursor = floatCursor;
      //graph.__proto_.pathAll = pathGroup;

      g_x1 = x1, g_x1Axis = x1Axis,
      g_x2 = x2, g_x2Axis = x2Axis,
      g_y1 = y1, g_y1Axis = y1Axis,
      g_y2 = y2, g_y2Axis = y2Axis;

      return graph;
    }

    /*
      example domain: [10, 150]
      example params: {
        ticks: 6,
        tickSize([6]),
        tickFormat: d3.format(",.0f")
      }
    */
    function updateAxis({
      graphType = "line",
      axisName = "bottom",
      domain,
      params
      }){
      if (domain || params) {
        if (graphType == "line") {
          let scale, axis, domAxis;
          let oldTicks, oldTikeSize, oldTickFormat, oldDomain;

          scale = axisName == "bottom"?root.x1:(axisName == "left"?root.y1:(axisName == "top"?root.x2:(axisName == "right"?root.y2:null)));
          if (domain) scale = scale.domain(domain);
          domAxis = axisName == "bottom"?root.dom_x1Axis:(axisName == "left"?root.dom_y1Axis:(axisName == "top"?root.dom_x2Axis:(axisName == "right"?root.dom_y2Axis:null)));
          axis = axisName == "bottom"?d3.axisBottom(scale):(axisName == "left"?d3.axisLeft(scale):(axisName == "top"?d3.axisTop(scale):(axisName == "right"?d3.axisRight(scale):null)));

          if (params){
            for (const param in params) {
              axis = eval("axis."+param+"("+param+")");
            }
          }

          domAxis.call(axis);
        }
      }
    }

    /*
      example show = "bottom" / "left" / "bottom left" / "all"
    */
    function toggleAxis(axis){

    }

    // add plot
    function addPlot({
      type = "line",
      channelName,
      data = {},
      config = {x: "bottom", y: "left"},
      theme = d3.schemeCategory10
      }){
      let pathGroup = d3.activeGraph.select(".css-d3-pathGroup"),
          x, y,
          pathCount = pathGroup.selectAll(".css-d3-path").size(),
          legendName = channelName || "channel" + pathCount,
          legendTable = d3.activeGraph.select(".css-d3-legendTable"),
          transform = null,
          color = theme[pathCount%theme.length];
      console.log(g_graph, d3.activeGraph)
      if (config){
        if (config.x == "bottom") {
          x = g_x1; // important! never use root.realX1
        }
        if (config.y == "left") {
          y = g_y1;
        }
      }
      if (g_transform){
        transform = g_transform;
      }

      let line = d3.line().x(d => x(d["x"])).y(d => y(d["y"]));
      const randomID = performance.now().toString().replace(".", "--")+"-r"+parseInt(Math.random()*1000);

      pathGroup.append("g")
               .attr("id", "id-d3-path-" + randomID)
               .attr("class", "css-d3-path")
               .on("focusin", function(){
                 focusIn(this, "plot");
                 console.log("focusin");
               })
               .on("focusout", function(){
                 focusOut(this, "plot");
                 console.log("focusout")
               })
                .append("path")
                .attr("class", "css-d3-line")
                .datum(data)
                .attr("d", line)
                .attr("transform", transform)
                .attr("fill", "none")
                .attr("stroke", color)
                .attr("stroke-linejoin", "round")
                .attr("stroke-linecap", "round")
                .attr("stroke-width", 1.3);

      let tr = legendTable.append("tr")
                          .attr("id", "id-d3-pathLegend-" + randomID)
                          .attr("class", "css-d3-legendTable-tr")
      tr.append("td")
        .attr("class", "css-d3-legendTable-td")
          .append("svg")
          .attr("class", "css-d3-legend-svgBox")
            .append("rect")
            .attr("fill", color);
      tr.append("td")
          .text(legendName);
    }

    // add cursor
    function addCursor({
      cursorType,
      x,
      opacity = {
        float: 0,
        fixed: 1
      },
      cursorColor = "black"
      }){
      let cursorOpacity = opacity[cursorType];
      let graphViewBox = root.graphViewBox;
      let cursorX;
      if (x) {cursorX = x;}
      else {
        cursorX = (graphViewBox.x2 + graphViewBox.x1)/2;
      }

      if (cursorType == "float") {
        // there is only one float cursor which was created when the graph was initialized
      }
      else if (cursorType == "fixed") {
        let x = g_x1, y = g_y1, transform = g_transform;
        let x0 = g_transform ? g_x1.invert(g_transform.invertX(cursorX)) : g_x1.invert(cursorX);
        let domainY = (g_tran_y1 || g_y1).domain();
        let y0 = domainY[0],
            y1 = domainY[1];
        let data = [{x:x0, y:y0}, {x:x0, y:y1}]
        let line = d3.line().x(d => x(d["x"])).y(d => y(d["y"]));
        g_graph.select(".css-d3-cursorGroup").append("path")
          .attr("class", "css-d3-cursor")
          .on("focusin", function(){
            focusIn(this, "cursor");
          })
          .on("focusout", function(){
            focusOut(this, "cursor");
          })
          .call(d3.drag().on("drag", function(){
            d3.select(this).select("rect").attr("x", d3.event.x);
          }))
            .datum(data)
            .attr("d", line)
            .attr("transform", transform)
            .attr("stroke", cursorColor)
            .attr("stroke-opacity", cursorOpacity)
            .attr("fill", "none");
      }
    }

    /*
      select and focus on plot
      change the view of active plot
    */
    function focusIn(element, type){
      let clicked = d3.select(element);
      if (type == "plot") d3.activeGraph.activePlot = clicked;
      else if (type == "cursor") d3.activeGraph.activeCursor = clicked;
    }
    function focusOut(element, type){
      let clicked = d3.select(element);
      if (type == "plot") d3.activeGraph.activePlot = null;
      else if (type == "cursor") d3.activeGraph.activeCursor = null;
    }
    /*
      remove Plot
    */
    function removePlot(plot){
      if (root.activeGraph.activePlot){
        root.activePlot.remove();
      }
    }

    /*
      toggle view state of all elements on the page
    */
    function toggleView(){

    }

    /*
      line graph zoom
    */
    function lineGraphZoom(){
      g_transform = d3.event.transform;
      // zoom for all line path
      d3.activeGraph.selectAll(".css-d3-line").each(function(){
        d3.select(this).attr("transform", g_transform);
      });
      // zoom for axis
      d3.activeGraph.select(".css-d3-x1Axis").call(g_tran_x1Axis = g_x1Axis.scale(g_tran_x1 = d3.event.transform.rescaleX(g_x1)));
      d3.activeGraph.select(".css-d3-x2Axis").call(g_tran_x2Axis = g_x2Axis.scale(g_tran_x2 = d3.event.transform.rescaleX(g_x2)));
      d3.activeGraph.select(".css-d3-y1Axis").call(g_tran_y1Axis = g_y1Axis.scale(g_tran_y1 = d3.event.transform.rescaleY(g_y1)));
      d3.activeGraph.select(".css-d3-y2Axis").call(g_tran_y2Axis = g_y2Axis.scale(g_tran_y2 = d3.event.transform.rescaleY(g_y2)));

      // zoom for all cursors
      let yDomain = g_tran_y1.domain();
      d3.activeGraph.selectAll(".css-d3-cursor").each(function(){
        let data = d3.select(this).datum();
        let line = d3.line().x(d => g_x1(d["x"])).y(d => g_y1(d["y"])); // import! must use the original x1 and y1!
        data[0]["y"] = yDomain[0], data[1]["y"] = yDomain[1];
        d3.select(this).attr("transform", d3.event.transform).attr("d", line);


      })
    }

    /*
      drag element, "this" will be in the drag event context
    */
    function dragstarted(d) {
      //d3.select(d).raise().classed("active", true);
    }

    function dragged(d) {
      d3.select(d).style("left", d3.event.sourceEvent.offsetX).style("top", d3.event.sourceEvent.offsetY);
    }

    function dragended(d) {
      //console.log("end", d3.event, d3.event.x, d3.event.y, "left:", d.style.left, "top:", d.style.top);
      //d3.select(d).classed("active", false);
    }

    //
  }

// new
var goblinsD3Painter = function(d3Selection){
    let root = this;
    this.state = "uninitialized";
    this.channelInquireResult = [];
    this.addedChannels = [];
    this.currentView = {};
    this.prevView = {};
    this.nextView = {};
    this.__proto__.initialize = initialize;
    this.__proto__.updateAxis = updateAxis;

    var g_x1, g_x1Axis, g_tran_x1, g_tran_x1Axis,
        g_y1, g_y1Axis, g_tran_y1, g_tran_y1Axis,
        g_x2, g_x2Axis, g_tran_x2, g_tran_x2Axis,
        g_y2, g_y2Axis, g_tran_y2, g_tran_y2Axis,
        g_graph, g_transform,
        g_cursorGroup, g_cursorTable, g_floatCursor;



    this.get_channelList = function(mdf){
      if (d3["UAESMDA"]){
        if (d3["UAESMDA"].length>0){
          let out = [];

          // modify mdf object structure when mdf was created
          for (const dgBlock of mdf["dgBlocks"]){
            for (const cgBlock of dgBlock["cgBlocks"]){
              for (const cnBlock of cgBlock["cnBlocks"]){
                out.push({
                  name: cnBlock["shortSignalName"],
                  samplingRate : cnBlock["samplingRage"],
                  signalDescription: cnBlock["signalDescription"]
                })
              }
            }
          }

          return out;
        }
      }
    }

    // don't have return value
    // save the inquire result in root.channelInquireResult
    this.searchChannelsByRegExp = function(regexp, mdf){
      let resultCNBlocks = [];
      let currentCNBlock = null;
      let fr = new FileReader();
      fr.readAsArrayBuffer(mdf.parent);
      // === timer start
      const t1 = performance.now();
      fr.onload = function(e){
        // === start
        if (regexp == "*" || regexp == ""){
          console.log("Please input keywords...")
        }
        else{
          resultCNBlocks = mdf.searchChannelsByRegExp(regexp);
          for (const theCNBlock of resultCNBlocks){
            mdf.readDataBlockOf(theCNBlock, e.target.result);
            theCNBlock["rawDataArray"] = theCNBlock["ccBlock"].convertAll(theCNBlock["rawDataArray"]);
          }
        }

        root.channelInquireResult = resultCNBlocks;
        const t2 = performance.now();
        console.log(t2-t1);
        // === end
      }
    }

    this.add = function({
      type,
      dataset,
      dataType = 0
      }){
      if (type == "line"){
        // ==========
        // dataType:0
        // dataset = [data, data, ...]
        // data = {x:[x0, x1, ...], y:[y0, y1, ...]}
        // ==========
        // dataType:1
        // dataset = [cnBlock, cnBlock, ...]
        if (dataType === 0){

        }
        else if (dataType === 1) {
          for (const cn of dataset){
            const data_y = cn["phyDataArray"];
            const cnBlock_time = cn["parent"]["cnBlocks"][0];
            const data_time = cnBlock_time["ccBlock"].convertAll(cnBlock_time["rawDataArray"]);
          }
        }

      }
      else if (type == "scatter"){

      }
      else if (type == "bar") {

      }

    }
    /*
    this.on("dragover", function(){
      let event = d3.event;
      event.stopPropagation();
      event.preventDefault();
      event.dataTransfer.dropEffect = "copy";
    })

    this.on("drop", function(){
      let event = d3.event;
      event.preventDefault();
      let files = event.dataTransfer.files;
      if (files.length>0){
        for (let file of files){
          const t1 = performance.now();
          let fr = new FileReader();
          fr.readAsArrayBuffer(file);
          fr.onload = function(e){
            const r = e.target.result;
            let mdf = new MDF(r, false);

            // add a pointer to file
            mdf["parent"] = file;

            // add a property of "dataFilled"
            mdf["dataFilled"] = false;

            // save memory, delete arrayBuffer
            delete mdf["arrayBuffer"];

            // attach mdf object to respective file
            file["mdf"] = mdf;

            if (!d3.UAESMDF) d3.UAESMDF = [];
            d3.UAESMDF.push(file);

            console.log("time cost of loading "+ file.name +":", parseInt(performance.now()-t1), "ms");
          }
        }

        // End of read files
      }
    });
    // === 2. update domain of x axis(time axis in general)
    this.update_xAxis = function(viewMode){
      if (viweMode == "allShareX"){

      }
      else if (viewMode == "conditionAlign") {

      }

    }
    */
    // === 3. update domain of y axis
    this.update_yAxis = function(viewMode){
      if (viewMode == "allShareY"){}
      else if (viewMode == "seperate"){}
    }

    this.d3Graph = initialize({type:"line"});




    /*
      example domain: [10, 150]
      example params: {
        ticks: 6,
        tickSize([6]),
        tickFormat: d3.format(",.0f")
      }
    */
    function updateAxis({
      graphType = "line",
      axisName = "bottom",
      domain,
      params
      }){
      if (domain || params) {
        if (graphType == "line") {
          let scale, axis, domAxis;
          let oldTicks, oldTikeSize, oldTickFormat, oldDomain;

          scale = axisName == "bottom"?root.x1:(axisName == "left"?root.y1:(axisName == "top"?root.x2:(axisName == "right"?root.y2:null)));
          if (domain) scale = scale.domain(domain);
          domAxis = axisName == "bottom"?root.dom_x1Axis:(axisName == "left"?root.dom_y1Axis:(axisName == "top"?root.dom_x2Axis:(axisName == "right"?root.dom_y2Axis:null)));
          axis = axisName == "bottom"?d3.axisBottom(scale):(axisName == "left"?d3.axisLeft(scale):(axisName == "top"?d3.axisTop(scale):(axisName == "right"?d3.axisRight(scale):null)));

          if (params){
            for (const param in params) {
              axis = eval("axis."+param+"("+param+")");
            }
          }

          domAxis.call(axis);
        }
      }
    }

    /*
      example show = "bottom" / "left" / "bottom left" / "all"
    */
    function toggleAxis(axis){

    }

    // add plot
    this.addPlot = function({
      type = "line",
      channelName,
      data = {},
      config = {x: "bottom", y: "left"},
      theme = d3.schemeCategory10
      }){
      let pathGroup = g_graph.select(".css-d3-pathGroup"),
          x, y,
          pathCount = pathGroup.selectAll(".css-d3-path").size(),
          legendName = channelName || "channel" + pathCount,
          legendTable = g_graph.select(".css-d3-legendTable"),
          transform = null,
          color = theme[pathCount%theme.length];
      console.log(g_graph, d3.activeGraph)
      if (config){
        if (config.x == "bottom") {
          x = g_x1; // important! never use root.realX1
        }
        if (config.y == "left") {
          y = g_y1;
        }
      }
      if (g_transform){
        transform = g_transform;
      }

      let line = d3.line().x(d => x(d["x"])).y(d => y(d["y"]));
      const randomID = performance.now().toString().replace(".", "--")+"-r"+parseInt(Math.random()*1000);

      pathGroup.append("g")
               .attr("id", "id-d3-path-" + randomID)
               .attr("class", "css-d3-path")
               .on("focusin", function(){
                 focusIn(this, "plot");
                 console.log("focusin");
               })
               .on("focusout", function(){
                 focusOut(this, "plot");
                 console.log("focusout")
               })
                .append("path")
                .attr("class", "css-d3-line")
                .datum(data)
                .attr("d", line)
                .attr("transform", transform)
                .attr("fill", "none")
                .attr("stroke", color)
                .attr("stroke-linejoin", "round")
                .attr("stroke-linecap", "round")
                .attr("stroke-width", 1.3);

      let tr = legendTable.append("tr")
                          .attr("id", "id-d3-pathLegend-" + randomID)
                          .attr("class", "css-d3-legendTable-tr")
      tr.append("td")
        .attr("class", "css-d3-legendTable-td")
          .append("svg")
          .attr("class", "css-d3-legend-svgBox")
            .append("rect")
            .attr("fill", color);
      tr.append("td")
          .text(legendName);
    }

    // add cursor
    function addCursor({
      cursorType,
      x,
      opacity = {
        float: 0,
        fixed: 1
      },
      cursorColor = "black"
      }){
      let cursorOpacity = opacity[cursorType];
      let graphViewBox = root.graphViewBox;
      let cursorX;
      if (x) {cursorX = x;}
      else {
        cursorX = (graphViewBox.x2 + graphViewBox.x1)/2;
      }

      if (cursorType == "float") {
        // there is only one float cursor which was created when the graph was initialized
      }
      else if (cursorType == "fixed") {
        let x = g_x1, y = g_y1, transform = g_transform;
        let x0 = g_transform ? g_x1.invert(g_transform.invertX(cursorX)) : g_x1.invert(cursorX);
        let domainY = (g_tran_y1 || g_y1).domain();
        let y0 = domainY[0],
            y1 = domainY[1];
        let data = [{x:x0, y:y0}, {x:x0, y:y1}]
        let line = d3.line().x(d => x(d["x"])).y(d => y(d["y"]));
        g_graph.select(".css-d3-cursorGroup").append("path")
          .attr("class", "css-d3-cursor")
          .on("focusin", function(){
            focusIn(this, "cursor");
          })
          .on("focusout", function(){
            focusOut(this, "cursor");
          })
          .call(d3.drag().on("drag", function(){
            d3.select(this).select("rect").attr("x", d3.event.x);
          }))
            .datum(data)
            .attr("d", line)
            .attr("transform", transform)
            .attr("stroke", cursorColor)
            .attr("stroke-width", 1.3)
            .attr("stroke-opacity", cursorOpacity)
            .attr("fill", "none");
      }
    }

    /*
      select and focus on plot
      change the view of active plot
    */
    function focusIn(element, type){
      let clicked = d3.select(element);
      if (type == "plot") d3.activeGraph.activePlot = clicked;
      else if (type == "cursor") {
        d3.activeGraph.activeCursor = clicked;

      }
    }
    function focusOut(element, type){
      let clicked = d3.select(element);
      if (type == "plot") d3.activeGraph.activePlot = null;
      else if (type == "cursor") d3.activeGraph.activeCursor = null;
    }

    /*
      toggle view state of all elements on the page
    */
    function toggleView(){

    }

    /*
      line graph zoom
    */
    root.lineGraphZoom = function(){
      g_transform = d3.event.transform;

      // zoom for all line path
      g_graph.selectAll(".css-d3-line").each(function(){
        d3.select(this).attr("transform", g_transform);
      });
      // zoom for axis
      g_graph.select(".css-d3-x1Axis").call(g_tran_x1Axis = g_x1Axis.scale(g_tran_x1 = d3.event.transform.rescaleX(g_x1)));
      g_graph.select(".css-d3-x2Axis").call(g_tran_x2Axis = g_x2Axis.scale(g_tran_x2 = d3.event.transform.rescaleX(g_x2)));
      g_graph.select(".css-d3-y1Axis").call(g_tran_y1Axis = g_y1Axis.scale(g_tran_y1 = d3.event.transform.rescaleY(g_y1)));
      g_graph.select(".css-d3-y2Axis").call(g_tran_y2Axis = g_y2Axis.scale(g_tran_y2 = d3.event.transform.rescaleY(g_y2)));

      // zoom for all cursors
      let yDomain = g_tran_y1.domain();
      console.log(yDomain);
      g_graph.selectAll(".css-d3-cursor").each(function(){
        let data = d3.select(this).datum();
        let line = d3.line().x(d => g_x1(d["x"])).y(d => g_y1(d["y"])); // import! must use the original x1 and y1!
        data[0]["y"] = yDomain[0], data[1]["y"] = yDomain[1];
        d3.select(this).attr("transform", d3.event.transform).attr("d", line);


      })
    }

    /*
      drag element, "this" will be in the drag event context
    */
    function dragstarted(d) {
      //d3.select(d).raise().classed("active", true);
    }

    function dragged(d) {
      d3.select(d).style("left", d3.event.sourceEvent.offsetX).style("top", d3.event.sourceEvent.offsetY);
    }

    function dragended(d) {
      //console.log("end", d3.event, d3.event.x, d3.event.y, "left:", d.style.left, "top:", d.style.top);
      //d3.select(d).classed("active", false);
    }
    function initialize({
      type = "line",
      padding = {left:50,top:50,right:50,bottom:50},
      boxSize = {width:800,height:500},
      widthRatio = 0.9
      }){
      var parent, graph, svg, id, dataRegister=[],
          x1, x1Axis, dom_x1Axis, x2, x2Axis, dom_x2Axis, y1, y1Axis, dom_y1Axis, y2, y2Axis, dom_y2Axis,
          line, graphViewBox, shadeLayer, hideLayer,
          pathGroup, legendGroup, cursorGroup, channelList=[], fontFamily, fontSize, master, toolbar;
      graphViewBox = {"x1":padding.left,
                      "y1":(padding.top+0.5),
                      "x2":(widthRatio*boxSize.width+0.5),
                      "y2":(boxSize.height-padding.bottom)};
      parent = d3Selection, id = performance.now().toString().replace(".", "--");

      x1 = d3.scaleLinear().domain([0, 10]).range([graphViewBox.x1, graphViewBox.x2-0.5]);
      x2 = d3.scaleLinear().domain([0, 10]).range([graphViewBox.x1, graphViewBox.x2-0.5]);
      y1 = d3.scaleLinear().domain([0, 10]).range([graphViewBox.y2, graphViewBox.y1-0.5]);
      y2 = d3.scaleLinear().domain([0, 10]).range([graphViewBox.y2, graphViewBox.y1-0.5]);

      x1Axis = d3.axisBottom(x1).tickSize([6]);
      x2Axis = d3.axisTop(x2).tickSize([6]);
      y1Axis = d3.axisLeft(y1).tickSize([6]);//(y1.ticks().length>4)?d3.axisLeft(y1).ticks(4):d3.axisLeft(y1);
      y2Axis = d3.axisRight(y2).tickSize([6]);

      parent.append("br");
      graph = parent.append("div")
                    .attr("contenteditable", false)
                    .attr("oncontextmenu", "return false")
                    .attr("id", "id-d3-graph-"+id)
                    .attr("class", "css-d3-graph")
                    .on("mousedown", function(){ // right mouse could invoke it! left button does not work!
                      d3.activeGraph = root;
                    });
      parent.append("br");
      d3.activeGraph = root;
      g_graph = graph;

      $(graph.node()).keyup(function(event){
        console.log(event);
        // on mac, meybe there is no key of "delete"(keycode=46) but just "backspace"(keycode=8)
        if (event.which == 46 || event.which == 8) { // key = delete
          console.log("delete btn pressed")
          // remove focused plot and ressponding legend
          let activePlot = d3.activeGraph.activePlot;
          console.log(activePlot);
          if (activePlot) {
            const id = activePlot.attr("id")
            activePlot.remove();

            let legend = d3.select("#"+id.replace("path", "pathLegend"));
            legend.remove();
          }
          else {
            // remove focused cursor
            let activeCursor = d3.activeGraph.activeCursor;
            if (activeCursor) {activeCursor.remove();}
          }

        }
      });

      svg = graph.append("svg")
                  .attr("id", "id-d3-graph-svg-"+id)
                  .attr("active", "true")
                  .attr("width", boxSize.width)
                  .attr("height", boxSize.height)
                  .attr("viewBox", "0 0 "+boxSize.width+" "+boxSize.height)


      // importtant! we have to bind this event to the whole window, otherwise the unexpected event will occurs!
      d3.select(window)
        .on("mouseup", function(){
          root.state = "pending";
        })
        .on("mousemove", function(){
          if (root.state == "zoom") d3Zoom();
        });

      shadeLayer  = svg.append("defs").append("clipPath").attr("id", "shadeLayer_"+id)
                       .append("rect").attr("width", graphViewBox.x2 - graphViewBox.x1)
                       .attr("height", graphViewBox.y2 - graphViewBox.y1)
                       .attr("transform", "translate("+padding.left+","+padding.top+")");


      dom_x1Axis = svg.append("g")
                      .attr("class", "css-d3-x1Axis")
                      .attr("draggable", true)
                      .attr("transform", "translate(0, "+(boxSize.height-padding.bottom)+")")
                      .style("font-family", fontFamily)
                      .attr("stroke-width", 1.0)
                      .call(x1Axis);
      dom_x2Axis = svg.append("g")
                      .attr("class", "css-d3-x2Axis")
                      .attr("transform", "translate(0, "+(padding.top)+")")
                      .style("font-family", fontFamily)
                      .attr("stroke-width", 1.0)
                      .call(x2Axis);
      dom_y1Axis = svg.append("g")
                      .attr("class", "css-d3-y1Axis")
                      .attr("transform", "translate("+padding.left+", 0)")
                      .style("font-family", fontFamily)
                      .attr("stroke-width", 1.0)
                      .call(y1Axis);
      dom_y2Axis = svg.append("g")
                      .attr("class", "css-d3-y2Axis")
                      .attr("transform", "translate("+ (graphViewBox.x2-0.5) +", 0)")
                      .style("font-family", fontFamily)
                      .attr("stroke-width", 1.0)
                      .call(y2Axis);
      actionLayer = svg.append("g")
                        .append("rect")
                        .attr("class", "css-d3-action")
                        .attr("fill", "none")
                        .attr("pointer-events", "all")
                        .attr("width", boxSize.width)
                        .attr("height", boxSize.height)
                        .on("mousemove", function(){
                          if (d3.cursorMode){
                            // hide/show and move float cursor
                            let offsetX = d3.event.offsetX, offsetY = d3.event.offsetY;
                            if (offsetX > graphViewBox.x2 || offsetX < graphViewBox.x1 || offsetY > graphViewBox.y2 || offsetY < graphViewBox.y1) {
                              // hide float cursor
                              g_graph.select(".css-d3-floatCursor").select("rect").attr("stroke-opacity", 0);
                            } else {
                              // show float cursor
                              g_graph.select(".css-d3-floatCursor").select("rect").attr("stroke-opacity", 1).attr("x", d3.event.offsetX);
                            }
                          } else if (d3.activeCursor) {

                          }
                        })
                        .call(d3.zoom().scaleExtent([0.001, 1000]).on("zoom", function(){ // must use anonymous function! root.lineGraphZoom does not work!
                          //console.log(d3.event);
                          root.lineGraphZoom();
                        }))
                        .on("wheel.zoom", null);
      pathGroup   = svg.append("g").attr("clip-path", "url(#shadeLayer_"+id+")").attr("class", "css-d3-pathGroup");
      cursorGroup = svg.append("g").attr("class", "css-d3-cursorGroup").attr("clip-path", "url(#shadeLayer_"+id+")");
      floatCursor = cursorGroup.append("g").attr("class", "css-d3-floatCursor")
                      .append("rect")
                      .attr("class", "css-d3-cursorBody")
                      .attr("width", 0.5)
                      .attr("height", graphViewBox.y2 - graphViewBox.y1)
                      .attr("x", graphViewBox.x1)
                      .attr("y", graphViewBox.y1)
                      .attr("stroke", "black")
                      .attr("stroke-opacity", 0)
                      .attr("fill", "none")
                      .on("click", function(){
                        if (d3.cursorMode == true) {
                          addCursor({
                            cursorType:"fixed",
                            x: d3.event.offsetX
                          });
                        }
                      });


      legendTable = document.createElement("table");
      legendTable.className = "css-d3-legendTable";
      legendTable.draggable = true;
      legendTable.spellcheck = false;
      document.getElementById("id-d3-graph-"+id).append(legendTable);
      $(legendTable).draggable();



      root.state = "initialized";
      root.__proto__.x1 = x1,
      root.__proto__.x1Axis = x1Axis,
      root.__proto__.dom_x1Axis = dom_x1Axis,

      root.__proto__.x2 = x2,
      root.__proto__.x2Axis = x2Axis,
      root.__proto__.dom_x2Axis = dom_x2Axis,

      root.__proto__.y1 = y1,
      root.__proto__.y1Axis = y1Axis,
      root.__proto__.dom_y1Axis = dom_y1Axis,

      root.__proto__.y2 = y2,
      root.__proto__.y2Axis = y2Axis,
      root.__proto__.dom_y2Axis = dom_y2Axis,


      root.__proto__.idPostfix = id,
      root.__proto__.graphViewBox = graphViewBox,
      root.__proto__.pathGroup = pathGroup,
      root.__proto__.legendTable = d3.select(legendTable),
      root.__proto__.cursorGroup = cursorGroup, root.__proto__.floatCursor = floatCursor;
      //graph.__proto_.pathAll = pathGroup;

      g_x1 = x1, g_x1Axis = x1Axis,
      g_x2 = x2, g_x2Axis = x2Axis,
      g_y1 = y1, g_y1Axis = y1Axis,
      g_y2 = y2, g_y2Axis = y2Axis;

      return graph;
    }
    //
    return this;
  }

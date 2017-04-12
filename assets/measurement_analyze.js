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


if (d3){
  d3.selection.prototype.goblinsD3Painter = function(){
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
      //console.log(d3.event);
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

    initialize({type:"line"});


    return this;

    function initialize({
      type = "line",
      padding = {left:50,top:50,right:50,bottom:50},
      boxSize = {width:800,height:500},
      widthRatio = 0.9
      }){
      var parent, graph, svg, id, dataRegister=[],
          x1, x1Axis, dom_x1Axis, x2, x2Axis, dom_x2Axis, y1, y1Axis, dom_y1Axis, y2, y2Axis, dom_y2Axis,
          line, graphViewBox, borderLayer, shadeLayer, hideLayer,
          pathGroup, legendGroup, channelList=[], fontFamily, fontSize, master, toolbar;
      graphViewBox = {"x1":padding.left,
                      "y1":(padding.top+0.5),
                      "x2":(widthRatio*boxSize.width+0.5),
                      "y2":(boxSize.height-padding.bottom)};
      parent = root;
      x1Axis = d3.axisBottom(x1).tickSize([0]);
      y2Axis = d3.axisRight(y2).tickSize([0]);
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
                  .attr("class", "css-d3-graph")
                  .attr("active", "true")
                  .attr("width", boxSize.width)
                  .attr("height", boxSize.height)
                  .attr("viewBox", "0 0 "+boxSize.width+" "+boxSize.height);
      actionLayer = svg.append("g")
                        .append("rect")
                        .attr("fill", "none")
                        .style("visibility", "hidden")
                        .attr("pointer-events", "all")
                        .attr("width", graphViewBox.x2 - graphViewBox.x1)
                        .attr("height", graphViewBox.y2 - graphViewBox.y1)
                        .attr("transform", "translate("+ padding.left +","+ padding.top +")")
                        //.call(zoom)
      /*borderLayer = svg.append("g")
                        .append("path")
                        .attr("fill", "none")
                        .attr("stroke", "black")
                        .attr("stroke-width", 1.0)
                        //.darum(_borderData)
                        .attr("d", "M "+graphViewBox.x1+" "+(graphViewBox.y1)+" L "+(graphViewBox.x2)+" "+(graphViewBox.y1)+" L "+(graphViewBox.x2)+" "+(graphViewBox.y2) + " L " +graphViewBox.x1 + " " +graphViewBox.y2 + " Z")
                        //.call(zoom)*/

      shadeLayer  = svg.append("defs").append("clipPath").attr("id", "shadeLayer_"+id)
                      .append("rect").attr("width", graphViewBox.x2 - graphViewBox.x1)
                      .attr("height", graphViewBox.y2 - graphViewBox.y1)
                      .attr("transform", "translate("+padding.left+","+padding.top+")")
      dom_x1Axis = svg.append("g")
                      .attr("transform", "translate(0, "+(boxSize.height-padding.bottom)+")")
                      .style("font-family", fontFamily)
                      .attr("stroke-width", 1.0)
                      .call(x1Axis);
      dom_x2Axis = svg.append("g")
                      .attr("transform", "translate(0, "+(padding.top)+")")
                      .style("font-family", fontFamily)
                      .attr("stroke-width", 1.0)
                      .call(x2Axis);
      dom_y1Axis = svg.append("g")
                      .attr("transform", "translate("+padding.left+", 0)")
                      .style("font-family", fontFamily)
                      .attr("stroke-width", 1.0)
                      .call(y1Axis);
      dom_y2Axis = svg.append("g")
                      .attr("transform", "translate("+ (graphViewBox.x2-0.5) +", 0)")
                      .style("font-family", fontFamily)
                      .attr("stroke-width", 1.0)
                      .call(y2Axis);
      pathGroup   = svg.append("g").attr("clip-path", "url(#shadeLayer_"+id+")");

      root.state = "initialized";
      root.__proto__.x1Axis = x1Axis;
      root.__proto__.dom_x1Axis = dom_x1Axis;





    }
  }

}

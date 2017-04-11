/*
  1. "global" mdf file saver
  d3.UAESMDF = [File, File, ...]

  2. initialize a d3 selection into a svg painter
  d3.select("#id").goblinsD3Painter();

  3. Array: new method resampling(targetNum)
  resample a array from source points(e.g. 15000) to target(e.g.1200)
*/

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

if (d3.selection){
  d3.selection.prototype.goblinsD3Painter = function(){
    let root = this;
    this.state = "uninitialized";
    this.channelInquireResult = [];
    this.addedChannels = [];
    this.currentView = {};
    this.prevView = {};
    this.nextView = {};

    this.initialize = function(
      padding = {left:50,top:50,right:50,bottom:50},
      boxSize = {width:800,height:500},
      widthRatio = 0.9
      ){
      if (this.state == "uninitialized"){
        var parent, svg, id, dataRegister=[],
            x, y, xAxis, dom_xAxis, y1, y1Axis, dom_y1Axis, y2, y2Axis, dom_y2Axis,
            line, graphViewBox, borderLayer, shadeLayer, hideLayer,
            pathGroup, legendGroup, channelList=[], fontFamily, fontSize, master, toolbar;
        graphViewBox = {"x1":padding.left,
                        "y1":(padding.top+0.5),
                        "x2":(widthRatio*boxSize.width+0.5),
                        "y2":(boxSize.height-padding.bottom)};
        parent = root;

        x  = d3.scaleLinear().domain([0, 0]).range([graphViewBox.x1, graphViewBox.x2-0.5]);
        y1 = d3.scaleLinear().domain([0, 0]).range([graphViewBox.y2, graphViewBox.y1-0.5]);
        y2 = d3.scaleLinear().domain([0, 0]).range([graphViewBox.y2, graphViewBox.y1-0.5]);

        xAxis  = d3.axisBottom(x);
        y1Axis = (y1.ticks().length>4)?d3.axisLeft(y1).ticks(4):d3.axisLeft(y1);
        y2Axis = d3.axisRight(y2);

        svg = parent.append("svg")
                    .attr("class", "css-d3-graph")
                    .attr("active", "true")
                    .attr("width", boxSize.width)
                    .attr("height", boxSize.height)
                    .attr("viewBox", "0 0 "+boxSize.width+" "+boxSize.height)
                    .style("background", "#CCC");
        actionLayer = svg.append("g")
                          .append("rect")
                          .attr("fill", "none")
                          .style("visibility", "hidden")
                          .attr("pointer-events", "all")
                          .attr("width", graphViewBox.x2 - graphViewBox.x1)
                          .attr("height", graphViewBox.y2 - graphViewBox.y1)
                          .attr("transform", "translate("+ padding.left +","+ padding.top +")")
                          //.call(zoom)
        borderLayer = svg.append("g")
                          .append("path")
                          .attr("fill", "none")
                          .attr("stroke", "black")
                          .attr("stroke-width", 1.0)
                          //.darum(_borderData)
                          .attr("d", "M "+graphViewBox.x1+" "+(graphViewBox.y1)+" L "+(graphViewBox.x2)+" "+(graphViewBox.y1)+" L "+(graphViewBox.x2)+" "+(graphViewBox.y2))
                          //.call(zoom)

        shadeLayer  = svg.append("defs").append("clipPath").attr("id", "shadeLayer_"+id)
                        .append("rect").attr("width", graphViewBox.x2 - graphViewBox.x1)
                        .attr("height", graphViewBox.y2 - graphViewBox.y1)
                        .attr("transform", "translate("+padding.left+","+padding.top+")")
        dom_xAxis = svg.append("g")
                        .attr("transform", "translate(0, "+(boxSize.height-padding.bottom)+")")
                        .style("font-family", fontFamily)
                        .attr("stroke-width", 1.0)
                        .call(xAxis);
        dom_y1Axis = svg.append("g")
                        .attr("transform", "translate("+padding.left+", 0)")
                        .style("font-family", fontFamily)
                        .attr("stroke-width", 1.0)
                        .call(y1Axis);
        dom_y2Axis = svg.append("g")
                        .style("font-family", fontFamily)
                        .style("display", "none")
                        .call(y1Axis);
        pathGroup   = svg.append("g").attr("clip-path", "url(#shadeLayer_"+id+")");

        toolbar = parent.append("button")
                    .text("channels")
                    .attr("onclick", "alert('')");

        this.state = "initialized";

        return this;
      }
    }

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
  }
}

if (document.HTMLElement){
  document.HTMLElement.prototype.VirtualVariableBox = function(){
    if (this.tagName.toUpperCase() == "DIV"){
      let root = this;

      this.innerHTML = "";

    }
  }
}
// ===================================================================== //
function dialog(element){
  var name = element.name;
  var activeDialog = document.querySelector("#id-dialog-"+name);
  activeDialog.showModal();
}
function newGraph(){
  var dialog = document.querySelector("#id-dialog-newGraph");
  dialog.showModal();
  var contentBox = d3.select(".page-content");
  var newPainter = contentBox.append("div");
  newPainter.goblinsD3Painter();
  newPainter.initialize();
}

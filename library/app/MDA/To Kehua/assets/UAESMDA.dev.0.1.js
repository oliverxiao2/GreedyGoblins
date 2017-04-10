;(function($, window, undefined){
  $.fn.d3MDA = function(options){
    var main = this;
    this.charts = [];
    // default settings
    var defaults = {
      "boxSize"    : {"width":800, "height": 600},
      "border"     : 0,
      "padding" : {top:5, left:50, bottom:18, right:20},
    	"svgStyleID" : 0,
    	"widthRatio" : 0.98,
    	"dataGroup"  : [],
    	"graphType"   : "multiPlot",
    	"marks"      : [],
    	"indexFrom"  : 0,
      "style" : {
        "title":{"fontFamily": "Consolas", "fontSize": 13},
        "p":{}
      }
    };


    /* setting options
    // dataType:
    */
    var settings = $.extend({}, defaults, options);

    // methods
    this.init = function(s){
      this.initToolbar(s);
      this.addD3SVG(s);
      return this;
    }
    this.addD3SVG = function(s){
      //inactivate all d3 charts
      main.inactivateAll();

      var parent, svg, id, dataRegister=[],
          x, y, xAxis, dom_xAxis, y1, y1Axis, dom_y1Axis, y2, y2Axis, dom_y2Axis,
          line, graphViewBox, borderLayer, shadeLayer, hideLayer,
          pathGroup, legendGroup, channelList=[], fontFamily, fontSize, master;
      // dataRegister=[]
      //{channelName:"", master:"some master channel", y:[...]}
      id = String(performance.now());
      graphViewBox = {"x1":settings.padding.left,
                      "y1":(settings.padding.top+0.5),
                      "x2":(settings.widthRatio*settings.boxSize.width+0.5),
                      "y2":(settings.boxSize.height-settings.padding.bottom)}
      parent = d3.select($(this).get(0));
      //
      switch (s.graphType) {
        case "multiPlot":
          x  = d3.scaleLinear().domain([0, 0]).range([graphViewBox.x1, graphViewBox.x2-0.5]);
          y1 = d3.scaleLinear().domain([0, 0]).range([graphViewBox.y2, graphViewBox.y1-0.5]);
          y2 = d3.scaleLinear().domain([0, 0]).range([graphViewBox.y2, graphViewBox.y1-0.5]);
          console.log(x)
          xAxis  = d3.axisBottom(x);
      		y1Axis = (y1.ticks().length>4)?d3.axisLeft(y1).ticks(4):d3.axisLeft(y1);
      		y2Axis = d3.axisRight(y2);

          svg = parent.append("svg")
                      .attr("class", "css-d3-chart")
                      .attr("active", "true")
                      .attr("x", x)
                      .attr("width", s.boxSize.width)
                      .attr("height", s.boxSize.height)
                      .attr("viewBox", "0 0 "+s.boxSize.width+" "+s.boxSize.height)
                      .style("background", "#CCC");
          actionLayer = svg.append("g")
      											.append("rect")
      											.attr("fill", "none")
      											.style("visibility", "hidden")
      											.attr("pointer-events", "all")
      											.attr("width", graphViewBox.x2 - graphViewBox.x1)
      											.attr("height", graphViewBox.y2 - graphViewBox.y1)
      											.attr("transform", "translate("+s.padding.left+","+s.padding.top+")")
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
      										.attr("transform", "translate("+s.padding.left+","+s.padding.top+")")
          dom_xAxis = svg.append("g")
                          .attr("transform", "translate(0, "+(s.boxSize.height-s.padding.bottom)+")")
                          .style("font-family", fontFamily)
                          .attr("stroke-width", 1.0)
                          .call(xAxis);
      		dom_y1Axis = svg.append("g")
                          .attr("transform", "translate("+s.padding.left+", 0)")
                          .style("font-family", fontFamily)
                          .attr("stroke-width", 1.0)
                          .call(y1Axis);
      		dom_y2Axis = svg.append("g")
                          .style("font-family", fontFamily)
                          .style("display", "none")
                          .call(y1Axis);
          pathGroup   = svg.append("g").attr("clip-path", "url(#shadeLayer_"+id+")");
          console.log(graphViewBox)
          break;
        default:

      }
      svg.parent = parent,
      svg.id = id,
      svg.dataRegister=dataRegister,
      svg.x =x,
      svg.xAxis = xAxis,
      svg.dom_xAxis = dom_xAxis,
      svg.y1 = y1,
      svg.y1Axis = y1Axis,
      svg.dom_y1Axis = dom_y1Axis,
      svg.y2 = y2,
      svg.y2Axis = y2Axis,
      svg.dom_y2Axis = dom_y2Axis,
      svg.line = line,
      svg.graphViewBox = graphViewBox,
      svg.borderLayer = borderLayer,
      svg.shadeLayer=shadeLayer,
      svg.hideLayer = hideLayer,
      svg.pathGroup = pathGroup,
      svg.legendGroup = legendGroup,
      svg.channelList= channelList,
      svg.master = master;
      main.charts.push(svg);
      console.log(svg);

      svg.reset = function(){
        alert(x);
      }

      return svg;
    }
    this.initToolbar = function(s){

      var toolbar = '<div class="css-workplace-toolbar">'+
                      '<button name="import" type="button" class="btn btn-default" data-toggle="modal" data-target="#id-modal-import">'+
                        'import'+
                      '</button>'+
                      '<button name="addPlot" type="button" class="btn btn-default" data-toggle="modal" data-target="#id-modal-addPlot">'+
                        'add channel'+
                      '</button>'+
                      '<button name="clear" type="button" class="btn btn-default" data-toggle="modal" data-target="#id-modal-addPlot">'+
                        'clear'+
                      '</button>'+
                      '<button name="addD3SVG" type="button" class="btn btn-default" data-toggle="modal" data-target="#id-modal-addPlot">'+
                        'new Chart'+
                      '</button>'+
                    '</div>';
      this.prepend(toolbar);

      let importPanel = '<div class="panel panel-default">'+
      '<input id="id-input-file-to-parser" class="file" type="file" data-show-preview="false" data-allowed-file-extensions="[\'dat\']" multiple/>'+
      '</div>'

      // ===     bind events for the buttons     ========== //
      this.find("button").each(function(){
        switch ($(this).attr("name")) {
          case "import":
            $(this).click(function(){
              //alert("import");
            })
            break;
          case "addPlot":
            $(this).click(function(event){
              $("#id-dialog-addPlot").dialog("open");
              event.preventDefault();
              //d3.MDFManager.mdfArray
            })
            break;
          case "clear":
            $(this).click(function(event){
              main.reset();
              event.preventDefault();
            })
            break;
          case "addD3SVG":
            $(this).click(function(event){
              main.addD3SVG(settings);
              event.preventDefault();
            })
            break;
          default:

        }
      });
      // =================================================== //
      return this
      // === toolbar end ===
    }
    this.reset = function(s){
      let pathGroup = main.activeChart().pathGroup;
      pathGroup.selectAll("*").remove();

      xAxis = d3.axisBottom(x.domain([0,0]));
      dom_xAxis.call(xAxis);

      y1Axis = d3.axisLeft(y1.domain([0,0]));
      dom_y1Axis.call(y1Axis);
    }

    this.addPlot = function(s){
      let activeChart = main.activeChart();
      if(activeChart){
        let x = activeChart.x;
        let y1 = activeChart.y1;
        let y2 = activeChart.y2;
        let xAxis = activeChart.xAxis;
        let y1Axis = activeChart.y1Axis;
        let y2Axis = activeChart.y2Axis;
        let dom_xAxis = activeChart.dom_xAxis;
        let dom_y1Axis = activeChart.dom_y1Axis;
        let dom_y2Axis = activeChart.dom_y2Axis;
        let line = activeChart.line;
        let pathGroup = activeChart.pathGroup;
        let graphViewBox = activeChart.graphViewBox;
        let borderLayer = activeChart.borderLayer;
        let shadeLayer = activeChart.shadeLayer;
        let hideLayer = activeChart.hideLayer;

        const channelGroup = s.channelGroup;
        const masterChannel = s.masterChannel;

        const Xmax = d3.max(masterChannel);
        const Xmin = d3.min(masterChannel);

        const domainXPrev = x.domain();
        const domainXNew = [Xmin, Xmax];
        x.domain(getChannelsDomain([domainXPrev, domainXNew])).nice();
        xAxis = d3.axisBottom(x);
        dom_xAxis.call(xAxis);

        const domainYPrev = y1.domain();
        const domainYNew = getChannelsDomain(channelGroup);
        y1.domain(getChannelsDomain([domainYPrev, domainYNew])).nice();
        y1Axis = d3.axisLeft(y1);
        dom_y1Axis.call(y1Axis);

        if(channelGroup){
          for (const channel of channelGroup){
            const data = masterChannel.map(function(value, index){
              return [value, channel[index]];
            });
            line = d3.line()
              .x(function(d){return x(d[0]);})
              .y(function(d){return y1(d[1]);});
            pathGroup.append("g")
              .append("path")
              .attr("class", "css-SVGPath")
              .datum(data)
              .attr("d", line)
              .attr("fill", "none")
              .attr("stroke", "red")
              .attr("stroke-linejoin", "round")
              .attr("stroke-linecap", "round")
              .attr("stroke-width", 1.3)
              .attr("pointer-events", "all");
          }
        }
      }
    }

    this.hidePlot = function(s){
    }

    this.activeChart = function(s){
      for (const chart of main.charts){
        console.log(typeof chart.attr("active"))
        if(chart.attr("active")=="true") return chart;
      }
    }
    this.inactivateAll = function(s){
      main.find(".css-d3-chart").each(function(){
        $(this).attr("active", "false")
      })
    }
    return this.init(settings);

    // === private functions ===
    function getChannelsDomain(channels=[]){
      let min, max;
      for(const ch of channels){
        if (!(min && (min < d3.min(ch)))) min = d3.min(ch);
        if (!(max && (max > d3.max(ch)))) max = d3.max(ch);
      }
      return [min, max]
    }

    function resampling(){

    }
  };
})(jQuery, window);

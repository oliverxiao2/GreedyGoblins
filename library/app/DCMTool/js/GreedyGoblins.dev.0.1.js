if (window.HTMLElement){
  HTMLElement.prototype.GreedyGoblins = function(){
    if (this){ //.tagName == "DIV"
      let root = this;
      this.fileList = [];

      this.initialize = function(){

        let DOMBox = document.createElement("div");
        DOMBox.style = "width:300px;height:300px;background-color:#31708f";
        DOMBox.className = "css-div-drag-fileinput";

        DOMBox.addEventListener("dragover", function(e){
          e.preventDefault();
          DOMBox.innerHTML = "drag files and drop here... "
        })

        DOMBox.addEventListener("drop", function(e){
          e.preventDefault();
          let files = e.dataTransfer.files;
          for (let file of files){
            if (file.name.toUpperCase().match("A2L")){ //&& file.name.match("a2l")
              let fr = new FileReader();

              fr.readAsText(file);

              fr.onload = function(e){
                let _tempFileObj = file;
                const r = e.target.result;
                console.log(file);
                if (!alreadyExist(file, root.fileList)){
                  _tempFileObj["data"] = root.fileReader(r, "A2L", root.fileList);
                  root.fileList.push(_tempFileObj);
                }
              }

              fr.onprogress = function(e){
                //console.log(parseInt(e.loaded/e.total*100)+"%");
              }
            }
            else if (file.name.toUpperCase().match("HEX")){
              let fr = new FileReader();

              fr.readAsText(file);

              fr.onload = function(e){
                let _tempFileObj = file;
                const r = e.target.result;
                if (!alreadyExist(file, root.fileList)){
                  _tempFileObj["data"] = r.split(/\n/);
                  root.fileList.push(_tempFileObj);
                }
              }
            }
          }
          // =========== drop event handler sub functions ======================
          // 1. check if the file already exist
          function alreadyExist(file, storeArray){
            for (const f of storeArray){if ((file.name == f.name) && (file.size == f.size)) return true;}
            return false;
          }
          // == End of 1 =======================================================
        })

        this.append(DOMBox);
      };

      this.fileReader = function(data, extName, storeArray=[]){
        if (extName.toUpperCase() == "A2L"){
          let out = {
            IF_DATA: [],
            FUNCTION: [],
            CHAR: [],
            MEAS: [],
            COMPU_METHOD: {},
            COMPU_TAB: {},
            COMPU_VTAB: {},
            RECORD_LAYOUT: {},
            AXIS_PTS: {}
          };
          let r   = data;

          var _quoteArray  = [];
          var _quoteOrder  = -1;
          var _escapeQuote = "escapeXXXQuote";
          var _quote       = "quoteXYZquote";

          const labels = {
            char: "CHAR",
            meas: "MEAS",
            method: "COMPU_METHOD",
            tab: "COMPU_TAB",
            vtab: "COMPU_VTAB",
            layout: "RECORD_LAYOUT",
            axis_pts: "AXIS_PTS"
          }

          r = r.replace(/\/\*[\s\S]+?\*\//g,'') // delete /* comment */
               .replace(/\\\"/g, _escapeQuote) // replace \" with _escapeQuote
               .replace(/\"[\s\S]*?\"/g, replacer4) // replace "..." with _quote
               .replace(/(\/begin)\s+([\S]+)\s+(((?!\/end|\/begin)([\s\S]*?))*)\s?([\s\S]*?(?=\/begin|\/end))/g, replacer1) // replace begin
               .replace(/\/end\s+[\w\_]+\b/g,replacer3) // replace end
               .replace(/(?:\/ul>)((?!(\<li\>))([\s\S])*?)(?=\<ul\>|\<\/ul\>)/g,replacer2) // find out the content out of the child label in a parent label, then hide it
               .replace(/(?:\/end)\s+[\w\_]+\b/g, replacer3) // replace end
               .replace('<ul>','<ul id="tree_ul">') // replace first ul tag
               .replace(eval("/"+_quote+"/g"), replacer5)
               .replace(eval("/"+_escapeQuote+"/g"), "\\\"");

          // === use a HTMLElement to parse the string
          let _tempHTMLElement = document.createElement("div");
          _tempHTMLElement.innerHTML = r;
          $(_tempHTMLElement).find("a").each(function(){
            let _e            = {};
            let i             = -1; // not-Blank-line count
            let _tab          = [];
            let _key, _subBlocks;
            let _content      = unescape($(this).attr("_content"));
            let _contentLines = _content.split(/\n/);

            switch ($(this).html().toUpperCase()) {
              case "CHARACTERISTIC":
                _e["type"] = "CHARACTERISTIC";

                // 1. read attributes in the main block
                for (let line of _contentLines){
                  // maye be blank line
                  line = $.trim(line);
                  if (line){
                    i += 1;

                    if (i == 0)      _e["name"]         = line
                    else if (i == 1) _e["description"]  = line
                    else if (i == 2) _e["valueType"]    = line
                    else if (i == 3) _e["address"]      = line
                    else if (i == 4) _e["recordLayout"] = line
                    else if (i == 5) _e["maxDiff"]      = line
                    else if (i == 6) _e["conversion"]   = line
                    else if (i == 7) _e["lowerLimit"]   = line
                    else if (i == 8) _e["upperLimit"]   = line
                    else{
                      //sometimes...
                      //READ_ONLY
                      const _spacePosition = line.indexOf(" ");
                      if (_spacePosition == -1) _e[line.toLowerCase()] = line;
                      else{
                        const _key = line.substring(0, _spacePosition).toLowerCase();
                        _e[_key] = line.substring(_spacePosition+1);
                      }
                    }
                  }
                }

                // 2. read subblock such as AXIS_DESCR
                _subBlocks = $(this).parent().siblings("ul").find("a");
                if (_subBlocks.length > 0){
                  _e["subs"] = [];
                  for (const _b of _subBlocks){
                    const _$ = $(_b);
                    const _subBlockType = _$.text().toUpperCase();
                    if (_subBlockType == "AXIS_DESCR"){
                      const _subBlockContentLines = unescape(_$.attr("_content")).split(/\n/);
                      let _subBlockLineCounter = -1;
                      let _subBlockDict = {"type":_subBlockType};
                      _e["subs"].push(_subBlockDict);

                      for (let line of _subBlockContentLines){
                        line = $.trim(line);
                        if (line){
                          _subBlockLineCounter += 1;

                          if (_subBlockLineCounter == 0) _subBlockDict["axisType"] = line;
                          else if (_subBlockLineCounter == 1) {
                            _subBlockDict["inut"] = line;
                          }
                          else if (_subBlockLineCounter == 2) {
                            _subBlockDict["conversion"] = line;
                          }
                          else if (_subBlockLineCounter == 3) {
                            _subBlockDict["maxPointsQuantity"] = line;
                          }
                          else if (_subBlockLineCounter == 4) {
                            _subBlockDict["lowerLimit"] = line;
                          }
                          else if (_subBlockLineCounter == 5) {
                            _subBlockDict["upperLimit"] = line;
                          }
                          else{
                            const _spacePosition = line.indexOf(" ");
                            if (_spacePosition == -1) _subBlockDict[line.toLowerCase()] = line;
                            else{
                              const _key = line.substring(0, _spacePosition).toLowerCase();
                              _subBlockDict[_key] = line.substring(_spacePosition+1);
                            }
                          }
                        }
                      }
                    }
                  }
                } // === read sub blocks ===

                out["CHAR"].push(_e);
                break;
              case "MEASUREMENT":
                _e["type"] = "MEASUREMENT";

                for (let line of _contentLines){
                  line = $.trim(line);
                  if (line){
                    i += 1;

                    if (i == 0) _e["name"] = line;
                    else if (i == 1) _e["description"] = line;
                    else if (i == 2) _e["valueType"]   = line;
                    else if (i == 3) _e["conversion"]  = line;
                    else if (i == 4) _e["resolution"]  = line;
                    else if (i == 5) _e["accuracy"]    = line;
                    else if (i == 6) _e["lowerLimit"]  = line;
                    else if (i == 7) _e["upperLimit"]  = line;
                    else{
                      const _spacePosition = line.indexOf(" ");
                      if (_spacePosition == -1) _e[line.toLowerCase()] = line;
                      else{
                        const _key = line.substring(0, _spacePosition).toLowerCase();
                        _e[_key] = line.substring(_spacePosition+1);
                      }
                    }
                  }
                }
                out["MEAS"].push(_e);
                break;
              case "FUNCTION":
                _e["type"] = "FUNCTION";

                for (let line of _contentLines){
                  line = $.trim(line);
                  if (line){
                    i += 1;

                    if (i == 0) _e["name"] = line;
                    else if (i == 1) _e["description"] = line;
                    else{
                      const _spacePosition = line.indexOf(" ");
                      if (_spacePosition == -1) _e[line.toLowerCase()] = line;
                      else{
                        const _key = line.substring(0, _spacePosition).toLowerCase();
                        _e[_key] = line.substring(_spacePosition+1);
                      }
                    }
                  }
                }
                // 2. read subblock such as DEF_CHARACTERISTIC
                _subBlocks = $(this).parent().siblings("ul").find("a");
                if (_subBlocks.length > 0){
                  _e["subs"] = {};
                  for (const _b of _subBlocks){
                    const _$ = $(_b);
                    const _subBlockType = _$.text().toUpperCase();
                    //if (_subBlockType == "DEF_CHARACTERISTIC"){
                    if (true){ // no need to judge
                      const _subBlockContentLines = unescape(_$.attr("_content")).split(/\n/);
                      let _subBlockLineCounter = -1;
                      _e["subs"][_subBlockType] = [];

                      for (let line of _subBlockContentLines){
                        line = $.trim(line);
                        if (line){
                          _subBlockLineCounter += 1;
                          _e["subs"][_subBlockType] = _e["subs"][_subBlockType].concat(line.split(/\s/));
                        }
                      }
                    }
                  }
                }//=== read sub blocks ===
                out["FUNCTION"].push(_e);
                break;
              case "RECORD_LAYOUT":
                for (let line of _contentLines){
                  line = $.trim(line);
                  if (line){
                    i += 1;
                    if (i == 0){
                      _key = line;
                    }
                    else{
                      const fieldElements = line.match(/\b[\S]+\b/g);
                      _e[fieldElements[0]] = fieldElements;
                    }
                  }
                }
                out["RECORD_LAYOUT"][_key] = _e;
                break;
              case labels.method:
                for (let line of _contentLines){
                  line = $.trim(line);
                  if (line){
                    i += 1;
                    if (i == 0) _key = line;
                    else if (i == 1) _e["description"] = line;
                    else if (i == 2) _e["conversionType"] = line;
                    else if (i == 3) _e["format"] = line;
                    else if (i == 4) _e["unit"] = line;
                    else {
                      const fieldElements = line.match(/\b[\S]+\b/g);
                      _e[fieldElements[0]] = fieldElements.slice(1, fieldElements.length);
                    }
                  }
                }
                out[labels.method][_key] = _e;
                break;
              case labels.tab:
                for (let line of _contentLines){
                  line = $.trim(line);
                  if (line){
                    i += 1;
                    if (i == 0) _key = line;
                    else if (i == 1) _e["description"] = line;
                    else if (i == 2) _e["conversion"] = line;
                    else if (i == 3) _e["count"] = parseInt(line);
                    else {
                      const fieldElements = line.match(/\b[\S]+\b/g);
                      _tab.push(fieldElements);
                    }
                  }
                }
                _e["data"] = _tab;
                out[labels.tab][_key] = _e;
                break;
              case labels.vtab:
                for (let line of _contentLines){
                  line = $.trim(line);
                  if (line){
                    i += 1;
                    if (i == 0) _key = line;
                    else if (i == 1) _e["description"] = line;
                    else if (i == 2) _e["conversion"] = line;
                    else if (i == 3) _e["count"] = parseInt(line);
                    else {
                      const fieldElements = line.match(/\b[\S]+\b/g);
                      _tab.push(fieldElements);
                    }
                  }
                }
                _e["data"] = _tab;
                out[labels.vtab][_key] = _e;
                break;
              case labels.axis_pts:
                for (let line of _contentLines){
                  line = $.trim(line);
                  if (line){
                    i += 1;
                    if (i == 0) _key = line;
                    else if (i == 1) _e["description"] = line;
                    else if (i == 2) _e["address"] = line;
                    else if (i == 3) _e["input"] = line;
                    else if (i == 4) _e["recordLayout"] = line;
                    else if (i == 5) _e["maxDiff"] = line;
                    else if (i == 6) _e["conversion"] = line;
                    else if (i == 7) _e["maxPointsQuantity"] = line;
                    else if (i == 8) _e["lowerLimit"] = line;
                    else if (i == 9) _e["upperLimit"] = line;
                    else {
                      const fieldElements = line.match(/\b[\S]+\b/g);
                      _tab.push(fieldElements);
                    }
                  }
                }
                _e["data"] = _tab;
                out[labels.axis_pts][_key] = _e;
                break;
              default:
            }
          // End of parsing single element(<a></a>) in _tempHTMLElement
          });
          return out;
        }
        // ============= sub functions =====================
        function replacer1(match, p1, p2, p3, offset, string){
          return '<ul><li><a style="cursor:pointer;" _content="' + escape(p3) + '" >'+p2+'</a></li>';}
        function replacer2(match, p1, offset, string){
          let k = p1.indexOf('</li>')
          if (k == -1){
            return '/ul><p class="css-p-hidden">' + p1 + '</p>';}
          else{
            return '/ul><p class="css-p-hidden">' + p1.substring(0, k-1) + '</p></li>';}
        }
        function replacer3(){
          return '</li></ul>';
        }
        function replacer4(match){
          _quoteArray.push(escape(match));
          return _quote;
        }
        function replacer5(match){
          _quoteOrder += 1;
          return _quoteArray[_quoteOrder].replace(/\"/g, "%22"); // escape quote "
        }
      }

      this.fetch = function({
        a2l,
        hex,
        charRegExp,
        funcRegExp
        }){
        const runtimeStart = performance.now();
        let out       = {};
        const _charAll = a2l["data"]["CHAR"];
        const _recordLayoutAll = a2l["data"]["RECORD_LAYOUT"];
        const _conversionAll= a2l["data"]["COMPU_METHOD"];
        const _tabAll= a2l["data"]["COMPU_TAB"];
        const _vtabAll= a2l["data"]["COMPU_VTAB"];
        const _axisPtsAll = a2l["data"]["AXIS_PTS"];

        if (a2l && hex){
          // search CHARACTERISTIC by charRegExp
          if (charRegExp) {
            let _charNeed = [];
            let _addrInfo = [];

            ////////////////////////////////////////////////////////////////////
            if (charRegExp == "*") _charNeed = _charAll;
            else {
              for (let _char of _charAll){
                if (_char.name.match(charRegExp)) _charNeed.push(_char);
              }
            }
            out["CHARFound"] = _charNeed;

            // _charNeed not empty
            if (_charNeed.length > 0){
              for (const [_i, _char] of _charNeed.entries()){
                //out["CHARGroupByExt"] = _addr
                //out["CHARGroupByExt"][0] = {}, members as following:
                //ext: extension address
                //CHARID: the order of CHAR in the out["CHARFound"]

                //get address
                const _addr = _char.address;
                const _valueType = _char.valueType.toUpperCase();
                // 32bit address, 0xAAAABBBB

                if (true){ // if 32bit address, always true
                  // ATTENTION! the address may not has 8 numbers!
                  // the amount of numbers should between 5 ~ 8
                  // such as 0x9061234
                  // in 32bit address, the base adress always have 4 digits
                  // but the extension address shouldn't have 4 digits
                  const _high = parseInt("0x"+_addr.substr(2, _addr.length - 6));
                  //_addrInfo empty
                  const _len  = _addrInfo.length;
                  if (_len == 0){
                    _addrInfo.push({ext:_high, CHARID:[_i]})
                  }
                  else{
                    let _flagInGroup = false;
                    for(let i=0; i<_len; i++){
                      //ext address exist, update baseMax & baseMin
                      if ( _high == _addrInfo[i].ext){
                        //add this CHAR's index into the CHARID array
                        _addrInfo[i].CHARID.push(_i);
                        _flagInGroup = true;
                        break;
                      }
                    }

                    if (!_flagInGroup) _addrInfo.push({ext:_high, CHARID:[_i]});
                  }

                  // ====================== Attach conversionType ============================= //
                  // TAB_INTP: table with interpolation
                  // TAB_NOINTP: table without interpolation
                  // TAB_VERB: verbal conversion table
                  // RAT_FUNC: fractional rational function = (axx+bx+c)/(dxx+ex+f)
                  // FORM: formula as specified in the Formula property
                  addConversionInfo({obj: _char,});

                  if (_char["subs"]){
                    _char["layoutDetailAxis"] = [];
                    for (const [i, sub] of _char["subs"].entries()){
                      addConversionInfo({obj:sub});
                      if (sub["axis_pts_ref"]){
                        sub["recordLayout"] = _axisPtsAll[sub["axis_pts_ref"]]["recordLayout"];
                        _char["layoutDetailAxis"].push(_recordLayoutAll[sub["recordLayout"]]);
                      }
                    }
                  }
                  // ================ End of attach conversionType ============================ //


                  // ================ Attach recordLayout information ========================= //
                  // KlAxU8SstxU16WU16
                  // NO_AXIS_PTS_X 1 SWORD
                  // AXIS_PTS_X    2 SWORD INDEX_INCR DIRECT
                  // FNC_VALUES    3 SWORD COLUMN_DIR DIRECT
                  // =====================================================================
                  // Axis_Xs16
                  // NO_AXIS_PTS_X     1 SWORD
                  // AXIS_PTS_X        2 SWORD INDEX_INCR DIRECT
                  // =====================================================================
                  // Cur_Xs16Ws16
                  // NO_AXIS_PTS_X     1 SWORD
                  // AXIS_PTS_X        2 SWORD INDEX_INCR DIRECT
                  // FNC_VALUES        3 SWORD COLUMN_DIR DIRECT
                  // =====================================================================
                  // KfAxSwAySwSstxSwSstySwWSw
                  // NO_AXIS_PTS_X     1 SWORD
                  // NO_AXIS_PTS_Y     2 SWORD
                  // AXIS_PTS_X        3 SWORD INDEX_INCR DIRECT
                  // AXIS_PTS_Y        4 SWORD INDEX_INCR DIRECT
                  // FNC_VALUES        5 SWORD COLUMN_DIR DIRECT

                  const _layout = _recordLayoutAll[_char["recordLayout"]]; // layout in main Block
                  let _tempAllLayout = [_layout];

                  if (_char["layoutDetailAxis"]){
                    _tempAllLayout = _tempAllLayout.concat(_char["layoutDetailAxis"])
                  }

                  _char["bytes"] = {};
                  _char["layoutDetail"] = {};

                  for (const i of _tempAllLayout){
                    for (const layoutItem in i){
                      if (i[layoutItem][2].match("UBYTE")){
                        _char["layoutDetail"][i[layoutItem][0]] = {dataType:"UBYTE", bytes:1, signed:false}; //8 bit
                      }
                      else if (i[layoutItem][2].match("SBYTE")) {
                        _char["layoutDetail"][i[layoutItem][0]] = {dataType:"SBYTE", bytes:1, signed:true}; // 8 bit
                      }
                      else if (i[layoutItem][2].match("UWORD")){
                        _char["layoutDetail"][i[layoutItem][0]] = {dataType:"UWORD", bytes:2, signed:false}; // 16 bit
                      }
                      else if (i[layoutItem][2].match("SWORD")){
                        _char["layoutDetail"][i[layoutItem][0]] = {dataType:"SWORD", bytes:2, signed:true}; // 16 bit
                      }
                      else if (i[layoutItem][2].match("ULONG")){
                        _char["layoutDetail"][i[layoutItem][0]] = {dataType:"ULONG", bytes:4, signed:false}; // 32 bit
                      }
                      else if (i[layoutItem][2].match("SLONG")){
                        _char["layoutDetail"][i[layoutItem][0]] = {dataType:"SLONG", bytes:4, signed:true}; // 32 bit
                      }
                      else if (i[layoutItem][2].match("A_UINT64")){
                        _char["layoutDetail"][i[layoutItem][0]] = {dataType:"A_UINT64", bytes:8, signed:false}; // 64 bit
                      }
                      else if (i[layoutItem][2].match("A_INT64")){
                        _char["layoutDetail"][i[layoutItem][0]] = {dataType:"A_INT64", bytes:8, signed:true}; // 64 bit
                      }
                      else if (i[layoutItem][2].match("FLOAT32_IEEE")){
                        _char["layoutDetail"][i[layoutItem][0]] = {dataType:"FLOAT32_IEEE", bytes:4, signed:true}; // 32 bit
                      }
                      else if (i[layoutItem][2].match("FLOAT64_IEEE")){
                        _char["layoutDetail"][i[layoutItem][0]] = {dataType:"FLOAT64_IEEE", bytes:8, signed:true}; // 64 bit
                      }
                    }
                  }
                  // ============== End of attach recordLayout information ==================== //
                }
              }

              out["CHARGroupByExt"] = _addrInfo;

              // =========== according to _addrInfo, read the data from hex =============== //
              // =================== CHARID =======================
              // data: "1020040..."
              // ext: 32772 => 0x8004
              // extFromRow: 7688 => row order in hex file
              // extToRow: 9736 => row order in hex file
              for (let _group of _addrInfo){
                const _ext = _group.ext.toString(16);
                const _offset = ":AABBBBCC".length;
                let _extFromRow, _extToRow, _flagFindExt=false, _biter="";

                //scan the hex and get the extension address data
                for (let [_i, _row] of hex["data"].entries()){
                  if (_flagFindExt){
                    if(_row.substr(7, 2) == "00"){
                      _biter += _row.substring(_offset, _row.length-3);}
                    else{
                      _extToRow = _i-1;
                      break;}
                  }

                  //search for the extention address row
                  //have to put at the end in order to work in next loop
                  if (_row.match(":02000004"+_ext)){
                    _extFromRow = _i;
                    _flagFindExt = true;
                  }
                }
                _group["data"]       = _biter;
                _group["extFromRow"] = _extFromRow;
                _group["extToRow"]   = _extToRow;
              }
              // =============== End of read the data from hex ============================ //

              // =========== according to the _biter, find the value of the address ======= //
              for (const _group of _addrInfo){
                for (const _CHARID of _group.CHARID){
                  sub_readAndAttachChar(_charNeed[_CHARID], _group["data"]);
                }
              }
            }
          }
          else if (funcRegExp){
            let _funcResultArray = [];
            for (const func of a2l["data"]["FUNCTION"]){
              if (func["name"].match(funcRegExp)) _funcResultArray.push(func);
            }
            out = _funcResultArray;
          }
          // ========== Calculate the ruuning time and output result ================== //
          const runtimeEnd = performance.now();
          console.log(runtimeEnd - runtimeStart);
          return out;
          // ======================= End of main code ================================= //
        }

        ////////////////////////////////////////////////////////////////////////////////
        ////////////////////////////////////////////////////////////////////////////////
        ////////////////////////////////////////////////////////////////////////////////

        // ============================ subfunction ================================= //
        // === convert value to physical value
        function convert(rawData, char){
          try{
            const type = char["conversionType"];

            let params;
            switch (type) {
              case "RAT_FUNC":
                // raw = (a*phy^2+b*phy+c)/(d*phy^2+e*phy+f)
                params = char["conversionCOEFFS"];
                const aMinusdg = params[0] - params[3]*rawData;
                if (aMinusdg == 0){
                  const numerator = params[5]*rawData - params[2];
                  const denominator = params[1] - params[4]*rawData;
                  return numerator/denominator;
                }
                else return null;
                //const b2Minus4ac = Math.pow(params[1]-params[4]*rawData, 2)-4*(params[0]-params[3]*rawData)*(params[2]-params[5]*rawData);
              case "TAB_VERB":
                params = char["conversionVTabRef"]["data"];
                for (const item of params){
                  if (item[0] == rawData) return item[1];
                }
                return null;
              case "TAB_INTP":
                params = char["conversionTabRef"]["data"];
                for (const item of params){
                  if (item[0] == rawData){
                    return item[1];
                  }
                }
                return null;
              case "TAB_NOINTP":
                params = char["conversionTabRef"]["data"];
                for (const item of params){
                  if (item[0] == rawData){
                    return parseFloat(item[1]);
                  }
                }
                return null;
              default:
                return null;
            }
          }
          catch (exception){
            console.log(char, char["conversionType"],  exception);
          }
        }

        // === find conversion info of obj
        // === and add these to obj's properties
        // === conversionDict = COMPU_METHOD
        // === obj can be CHARACTERISTIC or AXIS_DESCR
        function addConversionInfo({
          obj,
          conversionDict = _conversionAll, // COMPU_METHOD
          tabDict        = _tabAll,        // COMPU_TAB
          vtabDict       = _vtabAll        // COMPU_VTAB
        }){
          if (obj["conversion"]){

            const myConversion = conversionDict[obj["conversion"]];
            obj["conversionType"] = myConversion["conversionType"];

            if (myConversion["conversionType"] === "TAB_VERB"){
              obj["conversionVTabRef"] = vtabDict[myConversion["COMPU_TAB_REF"][0]];
            }
            else if (myConversion["conversionType"] === "RAT_FUNC"){
              obj["conversionCOEFFS"] = myConversion["COEFFS"];
              obj["conversionFormat"] = myConversion["format"];
            }
            else if (myConversion["conversionType"] === "TAB_INTP" || myConversion["conversionType"] === "TAB_NOINTP"){
              obj["conversionTabRef"] = tabDict[myConversion["COMPU_TAB_REF"][0]];
            }
          }
        }

        // === littleEndian: true
        // === 0xABCD => 0xCDAB
        // === 0xABCDEFGH => 0x GHEFCDAB
        // === datumLen = 1/2/4
        function hexDatumStrToInt({
          str="",
          signed=false,
          littleEndian=true,
          hexRaw=false
        }){
          if (littleEndian){
            if (str.length % 2 === 0){
              let out = 0;
              let rawStr = "";

              for (let i=0; i<str.length/2; i++){rawStr = str.substr(i*2, 2) + rawStr;}
              rawStr = "0x" + rawStr.toUpperCase();

              // example:raw "0xABCD"
              if (hexRaw) return rawStr;

              for (let i=0; i<str.length/2; i++){out += (parseInt("0x"+str.substr(i*2, 2))) * (0x01 << (i*8));}



              if (signed && (out.toString(2).length == str.length*4)){
                // negative
                return out - (0x01 << (str.length*4));
              }

              return out;
            }
            else return null;
          }
        }

        // === read CHARACTERISTIC-CURVE value ===
        // === char: dealed CHARACTERISTIC Object
        // === hexDB: pure hex data at right extension address
        function sub_readAndAttachChar(char, hexDB){
          let _out_rawDataArray = [];
          let _out_phyDataArray = [];
          let offset, offsetX, offsetY, offsetZ;
          let _strX = "", _strY = "", _strZ = "";
          let _rawX = "", _rawY = "", _rawZ = "";
          let _x = 0, _y = 0, _z;

          const _valueType                 = char["valueType"];
          const _number                    = parseInt(char["number"]);
          const _baseAddr                  = parseInt("0x"+char["address"].substr(char["address"].length-4, 4))*2;
          const _byteNumOfZVal             = char["layoutDetail"]["FNC_VALUES"]["bytes"];
          const _signedZ                   = char["layoutDetail"]["FNC_VALUES"]["signed"];
          const _conversionType            = char["conversionType"];

          // === validate the points quantity, the number of quantity must not be negative
          if(_valueType == "VALUE" || _valueType == "VAL_BLK"){
            const _realNum = (_valueType == "VALUE")? 1 : _number;
            let offset = 0;

            for (let i=0; i<_realNum; i++){
              offset = i * _byteNumOfZVal*2;

              _strZ = hexDB.substr(_baseAddr + offset, _byteNumOfZVal*2);

              _rawZ = hexDatumStrToInt({str:_strZ, signed:false, hexRaw:true});

              _z = hexDatumStrToInt({str:_strZ, signed:_signedZ});

              _z = convert(_z, char);

              _out_rawDataArray.push(_rawZ);
              _out_phyDataArray.push(_z);
            }
          }
          else if (_valueType == "CURVE"){

            const _byteNumOfAxisXPtsQuantity = char["layoutDetail"]["NO_AXIS_PTS_X"] ? char["layoutDetail"]["NO_AXIS_PTS_X"]["bytes"] : _byteNumOfZVal;
            const _byteNumOfAxisXVal         = char["layoutDetail"]["AXIS_PTS_X"] ? char["layoutDetail"]["AXIS_PTS_X"]["bytes"] : _byteNumOfZVal;
            const _realPointsNum = hexDatumStrToInt({str:hexDB.substr(_baseAddr, _byteNumOfAxisXPtsQuantity*2), signed:false});
            const _maxPointsNum  = parseInt(char["subs"][0]["maxPointsQuantity"]);
            const _signedX       = char["layoutDetail"]["AXIS_PTS_X"] ? char["layoutDetail"]["AXIS_PTS_X"]["signed"] : _signedZ;
            if (_realPointsNum <= _maxPointsNum){
              for (let i=0; i<_realPointsNum; i++){
                offsetX = (_byteNumOfAxisXPtsQuantity + i * _byteNumOfAxisXVal)*2;
                offsetZ = (_byteNumOfAxisXPtsQuantity + _realPointsNum * _byteNumOfAxisXVal + i * _byteNumOfZVal)*2;

                _strX = hexDB.substr(_baseAddr + offsetX, _byteNumOfAxisXVal*2);
                _strZ = hexDB.substr(_baseAddr + offsetZ, _byteNumOfZVal*2);

                _rawX = hexDatumStrToInt({str:_strX, signed:false, hexRaw:true});
                _rawZ = hexDatumStrToInt({str:_strZ, signed:false, hexRaw:true});

                _x = hexDatumStrToInt({str:_strX, signed:_signedX});
                _z = hexDatumStrToInt({str:_strZ, signed:_signedZ});

                _x = convert(_x, char["subs"][0]);
                _z = convert(_z, char);

                _out_rawDataArray.push({x:_rawX, z:_rawZ});
                _out_phyDataArray.push({x:_x, z:_z});
              }
            }
          }
          else if (_valueType == "MAP"){
            // the map data structure in hex
            // AAAA BBBB => x axis points number, y axis points number
            // XXXX XXXX .... XXXX => x axis value
            // YYYY YYYY .... YYYY => y axis value
            // ZZZZ ZZZZ .... ZZZZ => z value when x=x0, changing with y
            // ZZZZ ZZZZ .... ZZZZ => z value when x=x1, changing with y
            // ....
            const _byteNumOfAxisXPtsQuantity = char["layoutDetail"]["NO_AXIS_PTS_X"] ? char["layoutDetail"]["NO_AXIS_PTS_X"]["bytes"] : _byteNumOfZVal;
            const _byteNumOfAxisXVal         = char["layoutDetail"]["AXIS_PTS_X"] ? char["layoutDetail"]["AXIS_PTS_X"]["bytes"] : _byteNumOfZVal;
            const _byteNumOfAxisYPtsQuantity = char["layoutDetail"]["NO_AXIS_PTS_Y"] ? char["layoutDetail"]["NO_AXIS_PTS_Y"]["bytes"] : _byteNumOfAxisXPtsQuantity;
            const _byteNumOfAxisYVal         = char["layoutDetail"]["AXIS_PTS_Y"] ? char["layoutDetail"]["AXIS_PTS_Y"]["bytes"] : _byteNumOfAxisXVal;
            const _realNumOfPtsX = hexDatumStrToInt({str:hexDB.substr(_baseAddr, _byteNumOfAxisXPtsQuantity*2), signed:false});
            const _realNumOfPtsY = hexDatumStrToInt({str:hexDB.substr(_baseAddr + _byteNumOfAxisXPtsQuantity*2, _byteNumOfAxisYPtsQuantity*2), signed:false});
            const _maxPtsNumOfX  = parseInt(char["subs"][0]["maxPointsQuantity"]);
            const _maxPtsNumOfY  = parseInt(char["subs"][1]["maxPointsQuantity"]);
            const _signedX       = char["layoutDetail"]["AXIS_PTS_X"] ? char["layoutDetail"]["AXIS_PTS_X"]["signed"] : _signedZ;
            const _signedY       = char["layoutDetail"]["AXIS_PTS_Y"] ? char["layoutDetail"]["AXIS_PTS_Y"]["signed"] : _signedX;

            let _arrayX = [], _arrayY = [], _arrayZ = [], _map = {}, _mapRaw = {};
            let _arrayRawX = [], _arrayRawY = [], _arrayRawZ = [];

            if ((_realNumOfPtsX <= _maxPtsNumOfX) || (_realNumOfPtsY <= _maxPtsNumOfY)){
              offset  = (_byteNumOfAxisXPtsQuantity + _byteNumOfAxisYPtsQuantity)*2;

              for (let i=0; i<_realNumOfPtsX; i++){
                offsetX = offset + (i * _byteNumOfAxisXVal)*2;
                _strX = hexDB.substr(_baseAddr + offsetX, _byteNumOfAxisXVal*2);
                _rawX = hexDatumStrToInt({str:_strX, signed:false, hexRaw:true});
                _x    = hexDatumStrToInt({str:_strX, signed:_signedX});
                _x    = convert(_x, char["subs"][0]);
                _arrayX.push(_x);
                _arrayRawX.push(_rawX);
              }

              for (let i=0; i<_realNumOfPtsY; i++){
                offsetY = offset + (_realNumOfPtsX * _byteNumOfAxisXVal + i * _byteNumOfAxisYVal)*2;
                _strY = hexDB.substr(_baseAddr + offsetY, _byteNumOfAxisYVal*2);
                _rawY = hexDatumStrToInt({str:_strY, signed:false, hexRaw:true});
                _y    = hexDatumStrToInt({str:_strY, signed:_signedY});
                _y    = convert(_y, char["subs"][1]);
                _arrayY.push(_y);
                _arrayRawY.push(_rawY);
              }

              for (let i=0; i<_realNumOfPtsX; i++){

                //let _temp = [], _tempRaw =[];
                //_arrayZ.push([_arrayX[i], _temp]);
                //_arrayRawZ.push([_arrayRawX[i], _tempRaw]);

                if (!_map[_arrayX[i]]){
                  _map[_arrayX[i]] = {};
                  _mapRaw[_arrayRawX[i]] = {};
                }

                for (let j=0; j<_realNumOfPtsY; j++){
                  offsetZ = offset + (_realNumOfPtsX * _byteNumOfAxisXVal + _realNumOfPtsY * _byteNumOfAxisYVal + i*_realNumOfPtsY*_byteNumOfZVal + j)*2;
                  _strZ = hexDB.substr(_baseAddr + offsetZ, _byteNumOfZVal*2);
                  _rawZ = hexDatumStrToInt({str:_strZ, signed:false, hexRaw:true});
                  _z    = hexDatumStrToInt({str:_strZ, signed:_signedZ});
                  _z    = convert(_z, char);
                  //_temp.push([_arrayY[j], _z]);
                  //_tempRaw.push([_arrayRawY[j], _rawZ]);

                  _map[_arrayX[i]][_arrayY[j]] = _z;
                  _mapRaw[_arrayRawX[i]][_arrayRawY[j]] = _rawZ;
                }
              }
              _out_rawDataArray = _mapRaw;
              _out_phyDataArray = _map;
            }
            else{
              char["rawDataArray"] = null;
              char["phyDataArray"] = null;
              return null;
            }
          }

          char["rawDataArray"] = _out_rawDataArray; // attach result
          char["phyDataArray"] = _out_phyDataArray; // attach result
          // read and attach end
        }
      }

      this.getDependency = function({
        a2l,
        charName,
        funcName
        }){
        if (a2l){
          if (charName){
            if (charName == "*"){
              let _fullCollection = {};
              for (const func of a2l["data"]["FUNCTION"]){
                if (func["subs"]){
                  if (func["subs"]["DEF_CHARACTERISTIC"]){
                    for (const item of func["subs"]["DEF_CHARACTERISTIC"]){
                      if (!_fullCollection[item]) _fullCollection[item] = [func];
                      else {
                        _fullCollection[item].push(func);
                      }
                    }
                  }
                }
              }

              return _fullCollection;
            }
            else if (funcName){
              // return true or false that if the char reliable of the func
              for (const func of a2l["data"]["FUNCTION"]){
                if (func["name"] == funcName){
                  if (func["subs"]){
                    if (func["subs"]["DEF_CHARACTERISTIC"]){
                      for (const item of func["subs"]["DEF_CHARACTERISTIC"]){
                        if (item == charName) return true;
                      }
                    }
                  }
                }
              }

              return false;
            }
            else{
              let _result = [];
              for (const func of a2l["data"]["FUNCTION"]){
                if (func["subs"]){
                  if (func["subs"]["DEF_CHARACTERISTIC"]){
                    for (const item of func["subs"]["DEF_CHARACTERISTIC"]){
                      if (item == charName) _result.push(func)
                    }
                  }
                }
              }
              return _result;
            }
          }
          else {
            if (funcName){
              for (const func of a2l["data"]["FUNCTION"]){
                if (func["name"] == funcName) return func;
              }
            }
            else return null;
          }
        }
        else return null;
      }

      this.initialize();
    }
  }
}

function goblinsReader(data, extName, storeArray=[]){
  if (extName.toUpperCase() == "A2L"){
    let out = {
      IF_DATA: [],
      FUNCTION: [],
      CHAR: [],
      MEAS: [],
      COMPU_METHOD: {},
      COMPU_TAB: {},
      COMPU_VTAB: {},
      RECORD_LAYOUT: {},
      AXIS_PTS: {}
    };
    let r   = data;

    var _quoteArray  = [];
    var _quoteOrder  = -1;
    var _escapeQuote = "escapeXXXQuote";
    var _quote       = "quoteXYZquote";

    const labels = {
      char: "CHAR",
      meas: "MEAS",
      method: "COMPU_METHOD",
      tab: "COMPU_TAB",
      vtab: "COMPU_VTAB",
      layout: "RECORD_LAYOUT",
      axis_pts: "AXIS_PTS"
    }

    r = r.replace(/\/\*[\s\S]+?\*\//g,'') // delete /* comment */
         .replace(/\\\"/g, _escapeQuote) // replace \" with _escapeQuote
         .replace(/\"[\s\S]*?\"/g, replacer4) // replace "..." with _quote
         .replace(/(\/begin)\s+([\S]+)\s+(((?!\/end|\/begin)([\s\S]*?))*)\s?([\s\S]*?(?=\/begin|\/end))/g, replacer1) // replace begin
         .replace(/\/end\s+[\w\_]+\b/g,replacer3) // replace end
         .replace(/(?:\/ul>)((?!(\<li\>))([\s\S])*?)(?=\<ul\>|\<\/ul\>)/g,replacer2) // find out the content out of the child label in a parent label, then hide it
         .replace(/(?:\/end)\s+[\w\_]+\b/g, replacer3) // replace end
         .replace('<ul>','<ul id="tree_ul">') // replace first ul tag
         .replace(eval("/"+_quote+"/g"), replacer5)
         .replace(eval("/"+_escapeQuote+"/g"), "\\\"");

    // === use a HTMLElement to parse the string
    let _tempHTMLElement = document.createElement("div");
    _tempHTMLElement.innerHTML = r;
    $(_tempHTMLElement).find("a").each(function(){
      let _e            = {};
      let i             = -1; // not-Blank-line count
      let _tab          = [];
      let _key, _subBlocks;
      let _content      = unescape($(this).attr("_content"));
      let _contentLines = _content.split(/\n/);

      switch ($(this).html().toUpperCase()) {
        case "CHARACTERISTIC":
          _e["type"] = "CHARACTERISTIC";

          // 1. read attributes in the main block
          for (let line of _contentLines){
            // maye be blank line
            line = $.trim(line);
            if (line){
              i += 1;

              if (i == 0)      _e["name"]         = line
              else if (i == 1) _e["description"]  = line
              else if (i == 2) _e["valueType"]    = line
              else if (i == 3) _e["address"]      = line
              else if (i == 4) _e["recordLayout"] = line
              else if (i == 5) _e["maxDiff"]      = line
              else if (i == 6) _e["conversion"]   = line
              else if (i == 7) _e["lowerLimit"]   = line
              else if (i == 8) _e["upperLimit"]   = line
              else{
                //sometimes...
                //READ_ONLY
                const _spacePosition = line.indexOf(" ");
                if (_spacePosition == -1) _e[line.toLowerCase()] = line;
                else{
                  const _key = line.substring(0, _spacePosition).toLowerCase();
                  _e[_key] = line.substring(_spacePosition+1);
                }
              }
            }
          }

          // 2. read subblock such as AXIS_DESCR
          _subBlocks = $(this).parent().siblings("ul").find("a");
          if (_subBlocks.length > 0){
            _e["subs"] = [];
            for (const _b of _subBlocks){
              const _$ = $(_b);
              const _subBlockType = _$.text().toUpperCase();
              if (_subBlockType == "AXIS_DESCR"){
                const _subBlockContentLines = unescape(_$.attr("_content")).split(/\n/);
                let _subBlockLineCounter = -1;
                let _subBlockDict = {"type":_subBlockType};
                _e["subs"].push(_subBlockDict);

                for (let line of _subBlockContentLines){
                  line = $.trim(line);
                  if (line){
                    _subBlockLineCounter += 1;

                    if (_subBlockLineCounter == 0) _subBlockDict["axisType"] = line;
                    else if (_subBlockLineCounter == 1) {
                      _subBlockDict["inut"] = line;
                    }
                    else if (_subBlockLineCounter == 2) {
                      _subBlockDict["conversion"] = line;
                    }
                    else if (_subBlockLineCounter == 3) {
                      _subBlockDict["maxPointsQuantity"] = line;
                    }
                    else if (_subBlockLineCounter == 4) {
                      _subBlockDict["lowerLimit"] = line;
                    }
                    else if (_subBlockLineCounter == 5) {
                      _subBlockDict["upperLimit"] = line;
                    }
                    else{
                      const _spacePosition = line.indexOf(" ");
                      if (_spacePosition == -1) _subBlockDict[line.toLowerCase()] = line;
                      else{
                        const _key = line.substring(0, _spacePosition).toLowerCase();
                        _subBlockDict[_key] = line.substring(_spacePosition+1);
                      }
                    }
                  }
                }
              }
            }
          } // === read sub blocks ===

          out["CHAR"].push(_e);
          break;
        case "MEASUREMENT":
          _e["type"] = "MEASUREMENT";

          for (let line of _contentLines){
            line = $.trim(line);
            if (line){
              i += 1;

              if (i == 0) _e["name"] = line;
              else if (i == 1) _e["description"] = line;
              else if (i == 2) _e["valueType"]   = line;
              else if (i == 3) _e["conversion"]  = line;
              else if (i == 4) _e["resolution"]  = line;
              else if (i == 5) _e["accuracy"]    = line;
              else if (i == 6) _e["lowerLimit"]  = line;
              else if (i == 7) _e["upperLimit"]  = line;
              else{
                const _spacePosition = line.indexOf(" ");
                if (_spacePosition == -1) _e[line.toLowerCase()] = line;
                else{
                  const _key = line.substring(0, _spacePosition).toLowerCase();
                  _e[_key] = line.substring(_spacePosition+1);
                }
              }
            }
          }
          out["MEAS"].push(_e);
          break;
        case "FUNCTION":
          _e["type"] = "FUNCTION";

          for (let line of _contentLines){
            line = $.trim(line);
            if (line){
              i += 1;

              if (i == 0) _e["name"] = line;
              else if (i == 1) _e["description"] = line;
              else{
                const _spacePosition = line.indexOf(" ");
                if (_spacePosition == -1) _e[line.toLowerCase()] = line;
                else{
                  const _key = line.substring(0, _spacePosition).toLowerCase();
                  _e[_key] = line.substring(_spacePosition+1);
                }
              }
            }
          }
          // 2. read subblock such as DEF_CHARACTERISTIC
          _subBlocks = $(this).parent().siblings("ul").find("a");
          if (_subBlocks.length > 0){
            _e["subs"] = {};
            for (const _b of _subBlocks){
              const _$ = $(_b);
              const _subBlockType = _$.text().toUpperCase();
              //if (_subBlockType == "DEF_CHARACTERISTIC"){
              if (true){ // no need to judge
                const _subBlockContentLines = unescape(_$.attr("_content")).split(/\n/);
                let _subBlockLineCounter = -1;
                _e["subs"][_subBlockType] = [];

                for (let line of _subBlockContentLines){
                  line = $.trim(line);
                  if (line){
                    _subBlockLineCounter += 1;
                    _e["subs"][_subBlockType] = _e["subs"][_subBlockType].concat(line.split(/\s/));
                  }
                }
              }
            }
          }//=== read sub blocks ===
          out["FUNCTION"].push(_e);
          break;
        case "RECORD_LAYOUT":
          for (let line of _contentLines){
            line = $.trim(line);
            if (line){
              i += 1;
              if (i == 0){
                _key = line;
              }
              else{
                const fieldElements = line.match(/\b[\S]+\b/g);
                _e[fieldElements[0]] = fieldElements;
              }
            }
          }
          out["RECORD_LAYOUT"][_key] = _e;
          break;
        case labels.method:
          for (let line of _contentLines){
            line = $.trim(line);
            if (line){
              i += 1;
              if (i == 0) _key = line;
              else if (i == 1) _e["description"] = line;
              else if (i == 2) _e["conversionType"] = line;
              else if (i == 3) _e["format"] = line;
              else if (i == 4) _e["unit"] = line;
              else {
                const fieldElements = line.match(/\b[\S]+\b/g);
                _e[fieldElements[0]] = fieldElements.slice(1, fieldElements.length);
              }
            }
          }
          out[labels.method][_key] = _e;
          break;
        case labels.tab:
          for (let line of _contentLines){
            line = $.trim(line);
            if (line){
              i += 1;
              if (i == 0) _key = line;
              else if (i == 1) _e["description"] = line;
              else if (i == 2) _e["conversion"] = line;
              else if (i == 3) _e["count"] = parseInt(line);
              else {
                const fieldElements = line.match(/\b[\S]+\b/g);
                _tab.push(fieldElements);
              }
            }
          }
          _e["data"] = _tab;
          out[labels.tab][_key] = _e;
          break;
        case labels.vtab:
          for (let line of _contentLines){
            line = $.trim(line);
            if (line){
              i += 1;
              if (i == 0) _key = line;
              else if (i == 1) _e["description"] = line;
              else if (i == 2) _e["conversion"] = line;
              else if (i == 3) _e["count"] = parseInt(line);
              else {
                const fieldElements = line.match(/\b[\S]+\b/g);
                _tab.push(fieldElements);
              }
            }
          }
          _e["data"] = _tab;
          out[labels.vtab][_key] = _e;
          break;
        case labels.axis_pts:
          for (let line of _contentLines){
            line = $.trim(line);
            if (line){
              i += 1;
              if (i == 0) _key = line;
              else if (i == 1) _e["description"] = line;
              else if (i == 2) _e["address"] = line;
              else if (i == 3) _e["input"] = line;
              else if (i == 4) _e["recordLayout"] = line;
              else if (i == 5) _e["maxDiff"] = line;
              else if (i == 6) _e["conversion"] = line;
              else if (i == 7) _e["maxPointsQuantity"] = line;
              else if (i == 8) _e["lowerLimit"] = line;
              else if (i == 9) _e["upperLimit"] = line;
              else {
                const fieldElements = line.match(/\b[\S]+\b/g);
                _tab.push(fieldElements);
              }
            }
          }
          _e["data"] = _tab;
          out[labels.axis_pts][_key] = _e;
          break;
        default:
      }
    // End of parsing single element(<a></a>) in _tempHTMLElement
    });
    return out;
  }
// ============= sub functions =====================
  function replacer1(match, p1, p2, p3, offset, string){
    return '<ul><li><a style="cursor:pointer;" _content="' + escape(p3) + '" >'+p2+'</a></li>';}
  function replacer2(match, p1, offset, string){
    let k = p1.indexOf('</li>')
    if (k == -1){
      return '/ul><p class="css-p-hidden">' + p1 + '</p>';}
    else{
      return '/ul><p class="css-p-hidden">' + p1.substring(0, k-1) + '</p></li>';}
  }
  function replacer3(){
    return '</li></ul>';
  }
  function replacer4(match){
    _quoteArray.push(escape(match));
    return _quote;
  }
  function replacer5(match){
    _quoteOrder += 1;
    return _quoteArray[_quoteOrder].replace(/\"/g, "%22"); // escape quote "
  }
// ============ End of sub functions ===============
}

parser = function(files, globalParserBox, showBox=null){

  //=== parameters ===
  //files:
  //globalParserBox:
  //showBox:

  let timeFrom = new Date(); // record when to start parser
  let _main = this;

  for (const file of files){
    let _fileName = file.name;
    if (checkExist(_fileName, globalParserBox)){alert("already exist");}
    else{
      let _extName  = _fileName.split(".")[_fileName.split(".").length-1]
      let _reader   = new FileReader();
      let _result = {}

      _result["fileName"] = _fileName;
      _result["type"] = _extName;
      _result["data"] = {};

      _reader.readAsText(file)

      _reader.onload = function(e){
        let r = e.target.result;
        let _quoteArray = [];
        let _quoteOrder = -1;
        const _escapeQuote = "escapeXXXQuote";
        const _quote = "quoteXYZquote";
        // if it's a2l...
        if(_extName.toUpperCase() == "A2L"){
          let _hiddenBox = $("div#id-div-parser .css-div-hidden:first");
          _result["data"] = {
            IF_DATA: [],
            FUNCTION: [],
            CHAR: [],
            MEAS: [],
            COMPU_METHOD: {},
            COMPU_TAB: {},
            COMPU_VTAB: {},
            RECORD_LAYOUT: {},
            AXIS_PTS: {}
          };
          const labels = {
            char: "CHAR",
            meas: "MEAS",
            method: "COMPU_METHOD",
            tab: "COMPU_TAB",
            vtab: "COMPU_VTAB",
            layout: "RECORD_LAYOUT",
            axis_pts: "AXIS_PTS"
          }
          r = r.replace(/\/\*[\s\S]+?\*\//g,'') // delete /* comment */
               .replace(/\\\"/g, _escapeQuote) // replace \" with _escapeQuote
               .replace(/\"[\s\S]*?\"/g, replacer4) // replace "..." with _quote
               .replace(/(\/begin)\s+([\S]+)\s+(((?!\/end|\/begin)([\s\S]*?))*)\s?([\s\S]*?(?=\/begin|\/end))/g, replacer1) // replace begin
               .replace(/\/end\s+[\w\_]+\b/g,replacer3) // replace end
               .replace(/(?:\/ul>)((?!(\<li\>))([\s\S])*?)(?=\<ul\>|\<\/ul\>)/g,replacer2) // find out the content out of the child label in a parent label, then hide it
               .replace(/(?:\/end)\s+[\w\_]+\b/g, replacer3) // replace end
               .replace('<ul>','<ul id="tree_ul">') // replace first ul tag
               .replace(eval("/"+_quote+"/g"), replacer5)
               .replace(eval("/"+_escapeQuote+"/g"), "\\\"");
          _hiddenBox.html(r);
          _hiddenBox.find("a").each(function(){
            let _e = {};

            let _content = unescape($(this).attr("_content"));
            let _contentLines = _content.split(/\n/);
            let i = -1; // noBlank line count
            let _subBlocks;
            let _key;
            let _tab = [];
            //you need a dict obj to store the whole data
            switch ($(this).html().toUpperCase()) {
              case "CHARACTERISTIC":
                _e["type"] = "CHARACTERISTIC";

                // 1. read attributes in the main block
                for (let line of _contentLines){
                  // maye be blank line
                  line = $.trim(line);
                  if (line){
                    i += 1;

                    if (i == 0)      _e["name"]         = line
                    else if (i == 1) _e["description"]  = line
                    else if (i == 2) _e["valueType"]    = line
                    else if (i == 3) _e["address"]      = line
                    else if (i == 4) _e["recordLayout"] = line
                    else if (i == 5) _e["maxDiff"]      = line
                    else if (i == 6) _e["conversion"]   = line
                    else if (i == 7) _e["lowerLimit"]   = line
                    else if (i == 8) _e["upperLimit"]   = line
                    else{
                      //sometimes...
                      //READ_ONLY
                      const _spacePosition = line.indexOf(" ");
                      if (_spacePosition == -1) _e[line.toLowerCase()] = line;
                      else{
                        const _key = line.substring(0, _spacePosition).toLowerCase();
                        _e[_key] = line.substring(_spacePosition+1);
                      }
                    }
                  }
                }

                // 2. read subblock such as AXIS_DESCR
                _subBlocks = $(this).parent().siblings("ul").find("a");
                if (_subBlocks.length > 0){
                  _e["subs"] = [];
                  for (const _b of _subBlocks){
                    const _$ = $(_b);
                    const _subBlockType = _$.text().toUpperCase();
                    if (_subBlockType == "AXIS_DESCR"){
                      const _subBlockContentLines = unescape(_$.attr("_content")).split(/\n/);
                      let _subBlockLineCounter = -1;
                      let _subBlockDict = {"type":_subBlockType};
                      _e["subs"].push(_subBlockDict);

                      for (let line of _subBlockContentLines){
                        line = $.trim(line);
                        if (line){
                          _subBlockLineCounter += 1;

                          if (_subBlockLineCounter == 0) _subBlockDict["axisType"] = line;
                          else if (_subBlockLineCounter == 1) {
                            _subBlockDict["inut"] = line;
                          }
                          else if (_subBlockLineCounter == 2) {
                            _subBlockDict["conversion"] = line;
                          }
                          else if (_subBlockLineCounter == 3) {
                            _subBlockDict["maxPointsQuantity"] = line;
                          }
                          else if (_subBlockLineCounter == 4) {
                            _subBlockDict["lowerLimit"] = line;
                          }
                          else if (_subBlockLineCounter == 5) {
                            _subBlockDict["upperLimit"] = line;
                          }
                          else{
                            const _spacePosition = line.indexOf(" ");
                            if (_spacePosition == -1) _subBlockDict[line.toLowerCase()] = line;
                            else{
                              const _key = line.substring(0, _spacePosition).toLowerCase();
                              _subBlockDict[_key] = line.substring(_spacePosition+1);
                            }
                          }
                        }
                      }
                    }
                  }
                } // === read sub blocks ===

                _result["data"]["CHAR"].push(_e);
                break;
              case "MEASUREMENT":
                _e["type"] = "MEASUREMENT";

                for (let line of _contentLines){
                  line = $.trim(line);
                  if (line){
                    i += 1;

                    if (i == 0) _e["name"] = line;
                    else if (i == 1) _e["description"] = line;
                    else if (i == 2) _e["valueType"]   = line;
                    else if (i == 3) _e["conversion"]  = line;
                    else if (i == 4) _e["resolution"]  = line;
                    else if (i == 5) _e["accuracy"]    = line;
                    else if (i == 6) _e["lowerLimit"]  = line;
                    else if (i == 7) _e["upperLimit"]  = line;
                    else{
                      const _spacePosition = line.indexOf(" ");
                      if (_spacePosition == -1) _e[line.toLowerCase()] = line;
                      else{
                        const _key = line.substring(0, _spacePosition).toLowerCase();
                        _e[_key] = line.substring(_spacePosition+1);
                      }
                    }
                  }
                }
                _result["data"]["MEAS"].push(_e);
                break;
              case "FUNCTION":
                _e["type"] = "FUNCTION";

                for (let line of _contentLines){
                  line = $.trim(line);
                  if (line){
                    i += 1;

                    if (i == 0) _e["name"] = line;
                    else if (i == 1) _e["description"] = line;
                    else{
                      const _spacePosition = line.indexOf(" ");
                      if (_spacePosition == -1) _e[line.toLowerCase()] = line;
                      else{
                        const _key = line.substring(0, _spacePosition).toLowerCase();
                        _e[_key] = line.substring(_spacePosition+1);
                      }
                    }
                  }
                }
                // 2. read subblock such as DEF_CHARACTERISTIC
                _subBlocks = $(this).parent().siblings("ul").find("a");
                if (_subBlocks.length > 0){
                  _e["subs"] = {};
                  for (const _b of _subBlocks){
                    const _$ = $(_b);
                    const _subBlockType = _$.text().toUpperCase();
                    //if (_subBlockType == "DEF_CHARACTERISTIC"){
                    if (true){ // no need to judge
                      const _subBlockContentLines = unescape(_$.attr("_content")).split(/\n/);
                      let _subBlockLineCounter = -1;
                      _e["subs"][_subBlockType] = [];

                      for (let line of _subBlockContentLines){
                        line = $.trim(line);
                        if (line){
                          _subBlockLineCounter += 1;
                          _e["subs"][_subBlockType] = _e["subs"][_subBlockType].concat(line.split(/\s/));
                        }
                      }
                    }
                  }
                }//=== read sub blocks ===
                _result["data"]["FUNCTION"].push(_e);
                break;
              case "RECORD_LAYOUT":
                for (let line of _contentLines){
                  line = $.trim(line);
                  if (line){
                    i += 1;
                    if (i == 0){
                      _key = line;
                    }
                    else{
                      const fieldElements = line.match(/\b[\S]+\b/g);
                      _e[fieldElements[0]] = fieldElements;
                    }
                  }
                }
                _result["data"]["RECORD_LAYOUT"][_key] = _e;
                break;
              case labels.method:
                for (let line of _contentLines){
                  line = $.trim(line);
                  if (line){
                    i += 1;
                    if (i == 0) _key = line;
                    else if (i == 1) _e["description"] = line;
                    else if (i == 2) _e["conversionType"] = line;
                    else if (i == 3) _e["format"] = line;
                    else if (i == 4) _e["unit"] = line;
                    else {
                      const fieldElements = line.match(/\b[\S]+\b/g);
                      _e[fieldElements[0]] = fieldElements.slice(1, fieldElements.length);
                    }
                  }
                }
                _result["data"][labels.method][_key] = _e;
                break;
              case labels.tab:
                for (let line of _contentLines){
                  line = $.trim(line);
                  if (line){
                    i += 1;
                    if (i == 0) _key = line;
                    else if (i == 1) _e["description"] = line;
                    else if (i == 2) _e["conversion"] = line;
                    else if (i == 3) _e["count"] = parseInt(line);
                    else {
                      const fieldElements = line.match(/\b[\S]+\b/g);
                      _tab.push(fieldElements);
                    }
                  }
                }
                _e["data"] = _tab;
                _result["data"][labels.tab][_key] = _e;
                break;
              case labels.vtab:
                for (let line of _contentLines){
                  line = $.trim(line);
                  if (line){
                    i += 1;
                    if (i == 0) _key = line;
                    else if (i == 1) _e["description"] = line;
                    else if (i == 2) _e["conversion"] = line;
                    else if (i == 3) _e["count"] = parseInt(line);
                    else {
                      const fieldElements = line.match(/\b[\S]+\b/g);
                      _tab.push(fieldElements);
                    }
                  }
                }
                _e["data"] = _tab;
                _result["data"][labels.vtab][_key] = _e;
                break;
              case labels.axis_pts:
                for (let line of _contentLines){
                  line = $.trim(line);
                  if (line){
                    i += 1;
                    if (i == 0) _key = line;
                    else if (i == 1) _e["description"] = line;
                    else if (i == 2) _e["address"] = line;

                    else if (i == 2) _e["conversion"] = line;
                    else if (i == 3) _e["count"] = parseInt(line);
                    else {
                      const fieldElements = line.match(/\b[\S]+\b/g);
                      _tab.push(fieldElements);
                    }
                  }
                }
                _e["data"] = _tab;
                _result["data"][labels.axis_pts][_key] = _e;
                break;
              default:
            }
          });
        }
        else if(_extName.toUpperCase() == "HEX"){
          let _lines = r.split(/\n/)
          _result["data"] = _lines;

          _result.rowOf = function(exp){
            //scan lines to find exp
            for (const [_i, _e] of _lines.entries()){
              if (_e.match(exp)) return {row:_i, data:_e}
            }

            // not exit
            return null;
          }
        }
        globalParserBox.push(_result)
        parseComplete(_fileName, _extName, showBox)

        function replacer1(match, p1, p2, p3, offset, string){
      		return '<ul><li><a style="cursor:pointer;" _content="' + escape(p3) + '" >'+p2+'</a></li>';}

        function replacer2(match, p1, offset, string){
      		let k = p1.indexOf('</li>')
      		if (k == -1){
            return '/ul><p class="css-p-hidden">' + p1 + '</p>';}
      		else{
            return '/ul><p class="css-p-hidden">' + p1.substring(0, k-1) + '</p></li>';}
      	}
        function replacer3(){
          return '</li></ul>';
        }
        function replacer4(match){
          _quoteArray.push(escape(match));
          return _quote;
        }
        function replacer5(match){
          _quoteOrder += 1;
          return _quoteArray[_quoteOrder].replace(/\"/g, "%22"); // escape quote "
        }
      }
    }
  }

  function checkExist(fileName, parser){
    for (const file of parser){
      if (fileName == file.fileName){
        return true;
      }
    }
    return false;
  }
  function parseComplete(fileName, extName, showBox){
    let _itemStr = "";
    const _template = "<a draggable='true' class='list-group-item'><i class='$iconCSS$'></i>$fileName$</a>"
    if (extName.toUpperCase() == "A2L"){
      _itemStr = _template.replace("$iconCSS$", "icon-file").replace("$fileName$", fileName)
    }
    else{
      _itemStr = _template.replace("$iconCSS$", "icon-h-sign").replace("$fileName$", fileName)
    }
    showBox.append(_itemStr);
  }
}


function goblinsCalculatorSearchCharByRegExp(
  a2l,
  hex,
  charRegExp
  ){
  const runtimeStart = performance.now();
  let out       = {};
  let _charNeed = [];
  let _addrInfo = [];

  const _charAll = a2l["data"]["CHAR"];
  const _recordLayoutAll = a2l["data"]["RECORD_LAYOUT"];
  const _conversionAll= a2l["data"]["COMPU_METHOD"];
  const _tabAll= a2l["data"]["COMPU_TAB"];
  const _vtabAll= a2l["data"]["COMPU_VTAB"];
  const _axisPtsAll = a2l["data"]["AXIS_PTS"];

  if (charRegExp) {
    for (let _char of _charAll){
      if (_char.name.match(charRegExp)) _charNeed.push(_char);
    }
  }
  else _charNeed = _charAll;

  out["CHARFound"] = _charNeed;

  if (a2l && hex){
    // group the CHAR by ext
    if (_charNeed.length > 0){
      for (const [_i, _char] of _charNeed.entries()){
        //out["CHARGroupByExt"] = _addr
        //out["CHARGroupByExt"][0] = {}, members as following:
        //ext: extension address
        //CHARID: the order of CHAR in the out["CHARFound"]

        //get address
        const _addr = _char.address;
        const _valueType = _char.valueType.toUpperCase();
        //32bit address, 0xAAAABBBB
        if (_addr.length == 10){
          let _high = parseInt("0x"+_addr.substr(2,4))
          //_addrInfo empty
          const _len = _addrInfo.length;
          if (_len == 0){
            _addrInfo.push({ext:_high, CHARID:[_i]})
          }
          else{
            let _flagInGroup = false;
            for(let i=0; i<_len; i++){
              //ext address exist, update baseMax & baseMin
              if ( _high == _addrInfo[i].ext){
                //add this CHAR's index into the CHARID array
                _addrInfo[i].CHARID.push(_i);
                _flagInGroup = true;
                break;
              }
            }

            if (!_flagInGroup) _addrInfo.push({ext:_high, CHARID:[_i]});
          }

          // ====================== Attach conversionType ============================= //
          // TAB_INTP: table with interpolation
          // TAB_NOINTP: table without interpolation
          // TAB_VERB: verbal conversion table
          // RAT_FUNC: fractional rational function = (axx+bx+c)/(dxx+ex+f)
          // FORM: formula as specified in the Formula property
          addConversionInfo({obj: _char,});

          if (_char["subs"]){
            _char["layoutDetailAxis"] = [];
            for (const [i, sub] of _char["subs"].entries()){
              addConversionInfo({obj:sub});
              if (sub["axis_pts_ref"]){
                sub["recordLayout"] = _axisPtsAll[sub["axis_pts_ref"]]["recordLayout"];
                _char["layoutDetailAxis"].push(_recordLayoutAll[sub["recordLayout"]]);
              }
            }
          }
          // ================ End of attach conversionType ============================ //


          // ================ Attach recordLayout information ========================= //
          // KlAxU8SstxU16WU16
          // NO_AXIS_PTS_X 1 SWORD
          // AXIS_PTS_X    2 SWORD INDEX_INCR DIRECT
          // FNC_VALUES    3 SWORD COLUMN_DIR DIRECT
          // =====================================================================
          // Axis_Xs16
          // NO_AXIS_PTS_X     1 SWORD
          // AXIS_PTS_X        2 SWORD INDEX_INCR DIRECT
          // =====================================================================
          // Cur_Xs16Ws16
          // NO_AXIS_PTS_X     1 SWORD
          // AXIS_PTS_X        2 SWORD INDEX_INCR DIRECT
          // FNC_VALUES        3 SWORD COLUMN_DIR DIRECT
          // =====================================================================
          // KfAxSwAySwSstxSwSstySwWSw
          // NO_AXIS_PTS_X     1 SWORD
          // NO_AXIS_PTS_Y     2 SWORD
          // AXIS_PTS_X        3 SWORD INDEX_INCR DIRECT
          // AXIS_PTS_Y        4 SWORD INDEX_INCR DIRECT
          // FNC_VALUES        5 SWORD COLUMN_DIR DIRECT

          const _layout = _recordLayoutAll[_char["recordLayout"]]; // layout in main Block
          let _tempAllLayout = [_layout];

          if (_char["layoutDetailAxis"]){
            _tempAllLayout = _tempAllLayout.concat(_char["layoutDetailAxis"])
          }

          _char["bytes"] = {};
          _char["layoutDetail"] = {};

          for (const i of _tempAllLayout){
            for (const layoutItem in i){
              if (i[layoutItem][2].match("UBYTE")){
                _char["layoutDetail"][i[layoutItem][0]] = {dataType:"UBYTE", bytes:1, signed:false}; //8 bit
              }
              else if (i[layoutItem][2].match("SBYTE")) {
                _char["layoutDetail"][i[layoutItem][0]] = {dataType:"SBYTE", bytes:1, signed:true}; // 8 bit
              }
              else if (i[layoutItem][2].match("UWORD")){
                _char["layoutDetail"][i[layoutItem][0]] = {dataType:"UWORD", bytes:2, signed:false}; // 16 bit
              }
              else if (i[layoutItem][2].match("SWORD")){
                _char["layoutDetail"][i[layoutItem][0]] = {dataType:"SWORD", bytes:2, signed:true}; // 16 bit
              }
              else if (i[layoutItem][2].match("ULONG")){
                _char["layoutDetail"][i[layoutItem][0]] = {dataType:"ULONG", bytes:4, signed:false}; // 32 bit
              }
              else if (i[layoutItem][2].match("SLONG")){
                _char["layoutDetail"][i[layoutItem][0]] = {dataType:"SLONG", bytes:4, signed:true}; // 32 bit
              }
              else if (i[layoutItem][2].match("A_UINT64")){
                _char["layoutDetail"][i[layoutItem][0]] = {dataType:"A_UINT64", bytes:8, signed:false}; // 64 bit
              }
              else if (i[layoutItem][2].match("A_INT64")){
                _char["layoutDetail"][i[layoutItem][0]] = {dataType:"A_INT64", bytes:8, signed:true}; // 64 bit
              }
              else if (i[layoutItem][2].match("FLOAT32_IEEE")){
                _char["layoutDetail"][i[layoutItem][0]] = {dataType:"FLOAT32_IEEE", bytes:4, signed:true}; // 32 bit
              }
              else if (i[layoutItem][2].match("FLOAT64_IEEE")){
                _char["layoutDetail"][i[layoutItem][0]] = {dataType:"FLOAT64_IEEE", bytes:8, signed:true}; // 64 bit
              }
            }
          }
          // ============== End of attach recordLayout information ==================== //
        }
      }
    }
    out["CHARGroupByExt"] = _addrInfo;

    // =========== according to _addrInfo, read the data from hex =============== //
    // =================== CHARID =======================
    // data: "1020040..."
    // ext: 32772 => 0x8004
    // extFromRow: 7688 => row order in hex file
    // extToRow: 9736 => row order in hex file
    for (let _group of _addrInfo){
      const _ext = _group.ext.toString(16);
      const _offset = ":AABBBBCC".length;
      let _extFromRow, _extToRow, _flagFindExt=false, _biter="";

      //scan the hex and get the extension address data
      for (let [_i, _row] of hex["data"].entries()){
        if (_flagFindExt){
          if(_row.substr(7, 2) == "00"){
            _biter += _row.substring(_offset, _row.length-3);}
          else{
            _extToRow = _i-1;
            break;}
        }

        //search for the extention address row
        //have to put at the end in order to work in next loop
        if (_row.match(":02000004"+_ext)){
          _extFromRow = _i;
          _flagFindExt = true;
        }
      }
      _group["data"]       = _biter;
      _group["extFromRow"] = _extFromRow;
      _group["extToRow"]   = _extToRow;
    }
    // =============== End of read the data from hex ============================ //

    // =========== according to the _biter, find the value of the address ======= //
    for (const _group of _addrInfo){
      for (const _CHARID of _group.CHARID){
        sub_readAndAttachChar(_charNeed[_CHARID], _group["data"]);
      }
    }
    // ========== End of find the value at the specified address ================ //
    const runtimeEnd = performance.now();
    console.log(runtimeEnd - runtimeStart);
    return out;
    // ======================= End of main code ================================= //

  }

  ////////////////////////////////////////////////////////////////////////////////
  ////////////////////////////////////////////////////////////////////////////////
  ////////////////////////////////////////////////////////////////////////////////

  // ============================ subfunction ================================= //
  // === convert value to physical value
  function convert(rawData, char){
    const type = char["conversionType"];

    let params;
    switch (type) {
      case "RAT_FUNC":
        // raw = (a*phy^2+b*phy+c)/(d*phy^2+e*phy+f)
        params = char["conversionCOEFFS"];
        const aMinusdg = params[0] - params[3]*rawData;
        if (aMinusdg == 0){
          const numerator = params[5]*rawData - params[2];
          const denominator = params[1] - params[4]*rawData;
          return numerator/denominator;
        }
        else return null;
        //const b2Minus4ac = Math.pow(params[1]-params[4]*rawData, 2)-4*(params[0]-params[3]*rawData)*(params[2]-params[5]*rawData);
      case "TAB_VERB":
        params = char["conversionVTabRef"]["data"];
        for (const item of params){
          if (item[0] == rawData) return item[1];
        }
      case "TAB_INTP":
        params = char["conversionTabRef"]["data"];
        for (const item of params){
          if (item[0] == rawData){
            return item[1];
          }
        }
        return null;
      case "TAB_NOINTP":
        params = char["conversionTabRef"]["data"];
        for (const item of params){
          if (item[0] == rawData){
            return parseFloat(item[1]);
          }
        }
        return null;
      default:
        return null;
    }
  }

  // === find conversion info of obj
  // === and add these to obj's properties
  // === conversionDict = COMPU_METHOD
  // === obj can be CHARACTERISTIC or AXIS_DESCR
  function addConversionInfo({
    obj,
    conversionDict = _conversionAll, // COMPU_METHOD
    tabDict        = _tabAll,        // COMPU_TAB
    vtabDict       = _vtabAll        // COMPU_VTAB
  }){
    if (obj["conversion"]){

      const myConversion = conversionDict[obj["conversion"]];
      obj["conversionType"] = myConversion["conversionType"];

      if (myConversion["conversionType"] === "TAB_VERB"){
        obj["conversionVTabRef"] = vtabDict[myConversion["COMPU_TAB_REF"][0]];
      }
      else if (myConversion["conversionType"] === "RAT_FUNC"){
        obj["conversionCOEFFS"] = myConversion["COEFFS"];
        obj["conversionFormat"] = myConversion["format"];
      }
      else if (myConversion["conversionType"] === "TAB_INTP" || myConversion["conversionType"] === "TAB_NOINTP"){
        obj["conversionTabRef"] = tabDict[myConversion["COMPU_TAB_REF"][0]];
      }
    }
  }

  // === littleEndian: true
  // === 0xABCD => 0xCDAB
  // === 0xABCDEFGH => 0x GHEFCDAB
  // === datumLen = 1/2/4
  function hexDatumStrToInt({
    str="",
    signed=false,
    littleEndian=true,
    hexRaw=false
  }){
    if (littleEndian){
      if (str.length % 2 === 0){
        let out = 0;
        let rawStr = "";

        for (let i=0; i<str.length/2; i++){rawStr = str.substr(i*2, 2) + rawStr;}
        rawStr = "0x" + rawStr.toUpperCase();

        // example:raw "0xABCD"
        if (hexRaw) return rawStr;

        for (let i=0; i<str.length/2; i++){out += (parseInt("0x"+str.substr(i*2, 2))) * (0x01 << (i*8));}



        if (signed && (out.toString(2).length == str.length*4)){
          // negative
          return out - (0x01 << (str.length*4));
        }

        return out;
      }
      else return null;
    }
  }

  // === read CHARACTERISTIC-CURVE value ===
  // === char: dealed CHARACTERISTIC Object
  // === hexDB: pure hex data at right extension address
  function sub_readAndAttachChar(char, hexDB){
    let _out_rawDataArray = [];
    let _out_phyDataArray = [];
    let offset, offsetX, offsetY, offsetZ;
    let _strX = "", _strY = "", _strZ = "";
    let _rawX = "", _rawY = "", _rawZ = "";
    let _x = 0, _y = 0, _z;

    const _valueType                 = char["valueType"];
    const _number                    = parseInt(char["number"]);
    const _baseAddr                  = parseInt("0x"+char["address"].substr(6, 4))*2;
    const _byteNumOfZVal             = char["layoutDetail"]["FNC_VALUES"]["bytes"];
    const _signedZ                   = char["layoutDetail"]["FNC_VALUES"]["signed"];
    const _conversionType            = char["conversionType"];

    // === validate the points quantity, the number of quantity must not be negative
    if(_valueType == "VALUE" || _valueType == "VAL_BLK"){
      const _realNum = (_valueType == "VALUE")? 1 : _number;
      let offset = 0;

      for (let i=0; i<_realNum; i++){
        offset = i * _byteNumOfZVal*2;

        _strZ = hexDB.substr(_baseAddr + offset, _byteNumOfZVal*2);

        _rawZ = hexDatumStrToInt({str:_strZ, signed:false, hexRaw:true});

        _z = hexDatumStrToInt({str:_strZ, signed:_signedZ});

        _z = convert(_z, char);

        _out_rawDataArray.push(_rawZ);
        _out_phyDataArray.push(_z);
      }
    }
    else if (_valueType == "CURVE"){

      const _byteNumOfAxisXPtsQuantity = char["layoutDetail"]["NO_AXIS_PTS_X"] ? char["layoutDetail"]["NO_AXIS_PTS_X"]["bytes"] : _byteNumOfZVal;
      const _byteNumOfAxisXVal         = char["layoutDetail"]["AXIS_PTS_X"] ? char["layoutDetail"]["AXIS_PTS_X"]["bytes"] : _byteNumOfZVal;
      const _realPointsNum = hexDatumStrToInt({str:hexDB.substr(_baseAddr, _byteNumOfAxisXPtsQuantity*2), signed:false});
      const _maxPointsNum  = parseInt(char["subs"][0]["maxPointsQuantity"]);
      const _signedX       = char["layoutDetail"]["AXIS_PTS_X"] ? char["layoutDetail"]["AXIS_PTS_X"]["signed"] : _signedZ;
      if (_realPointsNum <= _maxPointsNum){
        for (let i=0; i<_realPointsNum; i++){
          offsetX = (_byteNumOfAxisXPtsQuantity + i * _byteNumOfAxisXVal)*2;
          offsetZ = (_byteNumOfAxisXPtsQuantity + _realPointsNum * _byteNumOfAxisXVal + i * _byteNumOfZVal)*2;

          _strX = hexDB.substr(_baseAddr + offsetX, _byteNumOfAxisXVal*2);
          _strZ = hexDB.substr(_baseAddr + offsetZ, _byteNumOfZVal*2);

          _rawX = hexDatumStrToInt({str:_strX, signed:false, hexRaw:true});
          _rawZ = hexDatumStrToInt({str:_strZ, signed:false, hexRaw:true});

          _x = hexDatumStrToInt({str:_strX, signed:_signedX});
          _z = hexDatumStrToInt({str:_strZ, signed:_signedZ});

          _x = convert(_x, char["subs"][0]);
          _z = convert(_z, char);

          _out_rawDataArray.push({x:_rawX, z:_rawZ});
          _out_phyDataArray.push({x:_x, z:_z});
        }
      }
    }
    else if (_valueType == "MAP"){

      const _byteNumOfAxisXPtsQuantity = char["layoutDetail"]["NO_AXIS_PTS_X"] ? char["layoutDetail"]["NO_AXIS_PTS_X"]["bytes"] : _byteNumOfZVal;
      const _byteNumOfAxisXVal         = char["layoutDetail"]["AXIS_PTS_X"] ? char["layoutDetail"]["AXIS_PTS_X"]["bytes"] : _byteNumOfZVal;
      const _byteNumOfAxisYPtsQuantity = char["layoutDetail"]["NO_AXIS_PTS_Y"] ? char["layoutDetail"]["NO_AXIS_PTS_Y"]["bytes"] : _byteNumOfAxisXPtsQuantity;
      const _byteNumOfAxisYVal         = char["layoutDetail"]["AXIS_PTS_Y"] ? char["layoutDetail"]["AXIS_PTS_Y"]["bytes"] : _byteNumOfAxisXVal;
      const _realNumOfPtsX = hexDatumStrToInt({str:hexDB.substr(_baseAddr, _byteNumOfAxisXPtsQuantity*2), signed:false});
      const _realNumOfPtsY = hexDatumStrToInt({str:hexDB.substr(_baseAddr + _byteNumOfAxisXPtsQuantity*2, _byteNumOfAxisYPtsQuantity*2), signed:false});
      const _maxPtsNumOfX  = parseInt(char["subs"][0]["maxPointsQuantity"]);
      const _maxPtsNumOfY  = parseInt(char["subs"][1]["maxPointsQuantity"]);
      const _signedX       = char["layoutDetail"]["AXIS_PTS_X"] ? char["layoutDetail"]["AXIS_PTS_X"]["signed"] : _signedZ;
      const _signedY       = char["layoutDetail"]["AXIS_PTS_Y"] ? char["layoutDetail"]["AXIS_PTS_Y"]["signed"] : _signedX;

      let _arrayX = [], _arrayY = [], _arrayZ = [], _map = {};
      let _arrayRawX = [], _arrayRawY = [], _arrayRawZ = [], _mapRaw = {};


      if ((_realNumOfPtsX <= _maxPtsNumOfX) && (_realNumOfPtsY <= _maxPtsNumOfY)){

        for (let i=0; i<_realNumOfPtsX; i++){
          offsetX = offset + (i * _byteNumOfAxisXVal)*2;
          _strX = hexDB.substr(_baseAddr + offsetX, _byteNumOfAxisXVal*2);
          _rawX = hexDatumStrToInt({str:_strX, signed:false, hexRaw:true});
          _x    = hexDatumStrToInt({str:_strX, signed:_signedX});
          _x    = convert(_x, char["subs"][0]);
          _arrayX.push(_x);
          _arrayRawX.push(_rawX);
        }

        for (let i=0; i<_realNumOfPtsY; i++){
          offsetY = offset + (_realNumOfPtsX * _byteNumOfAxisXVal + i * _byteNumOfAxisYVal)*2;
          _strY = hexDB.substr(_baseAddr + offsetY, _byteNumOfAxisYVal*2);
          _rawY = hexDatumStrToInt({str:_strY, signed:false, hexRaw:true});
          _y    = hexDatumStrToInt({str:_strY, signed:_signedY});
          _y    = convert(_y, char["subs"][1]);
          _arrayY.push(_y);
          _arrayRawY.push(_rawY);
        }

        for (let i=0; i<_realNumOfPtsX; i++){

          let _temp = [], _tempRaw =[];
          _arrayZ.push([_arrayX[i], _temp]);
          _arrayRawZ.push([_arrayRawX[i], _tempRaw]);

          _temp = {};
          _tempRaw = {};

          if (!_map[_arrayX[i]]) {
            _map[_arrayX[i]] = {};
            _mapRaw[_arrayRawX[i]] = {};
          }


          for (let j=0; j<_realNumOfPtsY; j++){
            offsetZ = offset + (_realNumOfPtsX * _byteNumOfAxisXVal + _realNumOfPtsY * _byteNumOfAxisYVal + i*_realNumOfPtsY*_byteNumOfZVal + j)*2;
            _strZ = hexDB.substr(_baseAddr + offsetZ, _byteNumOfZVal*2);
            _rawZ = hexDatumStrToInt({str:_strZ, signed:false, hexRaw:true});
            _z    = hexDatumStrToInt({str:_strZ, signed:_signedZ});
            _z    = convert(_z, char);
            _temp.push([_arrayY[j], _z]);
            _tempRaw.push([_arrayRawY[j], _rawZ]);

            _map[_arrayX[i]][_arrayY[j]] = _z;
            _mapRaw[_arrayRawX[i]][_arrayRawY[j]] = _rawZ;
          }
        }
        _out_rawDataArray = _mapRaw;
        _out_phyDataArray = _map;
      }
      else{
        char["rawDataArray"] = null;
        char["phyDataArray"] = null;
        return null;
      }
    }

    char["rawDataArray"] = _out_rawDataArray; // attach result
    char["phyDataArray"] = _out_phyDataArray; // attach result
    // read and attach end
  }
}

function ASAMFileReader(buffer, fileType){
  if (fileType.toUpperCase() == "A2L"){
    var out = {
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

    var r = buffer;
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

// ===============================================================================
// |                                     CSV                                     |
// ===============================================================================
/**
 * 
 * @param {*} input csv Array Input
 * @param {*} separator seprator
 */      

 buildTableWithCsv = (input, separator) => {
  hide(json);
  var tableArea = getElement("csvContainer");
  var allRows = input.split(/\r?\n|\r/).filter((row) => row !== "");
  
  var old = getElement("tablewrapper");
  if (old) tableArea.removeChild (old);
  
  var _wrapper = document.createElement("div");
  _wrapper.setAttribute("id", "tablewrapper");
  _wrapper.classList.add("table-wrapper");

  var _table = document.createElement("table");
  _table.setAttribute("id", "csv");
  _table.classList.add("fl-table");

  for (var singleRow = 0; singleRow < allRows.length; singleRow++) {
    _tr = document.createElement(singleRow === 0 ? "thead" : "tr"); 
    const rowCells = allRows[singleRow].split(separator);
    for(var rowCell = 0; rowCell < rowCells.length; rowCell++){
      const _td = document.createElement(singleRow === 0 ? "th" : "td");
      const text = document.createTextNode(rowCells[rowCell].replace(/\"/g, ""));
      _td.appendChild(text);
      _tr.appendChild(_td);
    }
    _table.appendChild(_tr);
  }
  
  wait(false);
  
  _wrapper.appendChild(_table);

  tableArea.appendChild(_wrapper);
  tableArea.classList.add("scrolling");
};
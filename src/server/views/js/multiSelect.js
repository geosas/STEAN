// ===============================================================================
// |                                multiSelect                                  |
// ===============================================================================


const createListWithoutOptions = (inputList) => inputList.split("</option>").join('').split("<option>").filter(e => e != "");



// ===============================================================================
// |                                   POPULATE                                  |
// ===============================================================================

// populate Select

  /**
   * 
   * @param {*} obj object to fill
   * @param {*} list list of items
   * @param {*} defValue default value
   * @param {*} addNone add none at list of th list
   */
  function populateSelect(obj, list, defValue, addNone) {
    while (obj.firstChild) {
      obj.removeChild(obj.lastChild);
    }
    obj.options.length = 0;
    if (list) {
      const uniklist = [...new Set(list)];
      if (addNone) uniklist.unshift("none");
      uniklist.forEach((element) => {
        obj.add(new Option(element));
      });    

      obj.selectedIndex = uniklist.indexOf(defValue);
    }
  };

    /**
   * 
   * @param {*} obj object to fill
   * @param {*} event event
   * @param {*} key name of the key
   */
  function clearMultiSelect(obj, event, key) {   
    obj = getElement(obj);
    if(!obj) return;
    const value = event.target.innerHTML;
    const cleanList = createListWithoutOptions(obj.innerHTML);
    const result = cleanList.map((e, i) => i == 0 ? `${value === "X" ? `${_NONE} ${_SELECTED}` : `${_ALL} ${_SELECTED}`}` : `${value === "X" ? "" : value} ${e[1] === _SPACE ? e.split(_SPACE)[1] : e}`.trim());
    obj.innerHTML = result.map(e => `<option>${e}</option>`).join('');
    obj.value = result[0];
    if (value === "X") deleteOption(key); else options.value =  createOptionsLine();
  };

    /**
   * 
   * @param {*} obj object to fill
   * @param {*} list list of items
   * @param {*} defValue default value
   * @param {*} mode "all or none"
   * @param {*} orderby orderby mode
   */
  function populateMultiSelect(obj, list, defValue, mode, orderby) {
    obj = getElement(obj);

    while (obj.firstChild) {
      obj.removeChild(obj.lastChild);
    }
    obj.options.length = 0;
    const mark = orderby ? _UP : _CHECK;

    if (list) {
      const uniklist = [...new Set(mode === _ALL ? list.map(e => `${mark} ${e}`) : list)];
      if (mode === _ALL || mode === _NONE) {
        if (defValue == null) defValue = `${mode} ${_SELECTED}`;
        uniklist.unshift(defValue);
      }
      uniklist.forEach((element) => {
        obj.add(new Option(element));
      });    
      obj.selectedIndex = uniklist.indexOf(defValue);
    }

  };

  function changeMultiSelect(value) {   
    const actual = value.target.value;  
    if (value.target.id === "queryOrderBy") {
      value.target.innerHTML = value.target.innerHTML.replace(actual, `${actual[0] == _DOWN ? _UP : _DOWN} ${actual[1] === _SPACE ? actual.split(_SPACE)[1] : actual}`);
      const cleanList = createListWithoutOptions(value.target.innerHTML);
      const firstOfList = cleanList.shift();    
      const selectedOfList = cleanList.filter(e => [_UP, _DOWN].includes(e[0]));
      const howMany = selectedOfList.length == cleanList.length ? _ALL : selectedOfList.length == 0 ? _NONE : `${selectedOfList.length}`
      value.target.innerHTML = value.target.innerHTML.replace(firstOfList, `${howMany} ${_SELECTED}`);
      value.target.value = `${howMany} ${_SELECTED}`;
      addOption('orderby', selectedOfList.map(e => `${e.split(_SPACE)[1]} ${e[0] == _DOWN ? "desc" : "asc"}`).join(), '0');
    }else {
      value.target.innerHTML = (actual[0] === _CHECK) ? 
      value.target.innerHTML.replace(actual, actual.split(_SPACE)[1])
      : value.target.innerHTML.replace(actual, `✔ ${actual}`);

      const cleanList = createListWithoutOptions(value.target.innerHTML);
      if (cleanList[0] == actual) {
        debug("============================== (cleanList[0] == actual) changeMultiSelect=========================================================");
        debug(cleanList);
        debug(actual);
      } else { 
        const firstOfList = cleanList.shift();
        const selectedOfList = cleanList.filter(e => e[0] === _CHECK);
        const temp = selectedOfList.length == cleanList.length ? _ALL : selectedOfList.length == 0 ? _NONE : `${selectedOfList.length}`
        value.target.innerHTML = value.target.innerHTML.replace(firstOfList, `${temp} ${_SELECTED}`);
        addOption(value.target.name, selectedOfList.map(e => e.split(_CHECK)[1].trim()).join(), '0');

      }
    }
  }

  function getMultiSelect(obj) {
    const element = getElement(obj);
    if(!obj) return [];
    const value = element.value.split(_SPACE)[0];
    if ([_ALL,_NONE].includes(value)) return [];
    const cleanList = element.innerHTML.split("</option>").join('').split("<option>").filter(e => e != "" && e[0] == _CHECK);
    return cleanList.map(e => e.split(_CHECK)[1].trim());
  }

function getMultiSelectOrderBy(obj){
  const element = getElement(obj);
  if(!obj) return [];
  const value = element.value.split(_SPACE)[0];
  if ([_ALL,_NONE].includes(value)) return [];
  const cleanList = createListWithoutOptions(element.innerHTML).filter(e => [_UP, _DOWN].includes(e[0]));
  return cleanList.map(e => `${e.split(_SPACE)[1]} ${e[0] == _DOWN ? "desc" : "asc"}`);
}






function setMultiSelect(obj, listValues) {  
  obj = getElement(obj);
  if(!obj) return;
  const cleanList = createListWithoutOptions(obj.innerHTML);
  const result = cleanList.map(e => `${e[1] === _SPACE ? e.split(_SPACE)[1] : e}`.trim());
  result[0] = `${listValues.length} ${_SELECTED}`;
  obj.innerHTML = result.map(e => `<option>${listValues.includes(e) ? `${_CHECK} ` : ""}${e}</option>`).join('');
  obj.value = result[0];
};












var jsonObj = {};
var jsonViewer = new JSONViewer();
var listOptions = {};
var canGo = false;
var modeDebug = true;
let builder = undefined;
let isDebug = true;
const cardDatas = {};
let dragText = "";



function debug(input) { if (isDebug == true) console.log(input); }

const SubOrNot = () => subentity.value !== _NONE ? subentity.value : entity.value;
const isObservation = () => entity.value == "Observations" || subentity.value == "Observations";
const testNull = (input) => (input.value == "<empty string>" || input.value.trim() == "" || input.value.trim()[0] == "0" || input.value.startsWith(_NONE)); 


document.querySelector("#json").appendChild(jsonViewer.getContainer());

params={};


function wait(on) {
  showHide(spinner, on);
};


// load file json
let importFile = false;

// DON'T REMOVE !!!!
// @start@

// ===============================================================================
// |                                 ERROR DIALOG                                |
// ===============================================================================
var notify =  function (titleMess, bodyMess) {
  wait(false);
      new Error({
        title: titleMess,
        content: bodyMess
    });
};

// ===============================================================================
// |                                 GUI HELPERS                                 |
// ===============================================================================





  function getVersion(input) {
    const splitVersion = (str) =>
      str
        .replace(/[//]+/g, '/')
        .split('/')
        .filter((value) => value.match(/v{1}\d\.\d/g));

    const temp = splitVersion(input);
    return temp[0];
  };

  function hide(obj) {
    obj.style.display = _NONE;
  }

  function show(obj) {
    obj.style.display = "block";
  }

  function showHide(obj, test) {
    obj.style.display = test === true ? "block" : _NONE;
  }

  function EnabledDisabled(obj, test) {
    if (obj.length == undefined) obj = [obj];
    obj.forEach(e => {
      if (test) e.removeAttribute('disabled', ''); 
      else e.setAttribute('disabled', ''); 
    });
  }

  function showOnly(obj) {
    [ 'graphContainer','csvContainer','jsonContainer'].forEach(elem => {
      if (elem === obj) show(getElement(elem));
      else hide(getElement(elem));
    });
  }

  function getIfChecked(objName) {
    const elemId = getElement(objName);
    if (elemId) return (elemId.checked === true);
    return false;
  };

  function getIfId(objName) {
    const index = Number(nb.value);
    return (index > 0);
  };

  function showJson(input) {
    jsonViewer.showJSON(input);
    show(json);
    showOnly('jsonContainer');
    wait(false);
  };
  
  function getDefaultValue(obj, list) {
    return obj.value != "" && list.includes(obj.value) ? obj.value : list[0]; 
  };

  function updateForm() {
    showHide(observationsTab, isObservation());    
    showHide(importTab, params.user.canPost);    
    showHide(logout, params.user.canPost);
    showHide(fileone, params.user.canPost);
    showHide(fileonelabel, params.user.canPost);  
    buttonGoOrSubmit();
    ToggleOption( getIfChecked("splitResultOption") && isObservation(), 'splitResult',splitResultOptionName.value, "");

    let temp = importFile ? ["JSON"]  : ["JSON","CSV","TXT","DATAARRAY"];
    if (isObservation() || resultFormatOption.value == "GRAPH") temp.push("GRAPH");
      populateSelect(resultFormatOption, temp, getDefaultValue(resultFormatOption, temp));
    };



  function refreshAfterEntityOrSubEntity() {
    populateMultiSelect("querySelect", Object.keys(params.columns[SubOrNot()]), null, "all");
    populateMultiSelect("queryOrderBy", Object.keys(params.columns[SubOrNot()]), null, _NONE, true);
    populateMultiSelect("queryExpand", params.relations[SubOrNot()], null, _NONE);
    populateSelect(queryProperty, Object.keys(params.columns[SubOrNot()]), params.property != undefined ? params.property :_NONE, true);

    refresh();
    updateForm();
    updateBuilder();
    canShowQueryButton();
    canShowSplitsElements();
  };

  function updateBuilder() {
    const ent = SubOrNot();
      const fields = [];
      Object.keys(params.columns[ent]).forEach(e => {
        fields.push({
          "value": e,
          "label": e,
          "type": params.columns[ent][e],
        });
      });
     if (builder) builder.clear("query-builder", fields); else builder = new QueryBuilder("query-builder", fields);
  }


// ===============================================================================
// |                                   REFRESH                                   |
// ===============================================================================
  function buttonGoOrSubmit() {
    if (importFile == true) {
      hide(go);
      show(addImport);
      
      const textValue = jsonDatas.last_string_content;

      showHide(submit, textValue.match("columns") != null);

    } else {
      show(go);
      canShowQueryButton();
      hide(submit);
      hide(addImport);
    }
  };

  function canShowQueryButton() {
    EnabledDisabled([go, btnShowLinks], (!testNull(subentity) && testNull(nb)) ? false : true);    
  };

  function canShowSplitsElements() {
    EnabledDisabled([splitResultOption, splitResultOptionName], ((!testNull(subentity) && subentity.value === "Observations") && (!testNull(entity) && entity.value === "MultiDatastreams")));
  }

// ===============================================================================
// |                                  GO Button                                  |
// ===============================================================================


async function editDataClicked(id, params) {
  const name = params.seriesName;
  const when = params.name;
  const myUrl = `${optHost.value}/${optVersion.value}/Observations(${id})`;
  let getEditData = await fetch(myUrl, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });
  const editData = await getEditData.json();

  new Prompt({
        title:  `Editing  ${name}`,
        submitText: "Valid",
        content: `date : ${when}`,
        placeholderText: (typeof editData.result === "object") ? `${editData.result[name]}` : `${editData.result}`,
        onSubmit(component, value) {
            debug(`Value: ${value}`);
        }
    });
}

// ===============================================================================
// |                                 REFRESH                                     |
// ===============================================================================


function refresh() {
  options.value =  createOptionsLine();
  const elemForm = getElement("pro-form");
  const elemId = getElement("debug");
  if (elemId && elemForm) {
    if (elemId.checked === true) {
      if (!elemForm.action.includes("?$debug=true")) elemForm.action = elemForm.action + "?$debug=true";
    } else elemForm.action = elemForm.action.replace("?$debug=true","");
  }
};


// ===============================================================================
// |                                    OPTIONS                                  |
// ===============================================================================

function createOptionsLine() {
  const temp = [];
  for (var key in listOptions) {
    temp.push("$" + key + "=" + listOptions[key]);
  }
  return temp.join("&");
};

function ToggleOption(test, key, value, deleteFalse){
  if (test) addOption(key, value, deleteFalse);
  else delete listOptions[key];
}

var addOption = function(key, value, deleteFalse){
  if ((deleteFalse && value.toUpperCase() === deleteFalse) || !value || value === "" || value === "<empty string>") 
    delete listOptions[key];
   else listOptions[key] = value; 
  options.value =  createOptionsLine();
};

var deleteOption = function(key){
  delete listOptions[key];
  options.value =  createOptionsLine();
};

  function clear() {
    entity.value = _NONE;
    subentity.value = _NONE
    topOption.value = 0;
    skipOption.value = 0;
    nb.value = 0;
    debug.checked = false;
    splitResultOption.checked = false;
    splitResultOptionName.value = "";
    resultFormatOption.value = "JSON";
    method.value = "GET";
  }
function init() {

 
  new SplitterBar(container, first, two);
  clear();
  wait(false);

  tempEntity = Object.keys(params.relations).includes(params.entity) ? params.entity : "Things";
  populateSelect(entity, Object.keys(params.relations), tempEntity);
  populateSelect(subentity, params.relations[entity.value], params.relations[tempEntity].includes(params.subentity) ? params.subentity : _NONE, true);
  populateSelect(method, entity.value == "Loras" ? ["GET","POST"]  : params.methods, params.method ? params.method : "GET");
  populateSelect(logsMethod,  params.methods, params.method ? params.method : "GET");
  populateSelect(selectSeries, ["year", "month", "day"], _NONE, true); 

  
  // hide params
  // history.replaceState({}, null, `${optHost.value}/${optVersion.value}/Query`);
  hide(querySubExpand);
  nb.value = params.id;
  
  
  if (decodeUrlOptions(params.options) == false) {
    onlyValue.checked = params.onlyValue == "true"; 
    
    optVersion.value = params.version;
    optHost.value = params.host;
    
    options.value = params.options;
    if (options.value[0] == "&") options.value = options.value.substring(1);
    if(params.datas) {
      jsonDatas.json_value = params.datas;
    }
  }
  refreshAfterEntityOrSubEntity();
  showOnly('none');
};

function jsonContainerEvent(event) {
  dragText = event.explicitOriginalTarget.innerText;
}


init();

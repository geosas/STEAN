// ===============================================================================
// |                                   EVENTS                                    |
// ===============================================================================


  submit.onclick = () => wait(true);

  preview.onclick = () => {
    try {
      jsonObj = JSON.parse(jsonDatas.last_string_content);
    }
    catch (err) {
      notify("Error", err.message);
    }
    showJson(jsonObj);
  };

  logout.onclick = () => {
    window.location.href = `${optHost.value}/${optVersion.value}/logout`;
  };

  info.onclick = () => {
    window.location.href = `${optHost.value}/${optVersion.value}/status`;
  };

  doc.onclick = () => {
    window.location.href = "https://sensorthings.geosas.fr/apidoc/";
  };

  git.onclick = () => {
    window.location.href = "https://github.com/Mario-35/api-sensorthing";
  };

  btnShowLinks.onclick = () => { 
    const temp = createUrl();
    jsonObj = JSON.parse(` { "direct" : "@${temp.direct}", "query" : "@${temp.query}"}`);
    showJson(jsonObj);
  };

  addImport.onclick = () => {
    jsonDatas.json_value = {
      "header": true,
      "nan": true,
      "duplicates": true,
      "columns": {
        "1": {
          "datastream": "1",
          "featureOfInterest": "1"
        }
      }
    };
    
  };

  btnLimit.onclick = async () => {
    const myUrl = `${optHost.value}/${optVersion.value}/Datastreams(1)/Observations?$limit=resultTime`;
    const response = await fetch(myUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    const value = await response.json();
    const min = value["min"].split("T")[0];
    const max = value["max"].split("T")[0];
    dateMin.min = min;
    dateMin.max = max;
    dateMax.min = min;
    dateMax.max = max;
    dateMin.value = min;
    dateMax.value = max;
    new Error({
      title: "Limits",
      useInnerHTML:true,
      content: `count : ${value["count"]} item(s)<br>Date min : ${value["min"]} <br>Date max: ${value["max"]}`
    });
    refresh();
  };

  btnCreateDateFilter.onclick = async () => {
    addOption('filter', `phenomenonTime gt '${dateMin.value}' and phenomenonTime lt '${dateMax.value}'`, '');
    refresh();
  };

  go.onclick = async (e) => {
    if (e) e.preventDefault();
    wait(true);

    var tableArea = getElement("tablewrapper");
    if (tableArea != null) {
      while (tableArea.firstChild) {
        tableArea.removeChild(tableArea.lastChild);
      }
    }
    var tableArea = getElement("two");
    tableArea.classList.remove("scrolling");

    const temp = createUrl();
    const url = temp.direct;
    
    const query = options.value; 


    
    switch (method.value ) {
      case "GET":
        // ===============================================================================
        // |                                     GET                                     |
        // ===============================================================================
        const value = await getFetchDatas(url.replace("resultFormat=GRAPH","resultFormat=GRAPHDATAS"),resultFormatOption.value);
        try {
          if (query.includes("resultFormat=CSV")) {
            buildTableWithCsv(value,";");
            showOnly('csvContainer');
          } else if (query.includes("resultFormat=GRAPH") && (value.title)) {
            showOnly('graphContainer');
              showGraph(value);
              wait(false);
          }else {
            jsonObj = value;
            showJson(jsonObj);
          }
          
        }
        catch (err) {
          notify("Error", err.message);
        }        
        break;
      case"POST":
      case "PATCH":
        // ===============================================================================
        // |                               POST $ PATCH                                  |
        // ===============================================================================
        if (entity.value === "createDB") {
          let response = await fetch(`${optHost.value}/${optVersion.value}/createDB`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: jsonDatas.string_value ,
          });
          try {
            const value = await response.text();
            if (response.status == 401) {
              window.location.href = `${params.inkBase}/${params.version}/login`;
            }
            wait(false);
            jsonObj = JSON.parse(value);
            showJson(jsonObj);
          }
          catch (err) {
            fetch(`${optHost.value}/${optVersion.value}/error`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: jsonDatas.string_value ,
            });
          }
        } else {
          let response = await fetch(url, {
            method: method.value,
            headers: {
              "Content-Type": "application/json",
            },
            body: jsonDatas.string_value ,
          });
          try {
            const value = await response.text();
            if (response.status == 401) {
              // window.location.replace(value);
              window.location.href = "/login";
            }
            jsonObj = JSON.parse(value);
            wait(false);
            showJson(jsonObj);
          }
          catch (err) {
            // window.location.href = "/error";
            debug(err);
            fetch(`${optHost.value}/${optVersion.value}/error`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: jsonDatas.string_value ,
            });
          }
        }
        break;
      case"DELETE":
        // ===============================================================================
        // |                                   DELETE                                    |
        // ===============================================================================
        if (nb.value && Number(nb.value) > 0 || (entity.value == "Loras" && nb.value != "")) {
          let response = await fetch(url, {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
            },
          });
          
          try {
            if (response.status == 204) 
            {
              jsonObj = {"Delete" : "Ok"};
            } else {
              jsonObj = {"Delete" : "Error"};
            }
            wait(false);
            showJson(jsonObj);
          }
          
          catch (err) {
            window.location.href = "/error";
          }
        }    
        break;
      default:
        break;
    }
  };

  btnLogs.onclick = async (e) => {
    if (e) e.preventDefault();
    wait(true);

    const url =  `${optHost.value}/${optVersion.value}/Logs?$select=date,method,url,datas,result,error&$filter=method eq '${logsMethod.value}'&$orderby=date desc`;

  debug(url);
    
        let response = await fetch(url, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });
        try {
          // const value = query.includes("resultFormat=CSV")  ?  await response.text() : await response.json()  ;
          const csv = false;
          const value = csv === true ?  await response.text() : await response.json()  ;
          
          if (csv === true) {
            buildTableWithCsv(value,";");
            showOnly('csvContainer');
            wait(false);
          }else {
            jsonObj = value;
            showJson(jsonObj);
          }
          
        }
        catch (err) {
          notify("Error", err.message);
        }        
  }

  function clickLink(element) {
    canGo = false;
    clear();
    decodeUrlOptions(element.textContent);
    refreshAfterEntityOrSubEntity();
    canGo = true;
  };

  function dblClickLink(element) {
      if (canGo === true) go.onclick();
  };

  nb.addEventListener("change", () => {
    updateForm();
  });

  queryExpand.addEventListener("change", () => {
    const test = !queryExpand.value.startsWith(_NONE);
    showHide(querySubExpand, test);
    if (test) {
      populateMultiSelect("querySubExpand", params.relations[subentity.value], null, _NONE);
    } 
  });

  entity.addEventListener("change", () => {
    subentity.options.length = 0;
    if ((entity.value.includes("createDB") && params.user.canCreateDb == true) || importFile) method.value = "POST";
    else if (entity.value === "createDB") method.value = "POST";
    else {
      populateSelect(subentity, params.relations[entity.value], params.relations[tempEntity].includes(params.subentity) ? params.subentity :  _NONE, true);
      populateSelect(method, entity.value == "Loras" ? ["GET","POST"]  : params.methods ,"GET"); 
    }
    refreshAfterEntityOrSubEntity();    
    
  });

  subentity.addEventListener("change", () => {
    refreshAfterEntityOrSubEntity();
  });  

  splitResultOption.addEventListener("change", () => {
    const test = getIfChecked("splitResultOption");
    if (test) {
      const element = getElement("splitResultOptionName");
      if(!element) return;
      EnabledDisabled(element, test);    
      addOption('splitResult', element.value.trim ()== "" ? "All" : element.value );
    } else deleteOption('splitResult');
    updateForm();
  });

  splitResultOptionName.addEventListener("change", () => {
    if (getElement("splitResultOptionName").value === "") getElement("splitResultOptionName").value = "All";
    addOption('splitResult', getIfChecked("splitResultOption") ? getElement("splitResultOptionName").value : 'false', 'FALSE');
    updateForm();
  });

  checkDebug.addEventListener("change", () => {
    addOption('debug', getIfChecked("checkDebug") ? 'true': 'false', 'FALSE');
    refresh();
  });

  selectSeries.addEventListener("change", () => {
    addOption('series',  selectSeries.value, '');
    refresh();
  });

  onlyValue.addEventListener("change", () => {
    const temp = getIfChecked("onlyValue") ? 'TXT': 'JSON';
    addOption('resultFormat', temp, 'JSON');
    getElement("resultFormatOption").value = temp;
  });

  resultFormatOption.addEventListener("change", () => {
    addOption('resultFormat',getElement("resultFormatOption").value, 'JSON');
    refresh();
    updateForm();
  });

  topOption.addEventListener("change", () => {
    addOption('top',getElement("topOption").value, '0');
  });

skipOption.addEventListener("change", () => {
  addOption('skip',getElement("skipOption").value, '0');
});  

fileone.addEventListener( "change", ( e ) => 	{
var fileName = "";
try {
  if (this.files && this.files.length > 1 )
    fileName = ( this.getAttribute( "data-multiple-caption" ) || "" ).replace( "{count}", this.files.length );
  else
    fileName = e.target.value.split( "\\" ).pop();
  
  if(fileName ) {
    fileonelabel.querySelector( "span" ).innerHTML = fileName;
    method.value = "POST";
    entity.value = "Datastreams";
    populateSelect(subentity, params.relations[entity.value], "Observations", true);
    importFile = true;
  }
  else {
    fileonelabel.innerHTML = labelVal;
  }
} catch (err) {
  notify("Error", err.message);
}
});

jsonDatas.addEventListener('paste', function() {
  setTimeout(function() {
    console.log("coucou");
    jsonDatas.format();
    });
});
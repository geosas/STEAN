
// ===============================================================================
// |                                   HELPERS                                   |
// ===============================================================================

  const capitalize = s => s && s[0].toUpperCase() + s.slice(1)

  // show spinner
  function wait(on) {
    showHide(spinner, on);
  };

  const getElement = (input) =>  {
    const elem = (typeof input === "string") ? document.getElementById(input) : input;
    return (typeof(elem) != 'undefined' && elem != null) ? elem : undefined;
  }


  function isValidJson(json) {
    try {
        JSON.parse(json);
        return true;
    } catch (e) {
        return false;
    }
  }

  function classIsValidJson(element) {
    if (isValidJson(element.value)) {
      element.classList.add("good");
      element.classList.remove("error");
      return true;
    } else {
      element.classList.remove("good");
      element.classList.add("error");
      return false;
    }
  };

  const getValue = (element) =>{ 
    if (element.type == "textarea") {
         return classIsValidJson (element) ? JSON.parse(element.value) : undefined;
    }
    else return element.value.trim() == "" ? undefined :element.value;
}

async function  getFetchDatas(url, format) {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (format && ["CSV","TXT"].includes(format))
        return await response.text();
        else  return await response.json();
      }
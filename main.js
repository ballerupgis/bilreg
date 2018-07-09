var baseurl = "https://ballerup.mapcentia.com/api/v2/sql/collector";
var api_key

//Status variables
bilregOK = false;
bilregIsSearch = false;

//Function for making web requests asynchronously
function HttpGetAsync(query, callback) {
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function() {
        if (xmlHttp.readyState == 4 && xmlHttp.status == 200)
            callback(JSON.parse(xmlHttp.responseText));
    }
    var url = baseurl + "?key=" + api_key + "&q=" + query;
    xmlHttp.open("GET", encodeURI(url), true);
    xmlHttp.send(null);
}

function validateBilreg() {
    var field = document.getElementById('bilReg');
    
    //Is the field empty?
    if (field.value == "")
        return;

    //Find out if we are updating an old car.
    //If we are we need to validate the plate against existing records.
    if (document.getElementById('nyBil').checked == false)
    {
        HttpGetAsync("select distinct bilreg from lora_flaadestyring.bil_bilreg_euid",
            function(json) {
                bilregOK = false;
                //There's no way to break out of a foreach in js.
                //Fix by changing to a regular for loop
                json['features'].forEach(element => {
                    bilreg = element.properties.bilreg
                    if (String(bilreg).toLowerCase() == String(field.value).toLowerCase()){
                        console.log("true");
                        bilregOK = true;
                        document.getElementById("bilRegNotKnown").style.display = 'none';
                        showCarData(bilreg)
                    }
                });
            if (bilregOK == true)
                return;
            console.log("false")
            document.getElementById("bilRegNotKnown").style.display = 'block';
            }
        );
    }
    else
    {
        //Verify format with regex
        var re = /[A-Za-z]{2}\d{4,5}/;
        if (re.test(String(field.value).toLowerCase())) {
            //Test passed
            bilregOK = true;
            document.getElementById("bilRegError").style.display = 'none';
        } else {
            //Test not passed
            bilregOK = false;
            document.getElementById("bilRegError").style.display = 'block';
        }
    }

}

//Changes bilreg between input and search
function bilregFieldState() {
    var ny = document.getElementById("nyBil").checked;
    
    var bilreg = document.getElementById("bilReg")
    var arr = [];

    if (!ny) {
        var i = 0;
        HttpGetAsync("select distinct bilreg from lora_flaadestyring.bil_bilreg_euid", function(json) {
            json['features'].forEach(element => {
                arr[i] = element.properties.bilreg;
                i++;
            })
        });

        autocomplete(bilreg, arr);
        bilregIsSearch = true;
    }
    else {
        if (bilregIsSearch) {
            bilregIsSearch = false;
            removeautocomplete(bilreg);
        }
    }
}

// List parking places in dropdown
function populateParkingDropdown() {
    var query = 
    `SELECT distinct pnavn 
    FROM lora_flaadestyring.bil_parkering_hjemme 
    ORDER BY pnavn`
    
    HttpGetAsync(query, function(json) {
        json['features'].forEach(element => {
            var node = document.createElement("option");
            var textnode = document.createTextNode(element.properties.pnavn);
            node.appendChild(textnode);
            document.getElementById("parkering").appendChild(node);
        });
    });
}

// Auto-fill form with car data
function showCarData(bilreg) {
    var query = 
        `SELECT distinct a.bilreg, a.eui, b.pnavn
        FROM lora_flaadestyring.bil_bilreg_euid a
        JOIN lora_flaadestyring.bil_parkering_hjemme b
        ON a.bilreg = b.bilreg
        WHERE a.bilreg = '` + bilreg + "'"

        HttpGetAsync(query, function(json) {
        json['features'].forEach(element => {
            $('#gpsID').val(element.properties.eui);
            $('#parkering').val(element.properties.pnavn);
        });
    });
}

// Start GC2 session and get API key.
function login() {
    user = String($( "#user" ).val())
    password = String($( "#pw" ).val())
    
    url = "https://ballerup.mapcentia.com/api/v1/session/start"
    $.post( url, { u: user, p: password }, function( data ) {
        //Storing API key in globale variable
        api_key = data.api_key
    }).fail(function() {
        alert( "Forkert GC2 bruger eller password" );
    });
}

// Handling events etc.
$( document ).ready(function() {
    $( "#gc2login" ).click(function() {
        login();
    });
    
    populateParkingDropdown();
});

//Autocomplete functionality
//Remove autocomplete to control
function removeautocomplete(inp) {
    let clone = inp.cloneNode();
    while (inp.firstChild) {
        clone.appendChild(inp.lastChild);
    }
    inp.parentNode.replaceChild(clone, inp);
    clone.focus();
}

//Add autocomplete to control
function autocomplete(inp, arr) {
    var currentFocus;

    function input_listener(e) {
        var a, b, i, val = this.value;

        closeAllLists();
        if (!val) {return false;}
        currentFocus = -1;

        a = document.createElement("DIV");
        a.setAttribute("id", this.id + "autocomplete-list");
        a.setAttribute("class", "autocomplete-items");

        this.parentNode.appendChild(a);

        for (i = 0; i < arr.length; i++) {
            if (arr[i].substr(0, val.length).toUpperCase() == val.toUpperCase()) {
                b = document.createElement("DIV");
                b.innerHTML = "<strong>" + arr[i].substr(0, val.length) + "</strong>";
                b.innerHTML += arr[i].substr(val.length);

                b.innerHTML += "<input type='hidden' value = '" + arr[i] + "'>";

                b.addEventListener("click", function(e) {
                    inp.value = this.getElementsByTagName("input")[0].value;
                    closeAllLists();
                });
                a.appendChild(b);
            }
        }
    }

    inp.addEventListener("input", input_listener);

    inp.addEventListener("keydown", function(e) {
        var x = document.getElementById(this.id + "autocomplete-list");
        if (x) x = x.getElementsByTagName("div");

        if (e.keyCode == 40) {
            currentFocus++;
            addActive(x);
        } else if (e.keyCode == 38) {
            currentFocus--;
            addActive(x);
        } else if (e.keyCode == 13) {
            e.preventDefault();
            if (currentFocus > -1) {
                if (x) x[currentFocus].click();
            }
        }
    });
    
    function addActive(x) {
        if (!x) return false;
        
        removeActive(x);
        if (currentFocus >= x.length) currentFocus = 0;
        if (currentFocus < 0) currentFocus = (x.length - 1);

        x[currentFocus].classList.add("autocomplete-active");
    }

    function removeActive(x) {
        for (var i = 0; i < x.length; i++) {
            x[i].classList.remove("autocomplete-active");
        }
    }

    function closeAllLists(elmnt) {
        var x = document.getElementsByClassName("autocomplete-items");
        for (var i = 0; i < x.length; i++) {
            if (elmnt != x[i] && elmnt != inp) {
                x[i].parentNode.removeChild(x[i]);
            }
        }
    }
    document.addEventListener("click", function(e) {
        closeAllLists(e.target);
    });
}


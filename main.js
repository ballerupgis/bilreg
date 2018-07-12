var baseurl = "https://ballerup.mapcentia.com/api/v2/sql/";
var db = "collector";
var api_key;
var user_name;

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
    var url = baseurl + user_name + "@" + db + "?key=" + api_key + "&q=" + query;

    xmlHttp.open("GET", encodeURI(url), true);
    xmlHttp.send(null);
}

function validateBilreg() {
    var field = document.getElementById('bilReg');
    
    //Is the field empty?
    if (field.value == "") {
        document.getElementById("bilRegNotKnown").style.display = 'none';
        document.getElementById("bilRegError").style.display = 'none';
        document.getElementById("bilAlrKnown").style.display = 'none';
        return;
    }

    var exists = false;
    
    HttpGetAsync("select distinct bilreg from lora_flaadestyring.bil_bilreg_euid",
        function(json) {
            //There's no way to break out of a foreach in js.
            //Fix by changing to a regular for loop
            json['features'].forEach(element => {
                var bilreg = element.properties.bilreg
                if (String(bilreg).toLowerCase() == String(field.value).toLowerCase()){
                    exists = true;
                }
            });
        //Find out if we are updating an old car.
        //If we are we need to validate the plate against existing records.
        if (document.getElementById('nyBil').checked == false)
        {
            if (exists) {
                bilregOK = true;
                document.getElementById("bilRegNotKnown").style.display = 'none';
                document.getElementById("bilRegError").style.display = 'none';
                document.getElementById("bilAlrKnown").style.display = 'none';
                showCarData(field.value)
            } else {
                bilregOK = false;
                document.getElementById("bilRegNotKnown").style.display = 'block';
                document.getElementById("bilRegError").style.display = 'none';
                document.getElementById("bilAlrKnown").style.display = 'none';
            }
        }
        else
        {
            //Check here if the car is already in the system.
            if (exists) {
                bilregOK = false;
                document.getElementById("bilAlrKnown").style.display = 'block';
                document.getElementById("bilRegNotKnown").style.display = 'none';
                document.getElementById("bilRegError").style.display = 'none';
                return;
            }
            //Verify format with regex
            var re = /[A-Za-z]{2}\d{4,5}/;
            if (re.test(String(field.value).toLowerCase())) {
                //Test passed
                bilregOK = true;
                document.getElementById("bilRegError").style.display = 'none';
                document.getElementById("bilRegNotKnown").style.display = 'none';
                document.getElementById("bilAlrKnown").style.display = 'none';
            } else {
                //Test not passed
                bilregOK = false;
                document.getElementById("bilRegError").style.display = 'block';
                document.getElementById("bilRegNotKnown").style.display = 'none';
                document.getElementById("bilAlrKnown").style.display = 'none';
            }
        }
    });
    
}

//Submit function
const DoSubmit = async () => {
    var B = document.getElementById("bilReg").value;
    var G = document.getElementById("gpsID").value;
    var P = document.getElementById("parkering").value;
    var A = document.getElementById("center").value;
    
    if (B == "" || G == "" || P == "" || A == "" ) return false;

    var query1;
    var query2;
    var query3;

    if (document.getElementById('nyBil').checked == true) {
        query1 = "INSERT INTO lora_flaadestyring.bil_bilreg_euid (eui, bilreg) VALUES ('"+G+"','"+B+"')";
        query2 = "INSERT INTO lora_flaadestyring.bil_parkering_hjemme (bilreg, pnavn) VALUES ('"+B+"','"+P+"')";
        query3 = "INSERT INTO lora_flaadestyring.bil_center (bilreg, center) VALUES ('"+B+"','"+A+"')";

        HttpGetAsync(query1, function(json) { console.log('DONE: ' + query1) });
        HttpGetAsync(query2, function(json) { console.log('DONE: ' + query2) });
        HttpGetAsync(query3, function(json) { console.log('DONE: ' + query3) });
    } else {
        HttpGetAsync("SELECT COUNT(*) FROM lora_flaadestyring.bil_bilreg_euid WHERE bilreg = '"+B+"'", function(json){
            if (json['features'][0]['properties']['count'] >= 1)
                query1 = "UPDATE lora_flaadestyring.bil_bilreg_euid SET eui = '"+G+"' WHERE bilreg = '"+B+"'";
            else
                query1 = "INSERT INTO lora_flaadestyring.bil_bilreg_euid (eui, bilreg) VALUES ('"+G+"','"+B+"')";

            HttpGetAsync("SELECT COUNT(*) FROM lora_flaadestyring.bil_parkering_hjemme WHERE bilreg = '"+B+"'", function(json) {
                if (json['features'][0]['properties']['count'] >= 1)
                    query2 = "UPDATE lora_flaadestyring.bil_parkering_hjemme SET pnavn = '"+P+"' WHERE bilreg = '"+B+"'";
                else
                    query2 = "INSERT INTO lora_flaadestyring.bil_parkering_hjemme (bilreg, pnavn) VALUES ('"+B+"','"+P+"')";

                HttpGetAsync("SELECT COUNT(*) FROM lora_flaadestyring.bil_center WHERE bilreg = '"+B+"'", function(json) {
                    if (json['features'][0]['properties']['count'] >= 1)
                        query3 = "UPDATE lora_flaadestyring.bil_center SET center = '"+A+"' WHERE bilreg = '"+B+"'";
                    else
                        query3 = "INSERT INTO lora_flaadestyring.bil_center (bilreg, center) VALUES ('"+B+"','"+A+"')";
                    
                    HttpGetAsync(query1, function(json) { console.log('DONE: ' + query1) });
                    HttpGetAsync(query2, function(json) { console.log('DONE: ' + query2) });
                    HttpGetAsync(query3, function(json) { console.log('DONE: ' + query3) });
                });
            });
        });
    }

    return true;
}

// Delete record.
function DoDelete() {

    bilreg = String($( "#bilReg" ).val())
    
    query_id =      "UPDATE lora_flaadestyring.bil_bilreg_euid SET bilreg = '*mangler*' WHERE bilreg = '" + bilreg + "'"
    query_park =    "DELETE FROM lora_flaadestyring.bil_parkering_hjemme WHERE bilreg = '" + bilreg + "'"
    query_center =  "DELETE FROM lora_flaadestyring.bil_center WHERE bilreg = '" + bilreg + "'"

    HttpGetAsync(query_id, function(json) { console.log('DONE: ' + query_id) });
    HttpGetAsync(query_park, function(json) { console.log('DONE: ' + query_park) });
    HttpGetAsync(query_center, function(json) { console.log('DONE: ' + query_center) });
}

function nyBilChange() {
    var ny = document.getElementById("nyBil").checked;

    if (ny) {
        disableBilregSearch();
    } else {
        enableBilregSearch();
    }
}

function enableBilregSearch() {
    var bilreg = document.getElementById("bilReg");
    var arr = [];
    var i = 0;
    HttpGetAsync("select distinct bilreg from lora_flaadestyring.bil_bilreg_euid", function(json) {
        json['features'].forEach(element => {
            arr[i] = element.properties.bilreg;
            i++;
        })
        autocomplete(bilreg, arr);
        bilregIsSearch = true;
    });
}

function disableBilregSearch() {
    var bilreg = document.getElementById("bilReg");
    removeautocomplete(bilreg);
}

//Make GPS a search field
function GPSSearch() {
    var arr = [];
    var i = 0;

    let query = "select distinct eui from lora_flaadestyring.bil_bilreg_euid";

    var ctrl = document.getElementById("gpsID");

    HttpGetAsync(query, function(json) {
        json['features'].forEach(element => {
            arr[i] = element.properties.eui;
            i++;
        });
        autocomplete(ctrl, arr);
    });

}

// List parking places in dropdown
function populateParkingDropdown() {
    var query = "SELECT distinct pnavn FROM lora_flaadestyring.bil_parkering_hjemme ORDER BY pnavn";
    
    HttpGetAsync(query, function(json) {
        json['features'].forEach(element => {
            var node = document.createElement("option");
            var textnode = document.createTextNode(element.properties.pnavn);
            node.appendChild(textnode);
            document.getElementById("parkering").appendChild(node);
        });
    });
}

function populateCenterDropdown() {
    var query = "SELECT DISTINCT center FROM lora_flaadestyring.centre ORDER BY center";

    HttpGetAsync(query, function(json) {
        json['features'].forEach(element => {
            var node  = document.createElement("option");
            node.appendChild(document.createTextNode(element.properties.center));
            document.getElementById("center").appendChild(node);
        });
    });
}

// Auto-fill form with car data
function showCarData(bilreg) {
    var query = 
        `SELECT distinct a.bilreg, a.eui, b.pnavn, c.center
        FROM lora_flaadestyring.bil_bilreg_euid a
        LEFT JOIN lora_flaadestyring.bil_parkering_hjemme b
        ON a.bilreg = b.bilreg
        LEFT JOIN lora_flaadestyring.bil_center c
        ON a.bilreg = c.bilreg
        WHERE a.bilreg = '` + bilreg + "'"

        HttpGetAsync(query, function(json) {
        json['features'].forEach(element => {
            $('#gpsID').val(element.properties.eui);
            $('#parkering').val(element.properties.pnavn);
            $('#center').val(element.properties.center);
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
        api_key = data.api_key;
        user_name = user;
        prepareForm();
    }).fail(function() {
        alert( "Forkert GC2 bruger eller password" );
        $("#myModal").modal({backdrop: 'static', keyboard: false});
    });
}

$(function() {
    $('.modal-content').keypress(function(e) {
        if (e.which == 13) $('#gc2login').click();
    })
})

// function stateDeleteBtn() {
//     // Delete button toggle active
//     var checker = document.getElementById('nyBil');
//     var btn = document.getElementById('del');
//     checker.onchange = function() {
//         btn.disabled = !!this.checked;
//     };
// }

// Handling events etc.
$( document ).ready(function() {
    $( "#gc2login" ).click(function() {
        login();
    });

    $( "#delete" ).click(function() {
        DoDelete();
        $('#confirm').modal('hide')
        $("#InsertSuccess").show();
        hideAlertsWithDelay();
        var form = document.getElementById("mainForm");
        form.reset()
    });

    $("#myModal").modal({backdrop: 'static', keyboard: false});
});

function prepareForm() {
    populateParkingDropdown();
    populateCenterDropdown();
    GPSSearch();
    enableBilregSearch();

    document.getElementById("loginButton").style.display = 'none';
    document.getElementById("loginName").style.display = 'block';
    document.getElementById("loginName").innerHTML = user_name;

    var form = document.getElementById("mainForm");
    function onSubmit(event) {
        if (event) {event.preventDefault();}
        if (!api_key) {$("#myModal").modal(); return;}
        validateBilreg();
        if (!bilregOK) return;
        
        //Do submission of data async, if succesful reload page
        DoSubmit().then((result) => {
            if (result) {
                $("#InsertSuccess").show();
                hideAlertsWithDelay();
                form.reset();

            } else {
                $("#InsertError").show();
                hideAlertsWithDelay(8000);
            }
        });
    }
    form.addEventListener('submit', onSubmit, false);
}

function hideAlertsWithDelay(delay = 6000) {
    window.setTimeout(function(){
        $(".alert").fadeTo(500,0).slideUp(500, function(){
            $(this).remove();
        });
    }, delay);
}

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
            e.preventDefault();
            currentFocus++;
            addActive(x);
        } else if (e.keyCode == 38) {
            e.preventDefault();
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
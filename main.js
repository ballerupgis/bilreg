var baseurl = "https://ballerup.mapcentia.com/api/v2/sql/collector";
var api_key

//Status variables
bilregOK = false;

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



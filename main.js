var gpsID = []

//var url = "https://ballerup.mapcentia.com/api/v2/sql/collector?q=select%20eui%20from%20LORIOT.GPS%20where%20eui%20like%20%2770%%27%20group%20by%20EUI%20order%20by%20EUI%20asc"

var baseurl = "https://ballerup.mapcentia.com/api/v2/sql/collector";
var api_key = "73a7b92465313debc7533b5019f7af58";

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

//Status variables
bilregOK = false;


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
                    if (String(element['properties']['bilreg']).toLowerCase() == String(field.value).toLowerCase()){
                        console.log("true");
                        bilregOK = true;
                        document.getElementById("bilRegNotKnown").style.display = 'none';
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




// var ajax = $.ajax({
//     url: url,
//     type: 'GET',
//     dataType: 'jsonp',
//     success: function(response) {
//       $.each(response.features, function(index, el) {
//         //add data to global data array
//         gpsID.push(el.properties);
//       });
//     }
// });

// var createEUIDropdown = function(gpsID) {
//     $.each(gpsID, function(index, el) {
//         var eui = gpsID[index].eui
//         $("#test")
//           .append('<option>' + eui + '</option>')
//     });
// }

// ajax.done(function() {
//     createEUIDropdown(gpsID);
// });

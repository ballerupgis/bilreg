var gpsID = []

var url = "https://ballerup.mapcentia.com/api/v2/sql/collector?q=select%20eui%20from%20LORIOT.GPS%20where%20eui%20like%20%2770%%27%20group%20by%20EUI%20order%20by%20EUI%20asc"

var ajax = $.ajax({
    url: url,
    type: 'GET',
    dataType: 'jsonp',
    success: function(response) {
      $.each(response.features, function(index, el) {
        //add data to global data array
        gpsID.push(el.properties);
      });
    }
});

var createEUIDropdown = function(gpsID) {
    $.each(gpsID, function(index, el) {
        var eui = gpsID[index].eui
        $("#test")
          .append('<option>' + eui + '</option>')
    });
}

ajax.done(function() {
    createEUIDropdown(gpsID);
});


$(document).ready(function() {
    //toggle the favorites list off when page loads
    $( "#favoritesWrapper" ).toggle();

    //hide the favorites list
    $("#favHikeBtn").click(function () {
        $("#favoritesWrapper").toggle("slow", function () {

        });
});

    //search bar control
    $("#search-icon").click(function () {

        if ($("#search-box-spot").css('display') == 'none') {

            // console.log("if");
            $("#location-icon-spot").hide();
            $("#name-spot").hide();
            $("#search-box-spot").show("slow", function () {
                $("#search-box").focus();
                $("#search-box").select();
            });

        } else {
            $("#search-box").val("");
            $("#search-box-spot").hide("slow", function () {
                $("#location-icon-spot").show();
                $("#name-spot").show();
            });
        }
    });





    //change background image on hover
    $('#hike-title').hover(function () {
        $('#hike-title-image').show();
    }, function () {

        $('#hike-title-image').hide();
    });



    $('#surf-title').hover(function () {
        $('#surf-title-image').show();
    }, function () {

       $('#surf-title-image').hide();
    });

});

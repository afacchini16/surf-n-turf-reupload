/**
 * @file - This file manages the api calls to get the hiking places and details as well as
 * some of the dynamic html manipulation
 * 
 * In order to access the information needed for the current display you can 
 * reference the global variable currentPlace and access it's properties:
 * name, lat, lng, temp, wind, url, photos
 * 
 * Each time a button with the "#newPlace" id is clicked the currentPlace object will update.
 * If the user continues to click newPlace and we run out of new places the currentPlace will 
 * cycle and repeat.
 * 
 * TODO:
 * 
 * See modal on-click/keypress functions: want a better way to start the newPlace function 
 * rather than waiting 1sec, look into "object watch"
 * 
 * Geolocation disabled for the time being. Figure out better way to prompt modal
 * 
 * Need an error image when a place was not found from search
 */

var currentLot = {
    lat: null,
    lng: null,
    switch: false
};

var searchLocation = {
    lat: null,
    lng: null,
    switch: false
};

var surfSpot = {
    name: null,
    lat: null,
    lng: null,
    height: null,
    wind: null,
    weather: null
};

// TEXT SEARCH request
var map;
var service;
var infowindow;
//global variables used to store list of places relevant to current location
var counter = 0;
var search;
var places = [];
var currentPlace;
var currentPhotos = [];
var locationSearch = "";
var temp;
var wind;

/**
 * Gets the weather for the given lat and lng and update's places properties
 * @param lat - the latitude used to get weather
 * @param lng - the longitude used to get weather
 * @param place - the place whose properties we are updating
 */
function getWeather(lat, lng, place) {
    var apikeyid = "eb3f27114445b4659aab2c8fd7a8fa5d";
    var queryURL = "http://api.openweathermap.org/data/2.5/weather?mode=json&units=imperial&" +
        "lat=" + lat +
        "&lon=" + lng +
        "&appid=" + apikeyid;
    $.ajax({
            url: queryURL,
            method: 'GET'
        })
        .done(function (response) {
            //Get temperature, wind, weather icon, and description
            temp = Math.floor(response.main.temp).toString();
            wind = Math.floor(response.wind.speed).toString();
            place.temp = Math.floor(response.main.temp);
            place.wind = Math.floor(response.main.wind);
            place.weatherIcon = response.weather[0].icon;
            place.weather = response.weather[0].main;
            //update the info box in hike.html
            $("#temp-info").html(temp + "°");
            $("#wind-info").html(wind + "mph");
            $("#current-weather").attr("src", "assets/images/weather-api-icons/" + place.weatherIcon + ".png");
            $("#current-weather").attr("style", "");
            $("#weather-info").html(place.weather);
        });
}

/** Call this to get current location and store lat & lng in currentLot */
function initMap() {
    //display the modal to accept user's search input when hike.html loads
    $('#myModal').modal('show');
    $("#modalInput").focus();
    $("#search-box").select();
    /* FIXME: Disable geolocation until we can figure out initial page load
    //if browser supports current location then store it in currentLot, else get from user input
    navigator.geolocation.getCurrentPosition(function (position) {
        locationSearch = "";
        currentLot = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            switch: true
        };

        console.log("Got current place!");
        //Check if the API has returned the user's current location. If so the if statement would run
        if (currentLot.switch) {
            initializePlaces(currentLot.lat, currentLot.lng);
        }
    }, function () {
        //if geolocation doesnt work then prompt user to enter a location
        $('#myModal').modal('show');
        $("#modalInput").focus();
        $("#search-box").select();
        //locationSearch = prompt("Cannot get your current location! Please enter a location (eg. 'La Jolla')");

    }, {
        timeout: 5000
    });
    */
}

/** Gets places based on given lat & lng 
 * 
 * @param lat - latitude used as input to get places
 * @param lng - longitude used as input to get places
 */
function initializePlaces(lat, lng) {
    var pyrmont = new google.maps.LatLng(lat, lng);
    map = new google.maps.Map(document.getElementById('map'), {
        center: pyrmont,
        zoom: 15
    });

    //want to search for hiking locations
    var myQuery = 'hiking';
    //if we searched for a location then add it to search
    if (locationSearch.length > 1) {
        myQuery = myQuery + ' in ' + locationSearch.trim();
    }
    //set data that determines what is returned
    var textRequest = {
        location: pyrmont,
        radius: '10000',
        query: myQuery
    };
    service = new google.maps.places.PlacesService(map);
    service.textSearch(textRequest, searchCallback);
}

/** Handles the data that is returned by google places */
function searchCallback(results, status) {
    //empty places array when new location is searched
    places = [];
    if (status == google.maps.places.PlacesServiceStatus.OK) {
        for (var i = 0; i < results.length; i++) {
            //get the ith place object
            var place = results[i];

            //add a new place object to the places array
            var thisPlace = {
                lat: place.geometry.location.lat(),
                lng: place.geometry.location.lng(),
                placeId: place.place_id,
                name: place.name,
                url: place.url,
                temp: null,
                wind: null,
                photos: null,
                rating: null,
                weather: null,
                weatherIcon: null
            };
            places.push(thisPlace);
        }
    }
}

/** Gets the next place in the places array, updates it's weather & details info, and assigns it to current place */
function getNewPlace() {
    getWeather(places[counter].lat, places[counter].lng, places[counter]);
    getDetails(places[counter]);
    counter = counter % (places.length - 1);
    counter++;
    $("body").removeClass("loading");
}

/** Gets the photos for the given place 
 * @param currentPlace - the place we want info for from google places api
*/
function getDetails(currentPlace) {
    //GET details for the current place
    var detailsRequest = {
        placeId: currentPlace.placeId
    };
    service.getDetails(detailsRequest, detailsCallback);
}

/** Get the photos from the details returned and update the photos attribute for the corresponding place object in the places[] array 
 * @param place - the place returned by the api with the desired info (url, photos, rating)
 * @param status - true if the api call was successful
 */
function detailsCallback(place, status) {
    if (status == google.maps.places.PlacesServiceStatus.OK) {
        //reset the currentPhotos
        currentPhotos = [];
        //if details api gives us a url then assign it to the place, else set default url to google maps
        if (typeof (place.url) !== undefined) {
            places[counter - 1].url = place.url;
        } else {
            places[counter - 1].url = "https://www.google.com/maps/";
        }

        //if details api gives us photos then assign it to the place, else give it a default image
        if (place.photos !== undefined) {
            for (var i = 0; i < place.photos.length; i++) {
                currentPhotos[i] = place.photos[i].getUrl({
                    'maxWidth': 4000,
                    'maxHeight': 4000
                });
            }
        } else {
            currentPhotos[0] = "https://lh4.googleusercontent.com/-IhuqmUwfUNE/V5q2XH0F37I/AAAAAAAAEtw/r5A0UzbkuO0-wCoko9BL5-DpByXBzzO0wCJkC/w4000-h4000-k/";
        }

        //add the info to the corresponding place object in places array
        places[counter - 1].photos = currentPhotos;
        places[counter - 1].rating = place.rating;
        //set currentPlace after all info has been added
        currentPlace = places[counter - 1];
        //update the rating in the info box in hike.html
        $("#rating-info").html(currentPlace.rating);
        getPhotos();
        infoHike(currentPlace);
    }
}


/** Update the hike.html carousel with the current place's photos */
function getPhotos() {
    //set carousel indicators based on how many photos there are
    $(".carousel-indicators").html("");
    $(".carousel-indicators").append("<li data-target='#myCarousel' data-slide-to='0' class='active'></li>");
    //set the first background photo in carousel with an active class
    $(".carousel-inner").html("");
    var newActiveItem = $("<div class='item active'></div>");
    newActiveItem.append("<div class='fill' style='background-image:url(" + currentPlace.photos[0] + ");'></div>");
    $(".carousel-inner").append(newActiveItem);
    //append the rest of the photos to carousel
    for (var i = 1; i < currentPlace.photos.length; i++) {
        var newItem = $("<div class='item'></div>");
        newItem.append("<div class='fill' style='background-image:url(" + currentPlace.photos[i] + ");'></div>");
        $(".carousel-inner").append(newItem);
        //add a carousel indicator for each photo
        $(".carousel-indicators").append("<li data-target='#myCarousel' data-slide-to='" + i + "'></li>");
    }
}

/** Get the next place when user clicks newPlace button in hike.html */
$("#newPlace").on("click", function () {
    getNewPlace();
    //function call from fireDB.js
    loadUserFav("Favorite Hike Spots", "#favHikeList");
});

/** initialize a new list of places when a search is made */
$("#modalSearch").on("click", function () {
    locationSearch = $("#modalInput").val().trim();
    $("#modalInput").html("");
    $('#myModal').modal('hide');
    initializePlaces(32.7157, -117.1611);
    $("body").addClass("loading");
    setTimeout(getNewPlace, 2000);
});
//do the same when enter is pressed
$("#modalInput").keypress(function (e) {
    if (e.which === 13) {
        locationSearch = $("#modalInput").val().trim();
        $("#modalInput").html("");
        $('#myModal').modal('hide');
        initializePlaces(32.7157, -117.1611);
        $("body").addClass("loading");
        setTimeout(getNewPlace, 2000);
    }
});
//initialize a new list of places from the search box in hike.html
$("#search-box").keypress(function (e) {
    if (e.which === 13) {
        locationSearch = $("#search-box").val().trim();
        $("#search-box").html("");
        $("#search-box-spot").hide("slow", function () {
            $("#location-icon-spot").show();
            $("#name-spot").show();
        });
        initializePlaces(32.7157, -117.1611);
        $("body").addClass("loading");
        setTimeout(getNewPlace, 2000);
        $("#search-box").val("");
    }
});

//initialize data based on current location when page loads
initMap();
//RUNNING FX when LOAD:

//Variables: 
//Configuration and initialize DB
var config = {
    apiKey: "AIzaSyDJSuvDBWilri_GyjUM7zJy2gEpcT0mits",
    authDomain: "surfnturf-reupload.firebaseapp.com",
    databaseURL: "https://surfnturf-reupload.firebaseio.com",
    projectId: "surfnturf-reupload",
    storageBucket: "surfnturf-reupload.appspot.com",
    messagingSenderId: "667811150897",
    appId: "1:667811150897:web:226ccacecc5740d2376910"
};
firebase.initializeApp(config);
var database = firebase.database();

//Create new folders called 'hike' and 'surf' by importing fbpath.json file
//new var count the likes:
var likeCount = null;
var UserlikedPlace;
var placeExistsInArray = false;
var currentName;
//Store user's data in the storage:
var favoriteList = localStorage.getItem("Favorite Hike Spots");



//When the heart is click on, i++ like counts:

//Get local storage fav list and display it
$("#favHikeBtn").on("click", function(){ 
    loadUserFav("Favorite Hike Spots", "#favHikeList");
});

$("#heartHike").on("click", function () {
    //check in the list 
    currentName = $("#current-spot").html();
    heartForFavPlace("#heartHike", favoriteList, "Favorite Hike Spots",  currentName);
    likeCountFx("#heartHike", "hike");
});

//Get local storage fav list and display it
$("#favSurfBtn").on("click", function(){ 
    loadUserFav("Favorite Surf Spots", "#favSurfList");
});

$("#heartSurf").on("click", function () {
    //check in the list
    //EDIT
    currentName = $("#current-spot").html(); 
    heartForFavPlace("#heartSurf", favoriteList, "Favorite Surf Spots",  currentName);
    likeCountFx("#heartSurf", "surf");
});


//Initial display the current likes of a place when click next 
function dispLikes() {
    currentName = $("#current-spot").html();
    if (currentName !== "") {
        var ref = database.ref("spotsInfo/hike");
        ref.once("value")
            .then(function (snapshot) {
            if (snapshot.child(currentName).exists()) {
                likeCount = snapshot.child(currentName + "/likes").val();
                $("#heartCount").text(likeCount);
            } else {
                $("#heartCount").text("0");
            }
        });
    }
}

//INITIAL display and CHECK SYSTEM using the localStorage 
//ALSO assign UserlikedPlace here:
function heartForFavPlace(heart,list, listName, name){
    $(heart).removeClass("heartColor");
    //check if list is string, if it is, parse to JSON format
    if (localStorage.getItem(listName)){
        var list = localStorage.getItem(listName);
        if (typeof(list) === "string"){
            list = JSON.parse(list);
        }
        if (list !== null) {
            for (i = 0; i < list.length; i++) {
                favPlace = list[i];
                if (favPlace.name === name ) {
                    $(heart).addClass("heartColor");
                    UserlikedPlace = true;
                } 
                else {
                    UserlikedPlace = false;
                }
            }
        }
    } else {
        $(heart).removeClass("heartColor");
        UserlikedPlace = false;
    }
}

function infoHike(current) {
    $("#spot-name").html("<a id='current-spot' href='" + current.url + "' target='_blank'>" + current.name + "</a>");
    // console.log("<a href='" + current.url + "'>" + current.name + "</a>");
    dispLikes();
    currentName = $("#current-spot").html();
    heartForFavPlace("#heartHike", favoriteList, "Favorite Hike Spots", currentName);
}


function likeCountFx(heartID, typeSpot) {
    // $(heartID).on("click", function () {
        //heartForFavPlace("#heartHike", favoriteList, currentName);
        //get the current spot's name        
        currentName = $("#current-spot").html();
        //check if database has a path for this aready
        var ref = database.ref("spotsInfo/" + typeSpot);
        //take a snapshot of current data
        ref.once("value")
            .then(function (snapshot) {
            //Test if this place has info in db
            if (snapshot.child(currentName).exists()) {
                //retrievve current like count 
                likeCount = snapshot.child(currentName + "/likes").val();
                spotID = snapshot.child(currentName + "/id").val();
                //add one more like to current one:
                //FIXME: Double likes at likeCount=0 
                if (UserlikedPlace === false) {
                    likeCount++;
                    $(heartID).addClass("heartColor");
                    saveFavLocal("Favorite Hike Spots");
                    currentName = $("#current-spot").html();
                    heartForFavPlace("#heartHike", favoriteList, "Favorite Hike Spots",  currentName);// loadUserFav("Favorite Hike Spots", "#favHikeList");
                    loadUserFav("Favorite Hike Spots", "#favHikeList");
                } else if (UserlikedPlace === true){
                    if (likeCount !== 0){
                        likeCount--;
                    }
                    $(heartID).removeClass("heartColor") ;
                    removePlace(favoriteList, currentName, "Favorite Hike Spots");
                    currentName = $("#current-spot").html();
                    heartForFavPlace("#heartHike", favoriteList,  "Favorite Hike Spots",  currentName);
                    loadUserFav("Favorite Hike Spots", "#favHikeList");
                }
                // console.log(likeCount)
                //push this back to the data count: 
                database.ref("spotsInfo/" + typeSpot + "/" + currentName).set({
                    id: spotID,
                    likes: likeCount
                });
                $("#heartCount").text(likeCount);
                //if the database doesn't have that path:
            } else {
                //create new path to that place id and like starts at 1
                if (UserlikedPlace === false) {
                    $(heartID).addClass("heartColor");
                    saveFavLocal("Favorite Hike Spots");
                    currentName = $("#current-spot").html();
                    heartForFavPlace("#heartHike", favoriteList, "Favorite Hike Spots",  currentName);// loadUserFav("Favorite Hike Spots", "#favHikeList");
                    loadUserFav("Favorite Hike Spots", "#favHikeList");
                } else if (UserlikedPlace === true){
                    $(heartID).removeClass("heartColor") ;
                    removePlace(favoriteList, currentName, "Favorite Hike Spots");
                    currentName = $("#current-spot").html();
                    heartForFavPlace("#heartHike", favoriteList,  "Favorite Hike Spots",  currentName);
                    loadUserFav("Favorite Hike Spots", "#favHikeList");
                }
                likeCount = 1;
                database.ref("spotsInfo/" + typeSpot + "/" + currentName).set({
                    "id": currentName,
                    "likes": likeCount
                });
                $("#heartCount").text(likeCount);
                //database.ref
            } //else
        }); //function
    
}

//Add places and set UserlikedPlace to true
function saveFavLocal(favorite) {
    placeName = $("#current-spot").html();
    url = currentPlace.url;
    // console.log(url);
    placeObj = {
        name: placeName,
        url: currentPlace.url,
    };
    //retrieve favorteArray from localStorage:
    if (localStorage.getItem(favorite)) {
        var favoriteArray = localStorage.getItem(favorite);
    }
    //start a new array in local storage and push new liked place to array
    if ((favoriteArray == "[null]") || (favoriteArray == undefined)){
        var favoriteArray = [];
        favoriteArray.push(placeObj);
        favoriteArray = JSON.stringify(favoriteArray);
        localStorage.setItem(favorite, favoriteArray);
        favoriteArray = localStorage.getItem(favorite);
        favoriteArray = JSON.parse(favoriteArray);
        favoriteList = favoriteArray;
        UserlikedPlace = true;
    } else {
        //get the array from localStorage and push new liked place to array
        favoriteArray = JSON.parse(favoriteArray);
        //Only add to the list once: 
        for (i = 0; i < favoriteArray.length; i++) {
            favPlace = favoriteArray[i];
            if (favPlace.name == placeName) {
                placeExistsInArray = true;
            } else {
                placeExistsInArray = false;
            }
        }
        if (placeExistsInArray !== true){
                favoriteArray.push(placeObj);
                favoriteArray = JSON.stringify(favoriteArray);
                localStorage.setItem(favorite, favoriteArray);
                favoriteArray = localStorage.getItem(favorite);
                favoriteArray = JSON.parse(favoriteArray);
                favoriteList = favoriteArray;
        } 
    }    
}
       

// remove place and set UserlikedPlace to false
function removePlace(list, name, listName){
    console.log(list);
    if (typeof(list) === "string"){
        list = JSON.parse(list);
    }
    // list = [{key 1: val 1, key 2: val 2}, {}, {}]
    if (list !== null) {
        for (i = 0; i < list.length; i++) {
            favPlace = list[i];
            if (favPlace.name === name ) {
                console.log("removing "+name);
                var index = list.indexOf(favPlace);
                if (index > -1){
                    list.splice(index, 1);
                }
            } 
        }
        UserlikedPlace = false;
        console.log("new list: ");
        console.log(list);
        list = JSON.stringify(list);
        if (list !== "[]"){
            localStorage.setItem(listName, list);
        } else {
            localStorage.removeItem(listName);
        }
        
    }
}


//Use the localStorage array to load liked places
function loadUserFav(listName, typeList) {
    //when the user try to open the favorite list
    if (localStorage.getItem(listName)) {
        var favList = localStorage.getItem(listName);     
        if (typeof(favList) === "string") favList = JSON.parse(favList);
        $(typeList).text("");
        // console.log(favList);
        // console.log(typeof(favList));
        for (var i = 0; i < favList.length; i++) {
            place = favList[i];
            var newDiv = $("<div> <img src = 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQQDvHKooQtuOlfLcbf5YPOTpL0YZyGxJQntFsNCsD3VBZEqEED1TuUgA' height = '25px' width = '25px'> <a target='_blank' href='" + place.url + "'>" + place.name + "</a></div>");
            $(typeList).append(newDiv);
        }
    } else {
        $(typeList).text("You don't have any favorites yet");
    }
}
//TODO: save in local storage value of like switch
// function alreadyLiked(list, name, heart) {
//     $(heart).removeClass("heartColor");
//     console.log(list);
//     //check if list is string, if it is, parse to JSON format
//     if (typeof(list) == "string"){
//         list = JSON.parse(list);
//     }
//     console.log(typeof(list));
//     if (list !== null) {
//         for (i = 0; i < list.length; i++) {
//             favPlace = list[i];
//             console.log(favPlace);
//             console.log(favPlace.name);
//             console.log(name);
//             if (favPlace.name === name && favPlace.liked == true) {
//                 $(heart).addClass("heartColor");
//             } 
//             else {
//                 $(heart).removeClass("heartColor");
//             }
//         }
//     }
// }


// function likedORunliked(list, name){
//     //name == current name on page
//     //list == favorite list in the local storage
//     //when click on heart:
//     if (typeof(list) == 'string'){
//         list = JSON.parse(list);
//     }    
//     for (var i = 0; i < list.length; i++){
//         place = list[i];
//         if (place.name == name && place.liked == true){
//             place.liked = false;
//         } else if ( place.name == name && place.liked == false){
//             place.liked = true;
//         }
//     }
// }



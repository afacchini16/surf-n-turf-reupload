
  var hour = moment().format('hA');
  var day = moment().format('l').split("/")[1];
  var month = moment().format('l').split("/")[0];     
  var year = moment().format('l').split("/")[2];
  var spotNamequeryURL = "http://api.spitcast.com/api/spot/all";
  var spotNamesArray = [];
  var infoArray = [];
  var ctx = $("#myChart");
  var options;
  var graphChecker = false;
  var userInput = "";

// initializes the surfSpot object that will hold all info for searched spot
  var surfSpot = {
    name: null,
    lat:null,
    long:null,
  county: null,
  wind: null,
  windDirection: null,
  surfHeight:null,
  condition: null,
  waterTemp:null,
  tidesArray: [],
  timeArray: [],
  heightArray: [],
  windArray: [],
  currentTide: null,
  switch:false,
  }

  
  
  // Hides surf info bar because no information has been input on page load
  $(".infoBar").hide();
  // Hides the error message if user hits submit without entering text
  $("#emptyField").hide();

  // Expands the search box when the user clicks on it
  $(".ui-autocomplete").on("click", function(){
    $(this).addClass('clicked');
    $("input").removeClass("inputDisappear");
    $(".glyphicon.glyphicon-search").hide();
  })

  // $("#submitBtn").on("click",function(){
  //   $("input").removeClass('clicked').toggleClass("inputDisappear");
  //   $(".glyphicon.glyphicon-search").show();
  //   $("input").addClass("clicked");
  // })
  
  // Will shrink the favorites bar when the top left button is clicked
  $(".glyphicon-align-justify").on("click", function(){
    $(".favoritesWrapper").toggleClass("clicked");
    $(".favoritesContentArea").toggleClass("clicked");
    
  })
 
 // Saves all spot names in Spitcast API to be input into an array which is then used for autocomplete
 function autocompleteCall(day, month, year){
  // API end point that has all spot names
  spotNamequeryURL = "http://api.spitcast.com/api/spot/all";
  $.ajax({
    url: spotNamequeryURL,
    method:'GET'
  })
    .done(function(response){
      var spots = response;   
      for (i = 0; i < spots.length; i++){
        // save the response into an info array variable which will then be used to find surf spots and set some of 
        // the properties of surfSpot object
        var info = spots[i];
        infoArray.push(info);
        // saves names of all spots to be used in autocomplete search bar
        spotName = spots[i].spot_name;
        spotNamesArray.push(spotName);
      }
      $(function(){
        $(".ui-autocomplete").autocomplete({
          // sets the source array equal to the array saved above which contains names of all surf spots available to API
          source:spotNamesArray
        })
      });

    });
  }
  //CALL FUNCTIONS HERE
   autocompleteCall(day, month, year);
   
   // Will get information about the surf height and conditions
   // Uses Spitcast "forecast" endpoint.  The response array is arranged chronologically, with new information for each hour
   function ajaxSurfHeightCall(spotID, hour){
    forecastURL = "http://api.spitcast.com/api/spot/forecast/" + spotID + "/";
     $.ajax({
      url: forecastURL,
      method: "GET"
    })
    .done(function(response){
    // loops through all data for the chosen spot, looking for the appropriate conditions at current time
     for (i = 0; i < response.length; i++){
       // saves the height at each interval of an hour to be added to heightArray
       // heightArray will generate the graph of surf height for an entire 24 hour period
       var height = response[i].size_ft;
        // Adds just the surf height info to be used for graphing
        surfSpot.heightArray.push(height);
        console.log(height);
       // Gets the info for this specific hour
       if (response[i].hour == hour){
        surfSpot.surfHeight = response[i].size;
        surfSpot.condition = response[i].shape_detail.swell;
      }
       
     }  
        // Sets available data to the page
        setHTML(surfSpot.name, surfSpot.surfHeight, surfSpot.condition, surfSpot.wind, surfSpot.windDirection, surfSpot.waterTemp);       
        
        
    })
   };

   // Gets the wind speed and direction using the "county/wind" API endpoint
   function ajaxWindCall(county, hour){
     console.log("wind");
     var windURL = "http://api.spitcast.com/api/county/wind/" + county;
     
     $.ajax({
         method: "POST",
       dataType: "json",
       url: "https://proxy-cbc.herokuapp.com/proxy",
         data: {
           url:windURL
         }
         })
    .done(function(response){
    
    for (i = 0; i < response.data.length; i++){
       //Saves wind speed for every hour to be used for graphing
       var wind = response.data[i].speed_mph;
        // Adds the wind speed to the windArray which will be used to generate the daily graph
        surfSpot.windArray.push(wind);
       // Gets wind information for the hour that the search is being executed
    
       if (response.data[i].hour == hour){
        // Rounds the wind speed to the nearest whole number to maintain a clean interface
        surfSpot.wind = Math.round(response.data[i].speed_mph);
        surfSpot.windDirection = response.data[i].direction_degrees;
      }
     }
    // Updates page with wind information
    setHTML(surfSpot.name, surfSpot.surfHeight, surfSpot.condition, surfSpot.wind, surfSpot.windDirection, surfSpot.waterTemp);   
  });
}

// Gets the water temp
function ajaxWaterTemp(county){
  // Uses the "water-temperature" endpoint, but can only get information by county
  var tempURL = "http://api.spitcast.com/api/county/water-temperature/" + county;
  $.ajax({
    method: "POST",
    dataType: "json",
    url: "https://proxy-cbc.herokuapp.com/proxy",
    data: {
        url:tempURL
      }
         })
    .done(function(response){
      // Only one response per day is available so no need for any if/for statements like other calls
      surfSpot.waterTemp = response.data.fahrenheit;

      setHTML(surfSpot.name, surfSpot.surfHeight, surfSpot.condition, surfSpot.wind, surfSpot.windDirection, surfSpot.surfHeight, surfSpot.waterTemp);

  })
}


function ajaxTide(county){
  console.log("tide");
var tideURL = 'http://api.spitcast.com/api/county/tide/' + county;
$.ajax({
  method: "POST",
  dataType: "json",
  url: "https://proxy-cbc.herokuapp.com/proxy",
  data: {
    url: tideURL
  }
})
.done(function(response){
 
  for (i = 0; i < response.data.length; i++){
  // Since this information is only being displayed on the "detailed info" portion of the page, all tide information is being saved
  // instead of just current info like the other API calls
  var tide = response.data[i].tide;
  // Saves the hour as well because it will be input into Graphs.js as the x-axis
  var time = response.data[i].hour;
  
  surfSpot.tidesArray.push(tide);
  surfSpot.timeArray.push(time);

          }
      })        
  };


function generateGraphs(time, tides, height, wind){
console.log("Generate Graphs Funciton");

// Updates some of the default graph properties
Chart.defaults.global.responsive = true;
Chart.defaults.global.defaultFontColor = 'white';
Chart.defaults.global.tooltips.mode = 'label';
Chart.defaults.global.tooltips.backgroundColor = '#fff';
Chart.defaults.global.tooltips.titleColor = 'white';
Chart.defaults.global.tooltips.bodyColor = 'white';

// Establishes some of the options that are available for line graphs
var options = {
  scales: {
            xAxes: [{ 
                // Remove grid lines
                gridLines: {
                    display: false,
                },
                // Change x-axis text to white
                ticks: {
                  fontColor: "white",
                },
            }],
            yAxes: [{
                display: true,
                gridLines: {
                    display: false,
                },
                ticks: {
                  fontColor: "white",
                },
            }],
        },
}

var data = {
    // Is the time data saved above from the tides API call.  Labels simply means "x-axis"
    labels: time,
      scaleFontColor: 'white',
        responsive: true,
        tooltips: {
            mode: 'single',
        },
    // Specifies all information for the data (line thickness, line color, etc.)
    datasets: [
        {
             label: 'Tide (ft)',

            // Boolean - if true fill the area under the line
            fill: false,

            // Tension - bezier curve tension of the line. Set to 0 to draw straight lines connecting points
            // Used to be called "tension" but was renamed for consistency. The old option name continues to work for compatibility.
            lineTension: 0.5,

            // String - the color to fill the area under the line with if fill is true
            //backgroundColor: "rgba(75,192,192,0.4)",

            // String - Line color
            borderColor: "rgb(255,20,147)",

            // String - cap style of the line. See https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/lineCap
            borderCapStyle: 'round',

            // Array - Length and spacing of dashes. See https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/setLineDash
            borderDash: [],

            // Number - Offset for line dashes. See https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/lineDashOffset
            borderDashOffset: 0.0,

            // String - line join style. See https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/lineJoin
            borderJoinStyle: 'miter',

            // The properties below allow an array to be specified to change the value of the item at the given index

            // String or Array - Point stroke color
            pointBorderColor: "black",
            borderWidth: 4,

            // String or Array - Point fill color
            pointBackgroundColor: "#fff",

            // Number or Array - Stroke width of point border
            pointBorderWidth: 0.5,

            // Number or Array - Radius of point when hovered
            pointHoverRadius: 5,

            // String or Array - point background color when hovered
            pointHoverBackgroundColor: "white",

            // String or Array - Point border color when hovered
            pointHoverBorderColor: "rgba(220,220,220,1)",

            // Number or Array - border width of point when hovered
            pointHoverBorderWidth: 2,

            // Number or Array - the pixel size of the point shape. Can be set to 0 to not render a circle over the point
            // Used to be called "radius" but was renamed for consistency. The old option name continues to work for compatibility.
            pointRadius: 1,

            // Number or Array - the pixel size of the non-displayed point that reacts to mouse hover events
            //
            // Used to be called "hitRadius" but was renamed for consistency. The old option name continues to work for compatibility.
            pointHitRadius: 10,

            // The actual data
            data: tides,

            // String - If specified, binds the dataset to a certain y-axis. If not specified, the first y-axis is used. First id is y-axis-0
            yAxisID: "y-axis-0",
        },
    {
       label: 'Wave Height (ft)',

            // Boolean - if true fill the area under the line
            fill: false,

            // Tension - bezier curve tension of the line. Set to 0 to draw straight lines connecting points
            // Used to be called "tension" but was renamed for consistency. The old option name continues to work for compatibility.
            lineTension: 0.5,

            // String - the color to fill the area under the line with if fill is true
            //backgroundColor: "rgba(75,192,192,0.4)",

            // String - Line color
            borderColor: "rgb(70,0,130)",

            // String - cap style of the line. See https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/lineCap
            borderCapStyle: 'round',

            // Array - Length and spacing of dashes. See https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/setLineDash
            borderDash: [],

            // Number - Offset for line dashes. See https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/lineDashOffset
            borderDashOffset: 0.0,

            // String - line join style. See https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/lineJoin
            borderJoinStyle: 'miter',

            // The properties below allow an array to be specified to change the value of the item at the given index

            // String or Array - Point stroke color
            pointBorderColor: "black",
      borderWidth: 4,

            // String or Array - Point fill color
            pointBackgroundColor: "#fff",

            // Number or Array - Stroke width of point border
            pointBorderWidth: 0.5,

            // Number or Array - Radius of point when hovered
            pointHoverRadius: 5,

            // String or Array - point background color when hovered
            pointHoverBackgroundColor: "white",

            // String or Array - Point border color when hovered
            pointHoverBorderColor: "rgba(220,220,220,1)",

            // Number or Array - border width of point when hovered
            pointHoverBorderWidth: 2,

            // Number or Array - the pixel size of the point shape. Can be set to 0 to not render a circle over the point
            // Used to be called "radius" but was renamed for consistency. The old option name continues to work for compatibility.
            pointRadius: 1,

            // Number or Array - the pixel size of the non-displayed point that reacts to mouse hover events
            //
            // Used to be called "hitRadius" but was renamed for consistency. The old option name continues to work for compatibility.
            pointHitRadius: 10,

            // The actual data
            data: height,

            // String - If specified, binds the dataset to a certain y-axis. If not specified, the first y-axis is used. First id is y-axis-0
            yAxisID: "y-axis-0",
        },
    { label: 'Wind (mph)',

            // Boolean - if true fill the area under the line
            fill: false,

            // Tension - bezier curve tension of the line. Set to 0 to draw straight lines connecting points
            // Used to be called "tension" but was renamed for consistency. The old option name continues to work for compatibility.
            lineTension: 0.5,

            // String - the color to fill the area under the line with if fill is true
            //backgroundColor: "rgba(75,192,192,0.4)",

            // String - Line color
            borderColor: "rgb(102,255,178)",

            // String - cap style of the line. See https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/lineCap
            borderCapStyle: 'round',

            // Array - Length and spacing of dashes. See https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/setLineDash
            borderDash: [],

            // Number - Offset for line dashes. See https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/lineDashOffset
            borderDashOffset: 0.0,

            // String - line join style. See https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/lineJoin
            borderJoinStyle: 'miter',

            // The properties below allow an array to be specified to change the value of the item at the given index

            // String or Array - Point stroke color
            pointBorderColor: "black",
            borderWidth: 4,

            // String or Array - Point fill color
            pointBackgroundColor: "#fff",

            // Number or Array - Stroke width of point border
            pointBorderWidth: 0.5,

            // Number or Array - Radius of point when hovered
            pointHoverRadius: 5,

            // String or Array - point background color when hovered
            pointHoverBackgroundColor: "white",

            // String or Array - Point border color when hovered
            pointHoverBorderColor: "rgba(220,220,220,1)",

            // Number or Array - border width of point when hovered
            pointHoverBorderWidth: 2,

            // Number or Array - the pixel size of the point shape. Can be set to 0 to not render a circle over the point
            // Used to be called "radius" but was renamed for consistency. The old option name continues to work for compatibility.
            pointRadius: 1,

            // Number or Array - the pixel size of the non-displayed point that reacts to mouse hover events
            //
            // Used to be called "hitRadius" but was renamed for consistency. The old option name continues to work for compatibility.
            pointHitRadius: 10,
      
            // The actual data
            data: wind,

            // String - If specified, binds the dataset to a certain y-axis. If not specified, the first y-axis is used. First id is y-axis-0
            yAxisID: "y-axis-0",
          }]
    
};
  // Actually creates the graph
  var myLineChart = new Chart(ctx, {
    type: 'line',
    data: data,
    options: options
  });
};

function carouselInputChecker(userInput){
        if (userInput === ""){
           $("#emptyField").show();
           $("input").val("");
           $(".glyphicon-search").toggleClass("clicked");
           $(".ui-autocomplete-input").removeClass("clicked");
          //  $(".infoBar").toggleClass("openWhenClicked");
           $("searchText").addClass("emptySearch");

           return false;
        };
        if (userInput === "Rincon"){
          $("#img1").attr("style", "background-image: url('https://i.ytimg.com/vi/OFZqat_nAJs/maxresdefault.jpg')");
          $("#img2").attr("style", "background-image: url('http://www.surfer.com/wp-content/uploads/2013/04/damien-hobgood-taras.jpg')");
          $("#img3").attr("style", "background-image: url('http://earthmissions.com/wp-content/uploads/Rincon1.jpg')");
          $("#img4").attr("style", "background-image: url('http://santabarbaraca.com/content/uploads/2016/01/surfing-at-rincon.jpg')");
      }
      else if (userInput === "Blacks"){
        $("#img1").attr("style", "background-image: url('http://i.cdn-surfline.com/surfnews/images/2011/09_september/spotcheck_blacks/full/04.jpg')");
        $("#img2").attr("style", "background-image: url('http://a2.espncdn.com/photo/2014/0130/as_surf_blacks_beefsqueege_2048.jpg')");
        $("#img3").attr("style", "background-image: url('https://cdn.shopify.com/s/files/1/0972/4294/files/51.jpg?7832140550121852118')");
        $("#img4").attr("style", "background-image: url('http://cdn1.theinertia.com/wp-content/gallery/stephen-morissette/morissette_01.jpg')");
      }
      else {

      }
       }

  detailArrowClick();

    $("#submitBtn").on("click", function(){
      
       // Clears the time array (x-axis) so that the previous and current time array don't stack on top of each other
      surfSpot.timeArray = [];
      graphChecker = false;
      detailArrowClick();
      console.log("submit btn on click");
      // Gets the value entered into the textbox
      var userInput = $("#searchText").val().trim();
        // Checks if the user didn't enter anything but still clicked "Submit"
        // Will display an error and move elements on page accordingly
      
      console.log(userInput);
      // $(".glyphicon-menu-down").removeClass("clicked");
      $(".infoBar").removeClass("clicked");
      
      carouselInputChecker(userInput);
     
      $(".searchWrapper").removeClass("moveUp");
      $("input").removeClass('clicked').toggleClass("inputDisappear");
      $(".glyphicon-menu-down").removeClass("clicked");
      $(".glyphicon.glyphicon-search").show();
      $("input").addClass("clicked");
      $("#emptyField").hide();
      $("input").val("");
      $("#myChart").hide();
      $("infoBar").css("left", "20px");
      $(".glyphicon-search").toggleClass("clicked");
      

      for (i = 0; i < infoArray.length; i++){
        // Checks the user's input against the list, comparing spot names
        // Will set surfSpot objects' properties to values available in the "all" endpoint call used in the autocomplete AJAX call
        if(userInput == infoArray[i].spot_name){
          surfSpot.name = infoArray[i].spot_name;
          surfSpot.county = infoArray[i].county_name;
          surfSpot.lat = infoArray[i].latitude;
          surfSpot.long = infoArray[i].longitude;
          surfSpot.spotID = infoArray[i].spot_id;
        }
      }
        
        //gets the current hour to be passed to the ajax call, gets current conditions
        var hour = moment().format('hA');
        
        //  Gets surf height for spot searched at the hour it was searched
        ajaxSurfHeightCall(surfSpot.spotID, hour);
        
        // Pushes available data to page
        setHTML(surfSpot.name, surfSpot.surfHeight, surfSpot.condition, surfSpot.wind, surfSpot.windDirection, surfSpot.waterTemp);
        // Formats the county name to be used in another AJAX call
        // Forces lower case and changes spaces to a dash, ex. San Diego --> san-diego
        var countyFormatted = surfSpot.county.replace(" ", "-").toLowerCase();
        
        ajaxWindCall(countyFormatted, hour);
        ajaxWaterTemp(countyFormatted);
        ajaxTide(countyFormatted);
        // Last time html is updated with all available info
        setHTML(surfSpot.name, surfSpot.surfHeight, surfSpot.condition, surfSpot.wind, surfSpot.windDirection, surfSpot.waterTemp);   
        // Finally shows the infoBar that contains all the data from AJAX calls
        $(".infoBar").show();
        // Moves search area up to make room for data being displayed
        $(".searchWrapper").addClass("clicked");
        // Attaches a click event to the down arrow in info area
        detailArrowClick();
    })

// Formats the day to match a queryURL
function dayFormatter(day){
  if (day < 10){
    // Gets 2nd index of date to match expected queryURL, ex: 08 --> 8
    day = day[1];   
  }
}

// Updates page, with arguments being all information obtained from AJAX calls
function setHTML(spotName, surfHeight, condition, wind, windDirection, waterTemp){
  console.log(spotName);
  console.log("setHTML");
  
  if (spotName == "null"){
    spotName = 'Blacks';
  };
  
  // Adds a location image with the user's entered spot name
  $(".spotName").html("<i class = 'glyphicon glyphicon-map-marker'></i><span id='surf-current-spot' >"+ spotName +  "</span>").addClass("h2");
 
  // Adds a small wave icon as well as the surf height in feet
  $(".surfHeight").html("<img src = 'https://d30y9cdsu7xlg0.cloudfront.net/png/51723-200.png' height = '55px' width = '55px'><h2>" + surfHeight + " ft</h2>");
 
  // Adds thumbs up/down symbol to signify rating
  $("#poorFairGood").html("<i class = 'glyphicon glyphicon-thumbs-up'> </i><i class = 'glyphicon glyphicon-thumbs-down'></i><p>" + condition + "</p>" )
    // Color-codes the conditon text according to how good it is
    conditionsColor(condition);
  
  // Adds a wind icon and wind in mpg
  $(".wind").html("<img src = 'https://image.flaticon.com/icons/svg/56/56086.svg' height = '45px' width = '45px'><h3>" + wind + " mph</h3><i class = 'glyphicon glyphicon-arrow-left'></i>");
  // Color codes the wind directional arrow based on wind strength
  windColor(wind);
  
  // Adds an arrow and rotates it according to the direction (in degrees) obtained in ajaxWindCall
  $(".glyphicon-arrow-left").css("-webkit-transform" , "rotate(" + windDirection + "deg)");
  
  // Adds a water with thermometer icon and water temp in degrees Fahrenheit
  $(".waterTemp").html("<img src = 'http://icongal.com/gallery/image/6062/water_temperature_temperature.png' height = '45px' width = '45px'><h2>" + waterTemp + " F</h2>");
};

// Color-codes condition text based on overall quality, as reported by "forecast" API endpoint
function conditionsColor(condition){
  if (condition === "Poor"){
    $("#poorFairGood").css('color', 'red');
  }
  else if (condition === "Poor-Fair"){
    $("#poorFairGood").css('color', 'yellow');
  }
  else if (condition === "Fair"){
    $("#poorFairGood").css('color', 'rgb(100, 235, 0)');
  }
  else if (condition === "Good"){
    $("#poorFairGood").css('color', 'orange');
  }
}
// Color-codes wind arrow based on the wind strength
function windColor(wind){
  if (wind <= 5){
    $(".wind i").css('color', 'rgb(100, 235, 0)');
  }
  else if (wind > 5 && wind <= 10){
    $(".wind i").css('color', 'yellow');
  }
  else if (wind > 10){
    $(".wind i").css('color', 'red');
  }
}

// Action to be taken when down arrow below surf info is clicked
function detailArrowClick(){
  
  $(".glyphicon.glyphicon-menu-down").on("click", function(){
    // Moves basic information block up to make room for graph
    // Cycles through the x-axis information, replacing every three values with empty strings
    // This makes the x-axis only have 1/4 as many labels and makes it look much less cluttered
    for (i = 0; i < surfSpot.timeArray.length; i++){
      if ((i % 2 == 0 && i % 4 != 0) || i % 2 == 1){
        surfSpot.timeArray[i] = "";
      }
    }
    console.log(surfSpot.timeArray);
    // Creates the graphs with four arrays of data: x-axis, and 3 y-axis sets of data
    generateGraphs(surfSpot.timeArray, surfSpot.tidesArray, surfSpot.heightArray, surfSpot.windArray);
    // Allows the user to click the arrow multiple times, with smooth functionality
    // graphChecker is set to "false" initialy so will run through first if statement then to the second, and so on
    if (graphChecker === false){
    $("#myChart").show();
    $(".searchWrapper").addClass("moveUp");
    $(".infoBar").toggleClass("clicked");
    $(".glyphicon.glyphicon-menu-down").toggleClass("clicked");
    graphChecker = true;
  }
  else {
    $("#myChart").hide();
    $(".searchWrapper").removeClass("moveUp");
    $(".glyphicon.glyphicon-menu-down").toggleClass("clicked");
    $(".infoBar").toggleClass("clicked");
    graphChecker = false;
  }
  })
}
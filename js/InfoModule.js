// Get weather information from openweather.org (AppKeyID = 6138fbb0dc207d7a4c5358909e205b06)


var InfoModule = (function () {


  function parseWeatherText(jsonText)
  {
	  var resObject = JSON.parse(jsonText);
	  return resObject.weather[0].description;
  }

  // Expose these functions via an interface while hiding
  // the implementation of the module within the function() block

  return {

	// [param]city name = i.e. Pittsburgh,us
	// [param] doneEventHandler = After parsed weather information
	// e,g, InfoModule.getWeatherByCity("Pittsburgh,us", function(){});
	getWeatherByCity: function(cityName, doneEventHandler){
		var xhr = new XMLHttpRequest();

		xhr.open('GET', "https://api.openweathermap.org/data/2.5/weather?q=" + cityName + "&APPID=6138fbb0dc207d7a4c5358909e205b06", true);
		xhr.send();

		xhr.onreadystatechange = processRequest;

		function processRequest(e) {
			// e = 0 => unsent
			// e = 1 => opened
			// e = 2 => Header recieved
			// 3 = 3 => Loading
			// e = 4 = > done
			if(xhr.readyState == 4){

				if(doneEventHandler){
                    var currentWeather = parseWeatherText(xhr.responseText);
					doneEventHandler(currentWeather);

				}
			}
		}
	},



  }
})();


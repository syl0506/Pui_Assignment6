


$(document).ready(function () {

$(document).scrollTop(0);
//Check if it is scrolling or not
window.IsAchorMode = false;


//For smooth scrolling
$('.navItem').click(function (e) {
            e.preventDefault();
            var curLink = $(this);

			var navBar = $('.navItem');


			for(var n =0; n < navBar.length; n++)
			{

				if(curLink[0].innerHTML == navBar[n].innerHTML)
				{

					curLink.addClass("navActive");
				}
				else
				{
					$(navBar[n]).removeClass("navActive");
				}

			}

			window.IsAchorMode = true;
            var scrollPoint = $(curLink.attr('href')).position().top;
            $('body,html').animate(
			{
                scrollTop: scrollPoint
            },
			{
				duration: 300,
				complete: function() {

					setTimeout( function(){
						window.IsAchorMode = false;
						// Do something after 0.8 second
					  }  , 80 );



				}
			});
        })


//Handle scrolling and navigation animation.
$(window).scroll(function () {
            onScrollHandle();
        });


//Handle scrolling and navigation animation.
function onScrollHandle() {

      //If it is moving do not take in input
		if(window.IsAchorMode == true) return;

		var currentScrollPos = $(document).scrollTop();
		var divIds = ["landing_Animation", "portfolio", "about"];

		var foundedIndex = -1;

		for(var i =0 ;i < divIds.length; i++)
		{
			var item = $('#' + divIds[i]);

			var itemOffset = item.offset();
			itemOffset.bottom = itemOffset.top + item.height();


      //compare the scrolled amount to the position of the href and find the position
			if(itemOffset.top <= currentScrollPos && currentScrollPos <= itemOffset.bottom)
			{
				foundedIndex = i;

				break;
			}

		}
    //Change the navigation according to what is found.

		var navBar = $('.navItem');

		for(var n =0; n < navBar.length; n++)
		{
			if(foundedIndex == n)
				$(navBar[n]).addClass("navActive");
			else
				$(navBar[n]).removeClass("navActive");
		}


}

//Portfolio filter

$grid = $('.grid');
$grid.isotope();

$('.filter-button').click(function() {

  var id = $(this).attr('data-filter');

  if (id== '*') {
    $grid.isotope({
      filter: '*'
    });
    return false;
  }
  $grid.isotope({
    filter: id
  });
});



//Get Weather Data


var weatherParameters = {"clouds" : ["cloudy", "CLOUDY", "clouds"],
                            "sky" : ["sunny", "SUNNY", "tree"],
                            "rain": ["rainy", "RAINING", "umbrella"],
                            "snow": ["snowy", "SNOWING", "hat"]
                          }


InfoModule.getWeatherByCity("Pittsburgh,us", function(weather){
  var weather = weather.split(" ");
  var currentW;
  var weatherTxt = $('#weather_Txt');
  if (weather.length == 1){
    currentW = weather[0];
  }else{
    currentW = weather[1];
  }

//Start stage according to the weather
  var currentStage = weatherParameters[currentW];
  BStageManager.startStage(currentStage[0]);
  $('#weather').text(currentStage[1]);
  $("#object").text(currentStage[2]) ;

});

//Change weather when button is clicked

$('.weather_Toggle').click(function(){
  var buttons = $('.weather_Toggle');
  for (button in buttons){
    if ($(button).hasClass("active")){
      $(button).removeClass("active");
    }
  }
  $(this).addClass("active");
  var stage = $(this).attr('id');
  var currentStage = weatherParameters[stage];
  BStageManager.startStage(currentStage[0]);
  $("#object").text(currentStage[2]);


});

//Change content div when each portfolio item is clicked from home

$('.item').click(function(){


    var items = $('.content');
    var currentItem = $(this).attr('id');



    if (currentItem != undefined){
      $(document).scrollTop(0);

      for (var i=0; i<items.length;i++){
        if ($(items[i]).hasClass("active")){
          $(items[i]).removeClass("active");
        }
      }

      $("#"+currentItem+"_detail").addClass("active");}
  });



// If they are in one of the portfolio item page go to home
// Select all links with hashes
$('a[href*="#"]')
  // Remove links that don't actually link to anything
  .not('[href="#"]')
  .not('[href="#0"]')
  .click(function(event) {
    var items = $('.content');

    for (var i=0; i<items.length;i++){
      if ($(items[i]).hasClass("active") && $(items[i]).attr("id") != "home"){
        $(document).scrollTop(0);

        for (var i=0; i<items.length;i++){
          if ($(items[i]).hasClass("active")){
            $(items[i]).removeClass("active");
          }
        }
        $("#home").addClass("active");
      }
    }

  });

});




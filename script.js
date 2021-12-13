//api key
const apiKey = '45f469664e37c781b87272989d626c9a'
  

// Selectors for HTML elements to display weather information
const cityEl = $('h2#city');
const dateEl = $('h3#date');
const weatherIconEl = $('img#weather-icon');
const temperatureEl = $('span#temperature');
const humidityEl = $('span#humidity');
const windEl = $('span#wind');
const uvIndexEl = $('span#uv-index');
const cityListEl = $('div.cityList');

// Selectors for form elements
const cityInput = $('#city-input');

// past searched cities
let pastCities = [];

//sort cities
function compare(a, b) {

   const cityA = a.city.toUpperCase();
   const cityB = b.city.toUpperCase();

   let comparison = 0;
   if (cityA > cityB) {
       comparison = 1;
   } else if (cityA < cityB) {
       comparison = -1;
   }
   return comparison;
}

// local storage functions for past searched cities

function loadCities() {
    const storedCities = JSON.parse(localStorage.getItem('pastCities'));
    if (storedCities) {
        pastCities = storedCities;
    }
}

// store searched cities in local storage
function storeCities() {
    localStorage.setItem('pastCities', JSON.stringify(pastCities));
}

// function from url

function buildURLFromInputs(city) {
    if (city) {
        return `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}`;
    }
}



 // display past city search
 function displayCities(pastCities) {
    cityListEl.empty();
    pastCities.splice(5);
    let sortedCities = [...pastCities];
    sortedCities.sort(compare);
    sortedCities.forEach(function (location) {
        let cityDiv = $('<div>').addClass('col-12 city');
        let cityBtn = $('<button>').addClass('btn btn-light city-btn').text(location.city);
        cityDiv.append(cityBtn);
        cityListEl.append(cityDiv);
    });
}



// call api for weather data
function searchWeather(queryURL) {

    // ajax call
    $.ajax({
        url: queryURL,
        method: 'GET'
    }).then(function (response) {

        // save cities
        let city = response.name;
        let id = response.id;
        // no repeats
        if (pastCities[0]) {
            pastCities = $.grep(pastCities, function (storedCity) {
                return id !== storedCity.id;
            })
        }
        pastCities.unshift({ city, id });
        storeCities();
        displayCities(pastCities);
        
        // dom element for current weather
        cityEl.text(response.name);
        let formattedDate = moment.unix(response.dt).format('L');
        dateEl.text(formattedDate);
        let weatherIcon = response.weather[0].icon;
        weatherIconEl.attr('src', `http://openweathermap.org/img/wn/${weatherIcon}.png`).attr('alt', response.weather[0].description);
        temperatureEl.html(((response.main.temp - 273.15) * 1.8 + 32).toFixed(1));
        humidityEl.text(response.main.humidity);
        windEl.text((response.wind.speed * 2.237).toFixed(1));

        // open weather api for uv index
        let lat = response.coord.lat;
        let lon = response.coord.lon;
        let queryURLAll = `https://api.openweathermap.org/data/2.5/onecall?lat=${lat}&lon=${lon}&appid=${apiKey}`;
        $.ajax({
            url: queryURLAll,
            method: 'GET'
        }).then(function (response) {
            let uvIndex = response.current.uvi;
            let uvColor = setUVIndexColor(uvIndex);
            uvIndexEl.text(response.current.uvi);
            uvIndexEl.attr('style', `background-color: ${uvColor}; color: ${uvColor === "yellow" ? "black" : "white"}`);
            let fiveDay = response.daily;

            // dom elements for 5day forecast
            for (let i = 0; i <= 5; i++) {
                let currDay = fiveDay[i];
                $(`div.day-${i} .card-title`).text(moment.unix(currDay.dt).format('L'));
                $(`div.day-${i} .fiveDay-img`).attr(
                    'src',
                    `http://openweathermap.org/img/wn/${currDay.weather[0].icon}.png`
                ).attr('alt', currDay.weather[0].description);
                $(`div.day-${i} .fiveDay-temp`).text(((currDay.temp.day - 273.15) * 1.8 + 32).toFixed(1));
                $(`div.day-${i} .fiveDay-humid`).text(currDay.humidity);
            }
        });
    });
}

 // display last search city
 function displayLastSearchedCity() {
    if (pastCities[0]) {
        let queryURL = buildURLFromId(pastCities[0].id);
        searchWeather(queryURL);
    } 
}

// Click handler for search button
$('#search-btn').on('click', function (event) {
    // Preventing the button from trying to submit the form
    event.preventDefault();

    // retrieve city input
    let city = cityInput.val().trim();
    city = city.replace(' ', '%20');

    // clear input
    cityInput.val('');

    //url for city inputs
    if (city) {
        let queryURL = buildURLFromInputs(city);
        searchWeather(queryURL);
    }
}); 







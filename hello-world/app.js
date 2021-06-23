const axios = require('axios')
const tinycolor = require("tinycolor2");
const hexToColorName = require("hex-to-color-name");

const API_KEY = ''; //TODO: Make private via env config
const CITY_ID = 2179537; // maps to wellington. Move to env config
const FORECAST_DAYS = 1; // get today's forecast
const url = `https://api.openweathermap.org/data/2.5/forecast/daily?id=${CITY_ID}&cnt=${FORECAST_DAYS}&appid=${API_KEY}&units=metric`;
let response;

/**
 *
 * Event doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html#api-gateway-simple-proxy-for-lambda-input-format
 * @param {Object} event - API Gateway Lambda Proxy Input Format
 *
 * Context doc: https://docs.aws.amazon.com/lambda/latest/dg/nodejs-prog-model-context.html
 * @param {Object} context
 *
 * Return doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html
 * @returns {Object} object - API Gateway Lambda Proxy Output Format
 *
 *
 * // Query openweathermap to get current temperature + weather forecast
 * // Based on the weather category (e.g. puffer jacket for Snow), windcheater for drizzle, Hoodie or sweater for clouds with low temperatures
 * // tshirt for clear and normal temperature
 * // Get matching turban colour based on contrast using chroma js library
 * // Build a message.
 */
exports.lambdaHandler = async (event, context) => {
    try {
        // const weatherResponse = await axios(url);
        const weatherResponse = mockWeatherResponse();

        const weatherToday = weatherResponse.data.list[0];
        const dayTemperature = weatherToday.feels_like.day;

        // Weather description
        // Groups we will use to determine clothing to wear are: Clouds, Clear, Snow, Rain, Drizzle, Thunderstorm
        // Get coldest temperature during the day and use to
        // Use the group to grab the appropriate top to wear.
        // Use the colour from top to get a matching bottom to wear. Obviously we dont want to get shorts when its cold!!!

        // Get top
        // if temperature is cold or (at most normal and windy), then recommend sweatshirts
        // else recommend shirt


        // if cold or windy or temperature is low, then dont get shorts.
        // order by date worn and get the first item.

        // if drizzle or rain then offer a rain cheater in addition
        // if very windy or rain or very cold then offer puffer jacket in addition

        // Get contrasting turban to the shirt or sweatshirt
        // Need to return a matching turban colour


        // get secondary colour from clothing if it exists.
        // if not, then choose the primary colour.
        const colour = tinycolor("red");
        const colourRecommendation = [];
        if (colour.isValid()) {
            let complement = colour.complement();
            colourRecommendation.push(hexToColorName(complement.toHexString(), colorMap));
        }

        let secondaryColour = false
        if (secondaryColour){
            colourRecommendation.push("red");
        } else {
            colourRecommendation.push("red");
        }

        const message =
            "Good Morning!  ☀️ 💦 🌤 ⛈ \n" +
            `Today there will be ${weatherToday.weather.description}\n` +
            "\n" +
            `day: ${weatherToday.feels_like.day.toFixed(0)}°C\n` +
            `night: ${weatherToday.feels_like.night.toFixed(0)}°C\n` +
            `high: ${weatherToday.temp.max.toString()}°C\n` +
            `low: ${weatherToday.temp.min.toString()}°C\n` +
            `wind: ${weatherToday.speed.toFixed(0)} KPH\n` +
            "\n" +
            `Recommend you wear Nike Red Jumper with black chino and either ${colourRecommendation[0]} or ${colourRecommendation[1]} turban.` +
            "\n" +
            "Have a good day! 🎉🎉 🎉 🎉";

        response = {
            'statusCode': 200,
            'body': JSON.stringify({
                message: message,
            })
        }
    } catch (err) {
        console.log(err);
        return err;
    }

    return response
};

function mockWeatherResponse() {
    const weatherData = {
        "city": {
            "id": 2179537,
            "name": "Wellington",
            "coord": {
                "lon": 174.7756,
                "lat": -41.2866
            },
            "country": "NZ",
            "population": 1000000,
            "timezone": 43200
        },
        "cod": "200",
        "message": 17.9210067,
        "cnt": 1,
        "list": [
            {
                "dt": 1624406400,
                "sunrise": 1624391236,
                "sunset": 1624424321,
                "temp": {
                    "day": 11.37,
                    "min": 8.79,
                    "max": 11.44,
                    "night": 10.05,
                    "eve": 9.27,
                    "morn": 9.19
                },
                "feels_like": {
                    "day": 10.47,
                    "night": 9.17,
                    "eve": 8.24,
                    "morn": 6.83
                },
                "pressure": 1024,
                "humidity": 73,
                "weather": [
                    {
                        "id": 803,
                        "main": "Clouds",
                        "description": "broken clouds",
                        "icon": "04d"
                    }
                ],
                "speed": 6.23,
                "deg": 179,
                "gust": 8.98,
                "clouds": 80,
                "pop": 0.31
            }
        ]
    };
    return {"data": weatherData};
}

var colorMap = {
    "White": "#FFFFFF",
    "Gray": "#808080",
    "Black": "#000000",
    "Red": "#FF0000",
    "Maroon": "#800000",
    "Yellow": "#FFFF00",
    "Orange": "#FFA500",
    "Olive": "#808000",
    "Green": "#008000",
    "Dark Green": "#006400",
    "Aqua": "#00FFFF",
    "Teal": "#008080",
    "Blue": "#0000FF",
    "Dark Blue": "#00008B",
    "Navy": "#000080",
    "Fuchsia": "#FF00FF",
    "Pink": "#FFC0CB",
    "Purple": "#800080",
    "Violet": "#EE82EE"
}
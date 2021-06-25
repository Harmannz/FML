const axios = require('axios')
const tinycolor = require("tinycolor2");
const hexToColorName = require("hex-to-color-name");
const AWS = require('aws-sdk')
AWS.config.update({region: process.env.AWS_REGION || 'us-east-1'})
const sns = new AWS.SNS();
const docClient = new AWS.DynamoDB.DocumentClient();

const FORECAST_DAYS = 1; // get today's forecast
const url = `https://api.openweathermap.org/data/2.5/forecast/daily?id=${process.env.CITY_ID}&cnt=${FORECAST_DAYS}&appid=${process.env.OWMAPIKEY}&units=metric`;
const colorMap = {
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
};

const pants = ["Black Chino", "Blue Chino", "Blue Jeans"];

function getTurbanColoursMessage(colourRecommendation) {
    if (colourRecommendation.length > 1) {
        return `and either ${colourRecommendation[0]} or ${colourRecommendation[1]} turban`;
    } else if (colourRecommendation.length === 1) {
        return `and ${colourRecommendation[0]} turban`;
    } else {
        return "";
    }
}

// dont have time to query pants so going to choose random for now
function randomPants() {

    return pants[Math.floor(Math.random()*pants.length)]
}

function checkReallyWet(weatherCategory) {
    // category is one of Clouds, Clear, Snow, Rain, Drizzle, Thunderstorm
    let weatherCategoryUpper = weatherCategory.toUpperCase();
    if (weatherCategoryUpper == "SNOW" || weatherCategoryUpper == "THUNDERSTORM") {
        return "Dont forget your puffer jacket!!!"
    } else if (weatherCategoryUpper == "RAIN" || weatherCategoryUpper == "DRIZZLE") {
        return "Take your rain jacket!!!"
    }
}

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
    if (!process.env.OWMAPIKEY) {
        throw new Error("Error reading API KEY");
    }

    let response;
    try {

        const weatherResponse = await axios({"url": url, timeout: 2000});

        const weatherToday = weatherResponse.data.list[0];

        // if temperature is cold or (at most normal and windy), then recommend sweatshirts
        let typeOfTop;
        if (weatherToday.feels_like.day < 16 || (weatherToday.feels_like.day <= 20 && weatherToday.speed > 10)) {
            typeOfTop = "sweatshirt";
        } else {
            typeOfTop = "shirt"
        }

        const DBparams = {
            TableName: 'harmans-app-ClothesCatalog-1CNOHXJCFFP0E',
            ExpressionAttributeNames: {'#name': 'type'},
            FilterExpression: "#name = :val",
            ExpressionAttributeValues: {":val": typeOfTop}
        }
        // should limit the result but I havent learnt that yet and Im running out of time.

        let data = await docClient.scan(DBparams).promise();

        data.Items.sort(compareItems);

        let top;
        if(data.Count > 0) {
            // get first item
            top = data.Items[0];
        } else {
            // default
            top = {"name": "Nike Jumper", "type": "sweatshirt", "colour": "Red", "lastWorn": Date.now()}
        }

        const colour = tinycolor(top.colour);
        const colourRecommendation = [];


        if (colour.isValid()) {
            let complement = colour.complement();
            colourRecommendation.push(hexToColorName(complement.toHexString(), colorMap));
        }

        if (colourRecommendation[0].toUpperCase() !== top.colour.toUpperCase()) {
            colourRecommendation.push(top.colour);
        }

        const message =
            "Good Morning!  ☀️ 💦 🌤 ⛈ \n" +
            `Today there will be ${weatherToday.weather[0].description}\n` +
            "\n" +
            `day: ${weatherToday.feels_like.day.toFixed(0)}°C\n` +
            `night: ${weatherToday.feels_like.night.toFixed(0)}°C\n` +
            `high: ${weatherToday.temp.max.toString()}°C\n` +
            `low: ${weatherToday.temp.min.toString()}°C\n` +
            `wind: ${weatherToday.speed.toFixed(0)} KPH\n` +
            "\n" +
            `Recommend you wear ${top.name} with ${randomPants()} ${getTurbanColoursMessage(colourRecommendation)}. ${checkReallyWet(weatherToday.weather[0].main)}` +
            "\n" +

            "Have a good day! 🎉🎉 🎉 🎉";

        const params = {
            Message: message,
            Subject: "Test SNS From Lambda",
            TopicArn: "arn:aws:sns:us-east-1:892579079126:ClothesRecommender"
        };

        sns.publish(params, (data, err) => {
            if (err) {
                throw new Error(`Unable to publish to sns: ${JSON.stringify(err)}`);
            }
        });
        response = {
            'statusCode': 200,
            "headers": {
                "Access-Control-Allow-Origin": "*"
            },
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

function compareItems( a, b ) {
    if ( a.lastWorn < b.lastWorn ){
        return -1;
    }
    if ( a.lastWorn > b.lastWorn ){
        return 1;
    }
    return 0;
}

const axios = require('axios')
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
 */
exports.lambdaHandler = async (event, context) => {
    try {
        const ret = await axios(url);
        // Weather description
        // Groups we will use to determine clothing to wear are: Clouds, Clear, Snow, Rain, Drizzle, Thunderstorm
        // Get coldest temperature during the day and use to
        // Use the group to grab the appropriate top to wear.
        // Use the colour from top to get a matching bottom to wear. Obviously we dont want to get shorts when its cold!!!
        //
        response = {
            'statusCode': 200,
            'body': JSON.stringify({
                message: 'hello world',
                location: ret
            })
        }
    } catch (err) {
        console.log(err);
        return err;
    }

    return response
};

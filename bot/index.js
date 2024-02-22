'use strict';

// Imports dependencies and set up http server
const express = require('express'),
  bodyParser = require('body-parser'),
  app = express().use(bodyParser.json()); // creates express http server

const {
  queryGraph,
  getBasicInfo,
  getFullInfo,
  getOnlyPrice,
  queryCovidAPI,
} = require('../shared');

const ACCESS_TOKEN =
  'EAAKZALbjqTtIBOypnVTrP4SOb55SVexC51J2FSyZA1II3VwCtY1LNwQRCNHxnwZCxZAe3q2azHK7WP25MtJUIsMEBDt3BSgFqmp1eiaFRKTGgl4lZBF1HEueVNFxVT97GZCfi4oGMZC8uA7zPwFEokxhIf2fqyEISKRnZC3pJbZCq6Dka5jfk8wmzXPXCvYBJlfVv';

const DEFAULT_RESPONSE = `Disculpa 😔 no te entendí.
Si quieres saber sobre información de una moneda, escribe por favor 'información de MONEDA'.
Ej: información del bitcoin`;

// Sets server port and logs message on success
app.listen(process.env.PORT || 1337, () => console.log('webhook is listening'));

// Creates the endpoint for our webhook
app.post('/webhook', (req, res) => {
  let body = req.body;

  // Checks this is an event from a page subscription
  if (body.object === 'page') {
    // Iterates over each entry - there may be multiple if batched
    body.entry.forEach(function (entry) {
      // Gets the message. entry.messaging is an array, but
      // will only ever contain one message, so we get index 0
      if (entry.messaging.length == 0) {
        return;
      }

      let webhook_event = entry.messaging[0];
      let message = webhook_event.message;
      if (message != null && message.nlp != null) {
        getMessageFromNlp(message.nlp).then((res) => {
          var messageReply = {
            recipient: {
              id: webhook_event.sender.id,
            },
            message: {
              text: res,
            },
          };
          queryGraph(messageReply, ACCESS_TOKEN);
        });
      }
    });

    // Returns a '200 OK' response to all requests
    res.status(200).send('EVENT_RECEIVED');
  } else {
    // Returns a '404 Not Found' if event is not from a page subscription
    res.sendStatus(404);
  }
});

// en esta función debo colocar todos los intents que están definidos en wit, para que vaya a su función maenejadora
async function getMessageFromNlp(nlp) {
  if (nlp.intents.length == 0) {
    return DEFAULT_RESPONSE;
  }

  switch (nlp.intents[0].name) {
    case 'info_intent':
      return await getInfoResponse(nlp.entities);
    case 'price_intent':
      return await getPriceResponse(nlp.entities);
    case 'sentiment_intent':
      return await getSentimentResponse(nlp.traits.sentiment);
    case 'greetings_intent':
      return `Hola 👋🏻 soy tu chatbot de confianza para precios del mercado de criptomonedas 😎\nPuedes pedirme información, información completa o solamente precio de la criptomoneda de tu preferencia.\nHay algo en lo que te pueda ayudar? 👀`;
    default:
      return DEFAULT_RESPONSE;
  }
}

// función manejadora para los intents relacionados con información
async function getInfoResponse(entities) {
  console.log(entities);

  var coin = '';
  var isInfo = false;

  // null checker
  if (
    entities['coin:coin'] == null &&
    entities['basic_info:basic_info'] == null &&
    entities['full_info:full_info'] == null
  ) {
    return DEFAULT_RESPONSE;
  }

  if (entities['full_info:full_info'] == null) {
    entities['coin:coin'].forEach(function (c) {
      coin = c.body;
    });

    entities['basic_info:basic_info'].forEach(function (c) {
      if (
        c.value == 'info' ||
        c.value == 'información' ||
        c.value == 'informacion'
      ) {
        isInfo = true;
      }
    });

    if (isInfo && coin != '') {
      var res = await getCases(coin.toLowerCase(), 'basic_info'); // ERROR
      var current_price = res[0];
      var high_24h = res[1];
      var low_24h = res[2];
      return `${coin.toLocaleUpperCase()}
      💵Precio: ${current_price} 
      📈Max 24h: ${high_24h} 
      📉Low 24h: ${low_24h} 
      \nCuál es tu impresión? 👀`;
    } else if (isInfo) {
      return 'Caray, parece que a alguien se le olvidó escribir la criptomoneda? vuelve a intentarlo con la criptomoneda que te interesa conocer la información';
    }
  }

  if (entities['basic_info:basic_info'] == null) {
    entities['coin:coin'].forEach(function (c) {
      coin = c.body;
    });

    entities['full_info:full_info'].forEach(function (c) {
      if (
        c.value == 'información detallada' ||
        c.value == 'informacion detallada' ||
        c.value == 'información completa' ||
        c.value == 'informacion completa' ||
        c.value == 'info detallada' ||
        c.value == 'info completa'
      ) {
        isInfo = true;
      }
    });

    if (isInfo && coin != '') {
      var res = await getCases(coin.toLowerCase(), 'full_info'); // ERROR
      var current_price = res[0];
      var high_24h = res[1];
      var low_24h = res[2];
      var market_cap = res[3];
      var market_cap_rank = res[4];
      var price_change_24h = res[5];
      var price_change_percentage_24h = res[6];
      var market_cap_change_percentage_24h = res[7];
      var circulating_supply = res[8];
      var total_supply = res[9];
      return `${coin.toLocaleUpperCase()} - Información completa
      💵Precio: ${current_price} 
      📈Max 24h: ${high_24h} 
      📉Low 24h: ${low_24h}
      💰Market Cap: ${market_cap}
      🏆Market Cap Rank: ${market_cap_rank}
      📊Price Change: ${price_change_24h}
      💸Price Change %: ${price_change_percentage_24h}
      🪙Market Cap Change %: ${market_cap_change_percentage_24h}
      🔄️Circulante: ${circulating_supply}
      📌Suministro total: ${total_supply}
      \nCuál es tu impresión? 👀`;
    } else if (isInfo) {
      return 'Caray, parece que a alguien se le olvidó escribir la criptomoneda? vuelve a intentarlo con la criptomoneda que te interesa conocer la información';
    }
  }

  return DEFAULT_RESPONSE;
}

// función manejadora para la entitie only_price
async function getPriceResponse(entities) {
  console.log(entities);

  var coin = '';
  var isPrice = false;

  // null checker
  if (
    entities['coin:coin'] == null ||
    entities['only_price:only_price'] == null
  ) {
    return DEFAULT_RESPONSE;
  }

  entities['coin:coin'].forEach(function (c) {
    coin = c.body;
  });

  entities['only_price:only_price'].forEach(function (c) {
    if (c.value == 'cuánto' || c.value == 'precio') {
      isPrice = true;
    }
  });

  if (isPrice && coin != '') {
    var res = await getCases(coin.toLowerCase(), 'only_price'); // ERROR
    var current_price = res[0];
    return `El precio de ${coin.toLocaleUpperCase()} es: ${current_price} 💵
      \nCuál es tu impresión? 👀`;
  } else if (isPrice) {
    return 'Caray, parece que a alguien se le olvidó escribir la criptomoneda? vuelve a intentarlo con la criptomoneda que te interesa conocer la información';
  }
}

// function to hit API for get total cases and confirm cases
async function getCases(coin, entitie) {
  switch (entitie) {
    case 'basic_info':
      // initial number with random - variables que vamos a usar para este caso
      var current_price = 0;
      var high_24h = 0;
      var low_24h = 0;

      await getBasicInfo(coin).then((res) => {
        // undefined checker
        if (res == undefined || res.length != 3) {
          return [current_price, high_24h, low_24h];
        }
        // assign when has the data
        if (res[0] > 0) {
          current_price = res[0];
        }
        if (res[1] > 0) {
          high_24h = res[1];
        }
        if (res[2] > 0) {
          low_24h = res[2];
        }
      });
      return [current_price, high_24h, low_24h];

    case 'full_info':
      // initial number with random - variables que vamos a usar para este caso
      var current_price = 0;
      var high_24h = 0;
      var low_24h = 0;
      var market_cap = 0;
      var market_cap_rank = 0;
      var price_change_24h = 0;
      var price_change_percentage_24h = 0;
      var market_cap_change_percentage_24h = 0;
      var circulating_supply = 0;
      var total_supply = 0;

      await getFullInfo(coin).then((res) => {
        // undefined checker
        if (res == undefined || res.length != 10) {
          return [
            current_price,
            high_24h,
            low_24h,
            market_cap,
            market_cap_rank,
            price_change_24h,
            price_change_percentage_24h,
            market_cap_change_percentage_24h,
            circulating_supply,
            total_supply,
          ];
        }
        // assign when has the data
        if (res[0] > 0) {
          current_price = res[0];
        }
        if (res[1] > 0) {
          high_24h = res[1];
        }
        if (res[2] > 0) {
          low_24h = res[2];
        }
        if (res[3] > 0) {
          market_cap = res[3];
        }
        if (res[4] > 0) {
          market_cap_rank = res[4];
        }
        if (res[5] > 0) {
          price_change_24h = res[5];
        }
        if (res[6] > 0) {
          price_change_percentage_24h = res[6];
        }
        if (res[7] > 0) {
          market_cap_change_percentage_24h = res[7];
        }
        if (res[8] > 0) {
          circulating_supply = res[8];
        }
        if (res[9] > 0) {
          total_supply = res[9];
        }
      });
      return [
        current_price,
        high_24h,
        low_24h,
        market_cap,
        market_cap_rank,
        price_change_24h,
        price_change_percentage_24h,
        market_cap_change_percentage_24h,
        circulating_supply,
        total_supply,
      ];
    case 'only_price':
      // initial number with random - variables que vamos a usar para este caso
      var current_price = 0;

      await getOnlyPrice(coin).then((res) => {
        // undefined checker
        if (res == undefined || res.length != 1) {
          return [current_price];
        }
        // assign when has the data
        if (res[0] > 0) {
          current_price = res[0];
        }
      });
      return [current_price];

    default:
      break;
  }
}

function getEntitiesValue() {
  const Wit = require('node-wit').Wit;
  const client = new Wit({ accessToken: 'YOUR_ACCESS_TOKEN' }); // Obtenga todas las entidades
  client.entities.list().then((entities) => {
    // Para cada entidad, obtenga los valores posibles
    entities.forEach((entity) => {
      client.entities.getValues(entity.name).then((values) => {
        console.log(
          `Los valores posibles para la entidad ${entity.name} son:, ${values}`
        );
      });
    });
  });
}

// function getRandomNumber(start, end) {
//   return Math.floor(Math.random() * end - start) + start;
// }

function getSentimentResponse(sentiment) {
  if (sentiment === undefined) {
    return 'Hola! Hay algo en lo que te pueda ayudar? 👀';
  }

  console.log(sentiment[0].value);
  if (sentiment[0].value === 'positive') {
    return 'Grandioso, espero que sea ventajoso para tí! 🤙🏻';
  }

  return 'Vaya 😔 aunque ya sabes lo que dicen: nunca vendas en rojo.';
}

// Adds support for GET requests to our webhook
app.get('/webhook', (req, res) => {
  // Your verify token. Should be a random string.
  let VERIFY_TOKEN = 'gusi.to';

  // Parse the query params
  let mode = req.query['hub.mode'];
  let token = req.query['hub.verify_token'];
  let challenge = req.query['hub.challenge'];

  // Checks if a token and mode is in the query string of the request
  if (mode && token) {
    // Checks the mode and token sent is correct
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      // Responds with the challenge token from the request
      console.log('WEBHOOK_VERIFIED');
      res.status(200).send(challenge);
    } else {
      // Responds with '403 Forbidden' if verify tokens do not match
      res.sendStatus(403);
    }
  }
});

const readline = require('readline');
const fetch = require('node-fetch');

// ------------------------------------------------------------
// Config

const NEW_ACCESS_TOKEN = 'Q47TPXCJRYHVX2V5NIESMFGFCRVGTTE7'; // TODO: fill this in
const FIREBASE_CONFIG = {}; // TODO: fill this in
const APP_ID = '991716978467057'; // TODO: fill this in

// ------------------------------------------------------------
// Wit API Calls

function queryWit(text, n = 1) {
  return fetch(
    `https://api.wit.ai/message?v=${APP_ID}&=n=${n}&q=${encodeURIComponent(
      text
    )}`,
    {
      headers: {
        Authorization: `Bearer ${NEW_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
    }
  ).then((res) => res.json());
}

function validateUtterances(samples) {
  console.log(JSON.stringify(samples));
  return fetch(`https://api.wit.ai/utterances?v=${APP_ID}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${NEW_ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(samples),
  }).then((res) => res.json());
}

function queryGraph(json, access_token) {
  return fetch(
    `https://graph.facebook.com/v8.0/me/messages?access_token=${access_token}`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${NEW_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(json),
    }
  ).then((res) => res.json());
}

// this has to change, the api doesnt work

queryCovidAPI = async () => {
  // fetch from API
  const resp = await fetch(
    `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=false`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'User-Agent': '*',
      },
    }
  );

  // //init data
  var data = await resp.json();
  return data;
};

async function getBasicInfo(coin) {
  var current_price = 0;
  var high_24h = 0;
  var low_24h = 0;

  await queryCovidAPI().then((res) => {
    var data = res;
    //init data

    coin = coin.toLowerCase();

    // must include intended location
    if (JSON.stringify(data).toLowerCase().includes(coin)) {
      const loko = data.filter((item) => item.id.toLowerCase() == coin);

      if (loko) {
        current_price = loko[0].current_price;
        high_24h = loko[0].high_24h;
        low_24h = loko[0].low_24h;
      }
    }
  });

  return [current_price, high_24h, low_24h];
}

async function getFullInfo(coin) {
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

  await queryCovidAPI().then((res) => {
    var data = res;
    //init data

    coin = coin.toLowerCase();

    // must include intended location
    if (JSON.stringify(data).toLowerCase().includes(coin)) {
      const loko = data.filter((item) => item.id.toLowerCase() == coin);

      if (loko) {
        current_price = loko[0].current_price;
        high_24h = loko[0].high_24h;
        low_24h = loko[0].low_24h;
        market_cap = loko[0].market_cap;
        market_cap_rank = loko[0].market_cap_rank;
        price_change_24h = loko[0].price_change_24h;
        price_change_percentage_24h = loko[0].price_change_percentage_24h;
        market_cap_change_percentage_24h =
          loko[0].market_cap_change_percentage_24h;
        circulating_supply = loko[0].circulating_supply;
        total_supply = loko[0].total_supply;
      }
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
}

async function getOnlyPrice(coin) {
  var current_price = 0;

  await queryCovidAPI().then((res) => {
    var data = res;
    //init data

    coin = coin.toLowerCase();

    // must include intended location
    if (JSON.stringify(data).toLowerCase().includes(coin)) {
      const loko = data.filter((item) => item.id.toLowerCase() == coin);

      if (loko) {
        current_price = loko[0].current_price;
      }
    }
  });

  return [current_price];
}

module.exports = {
  queryWit,
  validateUtterances,
  queryGraph,
  getBasicInfo,
  getFullInfo,
  getOnlyPrice,
  queryCovidAPI,
  NEW_ACCESS_TOKEN,
  FIREBASE_CONFIG,
};

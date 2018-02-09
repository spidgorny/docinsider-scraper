"use strict";
exports.__esModule = true;
var fs = require("fs");
var stringify = require('csv-stringify');
var input = fs.readFileSync('data/Zahnarzt-Berlin.json');
var data = JSON.parse(input.toString());
stringify(data, function (err, output) {
    console.log(output);
    fs.writeFileSync('data/Zahnarzt-Berlin.csv', output);
});

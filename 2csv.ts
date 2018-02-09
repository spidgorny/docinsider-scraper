import * as fs from "fs";
const stringify = require('csv-stringify');

const input = fs.readFileSync('data/Zahnarzt-Berlin.json');
const data = JSON.parse(input.toString());
stringify(data, function(err, output){
	console.log(output);
	fs.writeFileSync('data/Zahnarzt-Berlin.csv', output);
});

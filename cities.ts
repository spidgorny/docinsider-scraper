import * as fs from "fs";

const puppeteer = require('puppeteer');

async function getCities(page) {
	let cities = {};
	if (fs.existsSync('cities.json')) {
		const json = fs.readFileSync('cities.json');
		cities = JSON.parse(json.toString());
	} else {
		cities = await page.$$eval('div.left-innen div ul li a', (set) => {
			const cities = {};
			set.forEach(a => {
				console.log(a);
				const name = a.innerText;
				cities[name] = a.href;
			});
			return cities;
		});
		fs.writeFileSync('cities.json',
			JSON.stringify(cities));
	}
	return cities;
}

async function getDoctors(page, cityLink) {
	console.log('cityLink', cityLink);
	await page.goto(cityLink);
	console.log('loaded');
	return await page.$$eval('div.suchergebnis_boxInstant', (set) => {
		console.log('set', set.length);
		const doctors = [];
		set.map(div => {
			const img = div.querySelector('div.suchergebnis_bild img');
			const face = img ? img.getAttribute('src') : null;
			const a = div.querySelector('h1.suchergebnis_titel a');
			const addr = div.querySelector('address');
			const address = addr ? addr.innerText.trim() : null;
			let job = div.querySelector('span.diesearchfg');
			job = job ? job.innerText.trim() : null;
			if (a && a.innerText) {
				doctors.push({
					name: a.innerText,
					details: a.getAttribute('href'),
					address,
					face,
					job
				});
			} else {
				console.log(a);
			}
		});
		console.log('processed', doctors.length);
		return doctors;
	});
}

(async () => {
	const browser = await puppeteer.launch();
	const page = await browser.newPage();
	const berlinZahn = 'http://www.docinsider.de/#/search?q=Zahnarzt&place=Berlin%2C%20Deutschland&lat=52.519171&lng=13.406091199999992&sort=relevance&distance=50';
	// await page.goto(berlinZahn);

	page.on('console', msg => {
		for (let i = 0; i < msg.args.length; ++i)
			console.log(`${i}: ${msg.args[i]}`);
	});

	// const cities = await getCities(page);
	// console.log('cities', cities);

	// for (let city in cities) {
	// 	console.log('== ', city);
	// 	let cityLink = cities[city];
		let doctors = await getDoctors(page, berlinZahn);
		console.log(doctors);
	// }

	await browser.close();
})();


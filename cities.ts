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

async function scrollDown(page) {
	for (let i = 0; i < 10; i++) {
		try {
			console.log('scrollDown', i);
			// await Promise.all([
			await page.waitForNavigation({
				timeout: 5000,
				waitUntil: 'networkidle0',
			});
			await page.evaluate(() => {
				window.scrollTo(0, document.body.scrollHeight);
			});
			// ]);

		} catch (e) {
			console.error(e);
			break;
		}
	}
}

async function scrollDown2(page) {
	console.log('scrollDown');
	return page.evaluate(() => {
		return new Promise((resolve, reject) => {
			function getDocHeight() {
				var D = document;
				return Math.max(
					D.body.scrollHeight, D.documentElement.scrollHeight,
					D.body.offsetHeight, D.documentElement.offsetHeight,
					D.body.clientHeight, D.documentElement.clientHeight
				);
			}

			function scrollWhile(i) {
				window.scrollTo(0, document.body.scrollHeight);
				setTimeout(() => {
					let diff = Math.floor(getDocHeight() - window.scrollY);
					console.log(i, getDocHeight(), window.scrollY, diff, window.innerHeight);
					if (diff > window.innerHeight && i) {
						scrollWhile(i--);
					} else {
						resolve();
					}
				}, 1000);
			}

			scrollWhile(10);
		});
	});
}

async function getDoctors(page, cityLink) {
	console.log('cityLink', cityLink);
	await page.goto(cityLink);
	console.log('loaded');
	await scrollDown2(page);
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
	const browser = await puppeteer.launch({
		headless: false,
	});
	const page = await browser.newPage();
	const berlinZahn = 'http://www.docinsider.de/#/search?q=Zahnarzt&place=Berlin%2C%20Deutschland&lat=52.519171&lng=13.406091199999992&sort=relevance&distance=50';
	// await page.goto(berlinZahn);

	page.on('console', msg => {
		for (let i = 0; i < msg.args.length; ++i) {
			console.log(`${i}: ${msg.args[i]}`);
		}
	});
	page.evaluate(() => console.log('hello', 5, {foo: 'bar'}));

	// const cities = await getCities(page);
	// console.log('cities', cities);

	// for (let city in cities) {
	// 	console.log('== ', city);
	// 	let cityLink = cities[city];
		let doctors = await getDoctors(page, berlinZahn);
		console.log(doctors);
	// }
	fs.writeFileSync('data/Zahnarzt-Berlin.json',
		JSON.stringify(doctors));

	await browser.close();
})();


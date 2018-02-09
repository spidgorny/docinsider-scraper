import * as fs from "fs";

const puppeteer = require('puppeteer');

async function getDoctors(page, doc: DocInfo) {
	console.log(doc.details);
	await page.goto(doc.details);
	console.log('->', await page.url());
	await Promise.all([
		page.click('div#ap_hierklicken'),
		page.waitForNavigation({
			timeout: 10000
		})
	]);
	return await page.$eval('span[itemprop="email"]', (el) => el.innerText.trim());
}

function save(filename, data) {
	fs.writeFileSync(filename, JSON.stringify(data, null, 4));
}

(async () => {
	const browser = await puppeteer.launch({
		headless: true,
	});
	const page = await browser.newPage();
	await page.setViewport({width: 1280, height: 1024, deviceScaleFactor: 1});

	page.on('console', msg => {
		for (let i = 0; i < msg.args.length; ++i) {
			console.log(`${i}: ${msg.args[i]}`);
		}
	});
	page.evaluate(() => console.log('hello', 5, {foo: 'bar'}));

	try {
		let file = 'data/Zahnarzt-Berlin.json';
		const json = fs.readFileSync(file);
		const doctors: DocInfo[] = JSON.parse(json.toString());
		console.log('doctors', doctors.length);

		for (let doc of doctors) {
			console.log('== ', doc.name);
			if (doc.email) continue;
			try {
				let docMail = await getDoctors(page, doc);
				console.log(docMail);
				doc.email = docMail;
				save(file, doctors);
			} catch (e) {
				console.error(e);
			}
		}
	} catch (e) {
		console.error(e);
	} finally {
		await browser.close();
	}

})();


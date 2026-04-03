const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');
const { parseStringPromise } = require('xml2js');

const app = express();
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

let cachedThreats = [];
let lastFetchTime = 0;
const CACHE_TTL = 180000;

const countryCoords = {
    'United States': { lat: 39.8, lng: -98.5 },
    'Russia': { lat: 61.5, lng: 105.3 },
    'China': { lat: 35.8, lng: 104.2 },
    'United Kingdom': { lat: 55.4, lng: -3.4 },
    'Germany': { lat: 51.2, lng: 10.4 },
    'France': { lat: 46.2, lng: 2.2 },
    'India': { lat: 20.6, lng: 79.0 },
    'Brazil': { lat: -14.2, lng: -51.9 },
    'Japan': { lat: 36.2, lng: 138.3 },
    'Australia': { lat: -25.3, lng: 133.8 },
    'Canada': { lat: 56.1, lng: -106.3 },
    'Iran': { lat: 32.4, lng: 53.7 },
    'North Korea': { lat: 40.3, lng: 127.5 },
    'Israel': { lat: 31.0, lng: 34.8 },
    'Ukraine': { lat: 48.4, lng: 31.2 },
    'Poland': { lat: 51.9, lng: 19.1 },
    'Italy': { lat: 41.9, lng: 12.6 },
    'Spain': { lat: 40.5, lng: -3.7 },
    'Netherlands': { lat: 52.1, lng: 5.3 },
    'Sweden': { lat: 60.1, lng: 18.6 },
    'South Korea': { lat: 35.9, lng: 127.8 },
    'Turkey': { lat: 39.0, lng: 35.2 },
    'Saudi Arabia': { lat: 23.9, lng: 45.1 },
    'Pakistan': { lat: 30.4, lng: 69.3 },
    'Indonesia': { lat: -0.8, lng: 113.9 },
    'Mexico': { lat: 23.6, lng: -102.5 },
    'Argentina': { lat: -38.4, lng: -63.6 },
    'South Africa': { lat: -30.6, lng: 22.9 },
    'Egypt': { lat: 26.8, lng: 30.8 },
    'Singapore': { lat: 1.35, lng: 103.8 },
    'Thailand': { lat: 15.9, lng: 100.9 },
    'Vietnam': { lat: 14.1, lng: 108.3 },
    'Philippines': { lat: 12.9, lng: 121.8 },
    'Malaysia': { lat: 4.2, lng: 101.9 },
    'Romania': { lat: 45.9, lng: 25.0 },
    'Czech Republic': { lat: 49.8, lng: 15.5 },
    'Hungary': { lat: 47.2, lng: 19.5 },
    'Belgium': { lat: 50.5, lng: 4.5 },
    'Switzerland': { lat: 46.8, lng: 8.2 },
    'Austria': { lat: 47.5, lng: 14.6 },
    'Portugal': { lat: 39.4, lng: -8.2 },
    'Greece': { lat: 39.1, lng: 21.8 },
    'Ireland': { lat: 53.1, lng: -7.7 },
    'Denmark': { lat: 56.3, lng: 9.5 },
    'Finland': { lat: 61.9, lng: 25.7 },
    'New Zealand': { lat: -40.9, lng: 174.9 },
    'Chile': { lat: -35.7, lng: -71.5 },
    'Colombia': { lat: 4.6, lng: -74.3 },
    'Peru': { lat: -9.2, lng: -75.0 },
    'Iraq': { lat: 33.2, lng: 43.7 },
    'Syria': { lat: 34.8, lng: 39.0 },
    'Afghanistan': { lat: 33.9, lng: 67.7 },
    'Bangladesh': { lat: 23.7, lng: 90.4 },
    'Ethiopia': { lat: 9.1, lng: 40.5 },
    'Morocco': { lat: 31.8, lng: -7.1 },
    'Algeria': { lat: 28.0, lng: 1.7 },
    'Tunisia': { lat: 33.9, lng: 9.5 },
    'Libya': { lat: 26.3, lng: 17.2 },
    'Sudan': { lat: 12.9, lng: 30.2 },
    'Yemen': { lat: 15.6, lng: 48.5 },
    'Oman': { lat: 21.5, lng: 55.9 },
    'Qatar': { lat: 25.4, lng: 51.2 },
    'Kuwait': { lat: 29.3, lng: 47.5 },
    'United Arab Emirates': { lat: 23.4, lng: 53.8 },
    'Jordan': { lat: 30.6, lng: 36.2 },
    'Lebanon': { lat: 33.9, lng: 35.9 },
    'Estonia': { lat: 58.6, lng: 25.0 },
    'Latvia': { lat: 56.9, lng: 24.6 },
    'Lithuania': { lat: 55.2, lng: 23.9 },
    'Belarus': { lat: 53.7, lng: 27.9 },
    'Georgia': { lat: 42.3, lng: 43.4 },
    'Armenia': { lat: 40.1, lng: 45.0 },
    'Azerbaijan': { lat: 40.1, lng: 47.6 },
    'Kazakhstan': { lat: 48.0, lng: 66.9 },
    'Uzbekistan': { lat: 41.4, lng: 64.6 },
    'Mongolia': { lat: 46.9, lng: 103.8 },
    'Nepal': { lat: 28.4, lng: 84.1 },
    'Sri Lanka': { lat: 7.9, lng: 80.8 },
    'Cuba': { lat: 21.5, lng: -77.8 },
    'Iceland': { lat: 64.9, lng: -19.0 },
    'Luxembourg': { lat: 49.8, lng: 6.1 },
    'Slovakia': { lat: 48.7, lng: 19.7 },
    'Slovenia': { lat: 46.2, lng: 14.9 },
    'Croatia': { lat: 45.1, lng: 15.2 },
    'Serbia': { lat: 44.0, lng: 21.0 },
    'Bulgaria': { lat: 42.7, lng: 25.5 },
    'Albania': { lat: 41.2, lng: 20.2 },
    'Cyprus': { lat: 35.1, lng: 33.4 },
    'Malta': { lat: 35.9, lng: 14.4 },
    'Ghana': { lat: 7.9, lng: -1.0 },
    'Senegal': { lat: 14.5, lng: -14.5 },
    'Cameroon': { lat: 7.4, lng: 12.4 },
    'Uganda': { lat: 1.4, lng: 32.3 },
    'Mozambique': { lat: -18.7, lng: 35.5 },
    'Angola': { lat: -11.2, lng: 17.9 },
    'Zimbabwe': { lat: -19.0, lng: 29.2 },
    'Zambia': { lat: -13.1, lng: 27.8 },
    'Botswana': { lat: -22.3, lng: 24.7 },
    'Namibia': { lat: -22.0, lng: 18.5 },
    'Madagascar': { lat: -18.8, lng: 46.9 },
    'Fiji': { lat: -17.7, lng: 178.1 },
    'Papua New Guinea': { lat: -6.3, lng: 144.0 },
    'Brunei': { lat: 4.5, lng: 114.7 },
    'Laos': { lat: 19.9, lng: 102.5 },
    'Bhutan': { lat: 27.5, lng: 90.4 },
    'Maldives': { lat: 3.2, lng: 73.2 },
    'Tajikistan': { lat: 38.9, lng: 71.3 },
    'Kyrgyzstan': { lat: 41.2, lng: 74.8 },
    'Turkmenistan': { lat: 38.9, lng: 59.6 },
    'Unknown': { lat: 0, lng: 0 }
};

// City/region to country mapping for better detection
const cityToCountry = {
    'tehran': 'Iran', 'isfahan': 'Iran', 'tabriz': 'Iran', 'mashhad': 'Iran', 'shiraz': 'Iran',
    'kharg': 'Iran', 'qeshm': 'Iran', 'hormuz': 'Iran', 'karaj': 'Iran',
    'moscow': 'Russia', 'st petersburg': 'Russia', 'novosibirsk': 'Russia',
    'beijing': 'China', 'shanghai': 'China', 'shenzhen': 'China', 'hong kong': 'China',
    'london': 'United Kingdom', 'manchester': 'United Kingdom', 'birmingham': 'United Kingdom',
    'berlin': 'Germany', 'munich': 'Germany', 'frankfurt': 'Germany',
    'paris': 'France', 'marseille': 'France', 'lyon': 'France',
    'new delhi': 'India', 'mumbai': 'India', 'bangalore': 'India', 'chennai': 'India',
    'kolkata': 'India', 'hyderabad': 'India', 'pune': 'India', 'ahmedabad': 'India',
    'tokyo': 'Japan', 'osaka': 'Japan', 'kyoto': 'Japan',
    'sydney': 'Australia', 'melbourne': 'Australia', 'brisbane': 'Australia',
    'toronto': 'Canada', 'vancouver': 'Canada', 'montreal': 'Canada',
    'washington': 'United States', 'new york': 'United States', 'los angeles': 'United States',
    'chicago': 'United States', 'houston': 'United States', 'san francisco': 'United States',
    'kyiv': 'Ukraine', 'kiev': 'Ukraine', 'odessa': 'Ukraine', 'kharkiv': 'Ukraine',
    'tel aviv': 'Israel', 'jerusalem': 'Israel', 'haifa': 'Israel', 'gaza': 'Israel',
    'baghdad': 'Iraq', 'basra': 'Iraq', 'erbil': 'Iraq',
    'damascus': 'Syria', 'aleppo': 'Syria',
    'kabul': 'Afghanistan',
    'riyadh': 'Saudi Arabia', 'jeddah': 'Saudi Arabia', 'mecca': 'Saudi Arabia',
    'islamabad': 'Pakistan', 'karachi': 'Pakistan', 'lahore': 'Pakistan',
    'jakarta': 'Indonesia', 'bali': 'Indonesia',
    'cairo': 'Egypt', 'alexandria': 'Egypt',
    'bangkok': 'Thailand',
    'manila': 'Philippines',
    'kuala lumpur': 'Malaysia',
    'singapore': 'Singapore',
    'seoul': 'South Korea', 'busan': 'South Korea',
    'ankara': 'Turkey', 'istanbul': 'Turkey',
    'dubai': 'United Arab Emirates', 'abu dhabi': 'United Arab Emirates',
    'doha': 'Qatar',
    'kuwait city': 'Kuwait',
    'muscat': 'Oman',
    'beirut': 'Lebanon',
    'amman': 'Jordan',
    'sanaa': 'Yemen',
    'tripoli': 'Libya',
    'algiers': 'Algeria',
    'tunis': 'Tunisia',
    'rabat': 'Morocco',
    'khartoum': 'Sudan',
    'addis ababa': 'Ethiopia',
    'nairobi': 'Kenya',
    'lagos': 'Nigeria',
    'accra': 'Ghana',
    'johannesburg': 'South Africa', 'cape town': 'South Africa',
    'brasilia': 'Brazil', 'sao paulo': 'Brazil', 'rio': 'Brazil',
    'buenos aires': 'Argentina',
    'mexico city': 'Mexico',
    'bogota': 'Colombia',
    'lima': 'Peru',
    'santiago': 'Chile',
    'havana': 'Cuba',
    'reykjavik': 'Iceland',
    'vienna': 'Austria',
    'brussels': 'Belgium',
    'bern': 'Switzerland', 'zurich': 'Switzerland',
    'lisbon': 'Portugal',
    'athens': 'Greece',
    'dublin': 'Ireland',
    'copenhagen': 'Denmark',
    'stockholm': 'Sweden',
    'helsinki': 'Finland',
    'oslo': 'Norway',
    'warsaw': 'Poland',
    'prague': 'Czech Republic',
    'budapest': 'Hungary',
    'bucharest': 'Romania',
    'sofia': 'Bulgaria',
    'belgrade': 'Serbia',
    'zagreb': 'Croatia',
    'ljubljana': 'Slovenia',
    'bratislava': 'Slovakia',
    'tallinn': 'Estonia',
    'riga': 'Latvia',
    'vilnius': 'Lithuania',
    'minsk': 'Belarus',
    'tbilisi': 'Georgia',
    'yerevan': 'Armenia',
    'baku': 'Azerbaijan',
    'astana': 'Kazakhstan',
    'tashkent': 'Uzbekistan',
    'ulaanbaatar': 'Mongolia',
    'kathmandu': 'Nepal',
    'colombo': 'Sri Lanka',
    'dhaka': 'Bangladesh',
    'yangon': 'Myanmar',
    'phnom penh': 'Cambodia',
    'hanoi': 'Vietnam',
    'wellington': 'New Zealand', 'auckland': 'New Zealand',
    'nassau': 'Bahamas',
    'kingston': 'Jamaica',
    'santo domingo': 'Dominican Republic',
    'san jose': 'Costa Rica',
    'panama city': 'Panama',
    'quito': 'Ecuador',
    'la paz': 'Bolivia',
    'asuncion': 'Paraguay',
    'montevideo': 'Uruguay',
    'nicosia': 'Cyprus',
    'valletta': 'Malta',
    'tirana': 'Albania',
    'skopje': 'North Macedonia',
    'sarajevo': 'Bosnia and Herzegovina',
    'podgorica': 'Montenegro',
    'pristina': 'Kosovo',
    'chisinau': 'Moldova',
    'kyoto': 'Japan',
    'pyongyang': 'North Korea',
    'hanoi': 'Vietnam',
    'vientiane': 'Laos',
    'thimphu': 'Bhutan',
    'male': 'Maldives',
    'dushanbe': 'Tajikistan',
    'bishkek': 'Kyrgyzstan',
    'ashgabat': 'Turkmenistan',
    'bandar seri begawan': 'Brunei',
    'dili': 'Timor-Leste',
    'suva': 'Fiji',
    'port moresby': 'Papua New Guinea',
    'antarctica': 'Unknown'
};

function categorizeThreat(text) {
    const t = text.toLowerCase();
    if (t.includes('war') || t.includes('military') || t.includes('strike') || t.includes('bomb') || t.includes('missile') || t.includes('conflict') || t.includes('invasion') || t.includes('ceasefire') || t.includes('sanction') || t.includes('drone attack') || t.includes('airstrike') || t.includes('artillery') || t.includes('troop') || t.includes('frontline') || t.includes('truce') || t.includes('escalation')) return 'war';
    if (t.includes('ransomware')) return 'ransomware';
    if (t.includes('malware') || t.includes('virus') || t.includes('trojan') || t.includes('botnet') || t.includes('elf') || t.includes('mips')) return 'malware';
    if (t.includes('breach') || t.includes('leak') || t.includes('data theft') || t.includes('exfiltrat')) return 'breach';
    if (t.includes('exploit') || t.includes('vulnerability') || t.includes('cve') || t.includes('patch')) return 'exploit';
    if (t.includes('cyberattack') || t.includes('phishing') || t.includes('ransomware attack')) return 'hack';
    return 'other';
}

function determineSeverity(type) {
    switch (type) {
        case 'ransomware': return 'critical';
        case 'war': return 'critical';
        case 'breach': return 'high';
        case 'exploit': return 'high';
        case 'malware': return 'medium';
        case 'hack': return 'medium';
        default: return 'low';
    }
}

function extractCountry(text) {
    if (!text) return 'Unknown';
    const t = text.toLowerCase();
    // Check cities/regions first (more specific)
    for (const [city, country] of Object.entries(cityToCountry)) {
        if (t.includes(city)) return country;
    }
    // Then check country names (longer first)
    const sorted = Object.keys(countryCoords).filter(c => c !== 'Unknown').sort((a, b) => b.length - a.length);
    for (const country of sorted) {
        if (t.includes(country.toLowerCase())) return country;
    }
    return 'Unknown';
}

function getCoords(country) {
    return countryCoords[country] || countryCoords['Unknown'];
}

function jitter(coords) {
    return {
        lat: coords.lat + (Math.random() - 0.5) * 12,
        lng: coords.lng + (Math.random() - 0.5) * 12
    };
}

async function fetchCISA() {
    const threats = [];
    try {
        const res = await axios.get('https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json', { timeout: 15000 });
        const vulns = res.data.vulnerabilities || [];
        const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000);
        let id = 1;
        for (const v of vulns) {
            const added = new Date(v.dateAdded);
            if (added < cutoff) continue;
            const text = `${v.shortDescription} ${v.vendorProject || ''} ${v.product || ''} ${v.cveID || ''}`;
            const country = extractCountry(text);
            const coords = jitter(getCoords(country));
            const type = categorizeThreat(text);
            threats.push({
                id: id++, source: 'CISA KEV',
                title: `${v.cveID}: ${v.shortDescription}`,
                description: `Vendor: ${v.vendorProject || 'N/A'} | Product: ${v.product || 'N/A'}`,
                url: `https://nvd.nist.gov/vuln/detail/${v.cveID}`,
                timestamp: v.dateAdded, country, type,
                severity: determineSeverity(type),
                lat: coords.lat, lng: coords.lng
            });
        }
        console.log(`CISA: ${threats.length}`);
    } catch (e) { console.error('CISA:', e.message); }
    return threats;
}

async function fetchURLhaus() {
    const threats = [];
    try {
        const res = await axios.get('https://urlhaus.abuse.ch/downloads/json_recent/', { timeout: 15000 });
        const data = res.data;
        const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000);
        let id = 1000;
        for (const [urlId, entries] of Object.entries(data)) {
            if (!Array.isArray(entries)) continue;
            for (const entry of entries) {
                const added = new Date(entry.dateadded);
                if (added < cutoff) continue;
                const text = `${entry.url} ${entry.threat || ''} ${(entry.tags || []).join(' ')}`;
                const country = extractCountry(text);
                const coords = jitter(getCoords(country));
                const type = categorizeThreat(text);
                threats.push({
                    id: id++, source: 'URLhaus',
                    title: `Malware: ${entry.url.substring(0, 80)}`,
                    description: `Threat: ${entry.threat || 'Unknown'} | Tags: ${(entry.tags || []).join(', ')}`,
                    url: entry.url, timestamp: entry.dateadded,
                    country, type, severity: determineSeverity(type),
                    lat: coords.lat, lng: coords.lng
                });
                if (threats.length >= 100) break;
            }
            if (threats.length >= 100) break;
        }
        console.log(`URLhaus: ${threats.length}`);
    } catch (e) { console.error('URLhaus:', e.message); }
    return threats;
}

async function fetchRSSFeed(url, sourceName) {
    const threats = [];
    try {
        const res = await axios.get(url, { timeout: 10000 });
        const result = await parseStringPromise(res.data);
        const items = result.rss?.channel?.[0]?.item || result.feed?.entry || [];
        const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000);
        let id = 2000 + Math.floor(Math.random() * 1000);
        for (const item of items.slice(0, 50)) {
            const title = item.title?.[0] || item.title?._ || '';
            const link = item.link?.[0]?.$?.href || item.link?.[0] || '';
            const desc = (item.description?.[0] || item.summary?.[0]?._ || item['content:encoded']?.[0] || '').replace(/<[^>]*>/g, '');
            const pubDate = item.pubDate?.[0] || item.updated?.[0] || item.published?.[0] || new Date().toISOString();
            const added = new Date(pubDate);
            if (added < cutoff) continue;
            const text = `${title} ${desc}`;
            const country = extractCountry(text);
            const coords = jitter(getCoords(country));
            const type = categorizeThreat(text);
            threats.push({
                id: id++, source: sourceName,
                title: title.substring(0, 120),
                description: desc.substring(0, 200),
                url: link, timestamp: pubDate,
                country, type, severity: determineSeverity(type),
                lat: coords.lat, lng: coords.lng
            });
        }
        console.log(`${sourceName}: ${threats.length}`);
    } catch (e) { console.error(`${sourceName}:`, e.message); }
    return threats;
}

async function fetchThreats() {
    const now = Date.now();
    if (now - lastFetchTime < CACHE_TTL && cachedThreats.length > 0) return cachedThreats;

    console.log('Fetching from all sources...');
    const [cisa, urlhaus, hackernews, bleeping, securityweek, bbc, aljazeera, nyt, guardian, defense, googleIran, googleWar, googleUkraine, et, toi, hindu, moneycontrol, livemint] = await Promise.all([
        fetchCISA(),
        fetchURLhaus(),
        fetchRSSFeed('https://feeds.feedburner.com/TheHackersNews', 'The Hacker News'),
        fetchRSSFeed('https://www.bleepingcomputer.com/feed/', 'BleepingComputer'),
        fetchRSSFeed('https://www.securityweek.com/feed/', 'SecurityWeek'),
        fetchRSSFeed('https://feeds.bbci.co.uk/news/world/rss.xml', 'BBC World'),
        fetchRSSFeed('https://www.aljazeera.com/xml/rss/all.xml', 'Al Jazeera'),
        fetchRSSFeed('https://rss.nytimes.com/services/xml/rss/nyt/World.xml', 'NYT World'),
        fetchRSSFeed('https://www.theguardian.com/world/rss', 'Guardian World'),
        fetchRSSFeed('https://www.defensenews.com/arc/outboundfeeds/rss/', 'Defense News'),
        fetchRSSFeed('https://news.google.com/rss/search?q=iran+war+OR+iran+attack+OR+iran+military+OR+iran+strike&hl=en-US&gl=US&ceid=US:en', 'Google Iran'),
        fetchRSSFeed('https://news.google.com/rss/search?q=war+OR+military+strike+OR+missile+attack+OR+ceasefire+OR+escalation&hl=en-US&gl=US&ceid=US:en', 'Google War'),
        fetchRSSFeed('https://news.google.com/rss/search?q=ukraine+war+OR+ukraine+russia+OR+ukraine+attack&hl=en-US&gl=US&ceid=US:en', 'Google Ukraine'),
        fetchRSSFeed('https://economictimes.indiatimes.com/rssfeedstopstories.cms', 'Economic Times'),
        fetchRSSFeed('https://timesofindia.indiatimes.com/rssfeedstopstories.cms', 'Times of India'),
        fetchRSSFeed('https://www.thehindu.com/news/national/feeder/default.rss', 'The Hindu'),
        fetchRSSFeed('https://www.moneycontrol.com/rss/latestnews.xml', 'Moneycontrol'),
        fetchRSSFeed('https://www.livemint.com/rss', 'Livemint')
    ]);

    const all = [...cisa, ...urlhaus, ...hackernews, ...bleeping, ...securityweek, ...bbc, ...aljazeera, ...nyt, ...guardian, ...defense, ...googleIran, ...googleWar, ...googleUkraine, ...et, ...toi, ...hindu, ...moneycontrol, ...livemint];
    // Filter out Unknown countries
    const threats = all.filter(t => t.country !== 'Unknown').sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    cachedThreats = threats;
    lastFetchTime = now;
    const unknownCount = all.length - threats.length;
    console.log(`Total: ${threats.length} (filtered ${unknownCount} Unknown) (CISA:${cisa.length} URLhaus:${urlhaus.length} THN:${hackernews.length} BC:${bleeping.length} SW:${securityweek.length} BBC:${bbc.length} AJ:${aljazeera.length} NYT:${nyt.length} Guardian:${guardian.length} Defense:${defense.length} Iran:${googleIran.length} War:${googleWar.length} UA:${googleUkraine.length} ET:${et.length} TOI:${toi.length} Hindu:${hindu.length} MC:${moneycontrol.length} Mint:${livemint.length})`);
    return threats;
}

app.get('/api/threats', async (req, res) => {
    try {
        const threats = await fetchThreats();
        res.json(threats);
    } catch (error) {
        console.error('API error:', error.message);
        res.status(500).json({ error: 'Failed to fetch threats' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

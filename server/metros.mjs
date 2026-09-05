/**
 * Major U.S. metros for ZIP matching, the v4 hiring atlas, and company footprints.
 * Coordinates are city centroids (WGS84) for Albers USA projection.
 */
export const METROS = [
  { cbsa: '41860', cbsaName: 'San Francisco-Oakland-Berkeley, CA', msaSize: 'Large', seeds: ['94402'], lat: 37.7749, lng: -122.4194, short: 'San Francisco', match: [/san francisco|oakland|berkeley|san mateo|palo alto|fremont/i] },
  { cbsa: '41940', cbsaName: 'San Jose-Sunnyvale-Santa Clara, CA', msaSize: 'Large', seeds: ['95113'], lat: 37.3382, lng: -121.8863, short: 'San Jose', match: [/san jose|sunnyvale|santa clara|mountain view|cupertino/i] },
  { cbsa: '31080', cbsaName: 'Los Angeles-Long Beach-Anaheim, CA', msaSize: 'Large', seeds: ['90012'], lat: 34.0522, lng: -118.2437, short: 'Los Angeles', match: [/los angeles|long beach|anaheim|pasadena|santa monica/i] },
  { cbsa: '41740', cbsaName: 'San Diego-Chula Vista-Carlsbad, CA', msaSize: 'Large', seeds: ['92101'], lat: 32.7157, lng: -117.1611, short: 'San Diego', match: [/san diego|chula vista|carlsbad/i] },
  { cbsa: '40900', cbsaName: 'Sacramento-Roseville-Folsom, CA', msaSize: 'Large', seeds: ['95814'], lat: 38.5816, lng: -121.4944, short: 'Sacramento', match: [/sacramento|roseville|folsom/i] },
  { cbsa: '35620', cbsaName: 'New York-Newark-Jersey City, NY-NJ-PA', msaSize: 'Large', seeds: ['10001'], lat: 40.7128, lng: -74.006, short: 'New York', match: [/new york|brooklyn|manhattan|newark|jersey city/i] },
  { cbsa: '14460', cbsaName: 'Boston-Cambridge-Newton, MA-NH', msaSize: 'Large', seeds: ['02108'], lat: 42.3601, lng: -71.0589, short: 'Boston', match: [/boston|cambridge|somerville/i] },
  { cbsa: '47900', cbsaName: 'Washington-Arlington-Alexandria, DC-VA-MD-WV', msaSize: 'Large', seeds: ['20001'], lat: 38.9072, lng: -77.0369, short: 'Washington DC', match: [/washington|arlington|alexandria|dc\b/i] },
  { cbsa: '37980', cbsaName: 'Philadelphia-Camden-Wilmington, PA-NJ-DE-MD', msaSize: 'Large', seeds: ['19103'], lat: 39.9526, lng: -75.1652, short: 'Philadelphia', match: [/philadelphia|camden|wilmington/i] },
  { cbsa: '12580', cbsaName: 'Baltimore-Columbia-Towson, MD', msaSize: 'Large', seeds: ['21202'], lat: 39.2904, lng: -76.6122, short: 'Baltimore', match: [/baltimore|towson/i] },
  { cbsa: '38300', cbsaName: 'Pittsburgh, PA', msaSize: 'Large', seeds: ['15222'], lat: 40.4406, lng: -79.9959, short: 'Pittsburgh', match: [/pittsburgh/i] },
  { cbsa: '12060', cbsaName: 'Atlanta-Sandy Springs-Alpharetta, GA', msaSize: 'Large', seeds: ['30301'], lat: 33.749, lng: -84.388, short: 'Atlanta', match: [/atlanta|sandy springs/i] },
  { cbsa: '33100', cbsaName: 'Miami-Fort Lauderdale-Pompano Beach, FL', msaSize: 'Large', seeds: ['33131'], lat: 25.7617, lng: -80.1918, short: 'Miami', match: [/miami|fort lauderdale|pompano/i] },
  { cbsa: '36740', cbsaName: 'Orlando-Kissimmee-Sanford, FL', msaSize: 'Large', seeds: ['32801'], lat: 28.5383, lng: -81.3792, short: 'Orlando', match: [/orlando|kissimmee/i] },
  { cbsa: '45300', cbsaName: 'Tampa-St. Petersburg-Clearwater, FL', msaSize: 'Large', seeds: ['33602'], lat: 27.9506, lng: -82.4572, short: 'Tampa', match: [/tampa|st\.? petersburg|clearwater/i] },
  { cbsa: '16740', cbsaName: 'Charlotte-Concord-Gastonia, NC-SC', msaSize: 'Large', seeds: ['28202'], lat: 35.2271, lng: -80.8431, short: 'Charlotte', match: [/charlotte|concord|gastonia/i] },
  { cbsa: '39580', cbsaName: 'Raleigh-Cary, NC', msaSize: 'Large', seeds: ['27601'], lat: 35.7796, lng: -78.6382, short: 'Raleigh', match: [/raleigh|cary|durham/i] },
  { cbsa: '34980', cbsaName: 'Nashville-Davidson--Murfreesboro--Franklin, TN', msaSize: 'Large', seeds: ['37203'], lat: 36.1627, lng: -86.7816, short: 'Nashville', match: [/nashville|murfreesboro/i] },
  { cbsa: '16980', cbsaName: 'Chicago-Naperville-Elgin, IL-IN-WI', msaSize: 'Large', seeds: ['60601'], lat: 41.8781, lng: -87.6298, short: 'Chicago', match: [/chicago|naperville|evanston/i] },
  { cbsa: '19820', cbsaName: 'Detroit-Warren-Dearborn, MI', msaSize: 'Large', seeds: ['48226'], lat: 42.3314, lng: -83.0458, short: 'Detroit', match: [/detroit|warren|dearborn/i] },
  { cbsa: '33460', cbsaName: 'Minneapolis-St. Paul-Bloomington, MN-WI', msaSize: 'Large', seeds: ['55401'], lat: 44.9778, lng: -93.265, short: 'Minneapolis', match: [/minneapolis|st\.? paul|bloomington, mn/i] },
  { cbsa: '41180', cbsaName: 'St. Louis, MO-IL', msaSize: 'Large', seeds: ['63101'], lat: 38.627, lng: -90.1994, short: 'St. Louis', match: [/st\.? louis/i] },
  { cbsa: '28140', cbsaName: 'Kansas City, MO-KS', msaSize: 'Large', seeds: ['64105'], lat: 39.0997, lng: -94.5786, short: 'Kansas City', match: [/kansas city/i] },
  { cbsa: '19100', cbsaName: 'Dallas-Fort Worth-Arlington, TX', msaSize: 'Large', seeds: ['75201'], lat: 32.7767, lng: -96.797, short: 'Dallas', match: [/dallas|fort worth|arlington|plano/i] },
  { cbsa: '26420', cbsaName: 'Houston-The Woodlands-Sugar Land, TX', msaSize: 'Large', seeds: ['77002'], lat: 29.7604, lng: -95.3698, short: 'Houston', match: [/houston|sugar land|the woodlands/i] },
  { cbsa: '12420', cbsaName: 'Austin-Round Rock-Georgetown, TX', msaSize: 'Large', seeds: ['78701'], lat: 30.2672, lng: -97.7431, short: 'Austin', match: [/austin|round rock/i] },
  { cbsa: '41700', cbsaName: 'San Antonio-New Braunfels, TX', msaSize: 'Large', seeds: ['78205'], lat: 29.4241, lng: -98.4936, short: 'San Antonio', match: [/san antonio|new braunfels/i] },
  { cbsa: '19740', cbsaName: 'Denver-Aurora-Lakewood, CO', msaSize: 'Large', seeds: ['80202'], lat: 39.7392, lng: -104.9903, short: 'Denver', match: [/denver|aurora|boulder/i] },
  { cbsa: '38060', cbsaName: 'Phoenix-Mesa-Chandler, AZ', msaSize: 'Large', seeds: ['85004'], lat: 33.4484, lng: -112.074, short: 'Phoenix', match: [/phoenix|mesa|scottsdale|tempe/i] },
  { cbsa: '42660', cbsaName: 'Seattle-Tacoma-Bellevue, WA', msaSize: 'Large', seeds: ['98101'], lat: 47.6062, lng: -122.3321, short: 'Seattle', match: [/seattle|bellevue|tacoma|redmond/i] },
  { cbsa: '38900', cbsaName: 'Portland-Vancouver-Hillsboro, OR-WA', msaSize: 'Large', seeds: ['97201'], lat: 45.5152, lng: -122.6784, short: 'Portland', match: [/portland|vancouver|hillsboro/i] },
  { cbsa: '41620', cbsaName: 'Salt Lake City, UT', msaSize: 'Large', seeds: ['84101'], lat: 40.7608, lng: -111.891, short: 'Salt Lake City', match: [/salt lake/i] },
  { cbsa: '29820', cbsaName: 'Las Vegas-Henderson-Paradise, NV', msaSize: 'Large', seeds: ['89101'], lat: 36.1699, lng: -115.1398, short: 'Las Vegas', match: [/las vegas|henderson/i] },
  { cbsa: '18140', cbsaName: 'Columbus, OH', msaSize: 'Large', seeds: ['43215'], lat: 39.9612, lng: -82.9988, short: 'Columbus', match: [/columbus/i] },
  { cbsa: '26900', cbsaName: 'Indianapolis-Carmel-Anderson, IN', msaSize: 'Large', seeds: ['46204'], lat: 39.7684, lng: -86.1581, short: 'Indianapolis', match: [/indianapolis|carmel/i] },
  { cbsa: '17460', cbsaName: 'Cleveland-Elyria, OH', msaSize: 'Large', seeds: ['44113'], lat: 41.4993, lng: -81.6944, short: 'Cleveland', match: [/cleveland|elyria/i] },
  { cbsa: '17140', cbsaName: 'Cincinnati, OH-KY-IN', msaSize: 'Large', seeds: ['45202'], lat: 39.1031, lng: -84.512, short: 'Cincinnati', match: [/cincinnati/i] },
  { cbsa: '33340', cbsaName: 'Milwaukee-Waukesha, WI', msaSize: 'Large', seeds: ['53202'], lat: 43.0389, lng: -87.9065, short: 'Milwaukee', match: [/milwaukee|waukesha/i] },
  { cbsa: '25540', cbsaName: 'Hartford-West Hartford-East Hartford, CT', msaSize: 'Large', seeds: ['06103'], lat: 41.7658, lng: -72.6734, short: 'Hartford', match: [/hartford/i] },
  { cbsa: '40060', cbsaName: 'Richmond, VA', msaSize: 'Large', seeds: ['23219'], lat: 37.5407, lng: -77.436, short: 'Richmond', match: [/richmond/i] },
]

/** Extra CBSA centroids for company-footprint rows outside the atlas set. */
export const EXTRA_CBSA_COORDS = {
  39900: { lat: 39.5296, lng: -119.8138, short: 'Reno', cbsaName: 'Reno, NV' },
  14260: { lat: 43.615, lng: -116.2023, short: 'Boise', cbsaName: 'Boise City, ID' },
  22020: { lat: 46.8772, lng: -96.7898, short: 'Fargo', cbsaName: 'Fargo, ND-MN' },
  19780: { lat: 41.5868, lng: -93.625, short: 'Des Moines', cbsaName: 'Des Moines-West Des Moines, IA' },
  27260: { lat: 30.3322, lng: -81.6557, short: 'Jacksonville', cbsaName: 'Jacksonville, FL' },
  48300: { lat: 47.4235, lng: -120.3103, short: 'Wenatchee', cbsaName: 'Wenatchee, WA' },
  30340: { lat: 44.1004, lng: -70.2148, short: 'Lewiston', cbsaName: 'Lewiston-Auburn, ME' },
  12300: { lat: 44.3106, lng: -69.7795, short: 'Augusta', cbsaName: 'Augusta-Waterville, ME' },
  16940: { lat: 41.14, lng: -104.8202, short: 'Cheyenne', cbsaName: 'Cheyenne, WY' },
  39540: { lat: 42.7261, lng: -87.7829, short: 'Racine', cbsaName: 'Racine, WI' },
  47260: { lat: 36.8529, lng: -75.978, short: 'Virginia Beach', cbsaName: 'Virginia Beach-Norfolk-Newport News, VA-NC' },
  35380: { lat: 29.9511, lng: -90.0715, short: 'New Orleans', cbsaName: 'New Orleans-Metairie, LA' },
  13820: { lat: 33.5186, lng: -86.8104, short: 'Birmingham', cbsaName: 'Birmingham-Hoover, AL' },
  32820: { lat: 35.1495, lng: -90.049, short: 'Memphis', cbsaName: 'Memphis, TN-MS-AR' },
  39300: { lat: 41.824, lng: -71.4128, short: 'Providence', cbsaName: 'Providence-Warwick, RI-MA' },
  46520: { lat: 21.3069, lng: -157.8583, short: 'Honolulu', cbsaName: 'Urban Honolulu, HI' },
  38060: { lat: 33.4484, lng: -112.074, short: 'Phoenix', cbsaName: 'Phoenix-Mesa-Chandler, AZ' },
}

const metroByCbsa = new Map(METROS.map((m) => [String(m.cbsa), m]))

export function lookupCbsa(cbsa) {
  const key = String(cbsa).replace(/\D/g, '').padStart(5, '0')
  const metro = metroByCbsa.get(key)
  if (metro) {
    return {
      cbsa: key,
      cbsaName: metro.cbsaName,
      short: metro.short,
      lat: metro.lat,
      lng: metro.lng,
      zip: metro.seeds[0],
      msaSize: metro.msaSize,
    }
  }
  const extra = EXTRA_CBSA_COORDS[Number(key)] || EXTRA_CBSA_COORDS[key]
  if (extra) {
    return {
      cbsa: key,
      cbsaName: extra.cbsaName,
      short: extra.short,
      lat: extra.lat,
      lng: extra.lng,
      zip: null,
      msaSize: 'Large',
    }
  }
  return null
}

/**
 * @template T, R
 * @param {T[]} items
 * @param {number} concurrency
 * @param {(item: T, index: number) => Promise<R>} fn
 * @returns {Promise<R[]>}
 */
export async function mapPool(items, concurrency, fn) {
  /** @type {R[]} */
  const out = new Array(items.length)
  let i = 0
  async function worker() {
    while (i < items.length) {
      const idx = i++
      out[idx] = await fn(items[idx], idx)
    }
  }
  const n = Math.min(concurrency, items.length)
  await Promise.all(Array.from({ length: n }, worker))
  return out
}

export function dslString(value) {
  return String(value || '').replace(/"/g, '')
}

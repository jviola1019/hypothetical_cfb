/**
 * FBS program names from SportsDataverse / cfbfastR-data 2026 schedule.
 * 138 unique FBS programs identified from `home_division` / `away_division`.
 * This is a *program catalog*, not proof of 2026 roster or rating coverage.
 * Source: https://github.com/sportsdataverse/cfbfastR-data/blob/main/schedules/csv/cfb_schedules_2026.csv
 * Checked: 2026-11-21; last completed game in source: 2026-11-15 UTC.
 */
export const FBS_NAMES=`Air Force|Akron|Alabama|App State|Arizona|Arizona State|Arkansas|Arkansas State|Army|Auburn|BYU|Ball State|Baylor|Boise State|Boston College|Bowling Green|Buffalo|California|Central Michigan|Charlotte|Cincinnati|Clemson|Coastal Carolina|Colorado|Colorado State|Delaware|Duke|East Carolina|Eastern Michigan|Florida|Florida Atlantic|Florida International|Florida State|Fresno State|Georgia|Georgia Southern|Georgia State|Georgia Tech|Hawai'i|Houston|Illinois|Indiana|Iowa|Iowa State|Jacksonville State|James Madison|Kansas|Kansas State|Kennesaw State|Kent State|Kentucky|LSU|Liberty|Louisiana|Louisiana Tech|Louisville|Marshall|Maryland|Massachusetts|Memphis|Miami|Miami (OH)|Michigan|Michigan State|Middle Tennessee|Minnesota|Mississippi State|Missouri|Missouri State|NC State|Navy|Nebraska|Nevada|New Mexico|New Mexico State|North Carolina|North Dakota State|North Texas|Northern Illinois|Northwestern|Notre Dame|Ohio|Ohio State|Oklahoma|Oklahoma State|Old Dominion|Ole Miss|Oregon|Oregon State|Penn State|Pittsburgh|Purdue|Rice|Rutgers|SMU|Sacramento State|Sam Houston|San Diego State|San José State|South Alabama|South Carolina|South Florida|Southern Miss|Stanford|Syracuse|TCU|Temple|Tennessee|Texas|Texas A&M|Texas State|Texas Tech|Toledo|Troy|Tulane|Tulsa|UAB|UCF|UCLA|UConn|UL Monroe|UNLV|USC|UTEP|UTSA|Utah|Utah State|Vanderbilt|Virginia|Virginia Tech|Wake Forest|Washington|Washington State|West Virginia|Western Kentucky|Western Michigan|Wisconsin|Wyoming`.split('|');
const overriden={
 'Texas A&M':'texas-am','App State':'app-state','Miami (OH)':'miami-oh','Miami':'miami','Ole Miss':'ole-miss',
 'Hawai\'i':'hawaii','San José State':'san-jose-state','Mississippi State':'mississippi-state',
 'North Dakota State':'north-dakota-state','Sacramento State':'sacramento-state',
 'Louisiana':'louisiana','UC Davis':'uc-davis','Massachusetts':'massachusetts','California':'california',
 'Florida International':'florida-international','South Florida':'south-florida',
 'UConn':'uconn','BYU':'byu','LSU':'lsu','SMU':'smu', 'TCU':'tcu'
};
export const slugName=name=>overriden[name]||name.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/&/g,'and').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const codes={'Alabama':'ALA','Indiana':'IND','Georgia':'UGA','Ohio State':'OSU','Ole Miss':'MISS','Texas A&M':'TAMU','Michigan':'MICH','Notre Dame':'ND','North Dakota State':'NDSU','Sacramento State':'SAC','San José State':'SJSU','Miami (OH)':'M-OH','Miami':'MIA','Florida State':'FSU','Florida':'FLA','App State':'APP','Boise State':'BOIS'};
export const FBS_TEAMS=FBS_NAMES.map(name=>({id:slugName(name),name,short:codes[name]||name.toUpperCase().replace(/[^A-Z0-9 ]/g,'').split(' ').map(x=>x.slice(0,3)).join('').slice(0,6),division:'fbs'}));
export const FCS_REFERENCE=[['south-dakota-state','South Dakota State','SDSU'],['montana','Montana','MONT'],['montana-state','Montana State','MTST'],['uc-davis','UC Davis','UCD'],['idaho','Idaho','IDAH']].map(([id,name,short])=>({id,name,short,division:'fcs'}));

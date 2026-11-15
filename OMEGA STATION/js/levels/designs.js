const rows = [
 ['industrial-bays',75,57,'production',8,3,'Press Hall'],
 ['technical-spine',55,75,'maintenance',7,3,'Cable Trunk'],
 ['research-wings',67,61,'research',9,4,'Triage Wing'],
 ['security-checkpoints',61,71,'military',8,3,'Checkpoint Alpha'],
 ['cargo-aisles',77,59,'logistics',10,4,'Freight Rows'],
 ['technical-spine',53,77,'maintenance',8,4,'Ventilation Drop'],
 ['multi-wing',69,65,'residential',9,4,'Crew Quarters'],
 ['maintenance-maze',61,73,'communications',8,4,'Relay Crawl'],
 ['atrium-branches',75,63,'research',9,5,'Containment Atrium'],
 ['reactor-radial',67,67,'reactor',10,5,'Turbine Crown'],
 ['zone-network',77,65,'production',10,5,'Fever Ward'],
 ['ring-concourse',75,71,'experimental',11,6,'Resonance Ring'],

 ['open-yard',79,57,'logistics',8,4,'Dock Apron'],
 ['cargo-aisles',75,61,'logistics',11,5,'Container Spine'],
 ['industrial-bays',71,63,'production',10,4,'Engine Forge'],
 ['maintenance-maze',59,77,'maintenance',9,5,'Service Labyrinth'],
 ['research-wings',69,65,'research',10,5,'Greenhouse Wing'],
 ['security-checkpoints',65,75,'military',10,5,'Armory Locks'],
 ['long-facility',81,55,'production',11,5,'Foundry Line'],
 ['zone-network',77,65,'logistics',10,5,'Slag Channels'],
 ['organic-hive',67,75,'research',11,6,'Dark Tissue Lab'],
 ['reactor-radial',71,71,'reactor',11,6,'Core Cage'],
 ['multi-wing',79,67,'experimental',12,6,'Hull Breach'],
 ['asym-campus',77,77,'experimental',12,7,'Deep Space Array'],

 ['technical-spine',59,79,'underground',9,5,'Lower Conduits'],
 ['organic-hive',73,69,'biohazard',11,6,'Biohazard Vault'],
 ['reactor-radial',71,71,'infernal',11,6,'Old Reactor Shrine'],
 ['asym-campus',79,63,'underground',11,6,'Forgotten Block'],
 ['zone-network',73,77,'infernal',12,7,'The Abyss'],
 ['research-wings',77,71,'experimental',12,6,'Core Complex'],
 ['security-checkpoints',69,79,'experimental',12,7,'Omega Labs'],
 ['dense-room-web',75,73,'experimental',13,7,'Test Matrix'],
 ['organic-hive',77,75,'infernal',13,8,'Hive Heart'],
 ['multi-wing',81,71,'military',13,8,'Defense Grid'],
 ['ring-concourse',77,77,'infernal',13,8,'Omega Crown'],
 ['reactor-radial',79,79,'infernal',14,9,'Final Chamber']
];

export const ARCHITECTURES = [
 'industrial-bays','technical-spine','research-wings','ring-concourse',
 'maintenance-maze','atrium-branches','cargo-aisles','security-checkpoints',
 'multi-wing','dense-room-web','long-facility','zone-network',
 'asym-campus','reactor-radial','open-yard','organic-hive'
];

export const LEVEL_BLUEPRINTS = rows.map(([style,width,height,theme,rooms,loops,feature],i)=>({
 style,width,height,theme,rooms,loops,feature,seed:0x4f4d00+i*7919,
 open:style==='open-yard'||style==='asym-campus',
 encounters:Math.round(6+i*.34)
}));

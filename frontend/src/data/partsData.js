// ─── Spare Parts Categories and Models Dataset ─────────────────────────────────
// Used by Parts.jsx for dependent filtering: Machine Type → Brand → Model

export const PARTS_MACHINE_TYPES = [
  "Excavators",
  "Backhoe Loaders",
  "Dozers",
  "Wheel Loaders",
  "Graders",
  "Rollers",
  "Skid Steers",
  "Material Handlers",
  "Buckets & Attachments",
  "Others"
];

export const PARTS_CATEGORIES = [
  "Engine Parts",
  "Hydraulic Parts",
  "Undercarriage Parts",
  "Attachment Parts",
  "Swing System Parts",
  "Travel System Parts",
  "Electrical Parts",
  "Cabin Parts",
  "Wear Parts (GET)",
  "Maintenance Parts"
];

export const PARTS_BRANDS_BY_TYPE = {
  "Excavators": [
    "Caterpillar (CAT)", "Komatsu", "Hitachi", "Volvo CE", "Hyundai", "Kobelco", 
    "Doosan", "Develon", "SANY", "XCMG", "LiuGong", "CASE", "JCB", "John Deere", 
    "Liebherr", "Takeuchi", "Kubota", "Yanmar", "Sumitomo", "Terex", "Zoomlion", 
    "Sunward", "Bobcat", "Wacker Neuson", "Atlas", "Mecalac", "Others"
  ],
  "Backhoe Loaders": [
    "JCB", "Caterpillar (CAT)", "CASE", "John Deere", "Komatsu", "New Holland", 
    "Mahindra", "ACE", "BEML", "SANY", "LiuGong", "Terex", "Volvo CE", "Hyundai", "Others"
  ],
  "Dozers": [
    "Caterpillar (CAT)", "Komatsu", "John Deere", "CASE", "Liebherr", "Shantui", 
    "SANY", "XCMG", "Zoomlion", "BEML", "Dressta", "Others"
  ],
  "Wheel Loaders": [
    "Caterpillar (CAT)", "Komatsu", "Volvo CE", "Hitachi", "Hyundai", "Doosan", 
    "Develon", "CASE", "John Deere", "Liebherr", "JCB", "LiuGong", "SANY", "XCMG", 
    "SDLG", "Terex", "Kawasaki", "Others"
  ],
  "Graders": [
    "Caterpillar (CAT)", "Komatsu", "John Deere", "CASE", "Volvo CE", "SANY", 
    "XCMG", "Shantui", "LiuGong", "BEML", "Mahindra", "Others"
  ],
  "Rollers": [
    "Bomag", "Hamm", "Dynapac", "Caterpillar (CAT)", "Volvo CE", "CASE", "JCB", 
    "SANY", "XCMG", "LiuGong", "Ammann", "Sakai", "Wirtgen", "BOMAG India", "Others"
  ],
  "Skid Steers": [
    "Bobcat", "Caterpillar (CAT)", "CASE", "JCB", "New Holland", "John Deere", 
    "Kubota", "Takeuchi", "Gehl", "Mustang", "ASV", "Wacker Neuson", "SANY", "LiuGong", "Others"
  ],
  "Material Handlers": [
    "Liebherr", "Sennebogen", "Caterpillar (CAT)", "Komatsu", "Volvo CE", "Hitachi", 
    "Hyundai", "Doosan", "Develon", "SANY", "XCMG", "Terex Fuchs", "Mantsinen", "Others"
  ],
  "Buckets & Attachments": [
    "Caterpillar (CAT)", "Komatsu", "Hitachi", "Volvo CE", "Hyundai", "Kobelco", 
    "Doosan", "Develon", "JCB", "CASE", "John Deere", "SANY", "XCMG", "LiuGong", 
    "Kubota", "Takeuchi", "Yanmar", "Bobcat", "Liebherr", "Others"
  ],
  "Others": [
    "Caterpillar (CAT)", "Komatsu", "Hitachi", "Volvo CE", "Hyundai", "Kobelco", 
    "Doosan", "Develon", "JCB", "CASE", "John Deere", "SANY", "XCMG", "LiuGong", 
    "Liebherr", "Kubota", "Takeuchi", "Yanmar", "Bobcat", "Bomag", "Dynapac", "Hamm", 
    "Ammann", "Shantui", "ACE", "BEML", "Mahindra", "Terex", "New Holland", "Zoomlion", 
    "Sunward", "SDLG", "Wirtgen", "Gehl", "Mustang", "ASV", "Others"
  ]
};

// Helper to sort brands alphabetically but keep "Others" at the end
export const sortBrands = (brands) => {
  const sorted = [...new Set(brands)].sort();
  if (sorted.includes("Others")) {
    return [...sorted.filter(b => b !== "Others"), "Others"];
  }
  return sorted;
};

// Flattened list of all unique brands
export const ALL_PARTS_BRANDS = sortBrands(Object.values(PARTS_BRANDS_BY_TYPE).flat());

// Provide exact models only where we have them, fallback to an empty array so users can still type or it handles gracefully
export const PARTS_MODELS_BY_BRAND = {
  "Caterpillar (CAT)": {
    "Excavators": ["301.5", "302 CR", "303 CR", "305E2", "307D", "308E2", "311D", "312D", "313D", "315D", "318D", "320B", "320C", "320D", "320D2", "320GC", "323D", "323GX", "324D", "325C", "325D", "326D2", "329D", "330C", "330D", "330GC", "336D", "336GC", "345D", "349D", "352", "365C", "374D", "390F"],
    "Backhoe Loaders": ["416E", "416F", "420D", "420E", "420F", "422F", "426F", "428D", "430D", "432F", "434F", "444F", "450F"],
    "Dozers": ["D3", "D4", "D5", "D6", "D6R", "D6T", "D7", "D8", "D9", "D10", "D11"],
    "Wheel Loaders": ["903", "906", "907", "908", "914", "920", "924", "926", "930", "938", "950", "962", "966", "972", "980", "988", "990", "992"],
    "Graders": ["120", "120K", "120M", "130G", "135H", "140", "140K", "140M", "150", "160", "160K", "160M"],
    "Skid Steers": ["216B", "226B", "232D", "236D", "242D", "246D", "262D", "272D", "289D", "299D"],
    "Material Handlers": ["MH3022", "MH3024", "MH3026", "MH3040", "MH3050"]
  },
  "Komatsu": {
    "Excavators": ["PC30", "PC35", "PC45", "PC55", "PC60", "PC70", "PC75", "PC78", "PC100", "PC120", "PC130", "PC138", "PC160", "PC180", "PC200", "PC210", "PC220", "PC228", "PC240", "PC270", "PC300", "PC350", "PC360", "PC400", "PC450", "PC490", "PC650", "PC800"],
    "Dozers": ["D31", "D37", "D51", "D61", "D65", "D85", "D155", "D275", "D375", "D475"],
    "Wheel Loaders": ["WA70", "WA80", "WA100", "WA150", "WA200", "WA270", "WA320", "WA380", "WA470", "WA500", "WA600", "WA900"],
    "Graders": ["GD511", "GD555", "GD655", "GD675", "GD755", "GD825"]
  },
  "Hitachi": {
    "Excavators": ["ZX30", "ZX35", "ZX50", "ZX55", "ZX60", "ZX70", "ZX75", "ZX85", "ZX110", "ZX120", "ZX130", "ZX135", "ZX160", "ZX180", "ZX200", "ZX210", "ZX225", "ZX240", "ZX250", "ZX280", "ZX330", "ZX350", "ZX470", "ZX490", "ZX670", "ZX850"]
  },
  "Volvo CE": {
    "Excavators": ["EC55", "EC60", "EC75", "EC80", "EC140", "EC160", "EC180", "EC210", "EC220", "EC240", "EC250", "EC290", "EC300", "EC350", "EC380", "EC480", "EC750"],
    "Wheel Loaders": ["L30", "L35", "L45", "L60", "L70", "L90", "L110", "L120", "L150", "L180", "L220", "L260"],
    "Graders": ["G710", "G720", "G730", "G740", "G746", "G780", "G930", "G940", "G946", "G960"]
  },
  "Hyundai": {
    "Excavators": ["R55", "R60", "R80", "R130", "R140", "R145", "R150", "R160", "R170", "R180", "R200", "R210", "R215", "R220", "R225", "R250", "R260", "R290", "R300", "R330", "R380", "R450", "R520"]
  },
  "Kobelco": {
    "Excavators": ["SK30", "SK35", "SK50", "SK60", "SK75", "SK80", "SK100", "SK120", "SK140", "SK200", "SK210", "SK220", "SK235", "SK250", "SK260", "SK300", "SK330", "SK350", "SK380", "SK500"]
  },
  "Doosan": {
    "Excavators": ["DX55", "DX60", "DX80", "DX140", "DX150", "DX180", "DX210", "DX225", "DX235", "DX255", "DX300", "DX340", "DX420", "DX490", "DX530"]
  },
  "Develon": {
    "Excavators": ["DX55", "DX60", "DX80", "DX140", "DX150", "DX180", "DX210", "DX225", "DX235", "DX255", "DX300", "DX340", "DX420", "DX490", "DX530"]
  },
  "JCB": {
    "Excavators": ["JS81", "JS130", "JS140", "JS145", "JS160", "JS180", "JS200", "JS205", "JS210", "JS220", "JS305", "JS330", "JS370"],
    "Backhoe Loaders": ["1CX", "2DX", "3CX", "3DX", "4CX", "5CX"]
  },
  "SANY": {
    "Excavators": ["SY16", "SY35", "SY50", "SY55", "SY60", "SY75", "SY135", "SY155", "SY215", "SY220", "SY245", "SY265", "SY305", "SY365", "SY500", "SY650"]
  },
  "XCMG": {
    "Excavators": ["XE35", "XE55", "XE60", "XE80", "XE135", "XE150", "XE210", "XE215", "XE230", "XE265", "XE335", "XE370", "XE490", "XE700"]
  },
  "CASE": {
    "Backhoe Loaders": ["570N", "580N", "580SN", "590SN", "695SV", "770EX", "851EX"]
  },
  "New Holland": {
    "Backhoe Loaders": ["B90B", "B95B", "B110B", "B115B"]
  },
  "Mahindra": {
    "Backhoe Loaders": ["EarthMaster SX", "EarthMaster VX", "EarthMaster SXL"]
  },
  "Shantui": {
    "Dozers": ["SD13", "SD16", "SD22", "SD32", "SD42", "SD52"]
  },
  "John Deere": {
    "Dozers": ["450K", "550K", "650K", "700K", "750K", "850K", "1050K"]
  },
  "Bomag": {
    "Rollers": ["BW120", "BW138", "BW151", "BW161", "BW177", "BW211", "BW213", "BW216", "BW219"]
  },
  "Hamm": {
    "Rollers": ["HD10", "HD12", "HD14", "HD90", "3410", "3412", "3520"]
  },
  "Dynapac": {
    "Rollers": ["CA1300", "CA1500", "CA2500", "CA3500", "CA5000", "CC2200", "CC3800"]
  },
  "Bobcat": {
    "Skid Steers": ["S70", "S100", "S130", "S150", "S160", "S175", "S185", "S205", "S450", "S510", "S530", "S550", "S570", "S590", "S650", "S740", "S770"]
  },
  "Liebherr": {
    "Material Handlers": ["LH22", "LH26", "LH30", "LH35", "LH40", "LH50", "LH60", "LH80"]
  },
  "Sennebogen": {
    "Material Handlers": ["817", "821", "825", "830", "835", "840", "850", "870", "875"]
  }
};

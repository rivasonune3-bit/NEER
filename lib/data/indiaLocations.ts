import { LocationItem, LocationRiskDetail, AlertIncident, SosCall, ResponseUnit } from '../types';

export const INDIA_STATES: LocationItem[] = [
  { id: 'st-as', name: 'Assam', code: 'AS', type: 'state', lat: 26.2006, lng: 92.9376, riskLevel: 'UNASSESSED', susceptibilityScore: null },
  { id: 'st-uk', name: 'Uttarakhand', code: 'UK', type: 'state', lat: 30.0668, lng: 79.0193, riskLevel: 'UNASSESSED', susceptibilityScore: null },
  { id: 'st-hp', name: 'Himachal Pradesh', code: 'HP', type: 'state', lat: 31.1048, lng: 77.1734, riskLevel: 'UNASSESSED', susceptibilityScore: null },
  { id: 'st-kl', name: 'Kerala', code: 'KL', type: 'state', lat: 10.8505, lng: 76.2711, riskLevel: 'UNASSESSED', susceptibilityScore: null },
  { id: 'st-mh', name: 'Maharashtra', code: 'MH', type: 'state', lat: 19.7515, lng: 75.7139, riskLevel: 'UNASSESSED', susceptibilityScore: null },
  { id: 'st-br', name: 'Bihar', code: 'BR', type: 'state', lat: 25.0961, lng: 85.3131, riskLevel: 'UNASSESSED', susceptibilityScore: null },
  { id: 'st-wb', name: 'West Bengal', code: 'WB', type: 'state', lat: 22.9868, lng: 87.8550, riskLevel: 'UNASSESSED', susceptibilityScore: null },
  { id: 'st-od', name: 'Odisha', code: 'OD', type: 'state', lat: 20.9517, lng: 85.0985, riskLevel: 'UNASSESSED', susceptibilityScore: null },
  { id: 'st-tn', name: 'Tamil Nadu', code: 'TN', type: 'state', lat: 11.1271, lng: 78.6569, riskLevel: 'UNASSESSED', susceptibilityScore: null },
];

export const INDIA_DISTRICTS: Record<string, LocationItem[]> = {
  'st-uk': [
    { id: 'dt-ch', name: 'Chamoli', code: 'CHM', type: 'district', lat: 30.4042, lng: 79.3304, parentId: 'st-uk', riskLevel: 'UNASSESSED', susceptibilityScore: null },
    { id: 'dt-dd', name: 'Dehradun', code: 'DDN', type: 'district', lat: 30.3165, lng: 78.0322, parentId: 'st-uk', riskLevel: 'UNASSESSED', susceptibilityScore: null },
    { id: 'dt-pt', name: 'Pithoragarh', code: 'PTG', type: 'district', lat: 29.5829, lng: 80.2182, parentId: 'st-uk', riskLevel: 'UNASSESSED', susceptibilityScore: null },
  ],
  'st-hp': [
    { id: 'dt-[#mn]', name: 'Manali / Kullu', code: 'MNL', type: 'district', lat: 32.2432, lng: 77.1892, parentId: 'st-hp', riskLevel: 'UNASSESSED', susceptibilityScore: null },
    { id: 'dt-sml', name: 'Shimla', code: 'SML', type: 'district', lat: 31.1048, lng: 77.1734, parentId: 'st-hp', riskLevel: 'UNASSESSED', susceptibilityScore: null },
  ],
  'st-as': [
    { id: 'dt-km', name: 'Kamrup Metropolitan (Guwahati)', code: 'KM', type: 'district', lat: 26.1445, lng: 91.7362, parentId: 'st-as', riskLevel: 'UNASSESSED', susceptibilityScore: null },
    { id: 'dt-db', name: 'Dibrugarh', code: 'DB', type: 'district', lat: 27.4728, lng: 94.9120, parentId: 'st-as', riskLevel: 'UNASSESSED', susceptibilityScore: null },
    { id: 'dt-cz', name: 'Cachar (Silchar)', code: 'CZ', type: 'district', lat: 24.8333, lng: 92.7789, parentId: 'st-as', riskLevel: 'UNASSESSED', susceptibilityScore: null },
  ],
  'st-mh': [
    { id: 'dt-mum', name: 'Mumbai City & Suburbs', code: 'MUM', type: 'district', lat: 19.0760, lng: 72.8777, parentId: 'st-mh', riskLevel: 'UNASSESSED', susceptibilityScore: null },
    { id: 'dt-ngp', name: 'Nagpur', code: 'NGP', type: 'district', lat: 21.1458, lng: 79.0882, parentId: 'st-mh', riskLevel: 'UNASSESSED', susceptibilityScore: null },
    { id: 'dt-klp', name: 'Kolhapur', code: 'KLP', type: 'district', lat: 16.7050, lng: 74.2433, parentId: 'st-mh', riskLevel: 'UNASSESSED', susceptibilityScore: null },
  ],
  'st-kl': [
    { id: 'dt-wy', name: 'Wayanad', code: 'WY', type: 'district', lat: 11.6854, lng: 76.1320, parentId: 'st-kl', riskLevel: 'UNASSESSED', susceptibilityScore: null },
    { id: 'dt-ek', name: 'Ernakulam (Kochi)', code: 'EK', type: 'district', lat: 9.9816, lng: 76.2999, parentId: 'st-kl', riskLevel: 'UNASSESSED', susceptibilityScore: null },
  ],
  'st-br': [
    { id: 'dt-ptn', name: 'Patna', code: 'PTN', type: 'district', lat: 25.5941, lng: 85.1376, parentId: 'st-br', riskLevel: 'UNASSESSED', susceptibilityScore: null },
  ],
  'st-wb': [
    { id: 'dt-kol', name: 'Kolkata', code: 'KOL', type: 'district', lat: 22.5726, lng: 88.3639, parentId: 'st-wb', riskLevel: 'UNASSESSED', susceptibilityScore: null },
  ],
  'st-od': [
    { id: 'dt-ctk', name: 'Cuttack', code: 'CTK', type: 'district', lat: 20.4625, lng: 85.8828, parentId: 'st-od', riskLevel: 'UNASSESSED', susceptibilityScore: null },
  ]
};

export const INDIA_BLOCKS: Record<string, LocationItem[]> = {
  'dt-ch': [
    { id: 'bl-js', name: 'Joshimath Block', code: 'JSM', type: 'block', lat: 30.5556, lng: 79.5667, parentId: 'dt-ch', riskLevel: 'UNASSESSED', susceptibilityScore: null },
    { id: 'bl-kp', name: 'Karnaprayag Block', code: 'KNP', type: 'block', lat: 30.2600, lng: 79.2200, parentId: 'dt-ch', riskLevel: 'UNASSESSED', susceptibilityScore: null },
  ],
  'dt-dd': [
    { id: 'bl-dd', name: 'Dehradun City Block', code: 'DDC', type: 'block', lat: 30.3200, lng: 78.0400, parentId: 'dt-dd', riskLevel: 'UNASSESSED', susceptibilityScore: null },
    { id: 'bl-rsh', name: 'Rishikesh Block', code: 'RSK', type: 'block', lat: 30.0869, lng: 78.2676, parentId: 'dt-dd', riskLevel: 'UNASSESSED', susceptibilityScore: null },
  ],
  'dt-km': [
    { id: 'bl-gz', name: 'Guwahati East', code: 'GZE', type: 'block', lat: 26.1800, lng: 91.7800, parentId: 'dt-km', riskLevel: 'UNASSESSED', susceptibilityScore: null },
    { id: 'bl-gw', name: 'Guwahati West (Dispur)', code: 'GZW', type: 'block', lat: 26.1400, lng: 91.7900, parentId: 'dt-km', riskLevel: 'UNASSESSED', susceptibilityScore: null },
  ],
  'dt-wy': [
    { id: 'bl-vy', name: 'Vythiri (Meppadi)', code: 'VY', type: 'block', lat: 11.5528, lng: 76.1264, parentId: 'dt-wy', riskLevel: 'UNASSESSED', susceptibilityScore: null },
  ]
};

export const INDIA_VILLAGES: Record<string, LocationItem[]> = {
  'bl-js': [
    { id: 'vl-rn', name: 'Raini Floodplain Sector', code: 'RN', type: 'village', lat: 30.4850, lng: 79.6920, parentId: 'bl-js', riskLevel: 'UNASSESSED', susceptibilityScore: null },
    { id: 'vl-th', name: 'Tapovan Glacial Outwash Sector', code: 'TP', type: 'village', lat: 30.5050, lng: 79.6250, parentId: 'bl-js', riskLevel: 'UNASSESSED', susceptibilityScore: null },
  ],
  'bl-gz': [
    { id: 'vl-hb', name: 'Hatsingimari Riverside Village', code: 'HB', type: 'village', lat: 26.1950, lng: 91.7750, parentId: 'bl-gz', riskLevel: 'UNASSESSED', susceptibilityScore: null },
    { id: 'vl-bl', name: 'Bhorolu Floodplain Sector', code: 'BL', type: 'village', lat: 26.1700, lng: 91.7450, parentId: 'bl-gz', riskLevel: 'UNASSESSED', susceptibilityScore: null },
  ]
};

export const MOCK_LOCATION_RISK_DETAILS: Record<string, LocationRiskDetail> = {};
export const MOCK_ALERTS: AlertIncident[] = [];
export const MOCK_SOS_CALLS: SosCall[] = [];
export const MOCK_RESPONSE_UNITS: ResponseUnit[] = [];

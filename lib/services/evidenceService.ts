import { FieldEvidence } from '../types';

let evidenceStore: FieldEvidence[] = [
  {
    id: 'EVD-CIT-001',
    source: 'CITIZEN',
    uploaderName: 'Ramesh Kalita',
    incidentId: 'INC-2026-001',
    locationName: 'Ward 12, Pandu, Guwahati',
    lat: 26.1850,
    lng: 91.7720,
    timestamp: new Date(Date.now() - 3600000).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) + ' IST',
    imageUrl: 'https://images.unsplash.com/photo-1547683905-f686c993aae5?w=600&auto=format&fit=crop&q=80',
    description: 'Bhorolu river overflowed 1st floor residence road. Water depth ~1.2 meters.'
  },
  {
    id: 'EVD-FLEET-001',
    source: 'RESPONSE_FLEET',
    uploaderName: '1st NDRF Battalion Alpha Team',
    incidentId: 'INC-2026-001',
    locationName: 'Guwahati East Bhorolu Riverbank',
    lat: 26.1800,
    lng: 91.7800,
    timestamp: new Date(Date.now() - 1800000).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) + ' IST',
    imageUrl: 'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?w=600&auto=format&fit=crop&q=80',
    description: 'Deployed Motorboat Rig 4. 12 residents evacuated safely to high-ground camp.'
  }
];

export const evidenceService = {
  getEvidenceList(sourceFilter?: 'CITIZEN' | 'RESPONSE_FLEET'): FieldEvidence[] {
    if (!sourceFilter) return evidenceStore;
    return evidenceStore.filter(item => item.source === sourceFilter);
  },

  getEvidenceByIncidentId(incidentId: string): FieldEvidence[] {
    return evidenceStore.filter(item => item.incidentId === incidentId);
  },

  addEvidence(item: Omit<FieldEvidence, 'id' | 'timestamp'>): FieldEvidence {
    const newEntry: FieldEvidence = {
      ...item,
      id: `EVD-${item.source === 'CITIZEN' ? 'CIT' : 'FLEET'}-${Math.floor(100 + Math.random() * 900)}`,
      timestamp: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) + ' IST'
    };
    evidenceStore = [newEntry, ...evidenceStore];
    return newEntry;
  }
};

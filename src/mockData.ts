export interface Deal {
  id: string;
  name: string;
  value: number;
  stage: 'Lead' | 'Pitch' | 'Negotiation' | 'Won' | 'Lost';
  sector: 'Energy' | 'Mining' | 'Renewables' | 'Infrastructure' | 'Utilities';
  closeDate: string;
  customer: string;
  owner: string;
  probability: number;
  notes?: string;
}

export interface WorkOrder {
  id: string;
  associatedDeal: string;
  status: 'Not Started' | 'In Progress' | 'Completed' | 'Delayed';
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  targetEndDate: string;
  actualEndDate?: string;
  assignedTeam: string;
  revenue: number;
  notes?: string;
}

export const initialDeals: Deal[] = [
  {
    id: "d1",
    name: "Tata Solar Grid Phase 2",
    value: 450000,
    stage: "Won",
    sector: "Renewables",
    closeDate: "2026-06-15",
    customer: "Tata Power",
    owner: "Aditya Sharma",
    probability: 100,
    notes: "Contract signed. First milestone invoice sent. Focus is on survey execution."
  },
  {
    id: "d2",
    name: "Adani Wind Farm Mapping",
    value: 320000,
    stage: "Negotiation",
    sector: "Renewables",
    closeDate: "2026-08-20",
    customer: "Adani Green Energy",
    owner: "Priya Nair",
    probability: 80,
    notes: "Technical evaluation passed. Currently negotiating liability clauses in legal review."
  },
  {
    id: "d3",
    name: "Singareni Coal Mine Volume Survey",
    value: 680000,
    stage: "Won",
    sector: "Mining",
    closeDate: "2026-07-02",
    customer: "SCCL India",
    owner: "Aditya Sharma",
    probability: 100,
    notes: "Monthly stockpile volume measurement contract. Operational team deployed on site."
  },
  {
    id: "d4",
    name: "Konkan Railway Bridge Inspection",
    value: 210000,
    stage: "Pitch",
    sector: "Infrastructure",
    closeDate: "2026-10-10",
    customer: "Konkan Railway Corp",
    owner: "Rohan Das",
    probability: 40,
    notes: "Proposed photogrammetry and structural analysis using thermal cameras. Awaiting feedback."
  },
  {
    id: "d5",
    name: "NHAI Highway Corridor Mapping",
    value: 1200000,
    stage: "Won",
    sector: "Infrastructure",
    closeDate: "2026-05-18",
    customer: "NHAI",
    owner: "Priya Nair",
    probability: 100,
    notes: "150km corridor LiDAR mapping. Major project. Deliverables in 3 phases."
  },
  {
    id: "d6",
    name: "NTPC Ramagundam Powerline Survey",
    value: 150000,
    stage: "Lead",
    sector: "Energy",
    closeDate: "2026-11-01",
    customer: "NTPC",
    owner: "Rohan Das",
    probability: 10,
    notes: "Initial discussion on vegetation encroachment mapping along high tension lines."
  },
  {
    id: "d7",
    name: "Vedanta Zinc Mine Stockpile",
    value: 290000,
    stage: "Negotiation",
    sector: "Mining",
    closeDate: "2026-08-05",
    customer: "Vedanta Resources",
    owner: "Aditya Sharma",
    probability: 70,
    notes: "Discussing pricing model. Client wants a discount for long term contract."
  },
  {
    id: "d8",
    name: "BESCOM Grid Inspection",
    value: 380000,
    stage: "Won",
    sector: "Energy",
    closeDate: "2026-04-12",
    customer: "BESCOM",
    owner: "Priya Nair",
    probability: 100,
    notes: "Substation thermal imaging project. Completed, but work order tracking shows delayed reports."
  },
  {
    id: "d9",
    name: "L&T Smart City Survey",
    value: 550000,
    stage: "Won",
    sector: "Infrastructure",
    closeDate: "2026-06-28",
    customer: "Larsen & Toubro",
    owner: "Rohan Das",
    probability: 100,
    notes: "Topographical mapping of greenfield area. 3D point cloud is primary deliverable."
  },
  {
    id: "d10",
    name: "UPPCL Line Sag Analysis",
    value: 180000,
    stage: "Lost",
    sector: "Utilities",
    closeDate: "2026-03-10",
    customer: "UPPCL",
    owner: "Rohan Das",
    probability: 0,
    notes: "Competitor bid lower by 15%. Lost on pricing model."
  }
];

export const initialWorkOrders: WorkOrder[] = [
  {
    id: "wo1",
    associatedDeal: "Tata Solar Grid Phase 2",
    status: "In Progress",
    priority: "High",
    targetEndDate: "2026-08-30",
    assignedTeam: "Alpha Flight Team",
    revenue: 450000,
    notes: "Drone flight completed. Data in photogrammetry pipeline. Processing 12,000 images."
  },
  {
    id: "wo2",
    associatedDeal: "Singareni Coal Mine Volume Survey",
    status: "Completed",
    priority: "Medium",
    targetEndDate: "2026-07-20",
    actualEndDate: "2026-07-18",
    assignedTeam: "Geospatial Analyst Team A",
    revenue: 680000,
    notes: "Volumetric calculation complete. PDF report sent to SCCL engineer. 99.4% accuracy rating."
  },
  {
    id: "wo3",
    associatedDeal: "NHAI Highway Corridor Mapping",
    status: "Delayed",
    priority: "Critical",
    targetEndDate: "2026-07-15",
    assignedTeam: "Delta LiDAR Survey Team",
    revenue: 1200000,
    notes: "LiDAR sensor calibration failure on Day 3. Equipment sent back to base. Delayed by 15 days."
  },
  {
    id: "wo4",
    associatedDeal: "BESCOM Grid Inspection",
    status: "Completed",
    priority: "Low",
    targetEndDate: "2026-05-10",
    actualEndDate: "2026-05-15",
    assignedTeam: "Alpha Flight Team",
    revenue: 380000,
    notes: "Thermal reports delivered. Delay due to adverse monsoon conditions during field survey."
  },
  {
    id: "wo5",
    associatedDeal: "L&T Smart City Survey",
    status: "In Progress",
    priority: "Medium",
    targetEndDate: "2026-09-15",
    assignedTeam: "Beta Mapping Group",
    revenue: 550000,
    notes: "Ground control points (GCP) established using DGPS. Drone flights scheduled next week."
  },
  {
    id: "wo6",
    associatedDeal: "Adani Wind Farm Mapping",
    status: "Not Started",
    priority: "High",
    targetEndDate: "2026-09-30",
    assignedTeam: "Alpha Flight Team",
    revenue: 320000,
    notes: "Awaiting final deal sign-off. Flight permits applied in advance."
  },
  {
    id: "wo7",
    associatedDeal: "Vedanta Zinc Mine Stockpile",
    status: "Not Started",
    priority: "Medium",
    targetEndDate: "2026-10-15",
    assignedTeam: "Geospatial Analyst Team A",
    revenue: 290000,
    notes: "Proposed flight path drafted. Awaiting client authorization."
  }
];

export const suggestedPrompts = [
  "How is our Renewables sector pipeline performing?",
  "Which work orders are currently delayed or require attention?",
  "Show pipeline value breakdown by deal stage.",
  "Which high-value projects are currently at risk?",
  "Generate a weekly leadership update summary."
];

export const recentActivity = [
  { id: "act1", type: "sync", text: "Monday.com workspace auto-sync completed successfully.", time: "10 mins ago" },
  { id: "act2", type: "report", text: "Weekly Leadership Briefing generated by AI Assistant.", time: "1 hr ago" },
  { id: "act3", type: "deal", text: "Deal 'Singareni Coal Mine Volume Survey' stage updated to Won by Aditya Sharma.", time: "4 hrs ago" },
  { id: "act4", type: "alert", text: "Work Order wo3 (NHAI Highway Corridor Mapping) marked as Delayed.", time: "1 day ago" }
];

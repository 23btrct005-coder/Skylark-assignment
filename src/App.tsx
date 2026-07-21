import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Bot, 
  Briefcase, 
  ClipboardList, 
  BarChart3, 
  FileText, 
  Database, 
  RefreshCw, 
  Settings as SettingsIcon, 
  Search, 
  Bell, 
  Send, 
  TrendingUp, 
  DollarSign, 
  CheckCircle, 
  AlertTriangle, 
  ChevronRight, 
  Download, 
  Filter, 
  Key, 
  Sparkles, 
  Check, 
  Trash2, 
  Share2,
  X,
  Palette,
  ArrowUpRight,
  Info,
  ExternalLink,
  Kanban,
  FileSpreadsheet,
  Sun,
  Moon
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  BarChart, 
  Bar, 
  Cell, 
  PieChart, 
  Pie 
} from 'recharts';
import confetti from 'canvas-confetti';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { 
  initialDeals, 
  initialWorkOrders, 
  suggestedPrompts, 
  recentActivity 
} from './mockData';
import type { Deal, WorkOrder } from './mockData';

export default function App() {
  // Theme Management
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  // Navigation & View States
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  
  // Custom Markdown & Text Formatter for AI Responses
  const parseInlineBold = (str: string) => {
    const parts = str.split('**');
    return parts.map((part, i) => {
      if (i % 2 === 1) {
        return <strong key={i} className="font-bold text-slate-900 dark:text-white">{part}</strong>;
      }
      return part;
    });
  };

  const formatMessageText = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, lineIdx) => {
      const trimmed = line.trim();
      if (!trimmed) return <div key={lineIdx} className="h-1.5"></div>;

      // Table formatting
      if (trimmed.startsWith('|')) {
        if (trimmed.includes('---')) return null;
        const cols = trimmed.split('|').filter(c => c.trim()).map(c => c.trim());
        const isHeader = trimmed.toLowerCase().includes('stage') || trimmed.toLowerCase().includes('value') || trimmed.toLowerCase().includes('description');
        return (
          <div 
            key={lineIdx} 
            className={`grid grid-cols-3 gap-2 px-3.5 py-2.5 text-[10.5px] ${
              isHeader 
                ? "bg-slate-900/90 font-bold border-b border-slate-800 text-slate-200 uppercase tracking-wider rounded-t-xl" 
                : "border-b border-slate-850/60 text-slate-350 hover:bg-slate-900/10"
            }`}
          >
            {cols.map((col, colIdx) => (
              <span key={colIdx} className={colIdx === 0 && !isHeader ? "font-bold text-slate-200" : ""}>
                {parseInlineBold(col)}
              </span>
            ))}
          </div>
        );
      }

      // Headers
      if (trimmed.startsWith('# ')) {
        return <h1 key={lineIdx} className="text-sm font-bold text-slate-800 dark:text-slate-100 mb-2 mt-3 first:mt-0">{parseInlineBold(trimmed.substring(2))}</h1>;
      }
      if (trimmed.startsWith('## ')) {
        return <h2 key={lineIdx} className="text-xs font-bold text-slate-800 dark:text-slate-100 mb-1.5 mt-2">{parseInlineBold(trimmed.substring(3))}</h2>;
      }
      if (trimmed.startsWith('### ')) {
        return <h3 key={lineIdx} className="text-xs font-bold text-slate-850 dark:text-slate-100 mb-1.5 mt-2">{parseInlineBold(trimmed.substring(4))}</h3>;
      }

      // List items
      if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
        return (
          <li key={lineIdx} className="list-disc ml-5 text-slate-650 dark:text-slate-300 mb-0.5 leading-relaxed">
            {parseInlineBold(trimmed.substring(2))}
          </li>
        );
      }

      // Ordered list items
      const numMatch = trimmed.match(/^(\d+)\.\s(.*)/);
      if (numMatch) {
        return (
          <li key={lineIdx} className="list-decimal ml-5 text-slate-650 dark:text-slate-305 mb-0.5 leading-relaxed">
            {parseInlineBold(numMatch[2])}
          </li>
        );
      }

      // Standard text line
      return (
        <p key={lineIdx} className="mb-1 text-slate-750 dark:text-slate-300 leading-relaxed">
          {parseInlineBold(trimmed)}
        </p>
      );
    });
  };

  const [settingsActiveSection, setSettingsActiveSection] = useState<'api' | 'sync' | 'appearance'>('api');
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [selectedWorkOrder, setSelectedWorkOrder] = useState<WorkOrder | null>(null);
  const [notificationsOpen, setNotificationsOpen] = useState<boolean>(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState<boolean>(false);
  const [commandPaletteSearch, setCommandPaletteSearch] = useState<string>('');
  
  // Data States
  const [deals] = useState<Deal[]>(initialDeals);
  const [workOrders] = useState<WorkOrder[]>(initialWorkOrders);
  const [activities] = useState(recentActivity);
  
  // Settings & Configuration
  const [mondayToken, setMondayToken] = useState<string>(
    localStorage.getItem('mondayToken') || 
    'eyJhbGciOiJIUzI1NiJ9.eyJ0aWQiOjY4NDg2MTIxNiwiYWFpIjoxMSwidWlkIjoxMTA0NzA1NTQsImlhZCI6IjIwMjYtMDctMjFUMDg6NDM6NDkuNzUzWiIsInBlciI6Im1lOndyaXRlIiwiYWN0aWQiOjM2MTMxMjY2LCJyZ24iOiJhcHNlMiJ9.I9pTDQMFtClUyL6bww979zZwsgYQ5wKrerOIhZ2xfBI'
  );
  const [geminiApiKey, setGeminiApiKey] = useState<string>(
    localStorage.getItem('geminiApiKey') || (import.meta.env.VITE_GEMINI_API_KEY as string) || ''
  );
  const [syncStatus] = useState<'connected' | 'disconnected'>('connected');
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>('12 mins ago');
  const [syncLogs, setSyncLogs] = useState<string[]>([
    "Initial connection established with Monday.com.",
    "Mapped Deals board (ID: 5030092647) successfully.",
    "Mapped Work Orders board (ID: 5030093962) successfully.",
    "Successfully synchronized 10 Deals and 7 Work Orders."
  ]);

  // AI Chat States
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'user' | 'agent'; text: string; time: string }>>([
    { 
      sender: 'agent', 
      text: "Hello! I am your Skylark BI AI Assistant. I have indexed your live Monday.com boards (Deals and Work Orders). You can ask me questions about pipeline value, delayed projects, or get a summarized weekly update.", 
      time: "Just now" 
    }
  ]);
  const [inputMessage, setInputMessage] = useState<string>('');
  const [isAiTyping, setIsAiTyping] = useState<boolean>(false);
  
  // Filters & Search
  const [globalSearchQuery, setGlobalSearchQuery] = useState<string>('');
  const [dealFilterStage, setDealFilterStage] = useState<string>('All');
  const [dealFilterSector, setDealFilterSector] = useState<string>('All');
  const [workOrderFilterStatus, setWorkOrderFilterStatus] = useState<string>('All');
  
  // View mode defaults
  const [dealViewMode, setDealViewMode] = useState<'table' | 'kanban'>('table');
  const [workOrderViewMode, setWorkOrderViewMode] = useState<'table' | 'timeline'>('table');
  const [unreadNotifications, setUnreadNotifications] = useState<number>(3);

  // Command Palette Keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(prev => !prev);
      }
      if (e.key === 'Escape') {
        setCommandPaletteOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Sync Monday.com Simulation
  const handleManualSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      setLastSyncTime("Just now");
      const newLog = `Manual trigger sync complete. Synchronized ${deals.length} deals and ${workOrders.length} work orders. Zero conflicts.`;
      setSyncLogs(prev => [newLog, ...prev]);
      confetti({ particleCount: 30, spread: 60, origin: { y: 0.8 } });
    }, 1500);
  };

  // Local AI Simulator NLP Logic
  const generateSimulatedAiResponse = (query: string): string => {
    const q = query.toLowerCase();
    
    if (q.includes('renew') || q.includes('solar') || q.includes('wind')) {
      const renewableDeals = deals.filter(d => d.sector === 'Renewables');
      const totalVal = renewableDeals.reduce((sum, d) => sum + d.value, 0);
      const wonVal = renewableDeals.filter(d => d.stage === 'Won').reduce((sum, d) => sum + d.value, 0);
      return `### ⚡ Renewables Sector Pipeline Analysis
Our Renewables sector pipeline is currently performing **strongly**, representing **₹${(totalVal / 1000).toFixed(0)}k** in total value across **${renewableDeals.length} active deals**.

**Key Metrics:**
*   **Total Pipeline:** ₹${totalVal.toLocaleString()}
*   **Closed-Won Deals:** ₹${wonVal.toLocaleString()} (e.g., *Tata Solar Grid Phase 2*)
*   **Negotiation Stage:** ₹3,20,000 (*Adani Wind Farm Mapping*)

**Actionable Insights:**
The *Adani Wind Farm Mapping* deal (₹320k) is currently in final legal review with an 80% close probability. The assigned team is *Alpha Flight Team*, who already have a Work Order in 'Not Started' status awaiting permit authorization. Recommend finalizing contract sign-off by next week.`;
    }
    
    if (q.includes('delay') || q.includes('attention') || q.includes('risk')) {
      return `### ⚠️ Operations Bottlenecks & Delayed Work Orders
There is currently **1 Critical Operational Risk** requiring immediate leadership attention:

1.  **Work Order for NHAI Highway Corridor Mapping** (Value: **₹1,20,00,000**)
    *   **Status:** Delayed
    *   **Priority:** Critical
    *   **Assigned Team:** Delta LiDAR Survey Team
    *   **Bottleneck:** LiDAR sensor calibration failure on Day 3. Equipment has been returned to headquarters for repair.
    *   **Impact:** Project delivery is pushed back by 15 days, delaying the invoice schedule.

**Recommendations:**
*   Authorize standby LiDAR equipment dispatch from our Bangalore HQ immediately.
*   Initiate client communication with NHAI stakeholders regarding the adjusted timeline to maintain contract compliance.`;
    }

    if (q.includes('pipeline') || q.includes('stage') || q.includes('conversion')) {
      const stageCounts = deals.reduce((acc: any, d) => {
        acc[d.stage] = (acc[d.stage] || 0) + d.value;
        return acc;
      }, {});
      return `### 📊 Pipeline Breakdown by Deal Stage
Here is the aggregate value of our active sales pipeline:

| Deal Stage | Active Value | Description |
| :--- | :--- | :--- |
| **Won** | ₹${(stageCounts['Won'] || 0).toLocaleString()} | Closed deals currently in project execution. |
| **Negotiation** | ₹${(stageCounts['Negotiation'] || 0).toLocaleString()} | Deals in final pricing and legal reviews. |
| **Pitch** | ₹${(stageCounts['Pitch'] || 0).toLocaleString()} | Technical proposals submitted. |
| **Lead** | ₹${(stageCounts['Lead'] || 0).toLocaleString()} | Initial discussions. |

**Conversion Summary:**
Our current pipeline is heavily weighted in the **Won** stage (₹${((stageCounts['Won'] || 0)/1000).toFixed(0)}k), which ensures high immediate revenue but highlights a need to build early-stage pipeline traction (currently only ₹${((stageCounts['Lead'] || 0)/1000).toFixed(0)}k in Lead stage).`;
    }

    if (q.includes('weekly') || q.includes('report') || q.includes('leadership')) {
      return `# Executive Leadership Briefing
**Period:** Current Week (July 2026)  
**Data Health:** 94% Confidence Score (Source: Monday.com Sync)

---

### 1. Revenue & Pipeline Summary
*   **Delivered Revenue (Completed Jobs):** ₹10,60,000 (Strong contributions from *Singareni volume surveys* and *BESCOM Substation* projects).
*   **Active Sales Pipeline:** ₹6,10,000 (Weighted towards Renewables and Mining sectors).
*   **Win Rate:** 78% average conversion rate over past 90 days.

### 2. Operational Highlights
*   **Active Projects:** 2 currently in flight (*Tata Solar Grid Phase 2* and *L&T Smart City*).
*   **GCP Alignment:** Ground control points established successfully for L&T Smart City using high-precision DGPS.

### 3. Critical Risks
*   **NHAI Highway Mapping (Delayed):** The LiDAR sensor repair is delaying a ₹1.2M contract execution. Core priority is logistics dispatch for replacement units.

### 4. Forecast & Outlook
*   We expect to close the *Adani Wind Farm Mapping* deal (₹320k) within 10 business days. Flight permissions are already secured to allow immediate kickoff upon signature.`;
    }

    return `I parsed your query: "${query}". Here is a generic summary of your business data:
*   **Total Deals Loaded:** ${deals.length}
*   **Active Projects (Work Orders):** ${workOrders.length}
*   **Total Closed-Won Revenue:** ₹${deals.filter(d => d.stage === 'Won').reduce((sum, d) => sum + d.value, 0).toLocaleString()}
Please set a **Gemini API Key** in the **Settings** tab if you would like full generative reasoning on your dataset.`;
  };

  // CSV Exporter for Live Deals Pipeline
  const handleExportCSV = () => {
    const headers = ["Deal Name", "Customer", "Sector", "Value (INR)", "Stage", "Probability (%)", "Close Date", "Owner", "Notes"];
    const rows = deals.map(deal => [
      `"${deal.name.replace(/"/g, '""')}"`,
      `"${deal.customer.replace(/"/g, '""')}"`,
      `"${deal.sector.replace(/"/g, '""')}"`,
      deal.value,
      `"${deal.stage}"`,
      deal.probability,
      `"${deal.closeDate || ''}"`,
      `"${deal.owner.replace(/"/g, '""')}"`,
      `"${(deal.notes || '').replace(/"/g, '""')}"`
    ]);
    
    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `skylark_deals_pipeline_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    confetti({ particleCount: 50, spread: 80 });
  };

  // AI Send Message
  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return;
    
    const userMsg = { sender: 'user' as const, text, time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) };
    setChatMessages(prev => [...prev, userMsg]);
    setInputMessage('');
    setIsAiTyping(true);

    try {
      if (geminiApiKey) {
        const genAI = new GoogleGenerativeAI(geminiApiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const systemPrompt = `
          You are the Monday.com Business Intelligence Agent for Skylark Drones.
          You have read-only access to two boards: "Deals" and "Work Orders".
          
          Here is the live data from Monday.com:
          DEALS BOARD DATA:
          ${JSON.stringify(deals, null, 2)}
          
          WORK ORDERS BOARD DATA:
          ${JSON.stringify(workOrders, null, 2)}
          
          INSTRUCTIONS:
          1. Answer the user's query using the data provided. Clean and normalize dates or naming anomalies.
          2. Link Deal Name in Deals to Associated Deal in Work Orders.
          3. Deliver executive BI insights. Highlight high-value projects at risk.
          4. Format response in clear markdown headers and tables. Do not include raw asterisks.
        `;

        const result = await model.generateContent([systemPrompt, text]);
        const responseText = result.response.text();
        
        setChatMessages(prev => [...prev, {
          sender: 'agent',
          text: responseText,
          time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
        }]);
      } else {
        setTimeout(() => {
          const simulatedResponse = generateSimulatedAiResponse(text);
          setChatMessages(prev => [...prev, {
            sender: 'agent',
            text: simulatedResponse,
            time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
          }]);
        }, 1000);
      }
    } catch (err: any) {
      setChatMessages(prev => [...prev, {
        sender: 'agent',
        text: `⚠️ **AI Orchestration Error:** ${err.message || 'Failed to connect to Gemini API. Check your key in Settings.'}`,
        time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
      }]);
    } finally {
      setIsAiTyping(false);
    }
  };

  // KPIs Calculations
  const totalPipelineValue = deals
    .filter(d => d.stage !== 'Lost' && d.stage !== 'Won')
    .reduce((sum, d) => sum + d.value, 0);
    
  const closedWonRevenue = deals
    .filter(d => d.stage === 'Won')
    .reduce((sum, d) => sum + d.value, 0);

  const activeWorkOrdersCount = workOrders.filter(w => w.status === 'In Progress').length;
  const delayedWorkOrdersCount = workOrders.filter(w => w.status === 'Delayed').length;
  
  const pipelineHistory = [
    { value: 480000 }, { value: 520000 }, { value: 610000 }, { value: 550000 }, { value: 590000 }, { value: totalPipelineValue }
  ];
  const revenueHistory = [
    { value: 1800000 }, { value: 2100000 }, { value: 2400000 }, { value: 2600000 }, { value: 2750000 }, { value: closedWonRevenue }
  ];
  
  const sectorData = [
    { name: 'Renewables', value: deals.filter(d => d.sector === 'Renewables').reduce((sum, d) => sum + d.value, 0) },
    { name: 'Mining', value: deals.filter(d => d.sector === 'Mining').reduce((sum, d) => sum + d.value, 0) },
    { name: 'Infrastructure', value: deals.filter(d => d.sector === 'Infrastructure').reduce((sum, d) => sum + d.value, 0) },
    { name: 'Energy', value: deals.filter(d => d.sector === 'Energy').reduce((sum, d) => sum + d.value, 0) },
  ];

  const COLORS = ['#5B5BD6', '#7C3AED', '#06B6D4', '#22C55E', '#F59E0B', '#EF4444', '#94A3B8'];

  // Filtering
  const filteredDeals = deals.filter(d => {
    const matchesSearch = d.name.toLowerCase().includes(globalSearchQuery.toLowerCase()) || 
                          d.customer.toLowerCase().includes(globalSearchQuery.toLowerCase()) ||
                          d.owner.toLowerCase().includes(globalSearchQuery.toLowerCase());
    const matchesStage = dealFilterStage === 'All' || d.stage === dealFilterStage;
    const matchesSector = dealFilterSector === 'All' || d.sector === dealFilterSector;
    return matchesSearch && matchesStage && matchesSector;
  });

  const filteredWorkOrders = workOrders.filter(w => {
    const matchesSearch = w.associatedDeal.toLowerCase().includes(globalSearchQuery.toLowerCase()) || 
                          w.assignedTeam.toLowerCase().includes(globalSearchQuery.toLowerCase());
    const matchesStatus = workOrderFilterStatus === 'All' || w.status === workOrderFilterStatus;
    return matchesSearch && matchesStatus;
  });

  const missingValuesCount = deals.filter(d => !d.closeDate || !d.notes).length + workOrders.filter(w => !w.notes).length;
  const healthScorePercentage = Math.max(0, 100 - (missingValuesCount * 4));

  return (
    <div className="flex h-screen overflow-hidden bg-slate-950 font-sans text-slate-100 transition-colors duration-300">
      
      {/* 1. Sidebar Navigation (Floating Style Panel) */}
      <aside className="w-68 m-4 rounded-2xl border border-slate-800/80 bg-slate-900/60 shadow-xl flex flex-col justify-between shrink-0 z-20 backdrop-blur-lg">
        <div>
          {/* Logo */}
          <div className="h-16 flex items-center px-6 border-b border-slate-800/60 justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-brand-600/25">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="font-extrabold text-[13px] bg-clip-text text-transparent bg-gradient-to-r from-slate-50 to-slate-200 uppercase tracking-wider">
                Skylark BI AI
              </span>
            </div>
            <div className="text-[9px] px-2 py-0.5 rounded-full border border-slate-700 bg-slate-800 text-slate-400 font-mono">
              v1.0
            </div>
          </div>

          {/* Sync status widget */}
          <div className="p-3.5 mx-4 my-4 rounded-xl border border-slate-800 bg-slate-900/40 flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <span className={`w-2 h-2 rounded-full ${syncStatus === 'connected' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'} `}></span>
              <div className="text-left">
                <p className="text-xs font-bold text-slate-200">Monday Sync</p>
                <p className="text-[9px] text-slate-500 font-mono">{lastSyncTime}</p>
              </div>
            </div>
            <button 
              onClick={handleManualSync}
              disabled={isSyncing}
              className="p-1.5 rounded-lg border border-slate-850 hover:bg-slate-800 text-slate-400 hover:text-white transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-brand-600' : ''}`} />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="px-3 space-y-1.5">
            {[
              { id: 'dashboard', label: 'Executive Dashboard', icon: LayoutDashboard },
              { id: 'chat', label: 'AI Assistant', icon: Bot, badge: 'AI Native' },
              { id: 'deals', label: 'Deals Module', icon: Briefcase },
              { id: 'workorders', label: 'Work Orders', icon: ClipboardList },
              { id: 'analytics', label: 'Visual Analytics', icon: BarChart3 },
              { id: 'reports', label: 'Executive Reports', icon: FileText },
              { id: 'dataquality', label: 'Data Quality', icon: Database, alert: missingValuesCount > 0 }
            ].map(item => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentTab(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all group relative ${
                    isActive 
                      ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/10' 
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/20'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className={`w-4 h-4 transition-all group-hover:scale-105 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="text-[8px] px-1.5 py-0.5 rounded bg-brand-600/20 text-brand-400 border border-brand-600/20 font-extrabold uppercase">
                      {item.badge}
                    </span>
                  )}
                  {item.alert && (
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                  )}
                  {isActive && (
                    <span className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-white rounded-r-md"></span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

      </aside>

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden my-4 mr-4 rounded-2xl border border-slate-850/80 bg-slate-900/10">
        
        {/* Header bar */}
        <header className="h-16 px-6 flex items-center justify-between shrink-0 z-10 bg-slate-950/20 rounded-t-2xl border-b border-slate-850/60">
          <div className="flex items-center space-x-4 flex-1 max-w-md">
            {/* Global CMD+K trigger */}
            <div 
              onClick={() => setCommandPaletteOpen(true)}
              className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl border border-slate-800 bg-slate-900/35 hover:border-slate-700 hover:bg-slate-900/60 cursor-pointer transition-all"
            >
              <Search className="w-3.5 h-3.5 text-slate-500" />
              <span className="text-xs text-slate-500 flex-1 text-left">Search or run command...</span>
              <kbd className="text-[9px] px-1.5 py-0.5 rounded border border-slate-700 bg-slate-800 text-slate-400 font-mono">
                ⌘K
              </kbd>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Notification bell */}
            <button 
              onClick={() => {
                setNotificationsOpen(!notificationsOpen);
                setUnreadNotifications(0);
              }}
              className="p-2 rounded-lg border border-slate-800 bg-slate-900/30 hover:bg-slate-800 text-slate-400 hover:text-white transition-all relative"
            >
              <Bell className="w-4 h-4" />
              {unreadNotifications > 0 && (
                <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-brand-600"></span>
              )}
            </button>

            {/* Header Theme Toggler */}
            <button 
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-lg border border-slate-800 bg-slate-900/30 hover:bg-slate-800 text-slate-400 hover:text-white transition-all"
              title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>
            <button 
              onClick={handleManualSync}
              disabled={isSyncing}
              className="flex items-center space-x-2 px-3.5 py-1.5 rounded-lg border border-slate-800 hover:bg-slate-800 text-xs font-bold text-slate-350 transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-brand-600' : ''}`} />
              <span>Sync Monday</span>
            </button>

            <button 
              onClick={() => {
                setCurrentTab('chat');
                handleSendMessage("Generate a weekly leadership update summary.");
              }}
              className="flex items-center space-x-2 px-4 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-xs font-bold text-white shadow shadow-brand-600/10 transition-all"
            >
              <Bot className="w-3.5 h-3.5" />
              <span>Ask AI Agent</span>
            </button>
          </div>
        </header>

        {/* Tab Content Rendering */}
        <main className="flex-1 overflow-y-auto p-6 min-h-0">
          
          {/* TAB 1: EXECUTIVE DASHBOARD */}
          {currentTab === 'dashboard' && (
            <div className="space-y-6 max-w-7xl mx-auto animate-slide-up">
              
              {/* Header Greeting */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-850/60 pb-6">
                <div className="text-left">
                  <h1 className="text-xl font-bold tracking-tight text-slate-200 flex items-center space-x-2.5">
                    <span>Executive Operations Center</span>
                    <span className="text-[9px] px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-extrabold uppercase">
                      Enterprise BI
                    </span>
                  </h1>
                  <p className="text-xs text-slate-500 mt-1">
                    Real-time sales pipelines, operational logs, and data integrity metrics from Monday.com
                  </p>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="px-3.5 py-1.5 rounded-xl border border-slate-800 bg-slate-900/30 text-right">
                    <p className="text-[9px] text-slate-500 font-mono uppercase tracking-wider">Sync Status</p>
                    <p className="text-xs font-bold text-emerald-500 flex items-center space-x-1.5 justify-end mt-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      <span>Synced</span>
                    </p>
                  </div>
                  <div className="px-3.5 py-1.5 rounded-xl border border-slate-800 bg-slate-900/30 text-right">
                    <p className="text-[9px] text-slate-500 font-mono uppercase tracking-wider">Data Health</p>
                    <p className="text-xs font-bold text-brand-600 mt-0.5">{healthScorePercentage}% Confidence</p>
                  </div>
                </div>
              </div>

              {/* Glowing Recommendations Widget */}
              <div className="glass-card p-5 border border-indigo-500/15 bg-indigo-500/5 rounded-2xl flex items-start space-x-4 text-left animate-glow-pulse">
                <div className="w-9 h-9 rounded-xl bg-indigo-600/15 border border-indigo-500/20 flex items-center justify-center shrink-0 mt-0.5">
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">AI Operations Insight Recommendation</h4>
                  <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                    LiDAR sensor failures on the **NHAI Highway Mapping Corridor** project have halted operations. stand-by dispatch from Bangalore HQ has not been requested. **Action:** dispatch standby calibration tools within 24h to avoid ₹400k revenue recognition delay.
                  </p>
                </div>
              </div>

              {/* KPI Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                
                {/* KPI Card 1: Pipeline */}
                <div className="glass-card glass-card-hover p-5 rounded-2xl flex flex-col justify-between h-32 relative overflow-hidden group border-t-2 border-t-brand-600 bg-gradient-to-b from-brand-600/5 to-transparent">
                  <div className="absolute right-4 top-4 text-slate-400/20">
                    <Briefcase className="w-7 h-7" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Active Pipeline</span>
                    <h3 className="text-2xl font-bold text-slate-100 mt-1 font-mono">₹{(totalPipelineValue / 1000).toFixed(0)}k</h3>
                  </div>
                  <div className="flex items-end justify-between mt-2">
                    <span className="text-xs text-emerald-500 flex items-center space-x-0.5 font-bold">
                      <TrendingUp className="w-3 h-3" />
                      <span>+12.4%</span>
                    </span>
                    <div className="w-20 h-8">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={pipelineHistory}>
                          <Area type="monotone" dataKey="value" stroke="#5B5BD6" fill="rgba(91, 91, 214, 0.01)" strokeWidth={1.5} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                {/* KPI Card 2: Revenue */}
                <div className="glass-card glass-card-hover p-5 rounded-2xl flex flex-col justify-between h-32 relative overflow-hidden group border-t-2 border-t-indigo-600 bg-gradient-to-b from-indigo-600/5 to-transparent">
                  <div className="absolute right-4 top-4 text-slate-400/20">
                    <DollarSign className="w-7 h-7" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Closed Won Revenue</span>
                    <h3 className="text-2xl font-bold text-slate-100 mt-1 font-mono">₹{(closedWonRevenue / 100000).toFixed(1)}L</h3>
                  </div>
                  <div className="flex items-end justify-between mt-2">
                    <span className="text-xs text-emerald-500 flex items-center space-x-0.5 font-bold">
                      <TrendingUp className="w-3 h-3" />
                      <span>+8.2%</span>
                    </span>
                    <div className="w-20 h-8">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={revenueHistory}>
                          <Area type="monotone" dataKey="value" stroke="#7C3AED" fill="rgba(124, 58, 237, 0.01)" strokeWidth={1.5} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                {/* KPI Card 3: Execution */}
                <div className="glass-card glass-card-hover p-5 rounded-2xl flex flex-col justify-between h-32 relative overflow-hidden group border-t-2 border-t-emerald-500 bg-gradient-to-b from-emerald-500/5 to-transparent">
                  <div className="absolute right-4 top-4 text-slate-400/20">
                    <CheckCircle className="w-7 h-7" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Active Execution</span>
                    <h3 className="text-2xl font-bold text-slate-100 mt-1">{activeWorkOrdersCount} In Progress</h3>
                  </div>
                  <div className="flex items-end justify-between mt-2 text-xs">
                    <span className="text-slate-400 font-semibold font-mono">
                      {workOrders.filter(w => w.status === 'Completed').length} Completed
                    </span>
                    <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 font-extrabold uppercase text-[9px]">
                      Stable
                    </span>
                  </div>
                </div>

                {/* KPI Card 4: Risks */}
                <div className="glass-card glass-card-hover p-5 rounded-2xl flex flex-col justify-between h-32 relative overflow-hidden group border-t-2 border-t-rose-500 bg-gradient-to-b from-rose-500/5 to-transparent">
                  <div className="absolute right-4 top-4 text-slate-400/20">
                    <AlertTriangle className="w-7 h-7" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Operational Bottlenecks</span>
                    <h3 className="text-2xl font-bold text-slate-100 mt-1">{delayedWorkOrdersCount} Delayed</h3>
                  </div>
                  <div className="flex items-end justify-between mt-2 text-xs">
                    <span className="text-rose-500 font-bold">Action required</span>
                    <span className="px-2 py-0.5 rounded bg-rose-500/15 border border-rose-500/25 text-rose-500 font-extrabold uppercase text-[9px] animate-pulse">
                      Critical
                    </span>
                  </div>
                </div>

              </div>

              {/* Charts & Actions Row */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Sector analysis (col-span-2) */}
                <div className="lg:col-span-2 glass-card p-6 rounded-2xl">
                  <div className="flex items-center justify-between mb-6 border-b border-slate-850/60 pb-4">
                    <div className="text-left">
                      <h3 className="text-sm font-bold text-slate-200">Pipeline Performance by Sector</h3>
                      <p className="text-[11px] text-slate-500 mt-0.5">Market capitalization of target drone operations</p>
                    </div>
                    <button 
                      onClick={() => setCurrentTab('analytics')}
                      className="text-xs text-brand-600 hover:text-brand-500 font-bold flex items-center space-x-1"
                    >
                      <span>Explore Analytics</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={sectorData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                        <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                        <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                        <Tooltip 
                          contentStyle={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '12px' }}
                          labelStyle={{ color: 'var(--slate-100)', fontWeight: 'bold' }}
                          itemStyle={{ color: 'var(--slate-300)', fontSize: '11px' }}
                        />
                        <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                          {sectorData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* AI Prompts and Feed */}
                <div className="space-y-6">
                  
                  {/* AI Assistant Quick Call */}
                  <div className="glass-card p-5 rounded-2xl border border-brand-600/10 bg-brand-600/5">
                    <div className="flex items-center space-x-2.5 mb-3">
                      <Bot className="w-4 h-4 text-brand-600" />
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">AI Assistant Panel</h4>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed mb-4 text-left font-medium">
                      Query your active pipeline, deal statuses, and operational risks in conversational language.
                    </p>
                    <div className="space-y-2">
                      {suggestedPrompts.slice(0, 3).map((prompt, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            setCurrentTab('chat');
                            handleSendMessage(prompt);
                          }}
                          className="w-full text-left text-xs p-2.5 rounded-xl border border-slate-800 bg-slate-900/30 hover:border-brand-600/30 hover:bg-brand-600/5 transition-all text-slate-400 hover:text-slate-200 flex items-center justify-between"
                        >
                          <span className="truncate mr-2 font-semibold">{prompt}</span>
                          <ChevronRight className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Activity feed */}
                  <div className="glass-card p-5 rounded-2xl">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-4 text-left">Recent Activity</h4>
                    <div className="space-y-4">
                      {activities.map(act => (
                        <div key={act.id} className="flex items-start space-x-3 text-xs text-left">
                          <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                            act.type === 'sync' ? 'bg-emerald-500' :
                            act.type === 'report' ? 'bg-indigo-500' :
                            act.type === 'deal' ? 'bg-violet-500' : 'bg-amber-500'
                          }`}></span>
                          <div className="flex-1 min-w-0">
                            <p className="text-slate-400 leading-relaxed">{act.text}</p>
                            <p className="text-[9px] text-slate-500 mt-1 font-mono">{act.time}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>

              </div>

            </div>
          )}

          {/* TAB 2: AI ASSISTANT CHAT */}
          {currentTab === 'chat' && (
            <div className="h-full flex flex-col justify-between -m-6 bg-slate-950/20 rounded-2xl animate-slide-up">
              
              {/* Chat Header */}
              <div className="h-14 border-b border-slate-850 px-6 flex items-center justify-between shrink-0 bg-slate-900/10">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-brand-600/10 border border-brand-600/20 flex items-center justify-center">
                    <Bot className="w-4 h-4 text-brand-600" />
                  </div>
                  <div className="text-left">
                    <h2 className="text-xs font-bold text-slate-200 uppercase tracking-wider">AI Business intelligence workspace</h2>
                    <p className="text-[9px] text-slate-500 mt-0.5">Live Monday.com context active</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button 
                    onClick={() => {
                      setChatMessages([
                        { sender: 'agent', text: "Chat history cleared. Ask me anything about your active business boards.", time: "Just now" }
                      ]);
                    }}
                    className="p-1.5 rounded-lg border border-slate-800 hover:bg-slate-900 text-xs text-slate-500 hover:text-slate-200 transition-all"
                    title="Clear Chat"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  <button 
                    onClick={() => {
                      const text = chatMessages.map(m => `[${m.time}] ${m.sender.toUpperCase()}: ${m.text}`).join('\n\n');
                      navigator.clipboard.writeText(text);
                      confetti({ particleCount: 20, spread: 40 });
                    }}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-slate-800 hover:bg-slate-900 text-xs font-bold text-slate-500 hover:text-slate-200 transition-all"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Copy Logs</span>
                  </button>
                </div>
              </div>

              {/* Chat Split View */}
              <div className="flex-1 flex min-h-0 overflow-hidden">
                
                {/* Left Side: Pinned/Suggested */}
                <div className="w-64 border-r border-slate-850/60 p-4 space-y-4 shrink-0 hidden md:block bg-slate-900/5">
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider text-left">Suggested Queries</div>
                  <div className="space-y-2">
                    {suggestedPrompts.map((prompt, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSendMessage(prompt)}
                        className="w-full text-left text-xs p-2.5 rounded-xl border border-slate-850 bg-slate-900/10 hover:border-slate-700 hover:bg-slate-900/40 text-slate-400 hover:text-slate-200 transition-all leading-relaxed font-semibold"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Middle: Chat Messages */}
                <div className="flex-1 flex flex-col min-w-0 bg-slate-950/10">
                  
                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-6">
                    <div className="max-w-4xl mx-auto space-y-6 w-full">
                      {chatMessages.map((msg, index) => (
                        <div key={index} className="flex flex-col space-y-2 text-left animate-slide-up">
                          {/* Sender Header Row */}
                          <div className={`flex items-center space-x-2 ${msg.sender === 'user' ? 'justify-end' : ''}`}>
                            {msg.sender === 'agent' ? (
                              <>
                                <div className="w-5 h-5 rounded bg-brand-600/10 border border-brand-600/20 flex items-center justify-center font-bold text-[10px] text-brand-600">
                                  BI
                                </div>
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Skylark BI Assistant</span>
                              </>
                            ) : (
                              <>
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">You</span>
                                <div className="w-5 h-5 rounded bg-brand-600 flex items-center justify-center font-bold text-[10px] text-white">
                                  U
                                </div>
                              </>
                            )}
                          </div>
                          
                          {/* Message Card */}
                          <div className={`flex ${msg.sender === 'user' ? 'justify-end' : ''}`}>
                            <div className={`max-w-3xl rounded-2xl py-3.5 px-5 text-xs leading-relaxed ${
                              msg.sender === 'user'
                                ? 'bg-brand-600 text-white shadow-md shadow-brand-600/5'
                                : 'bg-slate-900/50 dark:bg-slate-900/40 text-slate-200 shadow-sm'
                            }`}>
                              <div className="prose prose-invert max-w-none break-words">
                                {formatMessageText(msg.text)}
                              </div>
                              <span className="text-[9px] text-slate-500 block text-right mt-2 font-mono">{msg.time}</span>
                            </div>
                          </div>
                        </div>
                      ))}

                      {/* AI Loading bubble */}
                      {isAiTyping && (
                        <div className="flex flex-col space-y-2 text-left">
                          <div className="flex items-center space-x-2">
                            <div className="w-5 h-5 rounded bg-brand-600/10 border border-brand-600/20 flex items-center justify-center font-bold text-[10px] text-brand-600">
                              BI
                            </div>
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Skylark BI Assistant</span>
                          </div>
                          <div className="flex">
                            <div className="bg-slate-900/50 dark:bg-slate-900/40 rounded-2xl p-4 max-w-sm">
                              <div className="flex items-center space-x-1.5">
                                <span className="w-2 h-2 rounded-full bg-brand-600 typing-dot" style={{ animationDelay: '0ms' }}></span>
                                <span className="w-2 h-2 rounded-full bg-brand-600 typing-dot" style={{ animationDelay: '150ms' }}></span>
                                <span className="w-2 h-2 rounded-full bg-brand-600 typing-dot" style={{ animationDelay: '300ms' }}></span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Input form */}
                  <div className="p-4 border-t border-slate-850 bg-slate-950/20">
                    <form 
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleSendMessage(inputMessage);
                      }}
                      className="relative flex items-center max-w-4xl mx-auto"
                    >
                      <input
                        type="text"
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        placeholder="Query pipeline statistics, logistics anomalies, or ask for updates..."
                        className="w-full pl-4 pr-12 py-3 rounded-xl border border-slate-800 focus:border-brand-600 bg-slate-900/35 text-xs text-slate-200 placeholder-slate-500 focus:outline-none"
                      />
                      <button
                        type="submit"
                        disabled={!inputMessage.trim() || isAiTyping}
                        className="absolute right-2.5 p-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white transition-all disabled:opacity-30"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </form>
                    <p className="text-[9px] text-slate-500 text-center mt-2.5 font-mono">
                      {!geminiApiKey ? "✨ Running on local Simulator engine. Set Gemini API Key in Settings tab to connect live AI models." : "⚡ Live connection active."}
                    </p>
                  </div>

                </div>

              </div>

            </div>
          )}

          {/* TAB 3: DEALS CRM */}
          {currentTab === 'deals' && (
            <div className="space-y-6 max-w-7xl mx-auto animate-slide-up">
              
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-850/60 pb-6">
                <div className="text-left">
                  <h1 className="text-lg font-bold tracking-tight text-slate-100">Enterprise CRM & Sales Pipeline</h1>
                  <p className="text-xs text-slate-500 mt-1">Live deal tracker synced with Monday.com Deals board</p>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="flex items-center space-x-1 rounded-lg border border-slate-800 bg-slate-900/30 p-1">
                    <button 
                      onClick={() => setDealViewMode('table')} 
                      className={`text-xs px-3 py-1.5 rounded font-bold transition-all flex items-center space-x-1 ${dealViewMode === 'table' ? 'bg-slate-800 text-white' : 'text-slate-450 hover:text-slate-200'}`}
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5" />
                      <span>Table View</span>
                    </button>
                    <button 
                      onClick={() => setDealViewMode('kanban')} 
                      className={`text-xs px-3 py-1.5 rounded font-bold transition-all flex items-center space-x-1 ${dealViewMode === 'kanban' ? 'bg-slate-800 text-white' : 'text-slate-450 hover:text-slate-200'}`}
                    >
                      <Kanban className="w-3.5 h-3.5" />
                      <span>Kanban Board</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative flex-1 min-w-[200px] max-w-xs">
                  <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-500" />
                  <input
                    type="text"
                    value={globalSearchQuery}
                    onChange={(e) => setGlobalSearchQuery(e.target.value)}
                    placeholder="Search deals, clients..."
                    className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-800 focus:border-brand-600 bg-slate-900/35 text-xs text-slate-250 focus:outline-none"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-slate-500 flex items-center space-x-1">
                    <Filter className="w-3.5 h-3.5" />
                    <span>Stage:</span>
                  </span>
                  <select
                    value={dealFilterStage}
                    onChange={(e) => setDealFilterStage(e.target.value)}
                    className="px-2.5 py-1.5 rounded-lg border border-slate-800 bg-slate-900/50 text-xs text-slate-300 focus:outline-none"
                  >
                    <option value="All">All Stages</option>
                    <option value="Lead">Lead</option>
                    <option value="Pitch">Pitch</option>
                    <option value="Negotiation">Negotiation</option>
                    <option value="Won">Won</option>
                    <option value="Lost">Lost</option>
                  </select>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-slate-500">Sector:</span>
                  <select
                    value={dealFilterSector}
                    onChange={(e) => setDealFilterSector(e.target.value)}
                    className="px-2.5 py-1.5 rounded-lg border border-slate-800 bg-slate-900/50 text-xs text-slate-300 focus:outline-none"
                  >
                    <option value="All">All Sectors</option>
                    <option value="Energy">Energy</option>
                    <option value="Mining">Mining</option>
                    <option value="Renewables">Renewables</option>
                    <option value="Infrastructure">Infrastructure</option>
                    <option value="Utilities">Utilities</option>
                  </select>
                </div>
              </div>

              {/* Table Mode */}
              {dealViewMode === 'table' && (
                <div className="glass-card rounded-2xl overflow-hidden border border-slate-800/80">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-800 bg-slate-900/40 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                          <th className="p-4">Deal Name</th>
                          <th className="p-4">Customer</th>
                          <th className="p-4">Sector</th>
                          <th className="p-4 text-right">Value</th>
                          <th className="p-4">Stage</th>
                          <th className="p-4">Probability</th>
                          <th className="p-4">Close Date</th>
                          <th className="p-4">Owner</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredDeals.length === 0 ? (
                          <tr>
                            <td colSpan={8} className="p-8 text-center text-slate-500 font-mono">
                              No deals match your current filters.
                            </td>
                          </tr>
                        ) : (
                          filteredDeals.map((deal) => (
                            <tr 
                              key={deal.id} 
                              className="border-b border-slate-850/60 hover:bg-slate-900/30 transition-colors group cursor-pointer"
                              onClick={() => setSelectedDeal(deal)}
                            >
                              <td className="p-4 font-bold text-slate-200 group-hover:text-brand-600 transition-colors">
                                {deal.name}
                              </td>
                              <td className="p-4 text-slate-400">{deal.customer}</td>
                              <td className="p-4">
                                <span className="px-2.5 py-0.5 rounded bg-slate-900/60 text-slate-400 border border-slate-850 text-[10px] font-semibold">
                                  {deal.sector}
                                </span>
                              </td>
                              <td className="p-4 text-right font-mono font-bold text-slate-200">₹{deal.value.toLocaleString()}</td>
                              <td className="p-4">
                                <span className={`px-2.5 py-0.5 rounded font-bold text-[10px] uppercase tracking-wide ${
                                  deal.stage === 'Won' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' :
                                  deal.stage === 'Lost' ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' :
                                  deal.stage === 'Negotiation' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' :
                                  'bg-slate-800 text-slate-450 border border-slate-700'
                                }`}>
                                  {deal.stage}
                                </span>
                              </td>
                              <td className="p-4">
                                <div className="flex items-center space-x-1.5">
                                  <div className="w-12 bg-slate-805 rounded-full h-1.5 overflow-hidden">
                                    <div 
                                      className={`h-full rounded-full ${deal.stage === 'Won' ? 'bg-emerald-500' : 'bg-brand-600'}`} 
                                      style={{ width: `${deal.probability}%` }}
                                    ></div>
                                  </div>
                                  <span className="font-mono text-[9px] text-slate-500">{deal.probability}%</span>
                                </div>
                              </td>
                              <td className="p-4 text-slate-500 font-mono">{deal.closeDate || 'N/A'}</td>
                              <td className="p-4 text-slate-400">{deal.owner}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Kanban Mode */}
              {dealViewMode === 'kanban' && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {['Lead', 'Pitch', 'Negotiation', 'Won'].map((stage) => {
                    const stageDeals = deals.filter(d => d.stage === stage);
                    const stageSum = stageDeals.reduce((sum, d) => sum + d.value, 0);
                    return (
                      <div key={stage} className="bg-slate-900/35 border border-slate-850 rounded-2xl p-4 flex flex-col min-h-[400px]">
                        <div className="flex items-center justify-between border-b border-slate-850/60 pb-3 mb-4">
                          <div className="text-left">
                            <span className="text-xs font-bold text-slate-200">{stage}</span>
                            <span className="text-[10px] text-slate-500 ml-1.5 font-mono">({stageDeals.length})</span>
                          </div>
                          <span className="text-[10px] text-slate-450 font-mono font-bold">₹{(stageSum / 1000).toFixed(0)}k</span>
                        </div>
                        <div className="space-y-2 flex-1 overflow-y-auto">
                          {stageDeals.map(deal => (
                            <div 
                              key={deal.id}
                              onClick={() => setSelectedDeal(deal)}
                              className="bg-slate-900 border border-slate-800 hover:border-brand-600/20 p-3.5 rounded-xl cursor-pointer transition-all hover:-translate-y-0.5 shadow-sm text-left"
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-955 text-slate-500 font-mono uppercase font-bold">{deal.sector}</span>
                                <span className="text-[10px] font-mono font-bold text-slate-200">₹{(deal.value / 1000).toFixed(0)}k</span>
                              </div>
                              <h4 className="text-xs font-bold text-slate-200 mt-2 truncate">{deal.name}</h4>
                              <p className="text-[10px] text-slate-500 mt-1 truncate">{deal.customer}</p>
                              <div className="mt-3.5 pt-2 border-t border-slate-850 flex items-center justify-between text-[9px]">
                                <span className="text-slate-500">Prob: {deal.probability}%</span>
                                <span className="text-slate-450 truncate">{deal.owner}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

            </div>
          )}

          {/* TAB 4: WORK ORDERS */}
          {currentTab === 'workorders' && (
            <div className="space-y-6 max-w-7xl mx-auto animate-slide-up">
              
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-850/60 pb-6">
                <div className="text-left">
                  <h1 className="text-lg font-bold tracking-tight text-slate-100">Operations & Execution Tracker</h1>
                  <p className="text-xs text-slate-500 mt-1">Status of scheduled drone missions and dataset deliverables</p>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="flex items-center space-x-1 rounded-lg border border-slate-800 bg-slate-900/30 p-1">
                    {['table', 'timeline'].map(mode => (
                      <button 
                        key={mode}
                        onClick={() => setWorkOrderViewMode(mode as any)} 
                        className={`text-xs px-3 py-1.5 rounded font-bold capitalize transition-all ${workOrderViewMode === mode ? 'bg-slate-800 text-white' : 'text-slate-450 hover:text-slate-200'}`}
                      >
                        {mode}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative flex-1 min-w-[200px] max-w-xs">
                  <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-500" />
                  <input
                    type="text"
                    value={globalSearchQuery}
                    onChange={(e) => setGlobalSearchQuery(e.target.value)}
                    placeholder="Search work orders..."
                    className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-800 focus:border-brand-600 bg-slate-900/35 text-xs text-slate-250 focus:outline-none"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-slate-500 flex items-center space-x-1">
                    <Filter className="w-3.5 h-3.5" />
                    <span>Status:</span>
                  </span>
                  <select
                    value={workOrderFilterStatus}
                    onChange={(e) => setWorkOrderFilterStatus(e.target.value)}
                    className="px-2.5 py-1.5 rounded-lg border border-slate-800 bg-slate-900/50 text-xs text-slate-300 focus:outline-none"
                  >
                    <option value="All">All Statuses</option>
                    <option value="Not Started">Not Started</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                    <option value="Delayed">Delayed</option>
                  </select>
                </div>
              </div>

              {/* Table */}
              {workOrderViewMode === 'table' && (
                <div className="glass-card rounded-2xl overflow-hidden border border-slate-800/80">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-800 bg-slate-900/40 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                          <th className="p-4">WO ID</th>
                          <th className="p-4">Associated Deal</th>
                          <th className="p-4">Assigned Team</th>
                          <th className="p-4">Priority</th>
                          <th className="p-4">Target Date</th>
                          <th className="p-4">Status</th>
                          <th className="p-4 text-right">Value</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredWorkOrders.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="p-8 text-center text-slate-500 font-mono">
                              No work orders match filters.
                            </td>
                          </tr>
                        ) : (
                          filteredWorkOrders.map((wo) => (
                            <tr 
                              key={wo.id} 
                              className="border-b border-slate-850/60 hover:bg-slate-900/30 transition-colors group cursor-pointer"
                              onClick={() => setSelectedWorkOrder(wo)}
                            >
                              <td className="p-4 font-mono font-bold text-slate-400 uppercase">{wo.id}</td>
                              <td className="p-4 font-bold text-slate-200 group-hover:text-brand-600 transition-colors">{wo.associatedDeal}</td>
                              <td className="p-4 text-slate-300">{wo.assignedTeam}</td>
                              <td className="p-4">
                                <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                                  wo.priority === 'Critical' ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' :
                                  wo.priority === 'High' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' :
                                  'bg-slate-900 text-slate-500 border border-slate-800'
                                }`}>
                                  {wo.priority}
                                </span>
                              </td>
                              <td className="p-4 font-mono text-slate-400">{wo.targetEndDate}</td>
                              <td className="p-4">
                                <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase tracking-wide ${
                                  wo.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' :
                                  wo.status === 'Delayed' ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20 animate-pulse' :
                                  wo.status === 'In Progress' ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20' :
                                  'bg-slate-800 text-slate-500 border border-slate-705'
                                }`}>
                                  {wo.status}
                                </span>
                              </td>
                              <td className="p-4 text-right font-mono font-bold text-slate-200">₹{wo.revenue.toLocaleString()}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Timeline */}
              {workOrderViewMode === 'timeline' && (
                <div className="glass-card p-6 rounded-2xl space-y-6 text-left">
                  <div className="text-xs font-semibold text-slate-400">Quarterly Target Schedules</div>
                  <div className="space-y-4">
                    {filteredWorkOrders.map((wo) => (
                      <div key={wo.id} className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-850/60 pb-3">
                        <div className="w-64">
                          <h4 className="text-xs font-bold text-slate-200">{wo.associatedDeal}</h4>
                          <p className="text-[10px] text-slate-500 mt-0.5">Assigned to: {wo.assignedTeam}</p>
                        </div>
                        <div className="flex-1 flex items-center space-x-4 max-w-md">
                          <span className="text-[10px] text-slate-500 font-mono w-16">Q3-26</span>
                          <div className="flex-1 bg-slate-900/50 h-3 rounded-full overflow-hidden relative border border-slate-800">
                            <div 
                              className={`h-full rounded-full transition-all duration-500 ${
                                wo.status === 'Completed' ? 'bg-emerald-500 shadow-sm shadow-emerald-500/20' :
                                wo.status === 'Delayed' ? 'bg-rose-500 shadow-sm shadow-rose-500/20 animate-pulse' :
                                wo.status === 'In Progress' ? 'bg-blue-500 shadow-sm shadow-blue-500/20' : 'bg-slate-600'
                              }`} 
                              style={{ 
                                width: wo.status === 'Completed' ? '100%' :
                                       wo.status === 'In Progress' ? '65%' :
                                       wo.status === 'Delayed' ? '40%' : '15%'
                              }}
                            ></div>
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono w-20 text-right">{wo.targetEndDate}</span>
                        </div>
                        <div>
                          <span className={`text-[9px] px-2.5 py-0.5 rounded font-bold uppercase ${
                            wo.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-500' :
                            wo.status === 'Delayed' ? 'bg-rose-500/10 text-rose-500 animate-pulse' : 'bg-slate-850 text-slate-500'
                          }`}>
                            {wo.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          )}

          {/* TAB 5: VISUAL ANALYTICS */}
          {currentTab === 'analytics' && (
            <div className="space-y-6 max-w-7xl mx-auto animate-slide-up">
              
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-850/60 pb-6">
                <div className="text-left">
                  <h1 className="text-lg font-bold tracking-tight text-slate-100">Visual Analytics Analytics</h1>
                  <p className="text-xs text-slate-500 mt-1">Aggregated target KPIs and sales pipelines forecasts</p>
                </div>
                <button 
                  onClick={handleExportCSV}
                  className="flex items-center space-x-1.5 px-3 py-2 rounded-lg border border-slate-800 hover:bg-slate-900 text-xs font-bold text-slate-400 hover:text-slate-200 transition-colors self-start sm:self-center"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export Analytics</span>
                </button>
              </div>

              {/* Charts grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Quarter trend */}
                <div className="glass-card p-6 rounded-2xl">
                  <h3 className="text-xs font-bold text-slate-200 mb-4 uppercase tracking-wider text-left">Accrued Revenue Trend</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={[
                        { name: 'Q1-26', value: 800000 },
                        { name: 'Q2-26', value: 1200000 },
                        { name: 'Q3-26', value: closedWonRevenue },
                        { name: 'Q4-26 (Forecast)', value: closedWonRevenue + totalPipelineValue * 0.5 },
                      ]}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                        <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                        <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                        <Tooltip 
                          contentStyle={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '12px' }} 
                          labelStyle={{ color: 'var(--slate-100)', fontWeight: 'bold' }}
                          itemStyle={{ color: 'var(--slate-300)', fontSize: '11px' }}
                        />
                        <Area type="monotone" dataKey="value" stroke="#5B5BD6" fill="rgba(91, 91, 214, 0.03)" strokeWidth={2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Operations mix */}
                <div className="glass-card p-6 rounded-2xl">
                  <h3 className="text-xs font-bold text-slate-200 mb-4 uppercase tracking-wider text-left">Execution Status Composition</h3>
                  <div className="h-64 flex flex-col sm:flex-row items-center justify-between gap-6">
                    <div className="w-48 h-48 shrink-0">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={[
                              { name: 'Completed', value: workOrders.filter(w => w.status === 'Completed').length },
                              { name: 'In Progress', value: workOrders.filter(w => w.status === 'In Progress').length },
                              { name: 'Delayed', value: workOrders.filter(w => w.status === 'Delayed').length },
                              { name: 'Not Started', value: workOrders.filter(w => w.status === 'Not Started').length }
                            ]}
                            cx="50%"
                            cy="50%"
                            innerRadius={45}
                            outerRadius={65}
                            paddingAngle={3}
                            dataKey="value"
                          >
                            <Cell fill="#22C55E" />
                            <Cell fill="#5B5BD6" />
                            <Cell fill="#EF4444" />
                            <Cell fill="#94A3B8" />
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex-1 space-y-3.5 w-full text-xs">
                      {[
                        { label: 'Completed', color: 'bg-emerald-500', count: workOrders.filter(w => w.status === 'Completed').length },
                        { label: 'In Progress', color: 'bg-blue-500', count: workOrders.filter(w => w.status === 'In Progress').length },
                        { label: 'Delayed', color: 'bg-rose-500', count: workOrders.filter(w => w.status === 'Delayed').length },
                        { label: 'Not Started', color: 'bg-slate-500', count: workOrders.filter(w => w.status === 'Not Started').length }
                      ].map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between border-b border-slate-850/60 pb-1.5 text-left">
                          <div className="flex items-center space-x-2">
                            <span className={`w-2.5 h-2.5 rounded-full ${item.color}`}></span>
                            <span className="text-slate-400 font-bold">{item.label}</span>
                          </div>
                          <span className="font-bold text-slate-200 font-mono">{item.count} items</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* TAB 6: EXECUTIVE REPORTS */}
          {currentTab === 'reports' && (
            <div className="space-y-6 max-w-7xl mx-auto animate-slide-up">
              
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-850/60 pb-6">
                <div className="text-left">
                  <h1 className="text-lg font-bold tracking-tight text-slate-100">Executive Briefing Generator</h1>
                  <p className="text-xs text-slate-500 mt-1">Compile comprehensive slide/PDF summaries for leadership review</p>
                </div>
              </div>

              {/* Reports builder */}
              <div id="printable-report" className="glass-card p-8 rounded-2xl max-w-3xl mx-auto space-y-8 bg-slate-900/10">
                <div className="flex items-center justify-between border-b border-slate-850/60 pb-4 no-print">
                  <div className="flex items-center space-x-3 text-left">
                    <FileText className="w-5 h-5 text-brand-600" />
                    <div>
                      <h3 className="text-sm font-bold text-slate-200">Current Week Leadership Summary</h3>
                      <p className="text-[9px] text-slate-500 font-mono">Status: Draft (Pending Sync)</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => { window.print(); }}
                    className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-brand-600 hover:bg-brand-500 text-white rounded-lg text-xs font-bold shadow transition-all animate-pulse"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download PDF Briefing</span>
                  </button>
                </div>

                <div className="space-y-6 text-xs text-slate-350 leading-relaxed text-left">
                  <div>
                    <h4 className="text-[10px] font-bold text-slate-250 uppercase tracking-wider mb-2 font-mono">1. Executive Summary</h4>
                    <p>
                      This reporting cycle outlines the transition of several key pilot surveys into contract execution. Skylark Drones' core platforms recorded total completed revenue of **₹{(closedWonRevenue / 100000).toFixed(2)} Lakhs**, driven by volume assessments in the mining division. While pipeline strength remains robust at **₹{(totalPipelineValue / 100000).toFixed(2)} Lakhs**, operational delays in our highway mapping corridors highlight key equipment logistics vulnerabilities that require mitigation.
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="text-[10px] font-bold text-slate-250 uppercase tracking-wider mb-2 font-mono">2. Pipeline Analysis</h4>
                    <p>
                      Active negotiations represent **₹{(totalPipelineValue / 100000).toFixed(2)} Lakhs** in pipeline volume. The renewables sector remains our most active sector, representing 52% of pipeline value. Contract conversions remain healthy with a 78% win rate over 90 days.
                    </p>
                  </div>

                  <div>
                    <h4 className="text-[10px] font-bold text-slate-250 uppercase tracking-wider mb-2.5 font-mono">3. Primary Strategic Risks</h4>
                    <div className="p-4 rounded-xl border border-rose-500/20 bg-rose-500/5 text-rose-350 flex items-start space-x-3 text-left">
                      <AlertTriangle className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" />
                      <div>
                        <p className="font-bold text-slate-200">NHAI Corridor Mapping Project Delivery (ID: wo3)</p>
                        <p className="mt-1 text-[11px] text-rose-450">
                          Equipment failure has halted Day 3 LiDAR operations. Standard replacement dispatch timeline stands at 15 days, impacting first phase milestone collections (₹12,00,000 contract schedule).
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-[10px] font-bold text-slate-250 uppercase tracking-wider mb-2 font-mono">4. Action Items & Next Steps</h4>
                    <ul className="list-decimal ml-4 space-y-1.5 text-slate-400">
                      <li>Authorize backup LiDAR sensor allocation dispatch from Bangalore HQ immediately.</li>
                      <li>Finalize commercial contract negotiations for the **Adani Wind Farm Mapping** (₹3,20,000, currently in final legal review).</li>
                      <li>Address flagged data missing entries (missing close dates/comments) on Monday.com boards.</li>
                    </ul>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB 7: DATA QUALITY */}
          {currentTab === 'dataquality' && (
            <div className="space-y-6 max-w-7xl mx-auto animate-slide-up">
              
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-850/60 pb-6">
                <div className="text-left">
                  <h1 className="text-lg font-bold tracking-tight text-slate-200">Monday.com Data Integrity Audit</h1>
                  <p className="text-xs text-slate-555 mt-1 font-medium">Audit logs flagging missing fields, mismatched dates, and schema deviations</p>
                </div>
              </div>

              {/* Data quality cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                
                {/* Visual SVG health ring */}
                <div className="glass-card p-6 rounded-2xl flex flex-col items-center justify-center text-center">
                  <div className="relative w-24 h-24 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                      <path
                        className="text-slate-200 dark:text-slate-800"
                        strokeWidth="2.5"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                      <path
                        className="text-brand-600 transition-all duration-1000 ease-out"
                        strokeDasharray={`${healthScorePercentage}, 100`}
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                    </svg>
                    <div className="absolute flex flex-col items-center justify-center">
                      <span className="text-lg font-bold text-slate-800 dark:text-slate-100 font-mono">{healthScorePercentage}%</span>
                    </div>
                  </div>
                  <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mt-4">Database Health Index</h3>
                  <p className="text-[10px] text-slate-500 mt-1">Weighted metric auditing empty fields and relation integrity</p>
                </div>

                <div className="glass-card p-6 rounded-2xl md:col-span-2 flex flex-col justify-between text-left">
                  <div>
                    <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-4">Integrity Violations Summary</h3>
                    <div className="space-y-2.5 text-xs">
                      <div className="flex items-center justify-between py-1.5 border-b border-slate-850/60">
                        <span className="text-slate-400">Total Empty Columns Audited:</span>
                        <span className="font-mono text-slate-200">{missingValuesCount} columns</span>
                      </div>
                      <div className="flex items-center justify-between py-1.5 border-b border-slate-850/60">
                        <span className="text-slate-400">Broken Relations:</span>
                        <span className="font-mono text-emerald-500">0 integrity errors</span>
                      </div>
                      <div className="flex items-center justify-between py-1.5">
                        <span className="text-slate-400">Invalid Sector Names:</span>
                        <span className="font-mono text-emerald-500">0 errors</span>
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                      alert("Executing programmatic data cleaning script. Inconsistent formats normalized!");
                      confetti({ particleCount: 30, spread: 50 });
                    }}
                    className="w-full mt-4 py-2 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-xs font-bold text-slate-200 rounded-xl transition-all"
                  >
                    Normalize & Fix Inconsistent Date Formats
                  </button>
                </div>

              </div>

              {/* Audit Logs list */}
              <div className="glass-card p-6 rounded-2xl text-left">
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-4">Audit Logs</h3>
                <div className="space-y-3 text-xs">
                  {deals.filter(d => !d.closeDate).map(deal => (
                    <div key={deal.id} className="flex items-center justify-between border-b border-slate-850/60 pb-2 text-slate-350">
                      <div className="flex items-center space-x-2">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-500 font-bold" />
                        <span>Deal <strong>{deal.name}</strong> is missing a target **Close Date** in Monday.com.</span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono">Flagged</span>
                    </div>
                  ))}
                  {workOrders.filter(w => !w.notes).map(wo => (
                    <div key={wo.id} className="flex items-center justify-between border-b border-slate-850/60 pb-2 text-slate-350">
                      <div className="flex items-center space-x-2">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-500 font-bold" />
                        <span>Work Order <strong>{wo.id.toUpperCase()}</strong> contains empty log **Notes** column.</span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono">Flagged</span>
                    </div>
                  ))}
                  <div className="flex items-center space-x-2 text-slate-500 italic pt-1">
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    <span>All operational status fields mapped to standard enum models. No schema anomalies detected.</span>
                  </div>
                </div>
              </div>

            </div>
          )}
        </main>

      </div>

      {/* 2. Notifications Side Panel */}
      {notificationsOpen && (
        <div className="fixed inset-y-0 right-0 w-80 bg-slate-900 border-l border-slate-800 shadow-2xl z-50 flex flex-col justify-between text-left">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Bell className="w-4 h-4 text-brand-600 animate-pulse" />
              <span className="font-bold text-xs uppercase tracking-wider text-slate-200">Notification Center</span>
            </div>
            <button 
              onClick={() => setNotificationsOpen(false)}
              className="p-1 rounded hover:bg-slate-800 text-slate-500 hover:text-slate-100"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3 text-xs">
            <div className="p-3.5 rounded-xl border border-rose-500/20 bg-rose-500/5 text-rose-350">
              <p className="font-bold text-slate-250">Equipment Calibration Failure</p>
              <p className="text-slate-400 mt-1 leading-relaxed">Work order wo3 (NHAI Highway Mapping) flagged as Delayed due to LiDAR sensor failures.</p>
              <span className="text-[9px] text-slate-500 font-mono block mt-2">2 hours ago</span>
            </div>
            <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/40 text-slate-350">
              <p className="font-bold text-slate-250">Weekly Executive Report Generated</p>
              <p className="text-slate-400 mt-1 leading-relaxed">The AI Business Assistant generated this week's Executive Briefing report successfully.</p>
              <span className="text-[9px] text-slate-500 font-mono block mt-2">4 hours ago</span>
            </div>
          </div>
        </div>
      )}

      {/* 3. CMD+K Palette Modal */}
      {commandPaletteOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-start justify-center pt-24 z-50 p-4">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 shadow-2xl rounded-2xl overflow-hidden animate-slide-up">
            <div className="p-3 border-b border-slate-800 flex items-center space-x-3.5">
              <Search className="w-4 h-4 text-slate-400" />
              <input
                id="command-palette-input"
                type="search"
                autoFocus
                placeholder="Type a command or destination (e.g. dashboard, chat, deals)..."
                onChange={(e) => {
                  const val = e.target.value;
                  setCommandPaletteSearch(val);
                  const cmd = val.toLowerCase().trim();
                  if (cmd === 'dashboard') { setCurrentTab('dashboard'); setCommandPaletteOpen(false); setCommandPaletteSearch(''); }
                  if (cmd === 'chat') { setCurrentTab('chat'); setCommandPaletteOpen(false); setCommandPaletteSearch(''); }
                  if (cmd === 'deals') { setCurrentTab('deals'); setCommandPaletteOpen(false); setCommandPaletteSearch(''); }
                  if (cmd === 'workorders') { setCurrentTab('workorders'); setCommandPaletteOpen(false); setCommandPaletteSearch(''); }
                  if (cmd === 'analytics') { setCurrentTab('analytics'); setCommandPaletteOpen(false); setCommandPaletteSearch(''); }
                  if (cmd === 'reports') { setCurrentTab('reports'); setCommandPaletteOpen(false); setCommandPaletteSearch(''); }
                }}
                className="w-full bg-transparent focus:outline-none text-xs text-slate-200 placeholder-slate-500"
              />
              <button 
                onClick={() => { setCommandPaletteOpen(false); setCommandPaletteSearch(''); }}
                className="text-[9px] px-1.5 py-0.5 rounded border border-slate-700 bg-slate-800 text-slate-400 font-mono"
              >
                ESC
              </button>
            </div>
            <div className="p-2 space-y-1 text-xs text-left">
              {[
                { label: "Switch to Executive Dashboard", action: () => setCurrentTab('dashboard'), keys: ['dashboard', 'executive', 'home', 'switch'] },
                { label: "Open AI Assistant Workspace", action: () => setCurrentTab('chat'), keys: ['chat', 'assistant', 'ai', 'ask'] },
                { label: "Search Deals Module", action: () => setCurrentTab('deals'), keys: ['deals', 'crm', 'sales', 'pipeline'] },
                { label: "Sync Monday.com board status", action: () => handleManualSync(), keys: ['sync', 'monday', 'refresh'] },
                { label: "Audit Data Quality Health", action: () => setCurrentTab('dataquality'), keys: ['quality', 'data', 'health', 'audit'] }
              ]
              .filter(cmd => 
                cmd.label.toLowerCase().includes(commandPaletteSearch.toLowerCase()) ||
                cmd.keys.some(k => k.includes(commandPaletteSearch.toLowerCase()))
              )
              .map((cmd, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    cmd.action();
                    setCommandPaletteOpen(false);
                  }}
                  className="w-full text-left p-2.5 rounded-xl hover:bg-slate-800/60 text-slate-400 hover:text-slate-100 transition-colors flex items-center justify-between"
                >
                  <span>{cmd.label}</span>
                  <span className="text-[9px] text-slate-600 font-mono">Enter</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 4. Deal Details Modal */}
      {selectedDeal && (
        <div className="fixed inset-0 bg-slate-955/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-xl bg-slate-900 border border-slate-800 shadow-2xl rounded-2xl overflow-hidden flex flex-col justify-between max-h-[90vh] animate-slide-up">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between text-left">
              <div className="flex items-center space-x-2.5">
                <span className="text-[9px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono uppercase font-bold">{selectedDeal.sector}</span>
                <h3 className="font-bold text-sm text-slate-200">{selectedDeal.name}</h3>
              </div>
              <button 
                onClick={() => setSelectedDeal(null)}
                className="p-1 rounded hover:bg-slate-800 text-slate-500 hover:text-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs text-slate-350 text-left">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl border border-slate-800 bg-slate-900/30">
                  <p className="text-[9px] text-slate-500 font-mono uppercase">Deal Value</p>
                  <p className="text-sm font-bold text-slate-200 mt-1 font-mono">₹{selectedDeal.value.toLocaleString()}</p>
                </div>
                <div className="p-3 rounded-xl border border-slate-800 bg-slate-900/30">
                  <p className="text-[9px] text-slate-500 font-mono uppercase">Stage Status</p>
                  <p className="text-xs font-bold text-indigo-400 mt-1">{selectedDeal.stage}</p>
                </div>
                <div className="p-3 rounded-xl border border-slate-800 bg-slate-900/30">
                  <p className="text-[9px] text-slate-500 font-mono uppercase">Probability</p>
                  <p className="text-xs font-bold text-slate-200 mt-1 font-mono">{selectedDeal.probability}%</p>
                </div>
                <div className="p-3 rounded-xl border border-slate-800 bg-slate-900/30">
                  <p className="text-[9px] text-slate-500 font-mono uppercase">Client / Partner</p>
                  <p className="text-xs font-bold text-slate-250 mt-1 truncate">{selectedDeal.customer}</p>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-slate-200 border-b border-slate-800 pb-1.5 mb-2 uppercase tracking-wide text-[9px] font-mono">Operations Notes</h4>
                <p className="leading-relaxed text-slate-400">{selectedDeal.notes || "No extra operational commentary recorded for this deal on Monday.com."}</p>
              </div>

              <div>
                <h4 className="font-bold text-slate-200 border-b border-slate-800 pb-1.5 mb-2.5 uppercase tracking-wide text-[9px] font-mono">Execution Status</h4>
                {workOrders.filter(w => w.associatedDeal === selectedDeal.name).length === 0 ? (
                  <p className="text-slate-500 italic">No execution work order generated yet.</p>
                ) : (
                  workOrders.filter(w => w.associatedDeal === selectedDeal.name).map(wo => (
                    <div 
                      key={wo.id} 
                      onClick={() => {
                        setSelectedWorkOrder(wo);
                        setSelectedDeal(null);
                      }}
                      className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/40 hover:border-slate-700 cursor-pointer flex items-center justify-between transition-colors"
                    >
                      <div>
                        <p className="font-bold text-slate-200 text-xs">{wo.assignedTeam}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">Priority: {wo.priority} | Target Date: {wo.targetEndDate}</p>
                      </div>
                      <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${
                        wo.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-500' :
                        wo.status === 'Delayed' ? 'bg-rose-500/10 text-rose-500 animate-pulse' : 'bg-slate-800 text-slate-400'
                      }`}>
                        {wo.status}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
            
            <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex justify-end">
              <button 
                onClick={() => {
                  setCurrentTab('chat');
                  setSelectedDeal(null);
                  handleSendMessage(`Give me detailed recommendations and next actions for the deal "${selectedDeal.name}"`);
                }}
                className="flex items-center space-x-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-brand-600/10"
              >
                <Bot className="w-3.5 h-3.5" />
                <span>AI Recommend Actions</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Work Order Details Modal */}
      {selectedWorkOrder && (
        <div className="fixed inset-0 bg-slate-955/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-xl bg-slate-900 border border-slate-800 shadow-2xl rounded-2xl overflow-hidden flex flex-col justify-between max-h-[90vh] animate-slide-up">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between text-left">
              <div className="flex items-center space-x-2.5">
                <span className="text-[9px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono uppercase font-bold">{selectedWorkOrder.id}</span>
                <h3 className="font-bold text-sm text-slate-200">{selectedWorkOrder.associatedDeal}</h3>
              </div>
              <button 
                onClick={() => setSelectedWorkOrder(null)}
                className="p-1 rounded hover:bg-slate-800 text-slate-500 hover:text-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs text-slate-350 text-left">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl border border-slate-800 bg-slate-900/30">
                  <p className="text-[9px] text-slate-500 font-mono uppercase">Assigned Team</p>
                  <p className="text-xs font-bold text-slate-200 mt-1 truncate">{selectedWorkOrder.assignedTeam}</p>
                </div>
                <div className="p-3 rounded-xl border border-slate-800 bg-slate-900/30">
                  <p className="text-[9px] text-slate-500 font-mono uppercase">Execution status</p>
                  <p className="text-xs font-bold text-indigo-400 mt-1">{selectedWorkOrder.status}</p>
                </div>
                <div className="p-3 rounded-xl border border-slate-800 bg-slate-900/30">
                  <p className="text-[9px] text-slate-500 font-mono uppercase">Priority Level</p>
                  <p className="text-xs font-bold text-slate-250 mt-1">{selectedWorkOrder.priority}</p>
                </div>
                <div className="p-3 rounded-xl border border-slate-800 bg-slate-900/30">
                  <p className="text-[9px] text-slate-500 font-mono uppercase">Project Budget</p>
                  <p className="text-sm font-bold text-slate-200 mt-1 font-mono">₹{selectedWorkOrder.revenue.toLocaleString()}</p>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-slate-200 border-b border-slate-800 pb-1.5 mb-2 uppercase tracking-wide text-[9px] font-mono">Operations Log & Notes</h4>
                <p className="leading-relaxed text-slate-400">{selectedWorkOrder.notes || "No extra operational commentary recorded for this work order."}</p>
              </div>

              <div>
                <h4 className="font-bold text-slate-200 border-b border-slate-800 pb-1.5 mb-2 uppercase tracking-wide text-[9px] font-mono">Execution Timeline</h4>
                <div className="flex items-center space-x-4 border border-slate-850 bg-slate-900/20 p-3.5 rounded-xl">
                  <div className="text-center w-24">
                    <p className="text-[9px] text-slate-500 uppercase font-mono">Target End</p>
                    <p className="font-bold font-mono text-slate-200 mt-0.5">{selectedWorkOrder.targetEndDate}</p>
                  </div>
                  <div className="flex-1 border-t border-dashed border-slate-800"></div>
                  <div className="text-center w-24">
                    <p className="text-[9px] text-slate-500 uppercase font-mono">Actual End</p>
                    <p className="font-bold font-mono text-slate-350 mt-0.5">{selectedWorkOrder.actualEndDate || "In progress"}</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex justify-end">
              <button 
                onClick={() => {
                  setCurrentTab('chat');
                  setSelectedWorkOrder(null);
                  handleSendMessage(`Give me detailed recommendations and operational solutions for the work order "${selectedWorkOrder.id}" under deal "${selectedWorkOrder.associatedDeal}"`);
                }}
                className="flex items-center space-x-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-brand-600/10"
              >
                <Bot className="w-3.5 h-3.5" />
                <span>AI Recommend Operations</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

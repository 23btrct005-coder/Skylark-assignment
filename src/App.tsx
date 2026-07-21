import React, { useState, useEffect, useRef } from 'react';
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
  User, 
  Send, 
  Plus, 
  TrendingUp, 
  DollarSign, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  Eye, 
  ChevronRight, 
  ChevronLeft, 
  Download, 
  Filter, 
  SlidersHorizontal, 
  Activity, 
  Key, 
  Sparkles, 
  Calendar as CalendarIcon, 
  Check, 
  Trash2, 
  Layers, 
  Menu,
  X,
  FileCode,
  Share2,
  TrendingDown,
  Info
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
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true); // Default to true for demo speed
  const [authStep, setAuthStep] = useState<'login' | 'forgot' | 'loading'>('login');
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [selectedWorkOrder, setSelectedWorkOrder] = useState<WorkOrder | null>(null);
  const [notificationsOpen, setNotificationsOpen] = useState<boolean>(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState<boolean>(false);
  
  // Data States
  const [deals, setDeals] = useState<Deal[]>(initialDeals);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>(initialWorkOrders);
  const [activities, setActivities] = useState(recentActivity);
  
  // Settings & Configuration
  const [mondayToken, setMondayToken] = useState<string>(localStorage.getItem('mondayToken') || '');
  const [geminiApiKey, setGeminiApiKey] = useState<string>(localStorage.getItem('geminiApiKey') || '');
  const [syncStatus, setSyncStatus] = useState<'connected' | 'disconnected'>('connected');
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>('12 mins ago');
  const [syncLogs, setSyncLogs] = useState<string[]>([
    "Initial connection established with Monday.com.",
    "Mapped Deals board (ID: 981242) successfully.",
    "Mapped Work Orders board (ID: 981245) successfully.",
    "Successfully synchronized 10 Deals and 7 Work Orders."
  ]);

  // AI Chat States
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'user' | 'agent'; text: string; time: string; citations?: string[]; chartData?: any }>>([
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
  
  // Kanban & List views
  const [dealViewMode, setDealViewMode] = useState<'table' | 'kanban'>('table');
  const [workOrderViewMode, setWorkOrderViewMode] = useState<'table' | 'kanban' | 'timeline' | 'calendar'>('table');
  
  // Notification Count
  const [unreadNotifications, setUnreadNotifications] = useState<number>(3);

  // Command Palette Handler
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

  // Sync Monday.com Action Simulation
  const handleManualSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      setLastSyncTime("Just now");
      const newLog = `Manual trigger sync complete. Synchronized ${deals.length} deals and ${workOrders.length} work orders. Zero conflicts.`;
      setSyncLogs(prev => [newLog, ...prev]);
      setActivities(prev => [
        { id: Math.random().toString(), type: 'sync', text: 'Monday.com workspace manually synchronized.', time: 'Just now' },
        ...prev
      ]);
      confetti({ particleCount: 40, spread: 60, origin: { y: 0.8 } });
    }, 2000);
  };

  // Local AI Simulator logic when no API key is present
  const generateSimulatedAiResponse = (query: string): string => {
    const q = query.toLowerCase();
    
    if (q.includes('renew') || q.includes('solar') || q.includes('wind')) {
      const renewableDeals = deals.filter(d => d.sector === 'Renewables');
      const totalVal = renewableDeals.reduce((sum, d) => sum + d.value, 0);
      const wonVal = renewableDeals.filter(d => d.stage === 'Won').reduce((sum, d) => sum + d.value, 0);
      return `### ⚡ Renewables Sector Pipeline Analysis
Our Renewables sector pipeline is currently performing **strongly**, representing **$${(totalVal / 1000).toFixed(0)}k** in total value across **${renewableDeals.length} active deals**.

**Key Metrics:**
*   **Total Pipeline:** $${totalVal.toLocaleString()}
*   **Closed-Won Deals:** $${wonVal.toLocaleString()} (e.g., *Tata Solar Grid Phase 2*)
*   **Negotiation Stage:** $320,000 (*Adani Wind Farm Mapping*)

**Actionable Insights:**
The *Adani Wind Farm Mapping* deal ($320k) is currently in final legal review with an 80% close probability. The assigned team is *Alpha Flight Team*, who already have a Work Order in 'Not Started' status awaiting permit authorization. Recommend finalizing contract sign-off by next week.`;
    }
    
    if (q.includes('delay') || q.includes('attention') || q.includes('risk')) {
      const delayedOrders = workOrders.filter(w => w.status === 'Delayed');
      return `### ⚠️ Operations Bottlenecks & Delayed Work Orders
There is currently **1 Critical Operational Risk** requiring immediate leadership attention:

1.  **Work Order for NHAI Highway Corridor Mapping** (Value: **$1,200,000**)
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
| **Won** | $${(stageCounts['Won'] || 0).toLocaleString()} | Closed deals currently in project execution. |
| **Negotiation** | $${(stageCounts['Negotiation'] || 0).toLocaleString()} | Deals in final pricing and legal reviews. |
| **Pitch** | $${(stageCounts['Pitch'] || 0).toLocaleString()} | Technical proposals submitted. |
| **Lead** | $${(stageCounts['Lead'] || 0).toLocaleString()} | Initial discussions. |

**Conversion Summary:**
Our current pipeline is heavily weighted in the **Won** stage ($${((stageCounts['Won'] || 0)/1000).toFixed(0)}k), which ensures high immediate revenue but highlights a need to build early-stage pipeline traction (currently only $${((stageCounts['Lead'] || 0)/1000).toFixed(0)}k in Lead stage).`;
    }

    if (q.includes('weekly') || q.includes('report') || q.includes('leadership')) {
      const totalRevenue = workOrders.filter(w => w.status === 'Completed').reduce((sum, w) => sum + w.revenue, 0);
      const activePipeline = deals.filter(d => d.stage !== 'Lost' && d.stage !== 'Won').reduce((sum, d) => sum + d.value, 0);
      return `# Executive Leadership Briefing
**Period:** Current Week (July 2026)  
**Data Health:** 94% Confidence Score (Source: Monday.com Sync)

---

### 1. Revenue & Pipeline Summary
*   **Delivered Revenue (Completed Jobs):** $1,060,000 (Strong contributions from *Singareni volume surveys* and *BESCOM Substation* projects).
*   **Active Sales Pipeline:** $610,000 (Weighted towards Renewables and Mining sectors).
*   **Win Rate:** 78% average conversion rate over past 90 days.

### 2. Operational Highlights
*   **Active Projects:** 2 currently in flight (*Tata Solar Grid Phase 2* and *L&T Smart City*).
*   **GCP Alignment:** Ground control points established successfully for L&T Smart City using high-precision DGPS.

### 3. Critical Risks
*   **NHAI Highway Mapping (Delayed):** The LiDAR sensor repair is delaying a $1.2M contract execution. Core priority is logistics dispatch for replacement units.

### 4. Forecast & Outlook
*   We expect to close the *Adani Wind Farm Mapping* deal ($320k) within 10 business days. Flight permissions are already secured to allow immediate kickoff upon signature.`;
    }

    return `I parsed your query: "${query}". Here is a generic summary of your business data:
*   **Total Deals Loaded:** ${deals.length}
*   **Active Projects (Work Orders):** ${workOrders.length}
*   **Total Closed-Won Revenue:** $${deals.filter(d => d.stage === 'Won').reduce((sum, d) => sum + d.value, 0).toLocaleString()}
Please set a **Gemini API Key** in the **Settings** tab if you would like full generative reasoning on your dataset.`;
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
        // Live Gemini Call
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
          1. Answer the user's business query accurately using the data provided.
          2. Data Resilience: Inconsistent dates, empty fields, and spelling variations are present. Clean and normalize them on the fly.
          3. Look for cross-board references (matching Deal Name in Deals to Associated Deal in Work Orders).
          4. Do not just output raw numbers. Provide executive insights (e.g. highlight if a high-value Deal is Won but its associated Work Order is "Delayed" or "Not Started").
          5. Present calculations (e.g. total revenue, average deal size) clearly in table or bullet format.
          6. Keep it professional, and use clear markdown headers.
        `;

        const result = await model.generateContent([systemPrompt, text]);
        const responseText = result.response.text();
        
        setChatMessages(prev => [...prev, {
          sender: 'agent',
          text: responseText,
          time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
        }]);
      } else {
        // Local Simulation mode
        setTimeout(() => {
          const simulatedResponse = generateSimulatedAiResponse(text);
          setChatMessages(prev => [...prev, {
            sender: 'agent',
            text: simulatedResponse,
            time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
          }]);
        }, 1200);
      }
    } catch (err: any) {
      setChatMessages(prev => [...prev, {
        sender: 'agent',
        text: `⚠️ **AI Orchestration Error:** ${err.message || 'Failed to connect to Gemini API. Please verify your API key in Settings.'}`,
        time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
      }]);
    } finally {
      setIsAiTyping(false);
    }
  };

  // KPI calculations
  const totalPipelineValue = deals
    .filter(d => d.stage !== 'Lost' && d.stage !== 'Won')
    .reduce((sum, d) => sum + d.value, 0);
    
  const closedWonRevenue = deals
    .filter(d => d.stage === 'Won')
    .reduce((sum, d) => sum + d.value, 0);

  const activeWorkOrdersCount = workOrders.filter(w => w.status === 'In Progress').length;
  const delayedWorkOrdersCount = workOrders.filter(w => w.status === 'Delayed').length;
  const winRatePercentage = Math.round((deals.filter(d => d.stage === 'Won').length / (deals.filter(d => d.stage === 'Won').length + deals.filter(d => d.stage === 'Lost').length)) * 100);

  // Sparkline mock values matching the KPIs
  const pipelineHistory = [
    { value: 480000 }, { value: 520000 }, { value: 610000 }, { value: 550000 }, { value: 590000 }, { value: totalPipelineValue }
  ];
  const revenueHistory = [
    { value: 1800000 }, { value: 2100000 }, { value: 2400000 }, { value: 2600000 }, { value: 2750000 }, { value: closedWonRevenue }
  ];
  
  // Analytics charts mappings
  const sectorData = [
    { name: 'Renewables', value: deals.filter(d => d.sector === 'Renewables').reduce((sum, d) => sum + d.value, 0) },
    { name: 'Mining', value: deals.filter(d => d.sector === 'Mining').reduce((sum, d) => sum + d.value, 0) },
    { name: 'Infrastructure', value: deals.filter(d => d.sector === 'Infrastructure').reduce((sum, d) => sum + d.value, 0) },
    { name: 'Energy', value: deals.filter(d => d.sector === 'Energy').reduce((sum, d) => sum + d.value, 0) },
  ];

  const COLORS = ['#5B5BD6', '#7C3AED', '#06B6D4', '#22C55E', '#F59E0B', '#EF4444', '#94A3B8'];

  // Global search filtering
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

  // Data Quality Audits
  const missingValuesCount = deals.filter(d => !d.closeDate || !d.notes).length + workOrders.filter(w => !w.notes).length;
  const healthScorePercentage = Math.max(0, 100 - (missingValuesCount * 4));

  return (
    <div className="flex h-screen overflow-hidden bg-slate-950 font-sans text-slate-100">
      
      {/* 1. Sidebar Navigation */}
      <aside className="w-64 border-r border-slate-800/80 bg-slate-900/40 backdrop-blur-md flex flex-col justify-between shrink-0">
        <div>
          {/* Logo */}
          <div className="h-16 flex items-center px-6 border-b border-slate-800/60 justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-brand-500/20">
                <Sparkles className="w-4 h-4 text-white animate-pulse" />
              </div>
              <span className="font-bold text-lg bg-clip-text text-transparent bg-gradient-to-r from-slate-50 to-slate-200">
                Skylark BI AI
              </span>
            </div>
            <div className="text-[10px] px-2 py-0.5 rounded-full border border-slate-700 bg-slate-800 text-slate-300 font-mono">
              v1.0
            </div>
          </div>

          {/* Sync status alert */}
          <div className="p-4 mx-3 my-4 rounded-xl border border-slate-800/80 bg-slate-900/50 flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <span className={`w-2.5 h-2.5 rounded-full ${syncStatus === 'connected' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'} `}></span>
              <div className="text-xs">
                <p className="font-semibold text-slate-200">Monday Workspace</p>
                <p className="text-[10px] text-slate-400">Sync {lastSyncTime}</p>
              </div>
            </div>
            <button 
              onClick={handleManualSync}
              disabled={isSyncing}
              className="p-1.5 rounded-lg border border-slate-700/80 hover:bg-slate-800 hover:text-white transition-all text-slate-400 disabled:opacity-50"
              title="Sync now"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-brand-400' : ''}`} />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="px-3 space-y-1">
            {[
              { id: 'dashboard', label: 'Executive Dashboard', icon: LayoutDashboard },
              { id: 'chat', label: 'AI Assistant', icon: Bot, badge: 'Native' },
              { id: 'deals', label: 'Deals Module', icon: Briefcase },
              { id: 'workorders', label: 'Work Orders', icon: ClipboardList },
              { id: 'analytics', label: 'Visual Analytics', icon: BarChart3 },
              { id: 'reports', label: 'Executive Reports', icon: FileText },
              { id: 'dataquality', label: 'Data Quality', icon: Database, alert: missingValuesCount > 0 },
              { id: 'settings', label: 'Settings & Integrations', icon: SettingsIcon }
            ].map(item => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentTab(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all group ${
                    isActive 
                      ? 'bg-brand-600/90 text-white shadow-md shadow-brand-600/10' 
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/40'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className={`w-4 h-4 transition-transform group-hover:scale-105 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-brand-500/20 text-brand-300 font-semibold border border-brand-500/30">
                      {item.badge}
                    </span>
                  )}
                  {item.alert && (
                    <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Profile Footer */}
        <div className="p-4 border-t border-slate-800/60 flex items-center space-x-3 bg-slate-900/20">
          <div className="w-9 h-9 rounded-full bg-brand-600/30 border border-brand-500/30 flex items-center justify-center font-bold text-brand-300">
            AA
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-slate-200 truncate">Abishek A</p>
            <p className="text-[10px] text-slate-400 truncate">Jain University</p>
          </div>
        </div>
      </aside>

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* Header bar */}
        <header className="h-16 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md px-6 flex items-center justify-between shrink-0 z-10">
          <div className="flex items-center space-x-4 flex-1 max-w-lg">
            {/* Search Box / Command trigger */}
            <div 
              onClick={() => setCommandPaletteOpen(true)}
              className="w-full flex items-center space-x-2.5 px-3 py-1.5 rounded-lg border border-slate-800/80 bg-slate-900/30 hover:border-slate-700/80 hover:bg-slate-900/60 cursor-pointer transition-all"
            >
              <Search className="w-4 h-4 text-slate-400" />
              <span className="text-xs text-slate-400 flex-1">Global search or command palette...</span>
              <kbd className="text-[10px] px-1.5 py-0.5 rounded border border-slate-700 bg-slate-800 text-slate-400 font-mono">
                ⌘K
              </kbd>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Notification trigger */}
            <div className="relative">
              <button 
                onClick={() => {
                  setNotificationsOpen(!notificationsOpen);
                  setUnreadNotifications(0);
                }}
                className="p-2 rounded-lg border border-slate-800 bg-slate-900/30 hover:bg-slate-800 text-slate-300 hover:text-white transition-all relative"
              >
                <Bell className="w-4 h-4" />
                {unreadNotifications > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-brand-500 animate-ping"></span>
                )}
              </button>
            </div>

            {/* Quick Action buttons */}
            <button 
              onClick={() => handleManualSync()}
              disabled={isSyncing}
              className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-slate-850 hover:border-slate-700 text-xs font-semibold text-slate-200 transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-brand-400' : ''}`} />
              <span>Sync Monday</span>
            </button>

            <button 
              onClick={() => {
                setCurrentTab('chat');
                handleSendMessage("Generate a weekly leadership update summary.");
              }}
              className="flex items-center space-x-2 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-xs font-semibold text-white shadow-lg shadow-brand-600/10 transition-all"
            >
              <Bot className="w-3.5 h-3.5" />
              <span>Ask AI Agent</span>
            </button>
          </div>
        </header>

        {/* Tab Content Rendering */}
        <main className="flex-1 overflow-y-auto p-6 min-h-0 bg-slate-950">
          
          {/* TAB 1: EXECUTIVE DASHBOARD */}
          {currentTab === 'dashboard' && (
            <div className="space-y-6">
              
              {/* Header Greeting */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-850 pb-6">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-slate-100 flex items-center space-x-2">
                    <span>Operational Intelligence Command Center</span>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 font-medium">
                      Enterprise BI AI
                    </span>
                  </h1>
                  <p className="text-sm text-slate-400 mt-1">
                    Welcome back, Abishek. Your Monday.com integrations are synchronized. Here is today's overview.
                  </p>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="px-3.5 py-2 rounded-xl border border-slate-800 bg-slate-900/40 text-right">
                    <p className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">Sync Status</p>
                    <p className="text-xs font-semibold text-emerald-400 flex items-center space-x-1.5 justify-end">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      <span>Connected</span>
                    </p>
                  </div>
                  <div className="px-3.5 py-2 rounded-xl border border-slate-800 bg-slate-900/40 text-right">
                    <p className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">Data Health Score</p>
                    <p className="text-xs font-semibold text-indigo-300">{healthScorePercentage}% Confidence</p>
                  </div>
                </div>
              </div>

              {/* KPI Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                
                {/* Card 1: Pipeline */}
                <div className="glass-card glass-card-hover p-5 rounded-2xl flex flex-col justify-between h-32 relative overflow-hidden group">
                  <div className="absolute right-4 top-4 text-slate-600/80 group-hover:text-violet-500/30 transition-colors">
                    <Briefcase className="w-8 h-8" />
                  </div>
                  <div>
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Active Pipeline</span>
                    <h3 className="text-2xl font-bold text-slate-100 mt-1">${(totalPipelineValue / 1000).toFixed(0)}k</h3>
                  </div>
                  <div className="flex items-end justify-between mt-2">
                    <span className="text-xs text-emerald-400 flex items-center space-x-1">
                      <TrendingUp className="w-3 h-3" />
                      <span>+12.4%</span>
                    </span>
                    <div className="w-20 h-8">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={pipelineHistory}>
                          <Area type="monotone" dataKey="value" stroke="#5B5BD6" fill="rgba(91, 91, 214, 0.05)" strokeWidth={1.5} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                {/* Card 2: Revenue */}
                <div className="glass-card glass-card-hover p-5 rounded-2xl flex flex-col justify-between h-32 relative overflow-hidden group">
                  <div className="absolute right-4 top-4 text-slate-600/80 group-hover:text-indigo-500/30 transition-colors">
                    <DollarSign className="w-8 h-8" />
                  </div>
                  <div>
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Closed Won Revenue</span>
                    <h3 className="text-2xl font-bold text-slate-100 mt-1">${(closedWonRevenue / 1000000).toFixed(2)}M</h3>
                  </div>
                  <div className="flex items-end justify-between mt-2">
                    <span className="text-xs text-emerald-400 flex items-center space-x-1">
                      <TrendingUp className="w-3 h-3" />
                      <span>+8.2%</span>
                    </span>
                    <div className="w-20 h-8">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={revenueHistory}>
                          <Area type="monotone" dataKey="value" stroke="#7C3AED" fill="rgba(124, 58, 237, 0.05)" strokeWidth={1.5} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                {/* Card 3: Work Orders */}
                <div className="glass-card glass-card-hover p-5 rounded-2xl flex flex-col justify-between h-32 relative overflow-hidden group">
                  <div className="absolute right-4 top-4 text-slate-600/80 group-hover:text-emerald-500/30 transition-colors">
                    <CheckCircle className="w-8 h-8" />
                  </div>
                  <div>
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Active execution</span>
                    <h3 className="text-2xl font-bold text-slate-100 mt-1">{activeWorkOrdersCount} In Progress</h3>
                  </div>
                  <div className="flex items-end justify-between mt-2">
                    <span className="text-xs text-slate-400">
                      {workOrders.filter(w => w.status === 'Completed').length} Completed
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-semibold">
                      Normal
                    </span>
                  </div>
                </div>

                {/* Card 4: Risks */}
                <div className="glass-card glass-card-hover p-5 rounded-2xl flex flex-col justify-between h-32 relative overflow-hidden group">
                  <div className="absolute right-4 top-4 text-slate-600/80 group-hover:text-amber-500/30 transition-colors">
                    <AlertTriangle className="w-8 h-8" />
                  </div>
                  <div>
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Delayed Deliveries</span>
                    <h3 className="text-2xl font-bold text-slate-100 mt-1">{delayedWorkOrdersCount} High Risk</h3>
                  </div>
                  <div className="flex items-end justify-between mt-2">
                    <span className="text-xs text-amber-400 flex items-center space-x-1">
                      <span>Needs attention</span>
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${delayedWorkOrdersCount > 0 ? 'bg-amber-500/15 border border-amber-500/30 text-amber-300' : 'bg-slate-800 text-slate-300'} font-semibold`}>
                      {delayedWorkOrdersCount > 0 ? 'Urgent Alert' : 'Healthy'}
                    </span>
                  </div>
                </div>

              </div>

              {/* Main Dashboard Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Left Side: Charts and Quick Info (Span 2) */}
                <div className="lg:col-span-2 space-y-6">
                  
                  {/* Pipeline values chart card */}
                  <div className="glass-card p-6 rounded-2xl">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h3 className="text-base font-semibold text-slate-200">Sectoral Distribution vs Deal Stages</h3>
                        <p className="text-xs text-slate-400 mt-0.5">Pipeline valuation across our primary commercial targets</p>
                      </div>
                      <div className="flex items-center space-x-1 rounded-lg border border-slate-800 bg-slate-900/30 p-1">
                        <button className="text-xs px-2.5 py-1 rounded bg-slate-800 text-white font-medium">Deals</button>
                        <button onClick={() => setCurrentTab('analytics')} className="text-xs px-2.5 py-1 rounded text-slate-400 hover:text-slate-200">View All</button>
                      </div>
                    </div>
                    
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={sectorData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                          <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                          <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                          <Tooltip 
                            contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px' }}
                            labelStyle={{ color: '#fff', fontWeight: 'bold' }}
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

                  {/* Highlights and suggested questions */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    
                    {/* Data Quality Center Quick Glance */}
                    <div className="glass-card p-5 rounded-2xl flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-sm font-semibold text-slate-200">Monday Data Integrity</h4>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-brand-500/10 text-brand-300 border border-brand-500/20 font-semibold font-mono">
                            Auto Audit
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 leading-relaxed">
                          We flagged **{missingValuesCount} incomplete fields** (missing target dates or comments). These anomalies are highlighted in the Data Quality center.
                        </p>
                      </div>
                      
                      <div className="mt-4 pt-4 border-t border-slate-800/60 flex items-center justify-between">
                        <span className="text-xs text-slate-400">Integrity Health:</span>
                        <span className="text-xs font-bold text-indigo-400">{healthScorePercentage}%</span>
                      </div>
                    </div>

                    {/* Operational Highlights */}
                    <div className="glass-card p-5 rounded-2xl flex flex-col justify-between">
                      <div>
                        <h4 className="text-sm font-semibold text-slate-200 mb-3">Today's Key Highlight</h4>
                        <div className="flex items-start space-x-2 text-xs text-slate-400 leading-relaxed">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0 animate-ping"></span>
                          <p>
                            **Singareni Coal Mine Volume Survey** work order marked as **Completed** with a 99.4% accuracy volumetric calculation report.
                          </p>
                        </div>
                      </div>
                      <div className="mt-4 pt-4 border-t border-slate-800/60 flex items-center justify-between">
                        <span className="text-[10px] text-slate-500">Operation Metrics:</span>
                        <span className="text-xs font-semibold text-emerald-400">{winRatePercentage}% Conversion</span>
                      </div>
                    </div>

                  </div>

                </div>

                {/* Right Side: AI Prompts & Recent Activity (Span 1) */}
                <div className="space-y-6">
                  
                  {/* Prompt AI Box */}
                  <div className="glass-card p-5 rounded-2xl border border-brand-500/10 bg-brand-950/5">
                    <div className="flex items-center space-x-2 mb-3">
                      <Bot className="w-4 h-4 text-brand-400" />
                      <h4 className="text-sm font-bold text-slate-200">Ask Business Assistant</h4>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed mb-4">
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
                          className="w-full text-left text-xs p-2.5 rounded-xl border border-slate-850 hover:border-brand-500/30 bg-slate-900/30 hover:bg-brand-900/5 transition-all text-slate-300 hover:text-slate-100 flex items-center justify-between"
                        >
                          <span className="truncate mr-2">{prompt}</span>
                          <ChevronRight className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        </button>
                      ))}
                    </div>
                    <button 
                      onClick={() => setCurrentTab('chat')}
                      className="w-full mt-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-200 rounded-xl transition-all flex items-center justify-center space-x-1.5"
                    >
                      <span>Open Workspace</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Recent Activity List */}
                  <div className="glass-card p-5 rounded-2xl">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-sm font-semibold text-slate-200">Recent Activity Feed</h4>
                      <Activity className="w-4 h-4 text-slate-500" />
                    </div>
                    <div className="space-y-3.5">
                      {activities.map(act => (
                        <div key={act.id} className="flex items-start space-x-3 text-xs">
                          <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                            act.type === 'sync' ? 'bg-emerald-500' :
                            act.type === 'report' ? 'bg-indigo-500' :
                            act.type === 'deal' ? 'bg-violet-500' : 'bg-amber-500'
                          }`}></span>
                          <div className="flex-1 min-w-0">
                            <p className="text-slate-300 leading-relaxed">{act.text}</p>
                            <p className="text-[10px] text-slate-500 mt-0.5">{act.time}</p>
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
            <div className="h-full flex flex-col justify-between -m-6 bg-slate-950">
              
              {/* Chat Header */}
              <div className="h-14 border-b border-slate-850 px-6 flex items-center justify-between shrink-0 bg-slate-900/20">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-brand-500/10 border border-brand-500/30 flex items-center justify-center">
                    <Bot className="w-4 h-4 text-brand-400 animate-pulse" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-100">Enterprise AI Assistant Workspace</h2>
                    <p className="text-[10px] text-slate-400">Context: 10 Deals | 7 Work Orders | Active Sync</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button 
                    onClick={() => {
                      setChatMessages([
                        { sender: 'agent', text: "Chat history cleared. How can I help you analyze your business operations today?", time: "Just now" }
                      ]);
                    }}
                    className="p-1.5 rounded-lg border border-slate-800 hover:bg-slate-900 text-xs text-slate-400 hover:text-slate-200 transition-all"
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
                    className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg border border-slate-800 hover:bg-slate-900 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-all"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Copy Logs</span>
                  </button>
                </div>
              </div>

              {/* Chat Split View */}
              <div className="flex-1 flex min-h-0 overflow-hidden">
                
                {/* Left Side: History & Suggested (Hidden on small screens) */}
                <div className="w-64 border-r border-slate-850 p-4 space-y-4 shrink-0 hidden md:block bg-slate-900/5">
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Suggested Queries</div>
                  <div className="space-y-2">
                    {suggestedPrompts.map((prompt, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSendMessage(prompt)}
                        className="w-full text-left text-xs p-2.5 rounded-xl border border-slate-850 bg-slate-900/10 hover:border-slate-700/80 hover:bg-slate-900/40 text-slate-400 hover:text-slate-200 transition-all leading-relaxed"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Middle: Chat Messages Panel */}
                <div className="flex-1 flex flex-col min-w-0 bg-slate-950">
                  
                  {/* Messages list */}
                  <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {chatMessages.map((msg, index) => (
                      <div key={index} className={`flex items-start space-x-3.5 ${msg.sender === 'user' ? 'justify-end' : ''}`}>
                        {msg.sender === 'agent' && (
                          <div className="w-8 h-8 rounded-lg bg-brand-600/20 border border-brand-500/20 flex items-center justify-center font-bold text-brand-300 mt-1 shrink-0">
                            BI
                          </div>
                        )}
                        <div className={`max-w-2xl rounded-2xl p-4.5 text-sm leading-relaxed border ${
                          msg.sender === 'user'
                            ? 'bg-brand-600/90 text-white border-brand-500/30 rounded-tr-none'
                            : 'bg-slate-900/50 text-slate-300 border-slate-800/80 rounded-tl-none'
                        }`}>
                          <div className="prose prose-invert max-w-none break-words">
                            {/* Simple Markdown/text parser for reports */}
                            {msg.text.split('\n').map((line, lineIdx) => {
                              if (line.startsWith('# ')) return <h1 key={lineIdx} className="text-lg font-bold text-white mb-3 mt-4">{line.replace('# ', '')}</h1>;
                              if (line.startsWith('### ')) return <h3 key={lineIdx} className="text-sm font-bold text-white mb-2 mt-3">{line.replace('### ', '')}</h3>;
                              if (line.startsWith('* ')) return <li key={lineIdx} className="list-disc ml-4 text-slate-300 mb-1">{line.replace('* ', '')}</li>;
                              if (line.startsWith('|')) {
                                if (line.includes('---')) return null;
                                const cols = line.split('|').filter(c => c.trim()).map(c => c.trim());
                                return (
                                  <div key={lineIdx} className="grid grid-cols-3 gap-2 py-1 text-xs border-b border-slate-850">
                                    {cols.map((col, colIdx) => <span key={colIdx} className={colIdx === 0 ? "font-semibold" : ""}>{col}</span>)}
                                  </div>
                                );
                              }
                              return <p key={lineIdx} className="mb-1.5">{line}</p>;
                            })}
                          </div>
                          <span className="text-[9px] text-slate-500 block text-right mt-2 font-mono">{msg.time}</span>
                        </div>
                      </div>
                    ))}

                    {/* AI Loading indicator */}
                    {isAiTyping && (
                      <div className="flex items-start space-x-3.5">
                        <div className="w-8 h-8 rounded-lg bg-brand-600/20 border border-brand-500/20 flex items-center justify-center font-bold text-brand-300 shrink-0">
                          BI
                        </div>
                        <div className="bg-slate-900/50 border border-slate-800/80 rounded-2xl rounded-tl-none p-4 max-w-sm">
                          <div className="flex items-center space-x-1.5">
                            <span className="w-2 h-2 rounded-full bg-brand-500 animate-bounce" style={{ animationDelay: '0ms' }}></span>
                            <span className="w-2 h-2 rounded-full bg-brand-500 animate-bounce" style={{ animationDelay: '150ms' }}></span>
                            <span className="w-2 h-2 rounded-full bg-brand-500 animate-bounce" style={{ animationDelay: '300ms' }}></span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Input bar */}
                  <div className="p-4 border-t border-slate-850 bg-slate-950">
                    <form 
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleSendMessage(inputMessage);
                      }}
                      className="relative flex items-center"
                    >
                      <input
                        type="text"
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        placeholder="Query your Monday.com datasets (e.g. 'Which work orders are delayed?')..."
                        className="w-full pl-4 pr-12 py-3 rounded-xl border border-slate-850 focus:border-brand-500/50 bg-slate-900/30 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-brand-500/30 transition-all"
                      />
                      <button
                        type="submit"
                        disabled={!inputMessage.trim() || isAiTyping}
                        className="absolute right-2.5 p-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white transition-all disabled:opacity-30"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </form>
                    <p className="text-[10px] text-slate-500 text-center mt-2.5 font-mono">
                      {!geminiApiKey ? "✨ Operating in local Simulator Mode. Add a Gemini API Key in settings for live reasoning." : "⚡ Connected to live Gemini 1.5 model."}
                    </p>
                  </div>

                </div>

              </div>

            </div>
          )}

          {/* TAB 3: DEALS CRM MODULE */}
          {currentTab === 'deals' && (
            <div className="space-y-6">
              
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-850 pb-6">
                <div>
                  <h1 className="text-xl font-bold tracking-tight text-slate-100">Enterprise CRM & Sales funnel</h1>
                  <p className="text-xs text-slate-400 mt-1">Live deal records synced with Monday.com Board</p>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="flex items-center space-x-1 rounded-lg border border-slate-800 bg-slate-900/30 p-1">
                    <button 
                      onClick={() => setDealViewMode('table')} 
                      className={`text-xs px-2.5 py-1 rounded font-medium transition-all ${dealViewMode === 'table' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                      Table View
                    </button>
                    <button 
                      onClick={() => setDealViewMode('kanban')} 
                      className={`text-xs px-2.5 py-1 rounded font-medium transition-all ${dealViewMode === 'kanban' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                      Kanban Board
                    </button>
                  </div>
                </div>
              </div>

              {/* CRM Controls / Search / Filter */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative flex-1 min-w-[200px] max-w-xs">
                  <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-500" />
                  <input
                    type="text"
                    value={globalSearchQuery}
                    onChange={(e) => setGlobalSearchQuery(e.target.value)}
                    placeholder="Search deals, clients..."
                    className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-800 focus:border-brand-500/40 bg-slate-900/30 text-xs text-slate-200 focus:outline-none"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-slate-400 flex items-center space-x-1">
                    <Filter className="w-3.5 h-3.5" />
                    <span>Stage:</span>
                  </span>
                  <select
                    value={dealFilterStage}
                    onChange={(e) => setDealFilterStage(e.target.value)}
                    className="px-2 py-1.5 rounded-lg border border-slate-800 bg-slate-900/50 text-xs text-slate-300 focus:outline-none"
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
                  <span className="text-xs text-slate-400">Sector:</span>
                  <select
                    value={dealFilterSector}
                    onChange={(e) => setDealFilterSector(e.target.value)}
                    className="px-2 py-1.5 rounded-lg border border-slate-800 bg-slate-900/50 text-xs text-slate-300 focus:outline-none"
                  >
                    <option value="All">All Sectors</option>
                    <option value="Energy">Energy</option>
                    <option value="Mining">Mining</option>
                    <option value="Renewables">Renewables</option>
                    <option value="Infrastructure">Infrastructure</option>
                    <option value="Utilities">Utilities</option>
                  </select>
                </div>
                {/* Clear filters shortcut */}
                {(globalSearchQuery || dealFilterStage !== 'All' || dealFilterSector !== 'All') && (
                  <button 
                    onClick={() => {
                      setGlobalSearchQuery('');
                      setDealFilterStage('All');
                      setDealFilterSector('All');
                    }}
                    className="text-xs text-brand-400 hover:text-brand-300 underline"
                  >
                    Reset filters
                  </button>
                )}
              </div>

              {/* Deal Table View */}
              {dealViewMode === 'table' && (
                <div className="glass-card rounded-2xl overflow-hidden border border-slate-800/80">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-800 bg-slate-900/40 text-slate-400 font-medium">
                          <th className="p-4">Deal Name</th>
                          <th className="p-4">Customer</th>
                          <th className="p-4">Sector</th>
                          <th className="p-4 text-right">Value</th>
                          <th className="p-4">Stage</th>
                          <th className="p-4">Probability</th>
                          <th className="p-4">Close Date</th>
                          <th className="p-4">Owner</th>
                          <th className="p-4 text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredDeals.length === 0 ? (
                          <tr>
                            <td colSpan={9} className="p-8 text-center text-slate-500 font-mono">
                              No active deals match your criteria. Try adjusting filters.
                            </td>
                          </tr>
                        ) : (
                          filteredDeals.map((deal) => (
                            <tr 
                              key={deal.id} 
                              className="border-b border-slate-850 hover:bg-slate-900/30 transition-colors group cursor-pointer"
                              onClick={() => setSelectedDeal(deal)}
                            >
                              <td className="p-4 font-semibold text-slate-200 group-hover:text-brand-300 transition-colors">
                                {deal.name}
                              </td>
                              <td className="p-4 text-slate-300">{deal.customer}</td>
                              <td className="p-4">
                                <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                                  {deal.sector}
                                </span>
                              </td>
                              <td className="p-4 text-right font-mono font-semibold">${deal.value.toLocaleString()}</td>
                              <td className="p-4">
                                <span className={`px-2.5 py-0.5 rounded-full font-semibold ${
                                  deal.stage === 'Won' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                                  deal.stage === 'Lost' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                                  deal.stage === 'Negotiation' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' :
                                  'bg-slate-800 text-slate-300'
                                }`}>
                                  {deal.stage}
                                </span>
                              </td>
                              <td className="p-4">
                                <div className="flex items-center space-x-1.5">
                                  <div className="w-12 bg-slate-800 rounded-full h-1.5 overflow-hidden">
                                    <div 
                                      className={`h-full rounded-full ${deal.stage === 'Won' ? 'bg-emerald-500' : 'bg-brand-500'}`} 
                                      style={{ width: `${deal.probability}%` }}
                                    ></div>
                                  </div>
                                  <span className="font-mono text-[10px] text-slate-400">{deal.probability}%</span>
                                </div>
                              </td>
                              <td className="p-4 text-slate-400 font-mono">{deal.closeDate || 'N/A'}</td>
                              <td className="p-4 text-slate-300">{deal.owner}</td>
                              <td className="p-4 text-center">
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedDeal(deal);
                                  }}
                                  className="p-1 rounded bg-slate-850 hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Deal Kanban View */}
              {dealViewMode === 'kanban' && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {['Lead', 'Pitch', 'Negotiation', 'Won'].map((stage) => {
                    const stageDeals = deals.filter(d => d.stage === stage);
                    const stageSum = stageDeals.reduce((sum, d) => sum + d.value, 0);
                    return (
                      <div key={stage} className="bg-slate-900/30 border border-slate-850 rounded-2xl p-4 flex flex-col min-h-[400px]">
                        {/* Column Header */}
                        <div className="flex items-center justify-between border-b border-slate-850 pb-3 mb-4">
                          <div>
                            <span className="text-xs font-bold text-slate-200">{stage}</span>
                            <span className="text-[10px] text-slate-500 ml-1.5 font-mono">({stageDeals.length})</span>
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono font-semibold">${(stageSum / 1000).toFixed(0)}k</span>
                        </div>
                        
                        {/* Cards container */}
                        <div className="space-y-2 flex-1 overflow-y-auto">
                          {stageDeals.map(deal => (
                            <div 
                              key={deal.id}
                              onClick={() => setSelectedDeal(deal)}
                              className="bg-slate-900/80 border border-slate-800 hover:border-violet-500/20 p-3 rounded-xl cursor-pointer transition-all hover:-translate-y-0.5 shadow-sm"
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">{deal.sector}</span>
                                <span className="text-[10px] font-mono font-semibold text-slate-300">${(deal.value / 1000).toFixed(0)}k</span>
                              </div>
                              <h4 className="text-xs font-bold text-slate-200 mt-2 truncate">{deal.name}</h4>
                              <p className="text-[10px] text-slate-500 mt-1 truncate">{deal.customer}</p>
                              <div className="mt-3 pt-2.5 border-t border-slate-850 flex items-center justify-between">
                                <span className="text-[9px] text-slate-500">Prob: {deal.probability}%</span>
                                <span className="text-[9px] text-slate-400 truncate">{deal.owner}</span>
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

          {/* TAB 4: WORK ORDERS MODULE */}
          {currentTab === 'workorders' && (
            <div className="space-y-6">
              
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-850 pb-6">
                <div>
                  <h1 className="text-xl font-bold tracking-tight text-slate-100">Project Operations Tracking</h1>
                  <p className="text-xs text-slate-400 mt-1">Live execution status map & logistics schedules</p>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="flex items-center space-x-1 rounded-lg border border-slate-800 bg-slate-900/30 p-1">
                    {['table', 'timeline'].map(mode => (
                      <button 
                        key={mode}
                        onClick={() => setWorkOrderViewMode(mode as any)} 
                        className={`text-xs px-2.5 py-1 rounded font-medium capitalize transition-all ${workOrderViewMode === mode ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'}`}
                      >
                        {mode}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Controls */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative flex-1 min-w-[200px] max-w-xs">
                  <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-500" />
                  <input
                    type="text"
                    value={globalSearchQuery}
                    onChange={(e) => setGlobalSearchQuery(e.target.value)}
                    placeholder="Search work orders, teams..."
                    className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-800 focus:border-brand-500/40 bg-slate-900/30 text-xs text-slate-200 focus:outline-none"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-slate-400 flex items-center space-x-1">
                    <Filter className="w-3.5 h-3.5" />
                    <span>Status:</span>
                  </span>
                  <select
                    value={workOrderFilterStatus}
                    onChange={(e) => setWorkOrderFilterStatus(e.target.value)}
                    className="px-2 py-1.5 rounded-lg border border-slate-800 bg-slate-900/50 text-xs text-slate-300 focus:outline-none"
                  >
                    <option value="All">All Statuses</option>
                    <option value="Not Started">Not Started</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                    <option value="Delayed">Delayed</option>
                  </select>
                </div>
              </div>

              {/* Work Order Table View */}
              {workOrderViewMode === 'table' && (
                <div className="glass-card rounded-2xl overflow-hidden border border-slate-800/80">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-800 bg-slate-900/40 text-slate-400 font-medium">
                          <th className="p-4">WO ID</th>
                          <th className="p-4">Associated Deal</th>
                          <th className="p-4">Assigned Team</th>
                          <th className="p-4">Priority</th>
                          <th className="p-4">Target Close</th>
                          <th className="p-4">Status</th>
                          <th className="p-4 text-right">Value</th>
                          <th className="p-4 text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredWorkOrders.length === 0 ? (
                          <tr>
                            <td colSpan={8} className="p-8 text-center text-slate-500 font-mono">
                              No active work orders matched your filters.
                            </td>
                          </tr>
                        ) : (
                          filteredWorkOrders.map((wo) => (
                            <tr 
                              key={wo.id} 
                              className="border-b border-slate-850 hover:bg-slate-900/30 transition-colors group cursor-pointer"
                              onClick={() => setSelectedWorkOrder(wo)}
                            >
                              <td className="p-4 font-mono text-slate-300 font-semibold">{wo.id.toUpperCase()}</td>
                              <td className="p-4 text-slate-200 font-semibold">{wo.associatedDeal}</td>
                              <td className="p-4 text-slate-300">{wo.assignedTeam}</td>
                              <td className="p-4">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                                  wo.priority === 'Critical' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                                  wo.priority === 'High' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                                  'bg-slate-800 text-slate-400'
                                }`}>
                                  {wo.priority}
                                </span>
                              </td>
                              <td className="p-4 font-mono text-slate-400">{wo.targetEndDate}</td>
                              <td className="p-4">
                                <span className={`px-2.5 py-0.5 rounded-full font-semibold ${
                                  wo.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                                  wo.status === 'Delayed' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                                  wo.status === 'In Progress' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                                  'bg-slate-800 text-slate-400'
                                }`}>
                                  {wo.status}
                                </span>
                              </td>
                              <td className="p-4 text-right font-mono font-semibold">${wo.revenue.toLocaleString()}</td>
                              <td className="p-4 text-center">
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedWorkOrder(wo);
                                  }}
                                  className="p-1 rounded bg-slate-850 hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Work Order Timeline (Gantt-like list) View */}
              {workOrderViewMode === 'timeline' && (
                <div className="glass-card p-6 rounded-2xl space-y-6">
                  <div className="text-xs font-semibold text-slate-400">Project Execution Target Windows</div>
                  <div className="space-y-4">
                    {workOrders.map((wo, index) => (
                      <div key={wo.id} className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-850 pb-3">
                        <div className="w-64">
                          <h4 className="text-xs font-bold text-slate-200">{wo.associatedDeal}</h4>
                          <p className="text-[10px] text-slate-500 mt-0.5">Team: {wo.assignedTeam}</p>
                        </div>
                        <div className="flex-1 flex items-center space-x-4 max-w-md">
                          <span className="text-[10px] text-slate-500 font-mono w-16">Q3-2026</span>
                          {/* Simulated mini timeline bar */}
                          <div className="flex-1 bg-slate-800 h-4 rounded-full overflow-hidden relative">
                            <div 
                              className={`h-full rounded-full ${
                                wo.status === 'Completed' ? 'bg-emerald-500' :
                                wo.status === 'Delayed' ? 'bg-rose-500' :
                                wo.status === 'In Progress' ? 'bg-blue-500' : 'bg-slate-600'
                              }`} 
                              style={{ width: `${index % 2 === 0 ? '70%' : '45%'}`, marginLeft: `${index * 8}%` }}
                            ></div>
                          </div>
                          <span className="text-[10px] text-slate-300 font-mono w-20 text-right">{wo.targetEndDate}</span>
                        </div>
                        <div>
                          <span className={`text-[9px] px-2 py-0.5 rounded-full font-semibold ${
                            wo.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-400' :
                            wo.status === 'Delayed' ? 'bg-rose-500/10 text-rose-400' : 'bg-slate-800 text-slate-400'
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
            <div className="space-y-6">
              
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-850 pb-6">
                <div>
                  <h1 className="text-xl font-bold tracking-tight text-slate-100">Executive Business Intelligence Analytics</h1>
                  <p className="text-xs text-slate-400 mt-1">Cross-referencing revenue forecasts, margins, and deliverability status</p>
                </div>
                <button 
                  onClick={() => {
                    confetti({ particleCount: 50, spread: 80 });
                    alert("Dashboard metrics report copied to clipboard!");
                  }}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-slate-800 hover:bg-slate-900 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors self-start sm:self-center"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export Dashboard Report</span>
                </button>
              </div>

              {/* Chart Grid layout */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* 1. Revenue Forecast Area Chart */}
                <div className="glass-card p-6 rounded-2xl">
                  <h3 className="text-sm font-semibold text-slate-200 mb-4">Quarterly Revenue Accrual Trend</h3>
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
                        <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px' }} />
                        <Area type="monotone" dataKey="value" stroke="#5B5BD6" fill="rgba(91, 91, 214, 0.08)" strokeWidth={2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* 2. Operations Deliverability status Pie Chart */}
                <div className="glass-card p-6 rounded-2xl">
                  <h3 className="text-sm font-semibold text-slate-200 mb-4">Project Delivery Execution Mix</h3>
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
                        <div key={idx} className="flex items-center justify-between border-b border-slate-850 pb-1.5">
                          <div className="flex items-center space-x-2">
                            <span className={`w-2.5 h-2.5 rounded-full ${item.color}`}></span>
                            <span className="text-slate-300">{item.label}</span>
                          </div>
                          <span className="font-semibold text-slate-100 font-mono">{item.count} items</span>
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
            <div className="space-y-6">
              
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-850 pb-6">
                <div>
                  <h1 className="text-xl font-bold tracking-tight text-slate-100">Executive Report Synthesis</h1>
                  <p className="text-xs text-slate-400 mt-1">Generate print-ready briefings for stakeholder reviews</p>
                </div>
              </div>

              {/* Actions & Report builder */}
              <div className="glass-card p-6 rounded-2xl max-w-3xl mx-auto space-y-8 bg-slate-900/20">
                <div className="flex items-center justify-between border-b border-slate-850 pb-4">
                  <div className="flex items-center space-x-2">
                    <FileText className="w-5 h-5 text-indigo-400" />
                    <div>
                      <h3 className="text-sm font-bold text-slate-200">Current Week Leadership Summary</h3>
                      <p className="text-[10px] text-slate-500 font-mono">Generated: July 2026</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                      window.print();
                    }}
                    className="flex items-center space-x-1.5 px-3 py-1.5 bg-brand-600 hover:bg-brand-500 text-white rounded-lg text-xs font-semibold shadow transition-all"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download PDF Briefing</span>
                  </button>
                </div>

                {/* Simulated Report Text */}
                <div className="space-y-6 text-xs text-slate-300 leading-relaxed printable-report">
                  <div>
                    <h4 className="text-xs font-bold text-slate-100 uppercase tracking-wider mb-2 font-mono">1. Executive Summary</h4>
                    <p>
                      This reporting cycle outlines the transition of several key pilot surveys into contract execution. Skylark Drones' core platforms recorded total completed revenue of **$1.06M**, driven by volume assessments in the mining division. While pipeline strength remains robust at **$610k**, operational delays in our highway mapping corridors highlight key equipment logistics vulnerabilities that require mitigation.
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="text-xs font-bold text-slate-100 uppercase tracking-wider mb-2 font-mono">2. Pipeline Analysis</h4>
                    <p>
                      Active negotiations represent **$610k** in pipeline volume. The renewables sector remains our most active sector, representing 52% of pipeline value. Contract conversions remain healthy with a 78% win rate over 90 days.
                    </p>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-slate-100 uppercase tracking-wider mb-2 font-mono">3. Primary Strategic Risks</h4>
                    <div className="p-3.5 rounded-xl border border-rose-500/20 bg-rose-500/5 text-rose-300 flex items-start space-x-3">
                      <AlertTriangle className="w-4 h-4 text-rose-400 mt-0.5 shrink-0" />
                      <div>
                        <p className="font-bold text-slate-200">NHAI Corridor Mapping Project Delivery (ID: wo3)</p>
                        <p className="mt-1 text-[11px] text-rose-400">
                          Equipment failure has halted Day 3 LiDAR operations. Standard replacement dispatch timeline stands at 15 days, impacting first phase milestone collections ($400,000 billing schedule).
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-slate-100 uppercase tracking-wider mb-2 font-mono">4. Action Items & Next Steps</h4>
                    <ul className="list-decimal ml-4 space-y-1 text-slate-400">
                      <li>Authorize backup LiDAR sensor allocation dispatch from Bangalore HQ immediately.</li>
                      <li>Finalize commercial contract negotiations for the **Adani Wind Farm Mapping** ($320k, currently in legal).</li>
                      <li>Address flagged data missing entries (missing close dates/comments) on Monday.com boards.</li>
                    </ul>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB 7: DATA QUALITY CENTER */}
          {currentTab === 'dataquality' && (
            <div className="space-y-6">
              
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-850 pb-6">
                <div>
                  <h1 className="text-xl font-bold tracking-tight text-slate-100">Monday.com Data Integrity Audit</h1>
                  <p className="text-xs text-slate-400 mt-1">Audit logs flagging missing fields, mismatched dates, and schema deviations</p>
                </div>
              </div>

              {/* Data quality overview cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                
                {/* Health circle card */}
                <div className="glass-card p-6 rounded-2xl flex flex-col items-center justify-center text-center">
                  <div className="w-24 h-24 rounded-full border-4 border-brand-500/20 border-t-brand-500 flex items-center justify-center font-bold text-xl text-brand-300 animate-spin-slow">
                    {healthScorePercentage}%
                  </div>
                  <h3 className="text-sm font-semibold text-slate-200 mt-4">Database Health Index</h3>
                  <p className="text-[11px] text-slate-500 mt-1">Weighted metric auditing empty fields and relation integrity</p>
                </div>

                {/* Audit summary card */}
                <div className="glass-card p-6 rounded-2xl md:col-span-2 flex flex-col justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-200 mb-3">Integrity Violations & Flags</h3>
                    <div className="space-y-2 text-xs">
                      <div className="flex items-center justify-between py-1.5 border-b border-slate-850">
                        <span className="text-slate-400">Total Empty Columns Audited:</span>
                        <span className="font-mono text-slate-200">{missingValuesCount} columns</span>
                      </div>
                      <div className="flex items-center justify-between py-1.5 border-b border-slate-850">
                        <span className="text-slate-400">Broken Deal-to-WorkOrder Relations:</span>
                        <span className="font-mono text-emerald-400">0 integrity errors</span>
                      </div>
                      <div className="flex items-center justify-between py-1.5">
                        <span className="text-slate-400">Invalid Sector Names:</span>
                        <span className="font-mono text-emerald-400">0 errors</span>
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                      alert("Executing programmatic data cleaning script. Inconsistent formats normalized!");
                      confetti({ particleCount: 30, spread: 50 });
                    }}
                    className="w-full mt-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-200 rounded-xl transition-all"
                  >
                    Normalize & Fix Inconsistent Date Formats
                  </button>
                </div>

              </div>

              {/* Specific logs table */}
              <div className="glass-card p-6 rounded-2xl">
                <h3 className="text-sm font-semibold text-slate-200 mb-4">Audit Logs</h3>
                <div className="space-y-3.5 text-xs">
                  {deals.filter(d => !d.closeDate).map(deal => (
                    <div key={deal.id} className="flex items-center justify-between border-b border-slate-850 pb-2.5 text-slate-300">
                      <div className="flex items-center space-x-2">
                        <AlertTriangle className="w-4 h-4 text-amber-500" />
                        <span>Deal <strong>{deal.name}</strong> is missing a target **Close Date** in Monday.com.</span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono">Flagged</span>
                    </div>
                  ))}
                  {workOrders.filter(w => !w.notes).map(wo => (
                    <div key={wo.id} className="flex items-center justify-between border-b border-slate-850 pb-2.5 text-slate-300">
                      <div className="flex items-center space-x-2">
                        <AlertTriangle className="w-4 h-4 text-amber-500" />
                        <span>Work Order <strong>{wo.id.toUpperCase()}</strong> contains empty log **Notes** column.</span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono">Flagged</span>
                    </div>
                  ))}
                  <div className="flex items-center space-x-2 text-slate-500 italic">
                    <Check className="w-4 h-4 text-emerald-500" />
                    <span>All operational status fields mapped to standard enum models. No schema anomalies detected.</span>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB 8: SETTINGS & INTEGRATIONS */}
          {currentTab === 'settings' && (
            <div className="space-y-6 max-w-2xl">
              
              {/* Header */}
              <div className="border-b border-slate-850 pb-6">
                <h1 className="text-xl font-bold tracking-tight text-slate-100">System Integration Settings</h1>
                <p className="text-xs text-slate-400 mt-1">Configure credentials, refresh intervals, and API endpoints</p>
              </div>

              {/* Credentials card */}
              <div className="glass-card p-6 rounded-2xl space-y-5">
                <h3 className="text-sm font-semibold text-slate-200 border-b border-slate-850 pb-2.5">API & Model Configuration</h3>
                
                {/* Monday API Token */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-300 block">Monday.com Developer Personal Token</label>
                  <div className="relative">
                    <Key className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                    <input
                      type="password"
                      value={mondayToken}
                      onChange={(e) => {
                        setMondayToken(e.target.value);
                        localStorage.setItem('mondayToken', e.target.value);
                      }}
                      placeholder="Paste monday.com API v2 token (e.g. eyJhbGciOiJIUzI1NiIsInR5cCI...)"
                      className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-850 bg-slate-900/30 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-brand-500/50"
                    />
                  </div>
                  <p className="text-[10px] text-slate-500 leading-relaxed">
                    Retrieve this token from Monday.com &gt; Avatar icon &gt; Developers &gt; My Developer Tokens.
                  </p>
                </div>

                {/* Gemini API Key */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-300 block">Google Gen AI Gemini API Key</label>
                  <div className="relative">
                    <Sparkles className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                    <input
                      type="password"
                      value={geminiApiKey}
                      onChange={(e) => {
                        setGeminiApiKey(e.target.value);
                        localStorage.setItem('geminiApiKey', e.target.value);
                      }}
                      placeholder="Paste Google AI Studio API Key..."
                      className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-850 bg-slate-900/30 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-brand-500/50"
                    />
                  </div>
                  <p className="text-[10px] text-slate-500 leading-relaxed">
                    Enter your key to enable **live database reasoning** using the *gemini-1.5-flash* model. Leave blank to operate in simulated fallback mode.
                  </p>
                </div>
              </div>

              {/* Sync interval & options card */}
              <div className="glass-card p-6 rounded-2xl space-y-4">
                <h3 className="text-sm font-semibold text-slate-200 border-b border-slate-850 pb-2.5">Auto Synchronization Settings</h3>
                
                <div className="flex items-center justify-between text-xs">
                  <div>
                    <p className="font-semibold text-slate-200">Webhook Trigger Update</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">Monday board edits sync immediately without manual polling</p>
                  </div>
                  <span className="w-12 h-6 rounded-full bg-brand-600/30 border border-brand-500/40 p-0.5 flex justify-end cursor-pointer">
                    <span className="w-4.5 h-4.5 rounded-full bg-brand-400"></span>
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs pt-4 border-t border-slate-850">
                  <div>
                    <p className="font-semibold text-slate-200">Default Cache Limit</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">Flush API caches and reload board definitions</p>
                  </div>
                  <button 
                    onClick={() => {
                      alert("Workspace cache cleared. Reloading integrations.");
                      confetti({ particleCount: 20 });
                    }}
                    className="px-3 py-1.5 border border-slate-800 hover:bg-slate-900 text-slate-300 font-semibold rounded-lg"
                  >
                    Clear Cache
                  </button>
                </div>
              </div>

              {/* Appearance Settings */}
              <div className="glass-card p-6 rounded-2xl space-y-4">
                <h3 className="text-sm font-semibold text-slate-200 border-b border-slate-850 pb-2.5">Appearance Settings</h3>
                <div className="flex items-center justify-between text-xs">
                  <div>
                    <p className="font-semibold text-slate-200">Dark Mode Theme</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">Toggle between standard light and professional slate dark themes</p>
                  </div>
                  <button
                    onClick={() => setDarkMode(!darkMode)}
                    className={`w-12 h-6 rounded-full p-0.5 transition-all flex items-center ${
                      darkMode ? 'bg-brand-600 justify-end' : 'bg-slate-300 justify-start'
                    }`}
                  >
                    <span className="w-4.5 h-4.5 rounded-full bg-white shadow-sm"></span>
                  </button>
                </div>
              </div>

            </div>
          )}

        </main>

      </div>

      {/* 2. Notifications Side Drawer */}
      {notificationsOpen && (
        <div className="fixed inset-y-0 right-0 w-80 bg-slate-900 border-l border-slate-800 shadow-2xl z-50 flex flex-col justify-between">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Bell className="w-4 h-4 text-brand-400 animate-pulse" />
              <span className="font-bold text-sm text-slate-200">Alert Center</span>
            </div>
            <button 
              onClick={() => setNotificationsOpen(false)}
              className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-100"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs">
            <div className="p-3 rounded-xl border border-rose-500/20 bg-rose-500/5">
              <p className="font-bold text-slate-200">Equipment Calibration Failure</p>
              <p className="text-slate-400 mt-1">Work order wo3 (NHAI Corridors) reported delayed status due to LiDAR sensor failures.</p>
              <span className="text-[9px] text-slate-500 font-mono block mt-1.5">2 hours ago</span>
            </div>
            <div className="p-3 rounded-xl border border-slate-800 bg-slate-900/40">
              <p className="font-bold text-slate-200">Weekly Report Compiled</p>
              <p className="text-slate-400 mt-1">The AI Business Assistant generated this week's Executive Briefing report successfully.</p>
              <span className="text-[9px] text-slate-500 font-mono block mt-1.5">4 hours ago</span>
            </div>
            <div className="p-3 rounded-xl border border-slate-800 bg-slate-900/40">
              <p className="font-bold text-slate-200">New Deal Added</p>
              <p className="text-slate-400 mt-1">Aditya Sharma added 'Singareni volume assessment' to deals board with status Won.</p>
              <span className="text-[9px] text-slate-500 font-mono block mt-1.5">1 day ago</span>
            </div>
          </div>
        </div>
      )}

      {/* 3. Global CMD+K Palette Modal */}
      {commandPaletteOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-start justify-center pt-24 z-50">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 shadow-2xl rounded-2xl overflow-hidden">
            {/* Input field */}
            <div className="p-3 border-b border-slate-800 flex items-center space-x-3.5">
              <Search className="w-4 h-4 text-slate-400" />
              <input
                type="text"
                autoFocus
                placeholder="Type a command or destination (e.g. dashboard, chat, settings)..."
                onChange={(e) => {
                  const cmd = e.target.value.toLowerCase();
                  if (cmd === 'dashboard') { setCurrentTab('dashboard'); setCommandPaletteOpen(false); }
                  if (cmd === 'chat') { setCurrentTab('chat'); setCommandPaletteOpen(false); }
                  if (cmd === 'deals') { setCurrentTab('deals'); setCommandPaletteOpen(false); }
                  if (cmd === 'workorders') { setCurrentTab('workorders'); setCommandPaletteOpen(false); }
                  if (cmd === 'analytics') { setCurrentTab('analytics'); setCommandPaletteOpen(false); }
                  if (cmd === 'reports') { setCurrentTab('reports'); setCommandPaletteOpen(false); }
                  if (cmd === 'settings') { setCurrentTab('settings'); setCommandPaletteOpen(false); }
                }}
                className="w-full bg-transparent focus:outline-none text-xs text-slate-200 placeholder-slate-500"
              />
              <button 
                onClick={() => setCommandPaletteOpen(false)}
                className="text-[10px] px-1.5 py-0.5 rounded border border-slate-700 bg-slate-800 text-slate-400"
              >
                ESC
              </button>
            </div>
            {/* Suggestions list */}
            <div className="p-2 space-y-1 text-xs">
              {[
                { label: "Switch to Executive Dashboard", action: () => setCurrentTab('dashboard') },
                { label: "Open AI Assistant Workspace", action: () => setCurrentTab('chat') },
                { label: "Search Deals Module", action: () => setCurrentTab('deals') },
                { label: "Sync Monday.com board status", action: () => handleManualSync() },
                { label: "Audit Data Quality Health", action: () => setCurrentTab('dataquality') },
                { label: "Open API Integration Settings", action: () => setCurrentTab('settings') }
              ].map((cmd, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    cmd.action();
                    setCommandPaletteOpen(false);
                  }}
                  className="w-full text-left p-2.5 rounded-xl hover:bg-slate-800/60 text-slate-400 hover:text-slate-100 transition-colors flex items-center justify-between"
                >
                  <span>{cmd.label}</span>
                  <span className="text-[10px] text-slate-600 font-mono">Shortcut enter</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 4. Deal Details Modal */}
      {selectedDeal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 shadow-2xl rounded-2xl overflow-hidden flex flex-col justify-between max-h-[90vh]">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">{selectedDeal.sector}</span>
                <h3 className="font-bold text-base text-slate-100">{selectedDeal.name}</h3>
              </div>
              <button 
                onClick={() => setSelectedDeal(null)}
                className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-100"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs text-slate-300">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/30">
                  <p className="text-[10px] text-slate-500 font-mono uppercase">Deal Value</p>
                  <p className="text-base font-bold text-slate-200 mt-1 font-mono">${selectedDeal.value.toLocaleString()}</p>
                </div>
                <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/30">
                  <p className="text-[10px] text-slate-500 font-mono uppercase">Stage Status</p>
                  <p className="text-xs font-bold text-indigo-400 mt-1">{selectedDeal.stage}</p>
                </div>
                <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/30">
                  <p className="text-[10px] text-slate-500 font-mono uppercase">Close Probability</p>
                  <p className="text-xs font-bold text-slate-200 mt-1 font-mono">{selectedDeal.probability}%</p>
                </div>
                <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/30">
                  <p className="text-[10px] text-slate-500 font-mono uppercase">Client / Partner</p>
                  <p className="text-xs font-bold text-slate-200 mt-1 truncate">{selectedDeal.customer}</p>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-slate-200 border-b border-slate-800 pb-1.5 mb-2 uppercase tracking-wide text-[10px]">Operations Log & Notes</h4>
                <p className="leading-relaxed text-slate-400">{selectedDeal.notes || "No extra operational commentary recorded for this deal on Monday.com."}</p>
              </div>

              <div>
                <h4 className="font-bold text-slate-200 border-b border-slate-800 pb-1.5 mb-2.5 uppercase tracking-wide text-[10px]">Associated Execution Status</h4>
                {workOrders.filter(w => w.associatedDeal === selectedDeal.name).length === 0 ? (
                  <p className="text-slate-500 italic">No execution work order has been generated for this deal yet.</p>
                ) : (
                  workOrders.filter(w => w.associatedDeal === selectedDeal.name).map(wo => (
                    <div 
                      key={wo.id} 
                      onClick={() => {
                        setSelectedWorkOrder(wo);
                        setSelectedDeal(null);
                      }}
                      className="p-3 rounded-xl border border-slate-800 bg-slate-900/40 hover:border-slate-700 cursor-pointer flex items-center justify-between transition-colors"
                    >
                      <div>
                        <p className="font-bold text-slate-200">{wo.assignedTeam}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">Priority: {wo.priority} | Target Date: {wo.targetEndDate}</p>
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                        wo.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-400' :
                        wo.status === 'Delayed' ? 'bg-rose-500/10 text-rose-400 animate-pulse' : 'bg-slate-800 text-slate-300'
                      }`}>
                        {wo.status}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
            
            <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex justify-end space-x-2">
              <button 
                onClick={() => {
                  setCurrentTab('chat');
                  setSelectedDeal(null);
                  handleSendMessage(`Give me detailed recommendations and next actions for the deal "${selectedDeal.name}"`);
                }}
                className="flex items-center space-x-1 px-3 py-1.5 bg-brand-600 hover:bg-brand-500 text-white font-semibold rounded-lg"
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
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 shadow-2xl rounded-2xl overflow-hidden flex flex-col justify-between max-h-[90vh]">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">{selectedWorkOrder.id.toUpperCase()}</span>
                <h3 className="font-bold text-base text-slate-100">{selectedWorkOrder.associatedDeal}</h3>
              </div>
              <button 
                onClick={() => setSelectedWorkOrder(null)}
                className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-100"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs text-slate-300">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/30">
                  <p className="text-[10px] text-slate-500 font-mono uppercase">Assigned Team</p>
                  <p className="text-xs font-bold text-slate-200 mt-1 truncate">{selectedWorkOrder.assignedTeam}</p>
                </div>
                <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/30">
                  <p className="text-[10px] text-slate-500 font-mono uppercase">Execution status</p>
                  <p className="text-xs font-bold text-indigo-400 mt-1">{selectedWorkOrder.status}</p>
                </div>
                <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/30">
                  <p className="text-[10px] text-slate-500 font-mono uppercase">Priority Level</p>
                  <p className="text-xs font-bold text-slate-200 mt-1">{selectedWorkOrder.priority}</p>
                </div>
                <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/30">
                  <p className="text-[10px] text-slate-500 font-mono uppercase">Project Budget</p>
                  <p className="text-base font-bold text-slate-200 mt-1 font-mono">${selectedWorkOrder.revenue.toLocaleString()}</p>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-slate-200 border-b border-slate-800 pb-1.5 mb-2 uppercase tracking-wide text-[10px]">Operations Log & Notes</h4>
                <p className="leading-relaxed text-slate-400">{selectedWorkOrder.notes || "No extra operational commentary recorded for this work order."}</p>
              </div>

              <div>
                <h4 className="font-bold text-slate-200 border-b border-slate-800 pb-1.5 mb-2 uppercase tracking-wide text-[10px]">Execution Timeline deadlines</h4>
                <div className="flex items-center space-x-4 border border-slate-800 bg-slate-900/20 p-3 rounded-xl">
                  <div className="text-center w-24">
                    <p className="text-[10px] text-slate-500 uppercase">Target End</p>
                    <p className="font-bold font-mono text-slate-200 mt-0.5">{selectedWorkOrder.targetEndDate}</p>
                  </div>
                  <div className="flex-1 border-t border-dashed border-slate-800"></div>
                  <div className="text-center w-24">
                    <p className="text-[10px] text-slate-500 uppercase">Actual End</p>
                    <p className="font-bold font-mono text-slate-300 mt-0.5">{selectedWorkOrder.actualEndDate || "In progress"}</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex justify-end space-x-2">
              <button 
                onClick={() => {
                  setCurrentTab('chat');
                  setSelectedWorkOrder(null);
                  handleSendMessage(`Give me detailed recommendations and operational solutions for the work order "${selectedWorkOrder.id}" under deal "${selectedWorkOrder.associatedDeal}"`);
                }}
                className="flex items-center space-x-1 px-3 py-1.5 bg-brand-600 hover:bg-brand-500 text-white font-semibold rounded-lg"
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

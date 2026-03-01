/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import AIInsights from './pages/AIInsights';
import AddPaper from './pages/AddPaper';
import AgentActivity from './pages/AgentActivity';
import ArticleList from './pages/ArticleList';
import AskAI from './pages/AskAI';
import CollectionDetail from './pages/CollectionDetail';
import Collections from './pages/Collections';
import Database from './pages/Database';
import DuplicateManager from './pages/DuplicateManager';
import Home from './pages/Home';
import PaperDetail from './pages/PaperDetail';
import Visualizations from './pages/Visualizations';
import PredictiveAnalytics from './pages/PredictiveAnalytics';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AIInsights": AIInsights,
    "AddPaper": AddPaper,
    "AgentActivity": AgentActivity,
    "ArticleList": ArticleList,
    "AskAI": AskAI,
    "CollectionDetail": CollectionDetail,
    "Collections": Collections,
    "Database": Database,
    "DuplicateManager": DuplicateManager,
    "Home": Home,
    "PaperDetail": PaperDetail,
    "Visualizations": Visualizations,
    "PredictiveAnalytics": PredictiveAnalytics,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};
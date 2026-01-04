import AIInsights from './pages/AIInsights';
import AddPaper from './pages/AddPaper';
import AgentActivity from './pages/AgentActivity';
import AskAI from './pages/AskAI';
import CollectionDetail from './pages/CollectionDetail';
import Collections from './pages/Collections';
import Database from './pages/Database';
import Home from './pages/Home';
import PaperDetail from './pages/PaperDetail';
import Visualizations from './pages/Visualizations';
import SubmitPaper from './pages/SubmitPaper';
import ReviewSubmissions from './pages/ReviewSubmissions';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AIInsights": AIInsights,
    "AddPaper": AddPaper,
    "AgentActivity": AgentActivity,
    "AskAI": AskAI,
    "CollectionDetail": CollectionDetail,
    "Collections": Collections,
    "Database": Database,
    "Home": Home,
    "PaperDetail": PaperDetail,
    "Visualizations": Visualizations,
    "SubmitPaper": SubmitPaper,
    "ReviewSubmissions": ReviewSubmissions,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};
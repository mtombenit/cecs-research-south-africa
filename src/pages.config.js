import AddPaper from './pages/AddPaper';
import AskAI from './pages/AskAI';
import CollectionDetail from './pages/CollectionDetail';
import Collections from './pages/Collections';
import Database from './pages/Database';
import Home from './pages/Home';
import PaperDetail from './pages/PaperDetail';
import Visualizations from './pages/Visualizations';
import AgentActivity from './pages/AgentActivity';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AddPaper": AddPaper,
    "AskAI": AskAI,
    "CollectionDetail": CollectionDetail,
    "Collections": Collections,
    "Database": Database,
    "Home": Home,
    "PaperDetail": PaperDetail,
    "Visualizations": Visualizations,
    "AgentActivity": AgentActivity,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};
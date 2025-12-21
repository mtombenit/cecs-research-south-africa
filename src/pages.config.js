import Home from './pages/Home';
import Database from './pages/Database';
import PaperDetail from './pages/PaperDetail';
import AskAI from './pages/AskAI';
import AddPaper from './pages/AddPaper';
import Visualizations from './pages/Visualizations';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Home": Home,
    "Database": Database,
    "PaperDetail": PaperDetail,
    "AskAI": AskAI,
    "AddPaper": AddPaper,
    "Visualizations": Visualizations,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};
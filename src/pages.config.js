import Home from './pages/Home';
import Database from './pages/Database';
import PaperDetail from './pages/PaperDetail';
import AskAI from './pages/AskAI';
import AddPaper from './pages/AddPaper';
import Visualizations from './pages/Visualizations';
import Collections from './pages/Collections';
import CollectionDetail from './pages/CollectionDetail';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Home": Home,
    "Database": Database,
    "PaperDetail": PaperDetail,
    "AskAI": AskAI,
    "AddPaper": AddPaper,
    "Visualizations": Visualizations,
    "Collections": Collections,
    "CollectionDetail": CollectionDetail,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { 
  FlaskConical, Home, Database, Sparkles, Plus, Menu, 
  LogOut, User, TrendingUp, Bookmark, Activity
} from "lucide-react";
import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const navItems = [
  { name: "Home", icon: Home, page: "Home" },
  { name: "Database", icon: Database, page: "Database" },
  { name: "Visualizations", icon: TrendingUp, page: "Visualizations" },
  { name: "AI Insights", icon: Sparkles, page: "AIInsights" },
  { name: "Collections", icon: Bookmark, page: "Collections" },
  { name: "Ask AI", icon: Sparkles, page: "AskAI" },
];

export default function Layout({ children, currentPageName }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const NavLinks = ({ mobile = false }) => (
    <div className={`flex ${mobile ? 'flex-col space-y-1' : 'items-center gap-1'}`}>
      {navItems.map((item) => {
        const isActive = currentPageName === item.page;
        return (
          <Link
            key={item.page}
            to={createPageUrl(item.page)}
            onClick={() => mobile && setMobileOpen(false)}
          >
            <Button
              variant="ghost"
              className={`${mobile ? 'w-full justify-start' : ''} ${
                isActive 
                  ? 'bg-teal-50 text-teal-700 hover:bg-teal-100' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <item.icon className="w-4 h-4 mr-2" />
              {item.name}
            </Button>
          </Link>
        );
      })}
      <Link 
        to={createPageUrl("AddPaper")} 
        onClick={() => mobile && setMobileOpen(false)}
      >
        <Button className={`bg-teal-600 hover:bg-teal-700 ${mobile ? 'w-full mt-4' : 'ml-2'}`}>
          <Plus className="w-4 h-4 mr-2" />
          Add Paper
        </Button>
      </Link>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to={createPageUrl("Home")} className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl shadow-lg shadow-teal-500/20">
                <FlaskConical className="w-5 h-5 text-white" />
              </div>
              <div className="hidden sm:block">
                <h1 className="font-bold text-slate-900 text-lg leading-tight">SA CECs Intelligent Portal</h1>
                <p className="text-xs text-slate-500">Research Portal</p>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-6">
              <NavLinks />
              
              {user && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="rounded-full">
                      <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-medium">
                        {user.full_name?.[0] || user.email?.[0] || 'U'}
                      </div>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <div className="px-3 py-2">
                      <p className="font-medium text-sm text-slate-900">{user.full_name || 'User'}</p>
                      <p className="text-xs text-slate-500 truncate">{user.email}</p>
                    </div>
                    <DropdownMenuSeparator />
                    {user.role === 'admin' && (
                      <DropdownMenuItem asChild>
                        <Link to={createPageUrl("AgentActivity")}>
                          <Activity className="w-4 h-4 mr-2" />
                          Agent Activity
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={() => base44.auth.logout()}>
                      <LogOut className="w-4 h-4 mr-2" />
                      Sign out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </nav>

            {/* Mobile Menu */}
            <div className="lg:hidden">
              <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Menu className="w-5 h-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[280px]">
                  <div className="flex items-center gap-3 mb-8 mt-2">
                    <div className="p-2 bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl">
                      <FlaskConical className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h2 className="font-bold text-slate-900">SA CECs Intelligent Portal</h2>
                      <p className="text-xs text-slate-500">Research Portal</p>
                    </div>
                  </div>
                  <NavLinks mobile />
                  
                  {user && (
                    <div className="mt-8 pt-6 border-t border-slate-200">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-medium">
                          {user.full_name?.[0] || user.email?.[0] || 'U'}
                        </div>
                        <div>
                          <p className="font-medium text-sm text-slate-900">{user.full_name || 'User'}</p>
                          <p className="text-xs text-slate-500 truncate">{user.email}</p>
                        </div>
                      </div>
                      {user.role === 'admin' && (
                        <Link to={createPageUrl("AgentActivity")} onClick={() => setMobileOpen(false)}>
                          <Button 
                            variant="ghost" 
                            className="w-full justify-start text-slate-600"
                          >
                            <Activity className="w-4 h-4 mr-2" />
                            Agent Activity
                          </Button>
                        </Link>
                      )}
                      <Button 
                        variant="ghost" 
                        className="w-full justify-start text-slate-600"
                        onClick={() => base44.auth.logout()}
                      >
                        <LogOut className="w-4 h-4 mr-2" />
                        Sign out
                      </Button>
                      </div>
                      )}
                      </SheetContent>
                      </Sheet>
                      </div>
                      </div>
                      </div>
                      </header>

      {/* Main Content */}
      <main>
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl">
                <FlaskConical className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm text-slate-600">
                South African CECs Research Database
              </span>
            </div>
            <p className="text-sm text-slate-500">
              © {new Date().getFullYear()} Zambezi Analytics • Focused on South African CECs Research
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
import { LayoutDashboard, History, Search, Bookmark, Settings, Headphones, Cpu } from "lucide-react";
import { NavLink } from "react-router-dom";

export default function Sidebar() {
  const navItems = [
    { name: "Dashboard", icon: LayoutDashboard, path: "/" },
    { name: "History", icon: History, path: "/history" },
    { name: "Search & Explore", icon: Search, path: "/search" },
    { name: "Saved Summaries", icon: Bookmark, path: "/saved" },
    { name: "Support", icon: Headphones, path: "/support" },
    { name: "Settings", icon: Settings, path: "/settings" },
  ];

  return (
    <div className="h-screen w-64 bg-white shadow-xl flex flex-col justify-between">
      {/* Logo */}
      <div>
        <div className="flex items-center gap-2 px-6 py-6 border-b">
          <img src="/logo.svg" alt="logo" className="h-8 w-8" />
          <h1 className="text-xl font-bold text-purple-600">InstaBrief</h1>
        </div>

        {/* Navigation */}
        <nav className="mt-4">
          {navItems.map((item) => (
            <NavLink
              to={item.path}
              key={item.name}
              className={({ isActive }) =>
                `flex items-center gap-3 px-6 py-3 text-gray-600 hover:bg-purple-50 hover:text-purple-600 transition ${
                  isActive ? "bg-purple-100 text-purple-600 font-medium" : ""
                }`
              }
            >
              <item.icon size={20} />
              {item.name}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* AI Info Card */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white m-4 rounded-xl p-4 flex items-center gap-3">
        <Cpu size={28} />
        <div>
          <p className="font-semibold">AI Powered</p>
          <p className="text-sm opacity-80">Processing with GPT-4</p>
        </div>
      </div>
    </div>
  );
}

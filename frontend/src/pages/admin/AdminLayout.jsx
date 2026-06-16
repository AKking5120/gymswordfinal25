import { useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate, Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Package, ShoppingCart, Users, Ticket, BarChart3, Mail,
  Settings as Cog, LogOut, UserPlus, Tag, Star, Image, UserCheck, FileText,
  BookOpen, HelpCircle, RotateCcw, Zap, Users2, Download, Shield, ArrowUp
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { GymSwordLogo } from "@/components/GymSwordLogo";
import { ADMIN } from "@/constants/testIds";

const NAV = [
  { to: "/admin", end: true, label: "Dashboard", icon: LayoutDashboard },
  // Products
  { to: "/admin/products", label: "Products", icon: Package },
  { to: "/admin/categories", label: "Categories", icon: Tag },
  // CMS
  { to: "/admin/blog", label: "Blog", icon: BookOpen },
  { to: "/admin/banners", label: "Banners", icon: Image },
  { to: "/admin/faqs", label: "FAQ", icon: HelpCircle },
  { to: "/admin/reviews", label: "Reviews", icon: Star },
  // Sales
  { to: "/admin/orders", label: "Orders", icon: ShoppingCart },
  { to: "/admin/returns", label: "Returns", icon: RotateCcw },
  { to: "/admin/flash-sales", label: "Flash Sales", icon: Zap },
  { to: "/admin/coupons", label: "Coupons", icon: Ticket },
  // People
  { to: "/admin/customers", label: "Customers", icon: Users },
  { to: "/admin/referrals", label: "Referrals", icon: UserPlus },
  { to: "/admin/leads", label: "Leads", icon: UserCheck },
  { to: "/admin/messages", label: "Messages", icon: Mail },
  // Comms
  { to: "/admin/newsletter", label: "Newsletter", icon: Users2 },
  { to: "/admin/email-logs", label: "Email Logs", icon: FileText },
  // Tools
  { to: "/admin/export", label: "Export", icon: Download },
  { to: "/admin/staff", label: "Staff", icon: Shield },
  { to: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/admin/settings", label: "Settings", icon: Cog },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [showTop, setShowTop] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [pathname]);

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 300);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white flex">
      <aside data-testid={ADMIN.sidebar} className="w-64 border-r border-white/10 flex flex-col sticky top-0 self-start h-screen overflow-y-auto">
        <div className="p-6 border-b border-white/10">
          <Link to="/admin"><GymSwordLogo variant="light" /></Link>
          <div className="text-overline text-white/40 mt-3">Owner Console</div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.end}
              data-testid={`admin-nav-${n.label.toLowerCase().replace(/\s+/g, '-')}`}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 text-sm transition ${
                  isActive ? "bg-white text-black" : "text-white/70 hover:bg-white/5 hover:text-white"
                }`
              }
            >
              <n.icon size={16} />
              {n.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-white/10 space-y-2">
          <div className="px-4 py-2 text-xs text-white/50">{user?.email}</div>
          <Link to="/" className="block px-4 py-2 text-xs text-white/60 hover:text-white luxury-link">View Storefront →</Link>
          <button onClick={async () => { await logout(); navigate("/admin/login"); }} className="w-full flex items-center gap-3 px-4 py-2 text-sm text-white/70 hover:bg-white/5 hover:text-white">
            <LogOut size={14} /> Sign Out
          </button>
        </div>
      </aside>
      <main className="flex-1 p-8 md:p-12 overflow-x-auto relative">
        <Outlet />
      </main>

      {showTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-8 right-8 z-50 w-12 h-12 rounded-full bg-white text-black flex items-center justify-center shadow-lg hover:bg-white/90 transition"
          title="Back to top"
        >
          <ArrowUp size={20} />
        </button>
      )}
    </div>
  );
}

import { useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { Package, ShoppingCart, Users } from "lucide-react";

const EXPORTS = [
  { type: "products", label: "Products", icon: Package, desc: "Download all products as CSV" },
  { type: "orders", label: "Orders", icon: ShoppingCart, desc: "Download all orders as CSV" },
  { type: "users", label: "Users", icon: Users, desc: "Download all users as CSV" },
];

export default function AdminExport() {
  const [loading, setLoading] = useState(null);

  const handleExport = async (type) => {
    setLoading(type);
    try {
      const res = await api.get(`/admin/export/${type}`, { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${type}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} exported`);
    } catch {
      toast.error("Export failed");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-10">
      <div>
        <div className="text-overline text-white/50">Data</div>
        <h1 className="font-display uppercase font-black text-4xl sm:text-5xl mt-2">Export</h1>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {EXPORTS.map(({ type, label, icon: Icon, desc }) => (
          <div key={type} className="bg-white/5 border border-white/10 p-6 flex flex-col items-start gap-4">
            <div className="w-12 h-12 rounded-lg bg-white/10 flex items-center justify-center">
              <Icon className="text-white" size={24} />
            </div>
            <div>
              <h3 className="font-semibold text-lg">{label}</h3>
              <p className="text-sm text-white/50 mt-1">{desc}</p>
            </div>
            <button
              onClick={() => handleExport(type)}
              disabled={loading === type}
              className="mt-auto px-5 py-2.5 bg-white text-black text-sm font-semibold rounded-lg hover:bg-white/90 transition disabled:opacity-50"
            >
              {loading === type ? "Exporting\u2026" : "Export CSV"}
            </button>
          </div>
        ))}
      </div>
      <p className="text-sm text-white/40">CSV files can be opened in Excel or Google Sheets</p>
    </div>
  );
}

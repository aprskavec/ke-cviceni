import { LayoutGrid, Layers, Bookmark, User } from "lucide-react";

interface BottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const BottomNav = ({ activeTab, onTabChange }: BottomNavProps) => {
  const navItems = [
    { id: "plan", icon: LayoutGrid, label: "Plán" },
    { id: "cards", icon: Layers, label: "Kartičky" },
    { id: "saved", icon: Bookmark, label: "Uložené" },
    { id: "profile", icon: User, label: "Profil" },
  ];

  return (
    <nav className="bottom-nav">
      {navItems.map((item) => {
        const isActive = activeTab === item.id;
        const Icon = item.icon;
        
        return (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={`nav-item ${isActive ? "nav-item-active" : "text-muted-foreground"}`}
          >
            <Icon className="w-6 h-6" strokeWidth={isActive ? 2.5 : 2} />
            <span className="text-xs font-medium">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};

export default BottomNav;

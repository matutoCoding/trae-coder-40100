import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  CalendarClock, 
  MonitorCog, 
  DollarSign, 
  FileText, 
  Film,
  Camera
} from 'lucide-react';

const navItems = [
  { path: '/dashboard', label: '工作台', icon: LayoutDashboard },
  { path: '/schedule', label: '工位排期', icon: CalendarClock },
  { path: '/workstations', label: '工位管理', icon: MonitorCog },
  { path: '/rates', label: '费率管理', icon: DollarSign },
  { path: '/bills', label: '账单中心', icon: FileText },
  { path: '/processing', label: '冲扫登记', icon: Film },
];

const Sidebar = () => {
  return (
    <aside className="w-64 bg-darkroom-card border-r border-darkroom-border h-screen flex flex-col fixed left-0 top-0 z-30">
      <div className="p-6 border-b border-darkroom-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-safelight-red flex items-center justify-center safelight-glow">
            <Camera className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-display text-lg font-bold text-film-cream">暗房工坊</h1>
            <p className="text-xs text-gray-500">Darkroom Studio</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                isActive
                  ? 'bg-safelight-red/20 text-safelight-redLight border-l-2 border-safelight-red'
                  : 'text-gray-400 hover:bg-darkroom-hover hover:text-film-cream'
              }`
            }
          >
            <item.icon className="w-5 h-5" />
            <span className="font-medium">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-darkroom-border">
        <div className="card-dark p-4">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-sm text-gray-400">系统运行中</span>
          </div>
          <p className="text-xs text-gray-600 mt-2 font-mono">
            v1.0.0
          </p>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;

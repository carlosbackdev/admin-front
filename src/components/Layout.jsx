import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { LayoutDashboard, Package, Tags, ShoppingCart, Truck, Settings, LogOut, Image, UserPlus } from 'lucide-react';

const Sidebar = () => {
    const navItems = [
        { icon: LayoutDashboard, label: 'Resumen', path: '/' },
        { icon: Package, label: 'Productos y stock', path: '/products' },
        { icon: Tags, label: 'Categorías', path: '/categories' },
        { icon: ShoppingCart, label: 'Pedidos', path: '/orders' },
        { icon: UserPlus, label: 'Leads', path: '/leads' },
        { icon: Truck, label: 'Seguimiento', path: '/tracking' },
        { icon: Image, label: 'Banners', path: '/banners' },
        { icon: LayoutDashboard, label: 'Blog', path: '/blog' },
        { icon: Settings, label: 'Ajustes', path: '/settings' },
    ];

    return (
        <aside className="sidebar">
            <div className="mb-10 flex items-center gap-3 px-2">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                    <span className="font-bold text-white text-lg">M</span>
                </div>
                <div className="flex flex-col">
                    <span className="text-lg font-bold tracking-tight text-white">MotoGear</span>
                    <span className="text-xs text-zinc-500">Producto e inventario</span>
                </div>
            </div>

            <nav className="flex flex-col gap-2 flex-1">
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group ${isActive
                                ? 'bg-blue-600/10 text-blue-500 border border-blue-500/20'
                                : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
                            }`
                        }
                    >
                        {({ isActive }) => (
                            <>
                                <item.icon size={20} className={isActive ? 'text-blue-500' : 'text-zinc-500 group-hover:text-white transition-colors'} />
                                <span className="font-medium">{item.label}</span>
                            </>
                        )}
                    </NavLink>
                ))}
            </nav>

            <button className="flex items-center gap-3 px-4 py-3 text-zinc-400 hover:text-red-400 transition-colors mt-auto rounded-lg hover:bg-red-500/10">
                <LogOut size={20} />
                <span className="font-medium">Cerrar sesión</span>
            </button>
        </aside>
    );
};

const Layout = () => {
    return (
        <div className="layout">
            <Sidebar />
            <main className="main-content">
                <Outlet />
            </main>
        </div>
    );
};

export default Layout;

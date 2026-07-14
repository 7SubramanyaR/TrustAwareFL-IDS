import { NavLink } from "react-router-dom";
import {
    LayoutDashboard,
    Shield,
    Activity,
    Cpu,
    Info
} from "lucide-react";

const items = [
    { name: "Dashboard", icon: LayoutDashboard, path: "/" },
    { name: "Analytics", icon: Activity, path: "/analytics" },
    { name: "Prediction", icon: Shield, path: "/prediction" },
    { name: "Federated", icon: Cpu, path: "/federated" },
    { name: "About", icon: Info, path: "/about" },
];

export default function Sidebar() {
    return (
        <div className="w-72 bg-black/40 border-r border-cyan-500/20 backdrop-blur-xl">

            <div className="p-8">

                <h1 className="font-['Orbitron'] text-cyan-400 text-2xl font-bold">
                    J.A.R.V.I.S
                </h1>

                <p className="text-gray-400 text-sm mt-2">
                    AI Security Console
                </p>

            </div>

            <div className="mt-8">

                {items.map((item) => {

                    const Icon = item.icon;

                    return (

                        <NavLink
                            key={item.name}
                            to={item.path}
                            className={({ isActive }) =>
                                `flex items-center gap-4 px-8 py-4 transition-all ${
                                    isActive
                                        ? "bg-cyan-500/20 text-cyan-400 border-r-4 border-cyan-400"
                                        : "text-gray-400 hover:bg-cyan-500/10 hover:text-cyan-300"
                                }`
                            }
                        >
                            <Icon size={22} />
                            {item.name}
                        </NavLink>

                    );
                })}

            </div>

        </div>
    );
}
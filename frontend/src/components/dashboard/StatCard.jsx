import { motion } from "framer-motion";

export default function StatCard({
    title,
    value,
    color = "cyan"
}) {

    const colors = {
        cyan: "text-cyan-400",
        green: "text-green-400",
        red: "text-red-400",
        yellow: "text-yellow-400",
        blue: "text-blue-400",
        purple: "text-purple-400"
    };

    return (

        <motion.div

            whileHover={{
                scale: 1.04,
                y: -5
            }}

            transition={{
                duration: 0.2
            }}

            className="
                rounded-2xl
                bg-white/5
                border
                border-cyan-500/20
                backdrop-blur-xl
                p-6
                shadow-lg
                hover:shadow-cyan-500/20
                transition-all
                duration-300
            "

        >

            <p className="text-gray-400 text-sm uppercase tracking-wider">
                {title}
            </p>

            <h2
                className={`text-4xl font-bold mt-4 ${colors[color]}`}
            >
                {value}
            </h2>

        </motion.div>

    );

}
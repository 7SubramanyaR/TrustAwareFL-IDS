import { motion } from "framer-motion";

const clients = [
  { id: 1, x: 15, y: 70 },
  { id: 2, x: 50, y: 85 },
  { id: 3, x: 85, y: 70 },
];

export default function NetworkAnimation() {
  return (
    <div className="relative w-full h-[450px] rounded-2xl bg-black/30 border border-cyan-500/20 overflow-hidden">

      {/* Server */}
      <motion.div
        animate={{
          scale: [1, 1.1, 1],
          boxShadow: [
            "0 0 15px cyan",
            "0 0 35px cyan",
            "0 0 15px cyan",
          ],
        }}
        transition={{
          repeat: Infinity,
          duration: 2,
        }}
        className="absolute w-20 h-20 rounded-full bg-cyan-400 flex items-center justify-center text-black font-bold"
        style={{
          left: "50%",
          top: "15%",
          transform: "translate(-50%, -50%)",
        }}
      >
        SERVER
      </motion.div>

      {clients.map((client) => (
        <div key={client.id}>
          {/* Line */}
          <svg
            className="absolute inset-0 w-full h-full"
            style={{ pointerEvents: "none" }}
          >
            <line
              x1="50%"
              y1="18%"
              x2={`${client.x}%`}
              y2={`${client.y}%`}
              stroke="#00F5FF"
              strokeWidth="2"
              opacity="0.3"
            />
          </svg>

          {/* Client */}
          <motion.div
            animate={{
              scale: [1, 1.05, 1],
              boxShadow: [
                "0 0 10px #00F5FF",
                "0 0 25px #00F5FF",
                "0 0 10px #00F5FF",
              ],
            }}
            transition={{
              repeat: Infinity,
              duration: 2,
              delay: client.id * 0.3,
            }}
            className="absolute w-16 h-16 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold"
            style={{
              left: `${client.x}%`,
              top: `${client.y}%`,
              transform: "translate(-50%, -50%)",
            }}
          >
            C{client.id}
          </motion.div>

          {/* Data Pulse */}
          <motion.div
            className="absolute w-3 h-3 rounded-full bg-cyan-300"
            initial={{
              left: `${client.x}%`,
              top: `${client.y}%`,
            }}
            animate={{
              left: "50%",
              top: "18%",
            }}
            transition={{
              repeat: Infinity,
              duration: 2,
              delay: client.id * 0.5,
            }}
          />
        </div>
      ))}
    </div>
  );
}
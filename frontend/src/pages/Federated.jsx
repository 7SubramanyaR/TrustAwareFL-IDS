import { useState } from "react";
import { Play, Cpu } from "lucide-react";

import { runSimulation } from "../services/api";

export default function Federated() {

    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");

    const handleSimulation = async () => {

        try {

            setLoading(true);
            setMessage("Running Federated Learning Simulation...");

            const response = await runSimulation();

            setMessage(response.message);

        } catch (error) {

            console.error(error);

            setMessage("Simulation Failed.");

        } finally {

            setLoading(false);

        }

    };

    return (

        <div className="space-y-8">

            <div>

                <h1 className="text-4xl text-cyan-400 font-bold">
                    Federated Learning Console
                </h1>

                <p className="text-gray-400 mt-2">
                    Execute Trust-Aware Federated Learning
                </p>

            </div>

            <div className="bg-white/5 border border-cyan-500/20 rounded-2xl p-10">

                <div className="flex items-center gap-4">

                    <Cpu
                        size={45}
                        className="text-cyan-400"
                    />

                    <div>

                        <h2 className="text-2xl font-semibold">
                            Global Model
                        </h2>

                        <p className="text-gray-400">
                            Ready for Training
                        </p>

                    </div>

                </div>

                <button

                    onClick={handleSimulation}

                    disabled={loading}

                    className="mt-10 flex items-center gap-3 bg-cyan-500 hover:bg-cyan-400 text-black px-8 py-4 rounded-xl font-bold transition-all disabled:opacity-50"

                >

                    <Play size={22} />

                    {

                        loading

                            ? "Running..."

                            : "Run Federated Learning"

                    }

                </button>

                <div className="mt-8">

                    <p className="text-green-400">

                        {message}

                    </p>

                </div>

            </div>

        </div>

    );

}
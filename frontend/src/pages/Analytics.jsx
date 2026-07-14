import { getGraph } from "../services/api";

export default function Analytics() {

    return (

        <div className="space-y-8">

            <div>

                <h1 className="text-4xl font-bold text-cyan-400">
                    Analytics Dashboard
                </h1>

                <p className="text-gray-400 mt-2">
                    Training Performance and Trust Evaluation
                </p>

            </div>

            {/* Accuracy */}

            <div className="bg-white/5 rounded-2xl border border-cyan-500/20 p-6">

                <h2 className="text-2xl font-semibold text-cyan-300 mb-4">
                    Global Accuracy
                </h2>

                <img
                    src={getGraph("accuracy.png")}
                    alt="Accuracy Graph"
                    className="rounded-xl w-full"
                />

            </div>

            {/* Loss + Trust */}

            <div className="grid grid-cols-2 gap-6">

                <div className="bg-white/5 rounded-2xl border border-cyan-500/20 p-6">

                    <h2 className="text-xl font-semibold text-cyan-300 mb-4">
                        Global Loss
                    </h2>

                    <img
                        src={getGraph("loss.png")}
                        alt="Loss Graph"
                        className="rounded-xl w-full"
                    />

                </div>

                <div className="bg-white/5 rounded-2xl border border-cyan-500/20 p-6">

                    <h2 className="text-xl font-semibold text-cyan-300 mb-4">
                        Trust Scores
                    </h2>

                    <img
                        src={getGraph("trust.png")}
                        alt="Trust Graph"
                        className="rounded-xl w-full"
                    />

                </div>

            </div>

        </div>

    );

}
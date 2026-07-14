export default function About() {

    return (

        <div className="space-y-8">

            <h1 className="text-4xl text-cyan-400 font-bold">

                About Project

            </h1>

            <div className="bg-white/5 rounded-2xl border border-cyan-500/20 p-8">

                <h2 className="text-2xl mb-4">

                    Trust-Aware Federated Learning Based Intrusion Detection System

                </h2>

                <p className="text-gray-300 leading-8">

                    This project proposes a Trust-Aware Federated Learning
                    Intrusion Detection System for IoT networks.

                    Instead of sending raw network traffic to a centralized
                    server, each IoT client trains locally using a CNN + BiLSTM
                    model.

                    A Trust Manager evaluates each client after every training
                    round.

                    Clients with higher trust contribute more strongly during
                    global model aggregation, improving robustness against
                    malicious participants.

                </p>

            </div>

            <div className="grid grid-cols-2 gap-6">

                <div className="bg-white/5 rounded-2xl p-6">

                    <h2 className="text-cyan-400 text-xl mb-3">

                        Technologies

                    </h2>

                    <ul className="space-y-2">

                        <li>React + Vite</li>

                        <li>Flask</li>

                        <li>TensorFlow</li>

                        <li>CNN + BiLSTM</li>

                        <li>Federated Learning</li>

                        <li>Tailwind CSS</li>

                    </ul>

                </div>

                <div className="bg-white/5 rounded-2xl p-6">

                    <h2 className="text-cyan-400 text-xl mb-3">

                        Dataset

                    </h2>

                    <p>

                        UNSW-NB15

                    </p>

                    <p className="mt-4">

                        Training occurs locally on client datasets.
                        Only model weights are transmitted to the
                        central aggregation server.

                    </p>

                </div>

            </div>

        </div>

    );

}
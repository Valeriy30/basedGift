import { createRoot } from "react-dom/client";
import { WagmiProvider } from "wagmi";
import App from "./App";
import "./index.css";
import "@coinbase/onchainkit/styles.css";
import { config } from "./lib/wagmi";

createRoot(document.getElementById("root")!).render(<WagmiProvider config={config}>
    <App />
  </WagmiProvider>);

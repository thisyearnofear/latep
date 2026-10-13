import React from "react";
import { AlertTriangle } from "lucide-react";
import { useWallet } from "../hooks/useWallet";
import { stellarNetwork } from "../contracts/util";
import "../styles/ui.css";

// Format network name with first letter capitalized
const formatNetworkName = (name: string) =>
  // TODO: This is a workaround until @creit-tech/stellar-wallets-kit uses the new name for a local network.
  name === "STANDALONE"
    ? "Local"
    : name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();

const appNetwork = formatNetworkName(stellarNetwork);

const NetworkPill: React.FC = () => {
  const { network, address } = useWallet();

  // Check if there's a network mismatch
  const walletNetwork = formatNetworkName(network ?? "");
  const isNetworkMismatch = walletNetwork !== appNetwork;

  let title = "";
  if (!address) {
    title = "Connect your wallet using this network.";
  } else if (isNetworkMismatch) {
    title = `Wallet is on ${walletNetwork}, connect to ${appNetwork} instead.`;
  }

  // The mismatch carries an icon and a tooltip, not just a colour: an outcome
  // never reads from colour alone (design.md §3).
  return (
    <div
      className={`ui-network-pill${isNetworkMismatch ? " ui-network-pill--mismatch" : ""}`}
      title={title}
    >
      {isNetworkMismatch && <AlertTriangle size={14} aria-hidden />}
      {appNetwork}
    </div>
  );
};

export default NetworkPill;

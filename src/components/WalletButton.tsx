import { useState } from "react";
import { Button, Text, Modal, Profile } from "@stellar/design-system";
import { useWallet } from "../hooks/useWallet";
import { useWalletBalance } from "../hooks/useWalletBalance";

const WALLET_NAMES: Record<string, string> = {
  freighter: "Freighter",
  xbull: "xBull",
  albedo: "Albedo",
  rabet: "Rabet",
  lobstr: "Lobstr",
  hana: "Hana",
  hotwallet: "Hot Wallet",
  klever: "Klever",
};

export const WalletButton = () => {
  const [showDisconnectModal, setShowDisconnectModal] = useState(false);
  const { address, walletId, isPending, connect, disconnect } = useWallet();
  const { xlm, ...balance } = useWalletBalance();
  const buttonLabel = isPending ? "Loading..." : "Connect";

  if (!address) {
    return (
      <Button variant="primary" size="md" onClick={() => void connect?.()}>
        {buttonLabel}
      </Button>
    );
  }

  return (
    <div
      className={
        balance.isLoading
          ? "wallet-status wallet-status--loading"
          : "wallet-status"
      }
    >
      <Text as="div" size="sm">
        {walletId ? `${WALLET_NAMES[walletId] ?? walletId} · ` : ""}Wallet
        Balance: {xlm} XLM
      </Text>

      <div id="modalContainer">
        <Modal
          visible={showDisconnectModal}
          onClose={() => setShowDisconnectModal(false)}
          parentId="modalContainer"
        >
          <Modal.Heading>
            Connected as <code className="wallet-address">{address}</code>. Do
            you want to disconnect?
          </Modal.Heading>
          <Modal.Footer itemAlignment="stack">
            <Button
              size="md"
              variant="primary"
              onClick={() => {
                disconnect?.();
                setShowDisconnectModal(false);
              }}
            >
              Disconnect
            </Button>
            <Button
              size="md"
              variant="tertiary"
              onClick={() => {
                setShowDisconnectModal(false);
              }}
            >
              Cancel
            </Button>
          </Modal.Footer>
        </Modal>
      </div>

      <Profile
        publicAddress={address}
        size="md"
        isShort
        onClick={() => setShowDisconnectModal(true)}
      />
    </div>
  );
};

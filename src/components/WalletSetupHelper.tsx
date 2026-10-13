/**
 * WalletSetupHelper — guided wallet setup for new users.
 *
 * Shows a 3-step checklist:
 *   1. Install Freighter (if not detected)
 *   2. Connect wallet
 *   3. Fund with testnet XLM (friendbot)
 *
 * Each step is a numbered row on the counter; done steps are ruled
 * through. The whole helper disappears once the wallet is connected
 * and funded.
 */
import React, { useState, useCallback } from "react";
import { useWallet } from "../hooks/useWallet";
import { useWalletBalance } from "../hooks/useWalletBalance";
import { useNotification } from "../hooks/useNotification";
import { getFriendbotUrl } from "../util/friendbot";
import "../styles/tournament.css";
import "../styles/zk.css";

type StepStatus = "done" | "active" | "todo";

interface StepProps {
  status: StepStatus;
  num: string;
  title: string;
  body: string;
  cta?: { label: string; onClick: () => void; disabled?: boolean };
}

const Step: React.FC<StepProps> = ({ status, num, title, body, cta }) => {
  if (status === "done") {
    return (
      <div className="zk-checkrow zk-checkrow--done">
        <span className="zk-checkrow__num">done</span>
        <div className="zk-checkrow__body">
          <p className="zk-checkrow__title">{title}</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={
        status === "active" ? "zk-checkrow zk-checkrow--active" : "zk-checkrow"
      }
    >
      <span className="zk-checkrow__num">{num}</span>
      <div className="zk-checkrow__body">
        <p className="zk-checkrow__title">{title}</p>
        <p className="zk-checkrow__text">{body}</p>
      </div>
      {cta && (
        <button
          type="button"
          onClick={cta.onClick}
          disabled={cta.disabled}
          className="till-button till-button--primary"
        >
          {cta.label}
        </button>
      )}
    </div>
  );
};

export const WalletSetupHelper: React.FC = () => {
  const { address } = useWallet();
  const {
    isFunded,
    isLoading: balanceLoading,
    updateBalance,
  } = useWalletBalance();
  const { addNotification } = useNotification();
  const [isFunding, setIsFunding] = useState(false);

  // Detect if Freighter extension is installed
  const [freighterDetected, setFreighterDetected] = useState<boolean | null>(
    null,
  );

  React.useEffect(() => {
    // Freighter injects window.freighterNetwork or window.freighter
    const checkFreighter = () => {
      const w = window as unknown as Record<string, unknown>;
      setFreighterDetected(
        typeof w.freighterNetwork !== "undefined" ||
          typeof w.freighter !== "undefined" ||
          typeof w.albedo !== "undefined",
      );
    };
    checkFreighter();
    // Re-check after a delay (extensions may load after page)
    const timer = setTimeout(checkFreighter, 2000);
    return () => clearTimeout(timer);
  }, []);

  const handleFund = useCallback(async () => {
    if (!address) return;
    setIsFunding(true);
    try {
      const response = await fetch(getFriendbotUrl(address));
      if (response.ok) {
        addNotification("Account funded with testnet XLM!", "success");
        await updateBalance();
      } else {
        addNotification("Funding failed — you may already be funded.", "error");
      }
    } catch {
      addNotification("Network error — try again.", "error");
    } finally {
      setIsFunding(false);
    }
  }, [address, addNotification, updateBalance]);

  // Don't render if everything is done
  if (address && isFunded) return null;

  const step1Status: StepStatus = address ? "done" : "active";
  const step2Status: StepStatus = !address
    ? "todo"
    : isFunded
      ? "done"
      : "active";

  return (
    <div className="zk-panel zk-setup">
      <h3 className="zk-setup__title">Wallet setup</h3>
      <p className="zk-setup__lede">
        Three steps to play for real — takes about a minute.
      </p>

      <div>
        {/* Step 1: Install a wallet */}
        {step1Status !== "done" && (
          <Step
            status={step1Status}
            num="1"
            title="Install a Stellar wallet (Freighter recommended)"
            body={
              freighterDetected === false
                ? "Freighter is a free Stellar wallet browser extension and works best here. Other wallets in the connect modal are experimental on testnet."
                : "Wallet detected — press Connect in the bar above to link it."
            }
            cta={
              freighterDetected === false
                ? {
                    label: "Get Freighter",
                    onClick: () =>
                      void window.open(
                        "https://www.freighter.app/",
                        "_blank",
                        "noopener",
                      ),
                  }
                : undefined
            }
          />
        )}

        {/* Step 2: Connect wallet */}
        {step1Status === "done" && step2Status !== "done" && (
          <Step
            status={step2Status}
            num="2"
            title="Connect your wallet"
            body="Link your Freighter wallet to Latep so you can sign transactions."
          />
        )}

        {/* Step 3: Fund with testnet XLM */}
        {address && !isFunded && (
          <Step
            status="active"
            num="3"
            title="Get testnet XLM"
            body="Fund your wallet with free testnet XLM — no real money needed. One click via Stellar Friendbot."
            cta={{
              label: isFunding ? "Funding…" : "Get free XLM",
              onClick: () => void handleFund(),
              disabled: isFunding || balanceLoading,
            }}
          />
        )}

        {/* All done */}
        {address && isFunded && (
          <p className="zk-setup__lede">
            Wallet ready — you're all set to play.
          </p>
        )}
      </div>
    </div>
  );
};

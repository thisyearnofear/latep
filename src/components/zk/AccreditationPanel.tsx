import React, { useState, useEffect, useCallback } from "react";
import { useWallet } from "../../hooks/useWallet";
import { useZKDilemma } from "../../hooks/useZKDilemma";
import {
  generateAccreditationProof,
  getAllCredentials,
} from "../../services/accreditationProofService";
import { getMerkleRootBytes, MERKLE_ROOT_HEX } from "../../util/merkleTree";
import { MARKS } from "../marks";
import "../../styles/zk.css";

/**
 * Accreditation Panel -- demonstrates the private allowlist membership ZK proof.
 *
 * Two modes:
 * 1. Admin: Initialize accreditation on the contract (set VK + Merkle root)
 * 2. Player: Generate a ZK proof of allowlist membership and verify on-chain
 *
 * The ZK proof proves "I hold a credential in the Merkle tree" without
 * revealing which credential is mine. The contract verifies the proof
 * on-chain and records a nullifier to prevent replay.
 *
 * This is the Pass primitive: "verified: on the list · which entry: hidden".
 */

const PassMark = MARKS.pass;

export const AccreditationPanel: React.FC = () => {
  const { address } = useWallet();
  const {
    checkAccreditationInitialized,
    getAccreditedRoot,
    initializeAccreditation,
    verifyAccreditation,
    isLoading,
    error,
  } = useZKDilemma();

  const [accreditationReady, setAccreditationReady] = useState(false);
  const [onChainRoot, setOnChainRoot] = useState<string | null>(null);
  const [selectedCredential, setSelectedCredential] = useState(0);
  const [proofStatus, setProofStatus] = useState<string>("");
  const [verified, setVerified] = useState(false);
  const [generating, setGenerating] = useState(false);

  const credentials = getAllCredentials();

  const checkStatus = useCallback(async () => {
    const ready = await checkAccreditationInitialized();
    setAccreditationReady(ready);
    if (ready) {
      const root = await getAccreditedRoot();
      setOnChainRoot(root);
    }
  }, [checkAccreditationInitialized, getAccreditedRoot]);

  useEffect(() => {
    void checkStatus();
  }, [checkStatus]);

  const handleInitialize = async () => {
    if (!address) return;
    setProofStatus("Initializing accreditation on-chain...");
    try {
      // Load the accreditation VK from the public directory
      const vkResponse = await fetch("/circuits/allowlist_membership_vk.bin");
      if (!vkResponse.ok) throw new Error("Failed to load accreditation VK");
      const vkBytes = new Uint8Array(await vkResponse.arrayBuffer());

      const rootBytes = getMerkleRootBytes();
      await initializeAccreditation(address, vkBytes, rootBytes);
      setProofStatus(
        "Accreditation initialized! Players can now prove membership.",
      );
      await checkStatus();
    } catch (err) {
      setProofStatus(
        `Error: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  };

  const handleVerify = async () => {
    if (!address) return;
    const credential = credentials[selectedCredential];
    if (!credential) return;

    setGenerating(true);
    setProofStatus(
      "Generating ZK proof in browser (lazy-loading Noir + bb.js)...",
    );
    setVerified(false);

    try {
      const { proof, merkleRoot, nullifier } = await generateAccreditationProof(
        {
          credentialId: credential.credentialId,
          merklePath: credential.merklePath,
          pathIndices: credential.pathIndices,
          gameId: 0,
        },
      );

      setProofStatus(
        "Proof generated! Verifying on-chain via UltraHonk verifier...",
      );

      await verifyAccreditation(proof, merkleRoot, nullifier, 0);

      setProofStatus(
        "Accreditation verified on-chain! You are a verified accredited participant.",
      );
      setVerified(true);
    } catch (err) {
      setProofStatus(
        `Error: ${err instanceof Error ? err.message : String(err)}`,
      );
    } finally {
      setGenerating(false);
    }
  };

  const statusClass = proofStatus.startsWith("Error")
    ? "zk-status-msg zk-status-msg--bad"
    : verified
      ? "zk-status-msg zk-status-msg--ok"
      : "zk-status-msg";

  return (
    <div className="zk-panel">
      <div className="zk-head">
        <h3 className="zk-pass__title">Private accreditation</h3>
        <PassMark size={28} />
      </div>
      <p className="zk-lede">
        Prove you&apos;re on the accredited allowlist{" "}
        <strong>without revealing which credential is yours</strong>. A Poseidon
        Merkle tree plus an UltraHonk proof, verified on-chain — the nullifier
        prevents replay without linking to your identity.
      </p>

      {/* Status display — chips carry words, never colour alone */}
      <div className="zk-pass__statuses">
        <span
          className={
            accreditationReady ? "zk-chip zk-chip--ok" : "zk-chip zk-chip--bad"
          }
        >
          {accreditationReady
            ? "Accreditation active"
            : "Accreditation not initialized"}
        </span>
        {onChainRoot && (
          <span className="zk-chip zk-chip--mono">
            Root: {onChainRoot.slice(0, 12)}…{onChainRoot.slice(-8)}
          </span>
        )}
        {verified && (
          <span className="zk-chip zk-chip--ok">
            Verified — on the list, which entry hidden
          </span>
        )}
      </div>

      {/* Admin section */}
      {!accreditationReady && (
        <div className="zk-pass__section">
          <h4 className="zk-pass__subtitle">Admin: initialize accreditation</h4>
          <p className="zk-status-line">
            Deploy the accreditation VK and Merkle root on-chain. This is a
            one-time setup that sets you as the admin who can later update the
            root.
          </p>
          <div className="zk-panel__actions">
            <button
              type="button"
              onClick={() => void handleInitialize()}
              disabled={!address || isLoading}
              className="till-button till-button--primary"
            >
              {isLoading ? "Initialising…" : "Initialise accreditation"}
            </button>
          </div>
        </div>
      )}

      {/* Player section */}
      {accreditationReady && (
        <div className="zk-pass__section">
          <h4 className="zk-pass__subtitle">Player: prove accreditation</h4>
          <p className="zk-status-line">
            Select your credential and generate a ZK proof. The proof shows your
            credential is in the Merkle tree without revealing which one. The
            contract verifies it on-chain.
          </p>

          <div className="zk-pass__field">
            <label htmlFor="zk-credential">Your credential:</label>
            <select
              id="zk-credential"
              value={selectedCredential}
              onChange={(e) => setSelectedCredential(Number(e.target.value))}
              disabled={generating || isLoading}
              className="zk-select"
            >
              {credentials.map((cred, i) => (
                <option key={cred.credentialId} value={i}>
                  Credential #{cred.credentialId} (leaf {i})
                </option>
              ))}
            </select>
          </div>

          {/*
            A disabled control with no stated reason is a dead end. The Everyday
            page sends people here on the strength of "this is the
            accreditation panel, running on-chain", so say plainly what stops
            them.
          */}
          {!address && (
            <p className="zk-gated-note">
              Connect a Stellar wallet to generate the proof. You can read how
              it works without one.
            </p>
          )}
          <div className="zk-panel__actions">
            <button
              type="button"
              onClick={() => void handleVerify()}
              disabled={!address || generating || isLoading || verified}
              className="till-button till-button--primary"
            >
              {generating
                ? "Generating proof…"
                : verified
                  ? "Verified"
                  : "Prove accreditation"}
            </button>
          </div>
        </div>
      )}

      {/* Status / error messages */}
      {proofStatus && (
        <p className={statusClass} role="status">
          {proofStatus}
        </p>
      )}

      {error && (
        <p className="zk-status-msg zk-status-msg--bad" role="alert">
          {error}
        </p>
      )}

      {/* Technical details */}
      <details className="zk-pass__details">
        <summary>Technical details</summary>
        <div className="zk-pass__tech">
          <p>
            <strong>Circuit:</strong>{" "}
            <code>circuits/allowlist_membership/</code> — Noir circuit proving
            Poseidon Merkle tree membership with nullifier.
          </p>
          <p>
            <strong>Tree:</strong> Depth-4 Poseidon Merkle tree (16 leaves) over
            credential IDs 1, 2, 3. Empty leaves = <code>hash_1(0)</code>.
          </p>
          <p>
            <strong>Hash:</strong> Poseidon (BN254) from{" "}
            <code>noir-lang/poseidon</code>. Stellar Protocol 25
            &quot;X-Ray&quot; added native Poseidon host functions.
          </p>
          <p>
            <strong>Proof:</strong> UltraHonk (14,592 bytes), verified on-chain
            via <code>ultrahonk_soroban_verifier</code>.
          </p>
          <p>
            <strong>Privacy:</strong> The contract learns only the Merkle root
            (public) and the nullifier (prevents replay). It cannot determine
            which credential the player holds.
          </p>
          <p>
            <strong>Merkle root:</strong> <code>{MERKLE_ROOT_HEX}</code>
          </p>
        </div>
      </details>
    </div>
  );
};

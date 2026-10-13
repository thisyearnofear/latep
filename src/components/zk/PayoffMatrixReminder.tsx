import React from "react";
import { MOVE_LABEL } from "../../content/vocabulary";
import "../../styles/zk.css";

/**
 * Compact payoff-matrix reminder printed above the commit CTA.
 *
 * Lives inside the commit receipt, so it is a dashed-rule section on the same
 * stock — never its own panel. The moves are named, not coloured (design.md
 * §7: nothing is carried by colour alone).
 */
export const PayoffMatrixReminder: React.FC = () => (
  <div className="zk-matrix">
    <p className="zk-matrix__title">Payoff matrix</p>
    <div className="zk-matrix__grid">
      <div />
      <div className="zk-matrix__head">They {MOVE_LABEL.C.toLowerCase()}</div>
      <div className="zk-matrix__head">They {MOVE_LABEL.D.toLowerCase()}</div>
      <div className="zk-matrix__side">You {MOVE_LABEL.C.toLowerCase()}</div>
      <div>+2 / +2</div>
      <div>0 / +3</div>
      <div className="zk-matrix__side">You {MOVE_LABEL.D.toLowerCase()}</div>
      <div>+3 / 0</div>
      <div>0 / 0</div>
    </div>
  </div>
);

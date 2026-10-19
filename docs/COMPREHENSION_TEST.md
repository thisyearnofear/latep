# Redesign comprehension test

**Status:** protocol ready; **not run yet.** This needs five humans. It cannot
be replaced by a screenshot pass, an automated check, or the author reading
their own copy.

`REDESIGN_PLAN.md` §1 makes this a merge condition:

> A first-time visitor can say, in their own words, what one of the four
> primitives is for after a single practice round. (Test with 5 people before
> and after.)

This file is the “after” protocol and the place to record the results. The
“before” baseline was the old UI; if it was not recorded, say so in the notes
rather than inventing one.

## Participants

- Five people who have not seen Latep before.
- At least two should not work in crypto or fintech; the point is the everyday
  story, not the ZK story.
- Do not recruit anyone who worked on the redesign.
- Consent to notes; no audio or video recording without a separate yes.

## Setup

- Fresh browser profile or incognito window; no wallet, no extensions that
  change the page.
- Start at `/` on a laptop if possible, and run at least one session on a phone
  at 375px.
- The moderator does not explain the game, the vocabulary, or what a receipt
  is. The page has to do that.

## Script (about 10 minutes)

1. **Play.** “Open this page and play one round. Think aloud if you like.”
   - Do not help for the first 60 seconds. If the participant is stuck, note
     where, then answer only the blocking question.
2. **Name the primitive.** After the round receipt appears:
   - “In your own words, what did **the Seal** do?”
   - If the participant met the Handshake instead, ask about that one.
   - Follow-up: “What would have happened without it?”
3. **Transfer.** “Where would you meet this in real life?”
4. **Pitch.** “What would you tell a friend this app is for?”
5. **Honesty check.** “When you sealed your move, what did you think was
   happening? Did you think it was on-chain?”
   - The practice round is local. A participant who believes a proof or
     transaction happened is a failure of the receipt, even if they liked it.
6. **One improvement.** “What was the most confusing thing on the page?”

## Scoring

Score each answer 0–2, and keep the verbatim quote. The quote matters more
than the number.

| Score | Meaning                                                                         |
| ----- | ------------------------------------------------------------------------------- |
| 0     | Cannot say, or describes something the page did not do.                         |
| 1     | Vague or partial (“it hides your move” without the before-you-see-theirs idea). |
| 2     | Clear, in their own words, matching the primitive's one-line purpose.           |

Pass bar:

- **≥ 4 of 5** score 2 on at least one primitive's purpose.
- **≥ 3 of 5** can give a real-life example that is not the app itself.
- **0 of 5** say “it's just a game” or believe the practice round was on-chain.
- **No one** needs the moderator to explain the core loop before finishing.

If the bar fails, do not merge on the grounds that the screenshots look good.
Fix the screen where the confusion happened and run five new participants.
Record the failing quotes; they are the design brief.

## Results

| #   | Date | Device / width | Primitive named | Purpose (0–2) | Real-life (0–2) | Pitch (0–2) | On-chain belief? | Verbatim note |
| --- | ---- | -------------- | --------------- | ------------- | --------------- | ----------- | ---------------- | ------------- |
| P1  | —    | —              | —               | —             | —               | —           | —                | **Not run**   |
| P2  | —    | —              | —               | —             | —               | —           | —                | **Not run**   |
| P3  | —    | —              | —               | —             | —               | —           | —                | **Not run**   |
| P4  | —    | —              | —               | —             | —               | —           | —                | **Not run**   |
| P5  | —    | —              | —               | —             | —               | —           | —                | **Not run**   |

**Result:** not recorded. The redesign is not merge-ready under §1 until this
table is filled and the pass bar is met.

## What this does not cover

- Accessibility (keyboard, screen reader, contrast) — that is A8.
- Visual polish or brand preference.
- Whether the game is fun; that is a separate playtest.
- Whether the ZK claim is true; that is the contract and proof tests.

The test is deliberately narrow: can a stranger explain one primitive after
one round, and do they know the practice round was not on-chain?

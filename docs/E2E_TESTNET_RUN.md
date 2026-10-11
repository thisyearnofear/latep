Latep two-wallet ZK end-to-end — Stellar TESTNET
Contract: CCYHIUOAUWFCWA5RV34UPT4SEXJFNE3SITGFR5HM2BL2K2RFOSGECE4P
Stake: 1 XLM

[1/6] Funding two fresh accounts via friendbot…
A: GCGY27DVF654T6ONWJWT2NUTJT6UIRCY6NMRZKNKQ6TCIJUNXVZKCNJ2
B: GA7ZIN6SFS3QX6GWGP2SYEUC7OZZ6C6QNCLI7PKZDOSGBRIEZLI4Y4TL

[1b/6] Checking contract house reserve (payouts exceed escrow)
topping up house reserve: +4 XLM → contract
✓ reserve topped up → e01167f99341854541e6d618935900e213a74cf4229000a3b1a1344430eede17

[2/6] Player A: generating real UltraHonk proof (keccak flavor) for game #3…
proof = 14592 bytes (expect 14592)
✓ create_game → 11d80082d091eb36416d546bcf1f07e130c6b88b64c6f0e9b3117e92b548cf03

[3/6] Player B: generating proof + joining game #3…
✓ join_game → 859d6aef03315e841cda5b358d0d6869f99a74014c4b9c28ae834041ba21b7d1

[4/6] Reveals (A=C, B=D — the temptation case: B should win)
✓ reveal_move → 8af649735228d618b77ec10abf3076937dba09d443bc1b2f93d867a4828b0eb6
✓ reveal_move → dd02cad7c92552d3484cbd3b019a1bc687c086f8430de90dc715d25315375db9

[5/6] Resolving escrow
predicted payouts (stroops): ["0","30000000"]
✓ resolve_game → d93e687cc34b42795d3bc2bb91bcdfffb03e2e4fed8361d38b695f9fe115398e

[6/6] Final on-chain game state:
{
"commit_deadline": "1791756452",
"commitment1": {
"type": "Buffer",
"data": [
67,
128,
237,
123,
213,
85,
222,
239,
201,
211,
232,
217,
118,
3,
232,
69,
55,
186,
196,
212,
66,
23,
152,
76,
207,
139,
128,
96,
51,
33,
195,
63
]
},
"commitment2": {
"type": "Buffer",
"data": [
109,
189,
90,
219,
36,
28,
61,
114,
209,
111,
180,
9,
118,
96,
247,
51,
99,
237,
230,
244,
161,
206,
106,
168,
53,
38,
75,
74,
122,
113,
189,
129
]
},
"created_at": "1791756152",
"match_id": null,
"move1": "C",
"move2": "D",
"nonce1": "4889032476950494216",
"nonce2": "8902589650935999733",
"player1": "GCGY27DVF654T6ONWJWT2NUTJT6UIRCY6NMRZKNKQ6TCIJUNXVZKCNJ2",
"player2": "GA7ZIN6SFS3QX6GWGP2SYEUC7OZZ6C6QNCLI7PKZDOSGBRIEZLI4Y4TL",
"reveal_deadline": "1791756462",
"round_number": 0,
"stake": "10000000",
"status": [
"Resolved"
]
}

RESULT: PASS — two independent wallets, real browser-flavor proofs,
verified ON-CHAIN on testnet. Game #3.
A: https://stellar.expert/explorer/testnet/account/GCGY27DVF654T6ONWJWT2NUTJT6UIRCY6NMRZKNKQ6TCIJUNXVZKCNJ2
B: https://stellar.expert/explorer/testnet/account/GA7ZIN6SFS3QX6GWGP2SYEUC7OZZ6C6QNCLI7PKZDOSGBRIEZLI4Y4TL
Game tx from create: https://stellar.expert/explorer/testnet/tx/11d80082d091eb36416d546bcf1f07e130c6b88b64c6f0e9b3117e92b548cf03

/**
 * 6-Operator FM Synthesis Algorithms
 * Defines how operators (1-6) modulate each other and which operators connect to the output.
 * Each algorithm specifies:
 * - name: descriptive title
 * - carriers: array of operator indices (1-6) that connect to voice output
 * - modulations: array of [modulatorIndex, targetIndex] pairs
 * - feedbackOp: which operator has self-feedback
 */
export const FM_ALGORITHMS = {
  1: {
    id: 1,
    name: "Linear Stack (1 Carrier)",
    description: "OP6 -> OP5 -> OP4 -> OP3 -> OP2 -> OP1 -> Out",
    carriers: [1],
    modulations: [
      [6, 5],
      [5, 4],
      [4, 3],
      [3, 2],
      [2, 1]
    ],
    feedbackOp: 6
  },
  2: {
    id: 2,
    name: "Dual Stack (2 Carriers)",
    description: "OP6->OP5->OP4 (Carrier 4), OP3->OP2->OP1 (Carrier 1)",
    carriers: [1, 4],
    modulations: [
      [6, 5],
      [5, 4],
      [3, 2],
      [2, 1]
    ],
    feedbackOp: 6
  },
  3: {
    id: 3,
    name: "Branched Modulators (2 Carriers)",
    description: "OP6->OP5, OP4->OP3, (5 & 3)->OP2->OP1",
    carriers: [1, 2],
    modulations: [
      [6, 5],
      [4, 3],
      [5, 2],
      [3, 2],
      [2, 1]
    ],
    feedbackOp: 6
  },
  4: {
    id: 4,
    name: "Triple Modulator (1 Carrier)",
    description: "OP6, OP5, OP4 all modulate OP3 -> OP2 -> OP1",
    carriers: [1],
    modulations: [
      [6, 3],
      [5, 3],
      [4, 3],
      [3, 2],
      [2, 1]
    ],
    feedbackOp: 6
  },
  5: {
    id: 5,
    name: "Three Dual Pairs (3 Carriers)",
    description: "OP6->OP5, OP4->OP3, OP2->OP1 (Carriers 1, 3, 5)",
    carriers: [1, 3, 5],
    modulations: [
      [6, 5],
      [4, 3],
      [2, 1]
    ],
    feedbackOp: 6
  },
  6: {
    id: 6,
    name: "4 Carriers / 2 Modulators",
    description: "OP6->OP5, OP4->OP3, OP2 & OP1 direct (Carriers 1, 2, 3, 5)",
    carriers: [1, 2, 3, 5],
    modulations: [
      [6, 5],
      [4, 3]
    ],
    feedbackOp: 6
  },
  7: {
    id: 7,
    name: "5 Carriers / 1 Modulator",
    description: "OP6->OP5, OP1..OP4 direct (Carriers 1, 2, 3, 4, 5)",
    carriers: [1, 2, 3, 4, 5],
    modulations: [
      [6, 5]
    ],
    feedbackOp: 6
  },
  8: {
    id: 8,
    name: "Parallel Additive (6 Carriers)",
    description: "All operators OP1-OP6 direct to output",
    carriers: [1, 2, 3, 4, 5, 6],
    modulations: [],
    feedbackOp: 6
  }
};

## Packages
framer-motion | Essential for the high-quality gift opening animations and page transitions
canvas-confetti | For the celebration effect when a gift is claimed
@types/canvas-confetti | Types for confetti
lucide-react | Beautiful icons
clsx | Utility for constructing className strings conditionally
tailwind-merge | Utility for merging Tailwind CSS classes

## Notes
Tailwind Config - extend fontFamily:
fontFamily: {
  display: ["var(--font-display)"],
  body: ["var(--font-body)"],
  handwriting: ["var(--font-handwriting)"],
}

Simulation:
Since we don't have a real blockchain provider configured, we will simulate the wallet connection and transaction delays using `setTimeout` and local state/storage where appropriate for the demo experience.

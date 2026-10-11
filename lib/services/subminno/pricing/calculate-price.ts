export type PricingResult = {
  aiCheck: number;
  completeCheck: number;
};
export const PRICING_VERSION =
  "2026-10-v1";

export function calculatePrice(
  wordCount: number
): PricingResult {
  if (wordCount <= 500) {
    return {
      aiCheck: 10,
      completeCheck: 19,
    };
  }

  if (wordCount <= 1000) {
    return {
      aiCheck: 15,
      completeCheck: 29,
    };
  }

  if (wordCount <= 2000) {
    return {
      aiCheck: 20,
      completeCheck: 39,
    };
  }

  if (wordCount <= 3000) {
    return {
      aiCheck: 29,
      completeCheck: 49,
    };
  }

  if (wordCount <= 5000) {
    return {
      aiCheck: 39,
      completeCheck: 79,
    };
  }

  if (wordCount <= 7500) {
    return {
      aiCheck: 59,
      completeCheck: 109,
    };
  }

  if (wordCount <= 10000) {
    return {
      aiCheck: 79,
      completeCheck: 149,
    };
  }

  return {
    aiCheck: 99,
    completeCheck: 179,
  };
}
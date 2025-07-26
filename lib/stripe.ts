import { loadStripe } from '@stripe/stripe-js'

export const getStripe = () => {
  return loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)
}

// Stripe price IDs - Your LIVE price IDs from Stripe Dashboard
export const STRIPE_PRICE_IDS = {
  PRO_MONTHLY: 'price_1RnliGRu7MX5WFq8P21bcoMF',
  PRO_YEARLY: 'price_1RnljPRu7MX5WFq89irP59pn',
  PRO_AI_MONTHLY: 'price_1RnlicRu7MX5WFq8FQhDpZOz',
  PRO_AI_YEARLY: 'price_1Rnm01Ru7MX5WFq8T2NoPyi8',
}

export const getPriceId = (planName: string, isAnnual: boolean) => {
  switch (planName.toLowerCase()) {
    case 'pro':
      return isAnnual ? STRIPE_PRICE_IDS.PRO_YEARLY : STRIPE_PRICE_IDS.PRO_MONTHLY
    case 'pro + ai':
      return isAnnual ? STRIPE_PRICE_IDS.PRO_AI_YEARLY : STRIPE_PRICE_IDS.PRO_AI_MONTHLY
    default:
      throw new Error(`Unknown plan: ${planName}`)
  }
} 
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-06-30.basil',
})

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!
const backendApiKey = process.env.BACKEND_API_KEY

if (!endpointSecret) {
  console.error('STRIPE_WEBHOOK_SECRET is not configured')
}

if (!backendApiKey) {
  console.warn('BACKEND_API_KEY is not configured, using fallback')
}

export async function POST(request: NextRequest) {
  const body = await request.text()
  const sig = request.headers.get('stripe-signature')!

  if (!sig) {
    console.error('No Stripe signature found in request')
    return NextResponse.json({ error: 'No signature found' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, sig, endpointSecret)
  } catch (err) {
    console.error(`Webhook signature verification failed.`, err)
    return NextResponse.json({ error: 'Webhook signature verification failed' }, { status: 400 })
  }

  console.log(`Received Stripe webhook: ${event.type}`)

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session)
        break
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription)
        break
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription)
        break
      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.Invoice)
        break
      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.Invoice)
        break
      default:
        console.log(`Unhandled event type ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error(`Error processing webhook:`, error)
    // Don't return 500 for webhook processing errors as Stripe will retry
    // Instead, log the error and return 200 to acknowledge receipt
    return NextResponse.json({ received: true, error: 'Webhook processing failed but acknowledged' })
  }
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  console.log('Processing checkout session completed:', session.id)
  
  const userId = session.metadata?.userId
  if (!userId) {
    console.error('No userId in session metadata')
    return
  }

  // Convert display format to internal format for consistency
  const displayPlanName = session.metadata?.planName || 'pro'
  const internalPlanName = convertDisplayToInternalFormat(displayPlanName)

  // Update user subscription in backend
  await updateUserSubscription(userId, {
    stripeCustomerId: session.customer as string,
    subscriptionId: session.subscription as string,
    planName: internalPlanName,
    status: 'active',
  })
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  console.log('Processing subscription updated:', subscription.id)
  
  const userId = subscription.metadata?.userId
  if (!userId) {
    console.error('No userId in subscription metadata')
    return
  }

  const planName = getPlanNameFromPriceId(subscription.items.data[0]?.price?.id)
  
  await updateUserSubscription(userId, {
    stripeCustomerId: subscription.customer as string,
    subscriptionId: subscription.id,
    planName,
    status: subscription.status,
    endsAt: (subscription as any).current_period_end,
  })
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  console.log('Processing subscription deleted:', subscription.id)
  
  const userId = subscription.metadata?.userId
  if (!userId) {
    console.error('No userId in subscription metadata')
    return
  }

  await updateUserSubscription(userId, {
    stripeCustomerId: subscription.customer as string,
    subscriptionId: subscription.id,
    planName: 'free',
    status: 'canceled',
    endsAt: (subscription as any).current_period_end,
  })
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  console.log('Processing payment succeeded:', invoice.id)
  // Payment successful - subscription is active
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  console.log('Processing payment failed:', invoice.id)
  // Handle failed payment - might want to update subscription status
}

function getPlanNameFromPriceId(priceId?: string): string {
  // Map price IDs to plan names - using the actual price IDs from stripe.ts
  const priceMapping: Record<string, string> = {
    'price_1RnliGRu7MX5WFq8P21bcoMF': 'pro',      // Pro Monthly
    'price_1RnljPRu7MX5WFq89irP59pn': 'pro',      // Pro Yearly
    'price_1RnlicRu7MX5WFq8FQhDpZOz': 'pro_ai',   // Pro + AI Monthly
    'price_1Rnm01Ru7MX5WFq8T2NoPyi8': 'pro_ai',   // Pro + AI Yearly
  }
  
  return priceMapping[priceId || ''] || 'pro'
}

function convertDisplayToInternalFormat(displayName: string): string {
  // Convert display format to internal format for database consistency
  switch (displayName.toLowerCase()) {
    case 'pro + ai':
    case 'pro+ai':
      return 'pro_ai'
    case 'pro':
      return 'pro'
    case 'free':
      return 'free'
    default:
      console.warn(`Unknown plan name: ${displayName}, defaulting to 'free'`)
      return 'free'
  }
}

async function updateUserSubscription(userId: string, data: {
  stripeCustomerId: string
  subscriptionId: string
  planName: string
  status: string
  endsAt?: number
}) {
  try {
    console.log(`Webhook: Updating subscription for user ${userId}:`, {
      plan: data.planName,
      status: data.status,
      stripeCustomerId: data.stripeCustomerId,
      stripeSubscriptionId: data.subscriptionId,
      endsAt: data.endsAt ? new Date(data.endsAt * 1000).toISOString() : null,
    })

    // Call backend API to update user subscription with retry logic
    let response
    let retries = 3
    let lastError

    while (retries > 0) {
      try {
        response = await fetch(`${process.env.BACKEND_URL || 'http://localhost:8080'}/api/user/subscription`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${backendApiKey || 'webhook'}`,
          },
          body: JSON.stringify({
            userId,
            plan: data.planName,
            stripeCustomerId: data.stripeCustomerId,
            stripeSubscriptionId: data.subscriptionId,
            status: data.status,
            endsAt: data.endsAt ? new Date(data.endsAt * 1000).toISOString() : null,
          }),
        })

        if (response.ok) {
          const result = await response.json()
          console.log(`Successfully processed subscription update for user ${userId}:`, result)
          return
        } else {
          const errorText = await response.text()
          lastError = `Backend API error: ${response.status} - ${errorText}`
          console.error(lastError)
          
          if (response.status === 404) {
            // User not found, don't retry
            throw new Error(lastError)
          }
        }
      } catch (error) {
        lastError = error instanceof Error ? error.message : 'Unknown error'
        console.error(`Attempt ${4 - retries}/3 failed:`, lastError)
      }
      
      retries--
      if (retries > 0) {
        console.log(`Retrying in 2 seconds... (${retries} attempts remaining)`)
        await new Promise(resolve => setTimeout(resolve, 2000))
      }
    }

    // All retries failed
    throw new Error(`Failed to update user subscription after 3 attempts: ${lastError}`)
  } catch (error) {
    console.error(`Failed to update user subscription:`, error)
    throw error
  }
} 
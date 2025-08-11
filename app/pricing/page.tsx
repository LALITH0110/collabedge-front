"use client"

import type React from "react"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Check, Sparkles, Crown, Users, Star, Loader2, Menu } from "lucide-react"
import { UserDropdown } from "@/components/user-dropdown"
import { AnimatedBackground } from "@/components/animated-background"
import { AppSidebar } from "@/components/app-sidebar"
import { useAuth } from "@/contexts/AuthContext"
import { getStripe, getPriceId } from "@/lib/stripe"
import { toast } from "sonner"

type PricingTier = {
  name: string
  price: string
  description: string
  features: string[]
  icon: React.ElementType
  popular?: boolean
  gradient: string
  buttonText: string
  buttonVariant: "default" | "outline" | "secondary"
}

const pricingTiers: PricingTier[] = [
  {
    name: "Free",
    price: "$0",
    description: "Perfect for getting started with collaborative editing",
    features: [
      "Up to 4 rooms maximum",
      "Basic text editor",
      "Code editor",
      "Real-time collaboration",
      "Community support",
    ],
    icon: Users,
    gradient: "from-gray-500 to-gray-600",
    buttonText: "Get Started Free",
    buttonVariant: "outline",
  },
  {
    name: "Pro",
    price: "$5",
    description: "For daily users who need advanced features",
    features: [
      "All Free features",
      "Unlimited rooms",
      "Freeform text editor",
      "Access to latest editors and features",
      "Batch & Animation Perks",
      "Priority management and support",
    ],
    icon: Crown,
    popular: true,
    gradient: "from-blue-500 to-purple-600",
    buttonText: "Start Using Pro",
    buttonVariant: "default",
  },
  {
    name: "Pro + AI",
    price: "$10",
    description: "Everything in Pro plus powerful AI assistance",
    features: [
      "All Pro features",
      "AI-powered document summarization",
      "Smart code completion & generation",
      "Automated form creation",
      "AI writing assistant",
      "Content suggestions",
      "Priority management and support",
    ],
    icon: Sparkles,
    gradient: "from-purple-500 to-pink-600",
    buttonText: "Unlock AI Power",
    buttonVariant: "default",
  },
]

function PricingPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { isAuthenticated, user, refreshUserData } = useAuth()
  const [isAnnual, setIsAnnual] = useState(false)
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null)
  const [showSidebar, setShowSidebar] = useState(false)

  // Handle Stripe success/cancel redirects and refresh user data
  useEffect(() => {
    const success = searchParams.get('success')
    const canceled = searchParams.get('canceled')
    
    if (success) {
      toast.success('Payment successful! Welcome to your new plan!')
      // Refresh user data to get updated subscription info
      if (isAuthenticated) {
        // Wait a moment for webhook to process, then refresh user data
        setTimeout(async () => {
          try {
            await refreshUserData()
            toast.success('Your subscription has been activated!')
          } catch (error) {
            console.error('Failed to refresh user data:', error)
            // Fallback to page reload
            window.location.reload()
          }
        }, 3000) // Increased delay to ensure webhook processes
      }
      if (isAuthenticated) {
        // Refresh user data after successful payment
        setTimeout(() => {
          window.location.reload()
        }, 1000)
      }
      // Clear URL parameters
      router.replace('/pricing')
    }
    
    if (canceled) {
      toast.error('Payment was canceled. You can try again anytime.')
      // Clear URL parameters
      router.replace('/pricing')
    }
  }, [searchParams, router, isAuthenticated])

  const handlePlanSelection = async (planName: string) => {
    // Check if user is authenticated for paid plans
    if (!isAuthenticated && (planName === 'Pro' || planName === 'Pro + AI')) {
      toast.error('Please log in first to access premium features')
      return
    }

    if (planName === 'Free') {
      // Handle free plan - just redirect to dashboard
      if (isAuthenticated) {
        router.push('/')
      } else {
        toast.error('Please sign up for a free account first')
      }
      return
    }

    // Check if user already has this plan
    const userPlan = user?.subscriptionPlan
    const userStatus = user?.subscriptionStatus

    if (userPlan === 'pro' && planName === 'Pro') {
      // User already has Pro plan - redirect to manage subscription
      router.push('/account?section=billing')
      return
    }

    if (userPlan === 'pro_ai' && planName === 'Pro + AI') {
      // User already has Pro+AI plan - redirect to manage subscription
      router.push('/account?section=billing')
      return
    }

    // Check if user has a higher plan and trying to downgrade
    if (userPlan === 'pro_ai' && planName === 'Pro') {
      toast.info('You already have Pro+AI. To downgrade to Pro, please manage your subscription.')
      router.push('/account?section=billing')
      return
    }

    // Check if user has an active or incomplete paid subscription
    const hasActivePaidSubscription = userPlan && (userStatus === 'active' || userStatus === 'incomplete') && (userPlan === 'pro' || userPlan === 'pro_ai')
    
    // If user has an active paid subscription, redirect to manage subscription
    if (hasActivePaidSubscription) {
      toast.info('You already have an active subscription. Please manage it from your account.')
      router.push('/account?section=billing')
      return
    }

    setLoadingPlan(planName)

    try {
      const priceId = getPriceId(planName, isAnnual)
      
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId,
          userId: user?.id,
          email: user?.email,
          planName,
        }),
      })

      const { sessionId, url, error } = await response.json()

      if (error) {
        throw new Error(error)
      }

      if (url) {
        // Redirect to Stripe Checkout
        window.location.href = url
      }
    } catch (error) {
      console.error('Error creating checkout session:', error)
      toast.error('Failed to start checkout process. Please try again.')
    } finally {
      setLoadingPlan(null)
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <AppSidebar defaultOpen={showSidebar} />
      <AnimatedBackground />

      {/* Header */}
      <header className="relative z-50 border-b border-white/10 backdrop-blur-sm bg-black/20">
        <div className="w-full px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setShowSidebar(true)}
              className="w-8 h-8 p-0"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <span 
              className="text-2xl font-bold cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => router.push('/')}
            >
              CollabEdge
            </span>
          </div>
          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-4 absolute left-1/2 transform -translate-x-1/2">
              <Button variant="ghost" size="sm" onClick={() => router.push('/about')}>
                About
              </Button>
              <Button variant="ghost" size="sm" onClick={() => router.push('/features')}>
                Features
              </Button>
              <Button variant="ghost" size="sm" onClick={() => router.push('/pricing')}>
                Pricing
              </Button>
            </div>
            {isAuthenticated ? (
              <UserDropdown onToggleSidebar={() => setShowSidebar(true)} />
            ) : (
              <div className="flex items-center gap-3">
                <Button variant="outline" size="sm" onClick={() => router.push('/')}>
                  Log In
                </Button>
                <Button size="sm" onClick={() => router.push('/')}>Sign Up</Button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 relative overflow-auto">
        <div className="relative z-10 container mx-auto px-4 py-16">
          {/* Pricing Header */}
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-600">
              Choose Your Plan
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
              Start for free, upgrade when you need more power. All plans include real-time collaboration and core
              editing features.
            </p>

            {/* Billing Toggle */}
            <div className="flex items-center justify-center gap-4 mb-8">
              <span className={`text-sm ${!isAnnual ? "text-foreground" : "text-muted-foreground"}`}>Monthly</span>
              <button
                onClick={() => setIsAnnual(!isAnnual)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  isAnnual ? "bg-blue-600" : "bg-gray-400"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full transition-transform ${
                    isAnnual ? "translate-x-6 bg-white" : "translate-x-1 bg-white"
                  }`}
                />
              </button>
              <span className={`text-sm ${isAnnual ? "text-foreground" : "text-muted-foreground"}`}>
                Annual
                <Badge variant="secondary" className="ml-2">
                  Save 20%
                </Badge>
              </span>
            </div>
          </div>

          {/* Pricing Cards */}
          <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {pricingTiers.map((tier, index) => (
              <Card
                key={tier.name}
                className={`relative overflow-hidden backdrop-blur-sm bg-background/80 border-background/20 transition-all duration-300 hover:scale-105 flex flex-col ${
                  tier.popular ? "ring-2 ring-primary shadow-2xl" : "hover:shadow-xl"
                }`}
              >
                {tier.popular && (
                  <div className="absolute top-0 left-0 right-0">
                    <div
                      className={`bg-gradient-to-r ${tier.gradient} text-white text-center py-2 text-sm font-medium`}
                    >
                      <Star className="inline h-4 w-4 mr-1" />
                      Most Popular
                    </div>
                  </div>
                )}
                {/* Active Plan badge removed per user request */}

                <CardHeader className={tier.popular ? "pt-12" : "pt-6"}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`p-3 rounded-lg bg-gradient-to-r ${tier.gradient}`}>
                      <tier.icon className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl">{tier.name}</CardTitle>
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-bold">
                          {tier.price === "$0" ? "Free" : 
                           isAnnual && tier.price === "$5" ? "$42" :
                           isAnnual && tier.price === "$10" ? "$84" :
                           tier.price}
                        </span>
                        {tier.price !== "$0" && (
                          <span className="text-muted-foreground">/{isAnnual ? "year" : "month"}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <CardDescription className="text-base">{tier.description}</CardDescription>
                </CardHeader>

                <CardContent className="flex-1 space-y-4">
                  <ul className="space-y-3">
                    {tier.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start gap-3">
                        <Check className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  {/* Add spacing for Free plan to align buttons */}
                  {tier.name === "Free" && (
                    <div className="space-y-3 mt-3">
                      <div className="h-6"></div>
                      <div className="h-6"></div>
                    </div>
                  )}
                </CardContent>

                <CardFooter className="pt-6 mt-auto">
                  {(() => {
                    const userPlan = user?.subscriptionPlan
                    const userStatus = user?.subscriptionStatus
                    const isCurrentPlan = 
                      (userPlan === 'pro' && tier.name === 'Pro') ||
                      (userPlan === 'pro_ai' && tier.name === 'Pro + AI')
                    const isUpgrade = 
                      (userPlan === 'pro' && tier.name === 'Pro + AI')
                    const isDowngrade = 
                      (userPlan === 'pro_ai' && tier.name === 'Pro')
                    
                    let buttonText = tier.buttonText
                    let buttonVariant = tier.buttonVariant
                    let isDisabled = false
                    let onClick = () => handlePlanSelection(tier.name)

                    // Check if user has an active or incomplete paid subscription first
                    const hasActivePaidSubscription = userPlan && (userStatus === 'active' || userStatus === 'incomplete') && (userPlan === 'pro' || userPlan === 'pro_ai')
                    
                    if (hasActivePaidSubscription) {
                      // If user has active paid subscription, show "Manage Subscription" for ALL plans
                      buttonText = 'Manage Subscription'
                      buttonVariant = 'outline'
                      onClick = async () => { router.push('/account?section=billing') }
                    } else if (isCurrentPlan && (userStatus === 'active' || userStatus === 'incomplete')) {
                      buttonText = 'Manage Subscription'
                      buttonVariant = 'outline'
                      onClick = async () => { router.push('/account?section=billing') }
                    } else if (isCurrentPlan && userStatus !== 'active' && userStatus !== 'incomplete') {
                      buttonText = 'Manage Subscription'
                      buttonVariant = 'outline'
                      onClick = async () => { router.push('/account?section=billing') }
                    } else if (isUpgrade) {
                      buttonText = 'Upgrade to Pro + AI'
                      buttonVariant = 'default'
                    } else if (isDowngrade) {
                      buttonText = 'Manage Subscription'
                      buttonVariant = 'outline'
                      onClick = async () => { router.push('/account?section=billing') }
                    }

                    return (
                      <Button
                        className={`w-full ${
                          tier.popular && !isDisabled
                            ? `bg-gradient-to-r ${tier.gradient} hover:opacity-90 text-white border-0`
                            : tier.name === "Pro + AI" && !isDisabled
                              ? `bg-gradient-to-r ${tier.gradient} hover:opacity-90 text-white border-0`
                              : ""
                        }`}
                        variant={buttonVariant}
                        size="lg"
                        onClick={onClick}
                        disabled={loadingPlan === tier.name || isDisabled}
                      >
                        {loadingPlan === tier.name ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          buttonText
                        )}
                      </Button>
                    )
                  })()}
                </CardFooter>
              </Card>
            ))}
          </div>

          {/* Feature Comparison */}
          <div className="mt-20">
            <h2 className="text-3xl font-bold text-center mb-12">Feature Comparison</h2>
            <div className="overflow-x-auto">
              <table className="w-full max-w-4xl mx-auto backdrop-blur-sm bg-background/80 rounded-lg border">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-4 font-medium">Features</th>
                    <th className="text-center p-4 font-medium">Free</th>
                    <th className="text-center p-4 font-medium">Pro</th>
                    <th className="text-center p-4 font-medium">Pro + AI</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {[
                    { feature: "Maximum Rooms", free: "4", pro: "Unlimited", ai: "Unlimited" },
                    { feature: "Basic Editors", free: "✓", pro: "✓", ai: "✓" },
                    { feature: "Freeform Text Editor", free: "✗", pro: "✓", ai: "✓" },
                    { feature: "Latest Editors", free: "✗", pro: "✓", ai: "✓" },
                    { feature: "Priority Management", free: "✗", pro: "✓", ai: "✓" },
                    { feature: "AI Summarization", free: "✗", pro: "✗", ai: "✓" },
                    { feature: "AI Code Generation", free: "✗", pro: "✗", ai: "✓" },
                    { feature: "Smart Forms", free: "✗", pro: "✗", ai: "✓" },
                    { feature: "Support Level", free: "Low", pro: "Priority", ai: "Priority" },
                  ].map((row, index) => (
                    <tr key={index} className="border-b last:border-b-0">
                      <td className="p-4 font-medium">{row.feature}</td>
                      <td className="text-center p-4">{row.free}</td>
                      <td className="text-center p-4">{row.pro}</td>
                      <td className="text-center p-4">{row.ai}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* FAQ Section */}
          <div className="mt-20">
            <h2 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>
            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {[
                {
                  question: "Can I upgrade or downgrade my plan anytime?",
                  answer:
                    "Yes! You can upgrade or downgrade your plan at any time. Changes effect depending on the plan you are upgrading or downgrading to.",
                },
                {
                  question: "What happens to my rooms if I downgrade from Pro to Free?",
                  answer:
                    "Your existing rooms will remain accessible, but you won't be able to create new rooms beyond the 4-room limit until you upgrade again.",
                },
                {
                  question: "How does the AI assistance work in Pro + AI?",
                  answer:
                    "Our AI features integrate directly into your editors, providing smart suggestions, code completion, document summarization, and automated content generation.",
                },
                {
                  question: "Is there a free trial for paid plans?",
                  answer:
                    "No! Pro and Pro + AI plans do not come with a free trial, But we are working on a free trial soon.",
                },
              ].map((faq, index) => (
                <Card key={index} className="backdrop-blur-sm bg-background/80 border-background/20">
                  <CardHeader>
                    <CardTitle className="text-lg">{faq.question}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{faq.answer}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* CTA Section */}
          <div className="mt-20 text-center">
            <div className="backdrop-blur-sm bg-background/80 border-background/20 rounded-2xl p-12 max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold mb-4">Ready to get started?</h2>
              <p className="text-xl text-muted-foreground mb-8">
                Join thousands of teams already collaborating with CollabEdge
              </p>
              <div className="flex flex-wrap gap-4 justify-center">
                {(() => {
                  const userPlan = user?.subscriptionPlan
                  const userStatus = user?.subscriptionStatus
                  const hasActivePaidSubscription = userPlan && (userStatus === 'active' || userStatus === 'incomplete') && (userPlan === 'pro' || userPlan === 'pro_ai')
                  
                  if (hasActivePaidSubscription) {
                    return (
                      <>
                        <Button 
                          size="lg" 
                          className="bg-gradient-to-r from-blue-500 to-purple-600 hover:opacity-90"
                          onClick={() => router.push('/account?section=billing')}
                        >
                          Manage Subscription
                        </Button>
                        <Button 
                          variant="outline" 
                          size="lg"
                          onClick={() => {
                            window.open('mailto:no-reply@lalithkothuru.com')
                          }}
                        >
                          Contact Sales
                        </Button>
                      </>
                    )
                  } else {
                    return (
                      <>
                        <Button 
                          size="lg" 
                          className="bg-gradient-to-r from-blue-500 to-purple-600 hover:opacity-90"
                          onClick={() => {
                            const pricingSection = document.querySelector('.grid.md\\:grid-cols-3')
                            if (pricingSection) {
                              pricingSection.scrollIntoView({ behavior: 'smooth' })
                            }
                          }}
                        >
                          Start Your Journey
                        </Button>
                        <Button 
                          variant="outline" 
                          size="lg"
                          onClick={() => {
                            window.open('mailto:no-reply@lalithkothuru.com')
                          }}
                        >
                          Contact Sales
                        </Button>
                      </>
                    )
                  }
                })()}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default function PricingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Loading...</h1>
          <p className="text-muted-foreground">Please wait while we prepare the pricing information.</p>
        </div>
      </div>
    }>
      <PricingPageContent />
    </Suspense>
  )
} 
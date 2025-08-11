"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AnimatedBackground } from "@/components/animated-background"
import { AppSidebar } from "@/components/app-sidebar"
import { UserDropdown } from "@/components/user-dropdown"
import { useAuth } from "@/contexts/AuthContext"
import {
  Users,
  Target,
  Heart,
  Globe,
  Zap,
  Shield,
  Sparkles,
  Lightbulb,
  ArrowRight,
  MapPin,
  Mail,
  Phone,
  Linkedin,
  Twitter,
  Github,
  Menu,
  ExternalLink,
  Globe as World,
} from "lucide-react"
import { motion } from "framer-motion"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

const stats = [
  { number: "25+", label: "Types of Documents", icon: Target },
  { number: "50+", label: "Features Implemented", icon: Sparkles },
  { number: "99.999%", label: "Uptime", icon: Zap },
  { number: "150+", label: "Countries", icon: Globe },
]

const values = [
  {
    icon: Heart,
    title: "User-Centric Design",
    description: "Every feature is designed with our users in mind, prioritizing simplicity and effectiveness.",
  },
  {
    icon: Shield,
    title: "Privacy First",
    description: "We believe your data belongs to you. We never sell or misuse your information.",
  },
  {
    icon: Zap,
    title: "Innovation",
    description: "We're constantly pushing the boundaries of what's possible in collaborative technology.",
  },
  {
    icon: Globe,
    title: "Accessibility",
    description: "Building tools that work for everyone, regardless of ability or location.",
  },
]

const timeline = [
  {
    year: "2023",
    title: "The Beginning",
    description: "CollabEdge was founded with a vision to revolutionize real-time collaboration.",
  },
  {
    year: "2024",
    title: "First Million Users",
    description: "Reached our first million users and launched AI-powered features.",
  },
  {
    year: "2024",
    title: "Enterprise Launch",
    description: "Launched enterprise features with advanced security and compliance.",
  },
  {
    year: "2025",
    title: "Global Expansion",
    description: "Expanding to serve teams in over 150 countries worldwide.",
  },
]

const team = [
  {
    name: "Lalith Kothuru",
    role: "Founder & Full Stack Developer",
    bio: "Built CollabEdge from the ground up, handling everything from frontend to backend, database design, and deployment.",
    avatar: "/placeholder.svg",
    social: { 
      linkedin: "https://www.linkedin.com/in/lalithkothuru", 
      github: "https://github.com/LALITH0110",
      website: "https://www.lalithkothuru.com/"
    },
  },
]

const investors = [
  { name: "Sequoia Capital", logo: "/placeholder.svg" },
  { name: "Andreessen Horowitz", logo: "/placeholder.svg" },
  { name: "Index Ventures", logo: "/placeholder.svg" },
  { name: "GV (Google Ventures)", logo: "/placeholder.svg" },
]

export default function AboutPage() {
  const router = useRouter()
  const { isAuthenticated } = useAuth()
  const [showSidebar, setShowSidebar] = useState(false)

  return (
    <div className="min-h-screen flex flex-col">
      <AppSidebar defaultOpen={showSidebar} onOpenChange={setShowSidebar} />
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
          {/* Hero Section */}
          <div className="text-center mb-16">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <Badge variant="secondary" className="mb-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10">
                <Sparkles className="h-3 w-3 mr-1" />
                About CollabEdge
              </Badge>
              <h1 className="text-4xl md:text-6xl font-bold mb-6">
                Building the future of{" "}
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-600">
                  collaboration
                </span>
              </h1>
              <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
                We're on a mission to empower teams worldwide with tools that make collaboration seamless, productive,
                and enjoyable. From startups to enterprises, we're helping teams work better together.
              </p>
            </motion.div>
          </div>

          {/* Stats Section */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-20">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <Card className="text-center backdrop-blur-sm bg-background/80 border-background/20">
                  <CardContent className="pt-6">
                    <stat.icon className="h-8 w-8 mx-auto mb-4 text-primary" />
                    <div className="text-3xl font-bold mb-2">{stat.number}</div>
                    <div className="text-sm text-muted-foreground">{stat.label}</div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Mission Section */}
          <div className="mb-20">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Our Mission</h2>
              <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                We believe that great ideas emerge when people can collaborate without barriers. Our mission is to
                eliminate the friction in teamwork and unlock human potential through seamless collaboration.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <Card className="backdrop-blur-sm bg-background/80 border-background/20">
                <CardHeader>
                  <Target className="h-8 w-8 text-primary mb-4" />
                  <CardTitle>What We Do</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    We build powerful, intuitive collaboration tools that work the way teams think. From real-time
                    editing to AI-powered assistance, we're creating the workspace of the future.
                  </p>
                </CardContent>
              </Card>

              <Card className="backdrop-blur-sm bg-background/80 border-background/20">
                <CardHeader>
                  <Lightbulb className="h-8 w-8 text-primary mb-4" />
                  <CardTitle>Why We Do It</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    We've experienced the frustration of clunky collaboration tools. We're building CollabEdge to be the
                    platform we wish we had - fast, reliable, and delightful to use.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Values Section */}
          <div className="mb-20">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Our Values</h2>
              <p className="text-lg text-muted-foreground">The principles that guide everything we do at CollabEdge</p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {values.map((value, index) => (
                <motion.div
                  key={value.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                >
                  <Card className="h-full backdrop-blur-sm bg-background/80 border-background/20 text-center">
                    <CardHeader>
                      <value.icon className="h-8 w-8 mx-auto mb-4 text-primary" />
                      <CardTitle className="text-lg">{value.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">{value.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Timeline Section - Commented out for now */}
          {/* <div className="mb-20">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Our Journey</h2>
              <p className="text-lg text-muted-foreground">Key milestones in our mission to transform collaboration</p>
            </div>

            <div className="relative">
              <div className="absolute left-1/2 transform -translate-x-px h-full w-0.5 bg-border"></div>

              <div className="space-y-12">
                {timeline.map((item, index) => (
                  <motion.div
                    key={item.year}
                    initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.2 }}
                    className={`flex items-center ${index % 2 === 0 ? "flex-row" : "flex-row-reverse"}`}
                  >
                    <div className="flex-1">
                      <Card
                        className={`backdrop-blur-sm bg-background/80 border-background/20 ${
                          index % 2 === 0 ? "mr-8" : "ml-8"
                        }`}
                      >
                        <CardHeader>
                          <Badge variant="secondary" className="w-fit">
                            {item.year}
                          </Badge>
                          <CardTitle>{item.title}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-muted-foreground">{item.description}</p>
                        </CardContent>
                      </Card>
                    </div>
                    <div className="w-4 h-4 bg-primary rounded-full border-4 border-background z-10"></div>
                    <div className="flex-1"></div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div> */}

          {/* Team Section */}
          <div className="mb-20">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Meet Our Team</h2>
              <p className="text-lg text-muted-foreground">
                The passionate people building the future of collaboration
              </p>
            </div>

            <div className="flex justify-center">
              <div className="max-w-md">
                {team.map((member, index) => (
                  <motion.div
                    key={member.name}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                  >
                  <Card className="backdrop-blur-sm bg-background/80 border-background/20 text-center">
                    <CardHeader>
                      <Avatar className="h-20 w-20 mx-auto mb-4">
                        <AvatarImage src={member.avatar || "/placeholder.svg"} alt={member.name} />
                        <AvatarFallback>
                          {member.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <CardTitle className="text-lg">{member.name}</CardTitle>
                      <CardDescription>{member.role}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4">{member.bio}</p>
                      <div className="flex justify-center gap-2">
                        {member.social.linkedin && (
                          <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                            <a href={member.social.linkedin} target="_blank" rel="noopener noreferrer">
                              <Linkedin className="h-4 w-4" />
                            </a>
                          </Button>
                        )}
                        {member.social.github && (
                          <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                            <a href={member.social.github} target="_blank" rel="noopener noreferrer">
                              <Github className="h-4 w-4" />
                            </a>
                          </Button>
                        )}
                        {member.social.website && (
                          <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                            <a href={member.social.website} target="_blank" rel="noopener noreferrer">
                              <World className="h-4 w-4" />
                            </a>
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
              </div>
            </div>
          </div>

          {/* Contact Section - Commented out for now */}
          {/* <div className="mb-20">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Get in Touch</h2>
              <p className="text-lg text-muted-foreground">We'd love to hear from you</p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <Card className="backdrop-blur-sm bg-background/80 border-background/20 text-center">
                <CardHeader>
                  <MapPin className="h-8 w-8 mx-auto mb-4 text-primary" />
                  <CardTitle>Visit Us</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    123 Innovation Drive
                    <br />
                    San Francisco, CA 94105
                  </p>
                </CardContent>
              </Card>

              <Card className="backdrop-blur-sm bg-background/80 border-background/20 text-center">
                <CardHeader>
                  <Mail className="h-8 w-8 mx-auto mb-4 text-primary" />
                  <CardTitle>Email Us</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    hello@collabedge.com
                    <br />
                    support@collabedge.com
                  </p>
                </CardContent>
              </Card>

              <Card className="backdrop-blur-sm bg-background/80 border-background/20 text-center">
                <CardHeader>
                  <Phone className="h-8 w-8 mx-auto mb-4 text-primary" />
                  <CardTitle>Call Us</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    +1 (555) 123-4567
                    <br />
                    Mon-Fri 9AM-6PM PST
                  </p>
                </CardContent>
              </Card>
            </div>
          </div> */}

          {/* CTA Section - Commented out for now */}
          {/* <div className="text-center">
            <Card className="backdrop-blur-sm bg-background/80 border-background/20 p-12 max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold mb-4">Join Our Mission</h2>
              <p className="text-xl text-muted-foreground mb-8">
                Be part of the team that's revolutionizing how the world collaborates
              </p>
              <div className="flex flex-wrap gap-4 justify-center">
                <Button size="lg" className="bg-gradient-to-r from-blue-500 to-purple-600 hover:opacity-90">
                  View Open Positions
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button variant="outline" size="lg">
                  Partner with Us
                </Button>
              </div>
            </Card>
          </div> */}
        </div>
      </main>
    </div>
  )
} 
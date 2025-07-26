"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AnimatedBackground } from "@/components/animated-background"
import { AppSidebar } from "@/components/app-sidebar"
import { UserDropdown } from "@/components/user-dropdown"
import { useAuth } from "@/contexts/AuthContext"
import {
  Code,
  FileText,
  Presentation,
  Table,
  PenTool,
  LayoutGrid,
  Users,
  Shield,
  Globe,
  Bot,
  History,
  Share2,
  Lock,
  Smartphone,
  Monitor,
  Tablet,
  WifiOff,
  Eye,
  MessageSquare,
  GitBranch,
  Palette,
  Search,
  Bell,
  Settings,
  Cloud,
  Database,
  Sparkles,
  ArrowRight,
  Check,
  Play,
  Menu,
} from "lucide-react"
import { motion } from "framer-motion"

const editorFeatures = [
  {
    id: "code",
    name: "Code Editor",
    icon: Code,
    description: "Professional code editing with syntax highlighting",
    features: [
      "Syntax highlighting for 100+ languages",
      "IntelliSense and auto-completion",
      "Real-time collaborative editing",
      "Git integration and version control",
      "Custom themes and extensions",
      "Live code execution and debugging",
    ],
    gradient: "from-blue-500 to-cyan-500",
  },
  {
    id: "word",
    name: "Word Processor",
    icon: FileText,
    description: "Rich text editing with advanced formatting",
    features: [
      "Rich text formatting and styling",
      "Tables, images, and media support",
      "Comment and suggestion system",
      "Document templates and themes",
      "Export to multiple formats",
      "Track changes and revision history",
    ],
    gradient: "from-green-500 to-emerald-500",
  },
  {
    id: "presentation",
    name: "Presentations",
    icon: Presentation,
    description: "Create stunning presentations collaboratively",
    features: [
      "Slide templates and themes",
      "Animations and transitions",
      "Media embedding and charts",
      "Presenter mode and notes",
      "Real-time slide collaboration",
      "Export to PowerPoint and PDF",
    ],
    gradient: "from-purple-500 to-violet-500",
  },
  {
    id: "spreadsheet",
    name: "Spreadsheets",
    icon: Table,
    description: "Powerful spreadsheet with formulas and charts",
    features: [
      "Advanced formulas and functions",
      "Charts and data visualization",
      "Pivot tables and data analysis",
      "Conditional formatting",
      "Import/export Excel files",
      "Real-time data collaboration",
    ],
    gradient: "from-orange-500 to-red-500",
  },
  {
    id: "freeform",
    name: "Freeform Canvas",
    icon: PenTool,
    description: "Unlimited creative canvas for ideas",
    features: [
      "Drawing and sketching tools",
      "Shapes and text annotations",
      "Infinite canvas space",
      "Layer management",
      "Collaborative brainstorming",
      "Export as images or PDF",
    ],
    gradient: "from-pink-500 to-rose-500",
  },
  {
    id: "custom",
    name: "Custom Editors",
    icon: LayoutGrid,
    description: "Build your own specialized editors",
    features: [
      "Plugin architecture",
      "Custom UI components",
      "API integrations",
      "Workflow automation",
      "Third-party extensions",
      "Enterprise customization",
    ],
    gradient: "from-indigo-500 to-purple-500",
  },
]

const collaborationFeatures = [
  {
    icon: Users,
    title: "Real-time Collaboration",
    description: "Work together seamlessly with live cursors, selections, and instant updates.",
  },
  {
    icon: MessageSquare,
    title: "Comments & Discussions",
    description: "Add comments, suggestions, and have threaded discussions within documents.",
  },
  {
    icon: History,
    title: "Version History",
    description: "Track all changes with detailed revision history and restore previous versions.",
  },
  {
    icon: Share2,
    title: "Smart Sharing",
    description: "Share with granular permissions - view, comment, or edit access levels.",
  },
  {
    icon: Bell,
    title: "Live Notifications",
    description: "Get notified of changes, comments, and mentions in real-time.",
  },
  {
    icon: Eye,
    title: "Presence Awareness",
    description: "See who's online, what they're working on, and where their cursor is.",
  },
]

const aiFeatures = [
  {
    icon: Bot,
    title: "AI Writing Assistant",
    description: "Get help with writing, editing, and improving your content with AI suggestions.",
  },
  {
    icon: Code,
    title: "Smart Code Completion",
    description: "AI-powered code suggestions and auto-completion for faster development.",
  },
  {
    icon: Sparkles,
    title: "Content Generation",
    description: "Generate text, code, and presentations from simple prompts and descriptions.",
  },
  {
    icon: Search,
    title: "Intelligent Search",
    description: "Find content across all your documents with AI-powered semantic search.",
  },
  {
    icon: Palette,
    title: "Design Suggestions",
    description: "Get AI recommendations for layouts, colors, and design improvements.",
  },
  {
    icon: GitBranch,
    title: "Smart Workflows",
    description: "Automate repetitive tasks and create intelligent document workflows.",
  },
]

const securityFeatures = [
  {
    icon: Shield,
    title: "End-to-End Encryption",
    description: "All data is encrypted in transit and at rest with enterprise-grade security. Your documents and conversations remain private and secure at all times.",
  },
  {
    icon: Lock,
    title: "Access Controls",
    description: "Granular permissions and role-based access control for teams and organizations. Manage who can view, edit, or share your collaborative workspaces.",
  },
  {
    icon: Database,
    title: "Data Sovereignty",
    description: "Choose where your data is stored with regional data centers worldwide. Maintain compliance with local data protection regulations and requirements.",
  },

  {
    icon: Cloud,
    title: "Secure Cloud",
    description: "Built on secure cloud infrastructure with 99.999% uptime. Benefit from enterprise-grade reliability and continuous monitoring.",
  },
]

export default function FeaturesPage() {
  const router = useRouter()
  const { isAuthenticated } = useAuth()
  const [showSidebar, setShowSidebar] = useState(false)
  const [activeEditor, setActiveEditor] = useState("code")

  return (
    <div className="min-h-screen flex flex-col">
      <AppSidebar defaultOpen={showSidebar} />
      <AnimatedBackground />

      {/* Header */}
      <header className="relative z-10 border-b border-white/10 backdrop-blur-sm bg-black/20">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setShowSidebar(true)}
              className="md:hidden w-8 h-8 p-0"
            >
              <Menu className="h-4 w-4" />
            </Button>
            <div className="w-6 md:w-0"></div>
            <span 
              className="text-2xl font-bold cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => router.push('/')}
            >
              CollabEdge
            </span>
          </div>
          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-4 absolute left-1/2 transform -translate-x-1/2">
              <Button variant="ghost" size="sm" onClick={() => router.push('/')}>
                Home
              </Button>
              <Button variant="ghost" size="sm" onClick={() => router.push('/pricing')}>
                Pricing
              </Button>
              <Button variant="ghost" size="sm" onClick={() => router.push('/about')}>
                About
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
                Powerful Features
              </Badge>
              <h1 className="text-4xl md:text-6xl font-bold mb-6">
                Everything you need for{" "}
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-600">
                  collaboration
                </span>
              </h1>
              <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
                From code editing to document creation, presentations to spreadsheets - CollabEdge provides all the
                tools your team needs to work together effectively.
              </p>
            </motion.div>
          </div>

          {/* Feature Categories */}
          <Tabs defaultValue="editors" className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-12">
              <TabsTrigger value="editors">Editors</TabsTrigger>
              <TabsTrigger value="collaboration">Collaboration</TabsTrigger>
              <TabsTrigger value="ai">AI Features</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
            </TabsList>

            {/* Editors Tab */}
            <TabsContent value="editors" className="space-y-12">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold mb-4">Professional Editors</h2>
                <p className="text-lg text-muted-foreground">
                  Choose from our suite of specialized editors, each designed for specific workflows
                </p>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {editorFeatures.map((editor, index) => (
                  <motion.div
                    key={editor.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                  >
                    <Card className="h-full backdrop-blur-sm bg-background/80 border-background/20 hover:scale-105 transition-all duration-300">
                      <CardHeader>
                        <div className={`inline-flex p-3 rounded-lg bg-gradient-to-r ${editor.gradient} w-fit mb-4`}>
                          <editor.icon className="h-6 w-6 text-white" />
                        </div>
                        <CardTitle className="text-xl">{editor.name}</CardTitle>
                        <CardDescription className="text-base">{editor.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {editor.features.map((feature, featureIndex) => (
                            <li key={featureIndex} className="flex items-start gap-2">
                              <Check className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                              <span className="text-sm">{feature}</span>
                            </li>
                          ))}
                        </ul>
                        <Button 
                          className="w-full mt-4 bg-transparent" 
                          variant="outline"
                          onClick={() => router.push('/create')}
                        >
                          Try {editor.name}
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </TabsContent>

            {/* Collaboration Tab */}
            <TabsContent value="collaboration" className="space-y-12">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold mb-4">Real-time Collaboration</h2>
                <p className="text-lg text-muted-foreground">
                  Work together seamlessly with advanced collaboration features
                </p>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {collaborationFeatures.map((feature, index) => (
                  <motion.div
                    key={feature.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                  >
                    <Card className="h-full backdrop-blur-sm bg-background/80 border-background/20">
                      <CardHeader>
                        <feature.icon className="h-8 w-8 text-primary mb-4" />
                        <CardTitle>{feature.title}</CardTitle>
                        <CardDescription className="text-base">{feature.description}</CardDescription>
                      </CardHeader>
                    </Card>
                  </motion.div>
                ))}
              </div>

              {/* Cross-platform Support */}
              <div className="mt-16">
                <h3 className="text-2xl font-bold text-center mb-8">Works Everywhere</h3>
                <div className="flex justify-center items-center gap-8 flex-wrap">
                  {[
                    { icon: Monitor, label: "Desktop" },
                    { icon: Tablet, label: "Tablet" },
                    { icon: Smartphone, label: "Mobile" },
                    { icon: Globe, label: "Web Browser" },
                  ].map((platform, index) => (
                    <motion.div
                      key={platform.label}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.6, delay: index * 0.1 }}
                      className="flex flex-col items-center gap-2"
                    >
                      <div className="p-4 rounded-full bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20">
                        <platform.icon className="h-8 w-8" />
                      </div>
                      <span className="text-sm font-medium">{platform.label}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* AI Features Tab */}
            <TabsContent value="ai" className="space-y-12">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold mb-4">AI-Powered Productivity</h2>
                <p className="text-lg text-muted-foreground">
                  Enhance your workflow with intelligent AI assistance and automation
                </p>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {aiFeatures.map((feature, index) => (
                  <motion.div
                    key={feature.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                  >
                    <Card className="h-full backdrop-blur-sm bg-background/80 border-background/20">
                      <CardHeader>
                        <div className="p-3 rounded-lg bg-gradient-to-r from-purple-500/10 to-pink-500/10 w-fit mb-4">
                          <feature.icon className="h-6 w-6 text-purple-500" />
                        </div>
                        <CardTitle>{feature.title}</CardTitle>
                        <CardDescription className="text-base">{feature.description}</CardDescription>
                      </CardHeader>
                    </Card>
                  </motion.div>
                ))}
              </div>

              {/* AI Demo Section */}
              <div className="mt-16">
                <Card className="backdrop-blur-sm bg-background/80 border-background/20 p-8">
                  <div className="text-center">
                    <h3 className="text-2xl font-bold mb-4">See AI in Action</h3>
                    <p className="text-muted-foreground mb-6">
                      Watch how AI can help you write better content, generate code, and boost productivity
                    </p>
                    <Button size="lg" className="bg-gradient-to-r from-purple-500 to-pink-600" disabled>
                      <Play className="mr-2 h-4 w-4" />
                      Coming Soon
                    </Button>
                  </div>
                </Card>
              </div>
            </TabsContent>

            {/* Security Tab */}
            <TabsContent value="security" className="space-y-12">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold mb-4">Enterprise-Grade Security</h2>
                <p className="text-lg text-muted-foreground">
                  Your data is protected with the highest security standards
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {securityFeatures.map((feature, index) => (
                  <motion.div
                    key={feature.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                  >
                    <Card className="h-full backdrop-blur-sm bg-background/80 border-background/20">
                      <CardHeader>
                        <div className="p-3 rounded-lg bg-gradient-to-r from-green-500/10 to-emerald-500/10 w-fit mb-4">
                          <feature.icon className="h-6 w-6 text-green-500" />
                        </div>
                        <CardTitle>{feature.title}</CardTitle>
                        <CardDescription className="text-base">{feature.description}</CardDescription>
                      </CardHeader>
                    </Card>
                  </motion.div>
                ))}
              </div>


            </TabsContent>
          </Tabs>

          {/* CTA Section */}
          <div className="mt-20 text-center">
            <Card className="backdrop-blur-sm bg-background/80 border-background/20 p-12 max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold mb-4">Ready to experience the future of collaboration?</h2>
              <p className="text-xl text-muted-foreground mb-8">
                Join thousands of teams already using CollabEdge to work better together
              </p>
              <div className="flex flex-wrap gap-4 justify-center">
                <Button 
                  size="lg" 
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:opacity-90"
                  onClick={() => router.push('/pricing')}
                >
                  Start Your Journey
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
} 
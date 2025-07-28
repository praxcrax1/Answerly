"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Search, ArrowRight, Sun, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import ReactMarkdown from "react-markdown"

interface SearchResult {
  title: string
  url: string
  content: string
}

interface Message {
  type: "search_results" | "content"
  data: SearchResult[] | string
}

export default function AnswerlyHome() {
  const [isDarkMode, setIsDarkMode] = useState(true)

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode)
  }
  const [query, setQuery] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [response, setResponse] = useState("")
  const [activeTab, setActiveTab] = useState("answer")
  const [showResults, setShowResults] = useState(false)
  const [followUpQuery, setFollowUpQuery] = useState("")
  const wsRef = useRef<WebSocket | null>(null)
  const responseRef = useRef("")

  const connectWebSocket = () => {
    wsRef.current = new WebSocket("ws://localhost:8000/ws/chat")

    wsRef.current.onopen = () => {
      console.log("WebSocket connected")
    }

    wsRef.current.onmessage = (event) => {
      const message: Message = JSON.parse(event.data)

      if (message.type === "search_results") {
        setSearchResults(message.data as SearchResult[])
      } else if (message.type === "content") {
        setIsSearching(false) // Stop loading when we start getting content
        responseRef.current += message.data as string
        setResponse(responseRef.current)
      }
    }

    wsRef.current.onclose = () => {
      console.log("WebSocket disconnected")
      // Attempt to reconnect after 3 seconds
      setTimeout(connectWebSocket, 3000)
    }

    wsRef.current.onerror = (error) => {
      console.error("WebSocket error:", error)
    }
  }

  useEffect(() => {
    // Initialize WebSocket connection
    connectWebSocket()

    return () => {
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  }, [])

  const handleSearch = async (searchQuery: string) => {
    if (!searchQuery.trim() || !wsRef.current) return

    setIsSearching(true)
    setShowResults(true)
    setResponse("")
    responseRef.current = ""
    setSearchResults([])

    // Send query through WebSocket
    wsRef.current.send(JSON.stringify({ query: searchQuery }))

    // Don't set isSearching to false here - let it stay true until we get results
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    handleSearch(query)
  }

  const handleFollowUp = (e: React.FormEvent) => {
    e.preventDefault()
    if (followUpQuery.trim()) {
      setQuery(followUpQuery) // Add this line to update the main title
      handleSearch(followUpQuery)
      setFollowUpQuery("")
    }
  }

  const handleNewSearch = () => {
    // Close existing WebSocket connection
    if (wsRef.current) {
      wsRef.current.close()
    }

    // Reset all state
    setShowResults(false)
    setQuery("")
    setResponse("")
    setSearchResults([])
    responseRef.current = ""
    setActiveTab("answer")

    // Reconnect WebSocket for new session
    setTimeout(() => {
      connectWebSocket()
    }, 100)
  }

  const SkeletonLoader = () => (
    <div className="space-y-4 animate-pulse">
      <div className="h-4 bg-gray-700 rounded w-3/4"></div>
      <div className="h-4 bg-gray-700 rounded w-1/2"></div>
      <div className="h-4 bg-gray-700 rounded w-5/6"></div>
      <div className="h-4 bg-gray-700 rounded w-2/3"></div>
    </div>
  )

  const truncateText = (text: string, maxLength = 200) => {
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength) + "..."
  }

  if (showResults) {
    return (
      <div
        className={`h-screen flex flex-col ${isDarkMode ? "bg-[#1a1a1a]" : "bg-white"} ${isDarkMode ? "text-white" : "text-black"}`}
      >
        {/* Header */}
        <div className={`border-b ${isDarkMode ? "border-gray-800" : "border-gray-200"} px-6 py-4 flex-shrink-0`}>
          <div className="flex items-center justify-between max-w-xl mx-auto">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold">{query}</h1>
            </div>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <div
            className={`w-64 border-r ${isDarkMode ? "border-gray-800" : "border-gray-200"} p-4 flex-shrink-0 flex flex-col`}
          >
            {/* Answerly Logo */}
            <div className="mb-6">
              <h2 className={`text-lg font-semibold ${isDarkMode ? "text-white" : "text-black"}`}>Answerly</h2>
            </div>

            {/* New Chat Button */}
            <div className="mb-4">
              <Button
                onClick={handleNewSearch}
                className={`w-full justify-start ${isDarkMode ? "bg-gray-800 hover:bg-gray-700 text-white" : "bg-gray-100 hover:bg-gray-200 text-black"} rounded-lg border ${isDarkMode ? "border-gray-700" : "border-gray-300"}`}
              >
                <Plus className="w-4 h-4 mr-2" />
                New Chat
              </Button>
            </div>

            <div className="space-y-2 flex-1">
              <Button
                variant="ghost"
                className={`w-full justify-start ${isDarkMode ? "text-white bg-gray-800 hover:bg-gray-700" : "text-black bg-gray-100 hover:bg-gray-200"} rounded-md`}
              >
                <div className="w-6 h-6 mr-3 rounded-full bg-gray-600 flex items-center justify-center">
                  <Search className="w-3 h-3" />
                </div>
                Home
              </Button>
            </div>

            <div className="mt-auto space-y-2">
              <Button
                variant="ghost"
                className={`w-full justify-start ${isDarkMode ? "text-gray-300 hover:bg-gray-800" : "text-gray-700 hover:bg-gray-200"} rounded-md`}
                onClick={toggleTheme}
              >
                <div className="w-6 h-6 mr-3 rounded-full bg-gray-600 flex items-center justify-center">
                  <Sun className="w-3 h-3" />
                </div>
                Theme
              </Button>
              <Button
                variant="ghost"
                className={`w-full justify-start ${isDarkMode ? "text-gray-300 hover:bg-gray-800" : "text-gray-700 hover:bg-gray-200"} rounded-md`}
              >
                <div className="w-6 h-6 mr-3 rounded-full bg-pink-600 flex items-center justify-center text-white text-sm font-medium">
                  A
                </div>
                Account
              </Button>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto">
              <div className="max-w-4xl mx-auto p-6">
                {/* Tabs */}
                <div className={`flex space-x-6 mb-6 border-b ${isDarkMode ? "border-gray-800" : "border-gray-200"}`}>
                  <button
                    onClick={() => setActiveTab("answer")}
                    className={`pb-2 px-1 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === "answer"
                        ? `border-blue-500 ${isDarkMode ? "text-white" : "text-black"}`
                        : `border-transparent ${isDarkMode ? "text-gray-400 hover:text-gray-300" : "text-gray-600 hover:text-gray-800"}`
                    }`}
                  >
                    <Search className="w-4 h-4 inline mr-2" />
                    Answer
                  </button>
                  <button
                    onClick={() => setActiveTab("sources")}
                    className={`pb-2 px-1 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === "sources"
                        ? `border-blue-500 ${isDarkMode ? "text-white" : "text-black"}`
                        : `border-transparent ${isDarkMode ? "text-gray-400 hover:text-gray-300" : "text-gray-600 hover:text-gray-800"}`
                    }`}
                  >
                    Sources
                    {searchResults.length > 0 && (
                      <Badge variant="secondary" className="ml-2 bg-gray-700 text-gray-300">
                        {searchResults.length}
                      </Badge>
                    )}
                  </button>
                </div>

                {/* Content */}
                {activeTab === "answer" && (
                  <div className="space-y-6">
                    {/* Source Pills */}
                    {searchResults.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-6">
                        {searchResults.slice(0, 4).map((result, index) => (
                          <a
                            key={index}
                            href={result.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`flex items-center space-x-2 ${isDarkMode ? "bg-gray-800 hover:bg-gray-700" : "bg-gray-100 hover:bg-gray-200"} rounded-full px-3 py-1 text-sm transition-colors cursor-pointer`}
                          >
                            <div className="w-4 h-4 rounded-full bg-gray-600 flex items-center justify-center text-xs">
                              {result.title.charAt(0).toUpperCase()}
                            </div>
                            <span className={`${isDarkMode ? "text-gray-300" : "text-gray-700"} truncate max-w-32`}>
                              {result.title}
                            </span>
                          </a>
                        ))}
                      </div>
                    )}

                    {/* Response */}
                    <div>
                      {isSearching ? (
                        <SkeletonLoader />
                      ) : response ? (
                        <div className="max-w-none">
                          <ReactMarkdown
                            components={{
                              p: ({ children }) => (
                                <p className={`${isDarkMode ? "text-gray-200" : "text-gray-800"} leading-relaxed mb-4`}>
                                  {children}
                                </p>
                              ),
                              h1: ({ children }) => (
                                <h1
                                  className={`${isDarkMode ? "text-gray-100" : "text-gray-900"} text-2xl font-bold mb-4`}
                                >
                                  {children}
                                </h1>
                              ),
                              h2: ({ children }) => (
                                <h2
                                  className={`${isDarkMode ? "text-gray-100" : "text-gray-900"} text-xl font-semibold mb-3`}
                                >
                                  {children}
                                </h2>
                              ),
                              ul: ({ children }) => (
                                <ul
                                  className={`list-disc pl-5 ${isDarkMode ? "text-gray-200" : "text-gray-800"} leading-relaxed mb-4`}
                                >
                                  {children}
                                </ul>
                              ),
                              li: ({ children }) => <li className={`mb-1`}>{children}</li>,
                              code: ({ children }) => (
                                <code className="bg-gray-800 text-gray-100 px-1 py-0.5 rounded text-sm font-mono">
                                  {children}
                                </code>
                              ),
                              blockquote: ({ children }) => (
                                <blockquote className="border-l-4 pl-4 italic text-gray-500">{children}</blockquote>
                              ),
                            }}
                          >
                            {response}
                          </ReactMarkdown>
                        </div>
                      ) : (
                        <div className={`${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>No response yet</div>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === "sources" && (
                  <div className="space-y-4">
                    {searchResults.map((result, index) => (
                      <div
                        key={index}
                        className={`border ${isDarkMode ? "border-gray-800" : "border-gray-200"} rounded-lg p-4`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h3
                            className={`${isDarkMode ? "font-medium text-white" : "font-medium text-black"} flex-1 pr-4`}
                          >
                            {result.title}
                          </h3>
                          <a
                            href={result.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:text-blue-300 text-xs flex-shrink-0"
                          >
                            Visit
                          </a>
                        </div>
                        <p className={`${isDarkMode ? "text-gray-400 text-sm mb-3" : "text-gray-600 text-sm mb-3"}`}>
                          {truncateText(result.content, 300)}
                        </p>
                        <div className={`text-xs ${isDarkMode ? "text-gray-500" : "text-gray-500"} truncate`}>
                          {result.url}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Follow-up Input - Fixed at bottom */}
            <div className={`border-t ${isDarkMode ? "border-gray-800" : "border-gray-200"} p-6 flex-shrink-0`}>
              <div className="max-w-4xl mx-auto">
                <form onSubmit={handleFollowUp} className="relative">
                  <Input
                    value={followUpQuery}
                    onChange={(e) => setFollowUpQuery(e.target.value)}
                    placeholder="Ask a follow-up..."
                    className={`w-full ${isDarkMode ? "bg-gray-800 border-gray-700 text-white placeholder-gray-400" : "bg-gray-100 border-gray-300 text-black placeholder-gray-500"}`}
                  />
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2 py-6">
                    <Button type="submit" size="sm" className="bg-teal-600 hover:bg-teal-700 text-white">
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className={`min-h-screen ${isDarkMode ? "bg-[#1a1a1a]" : "bg-white"} ${isDarkMode ? "text-white" : "text-black"} flex`}
    >
      {/* Sidebar */}
      <div className={`w-64 border-r ${isDarkMode ? "border-gray-800" : "border-gray-200"} p-4 relative`}>
        <div className="space-y-2">
          <Button
            variant="ghost"
            className={`w-full justify-start ${isDarkMode ? "text-white bg-gray-800 hover:bg-gray-700" : "text-black bg-gray-100 hover:bg-gray-200"} max-w-full`}
          >
            <div className="w-6 h-6 mr-3 rounded-full bg-gray-600 flex items-center justify-center">
              <Search className="w-3 h-3" />
            </div>
            Home
          </Button>
        </div>

        <div className="absolute bottom-4 left-4 right-4 space-y-2 w-56">
          <Button
            variant="ghost"
            className={`w-full justify-start ${isDarkMode ? "text-gray-300 hover:bg-gray-800" : "text-gray-700 hover:bg-gray-200"} max-w-full`}
            onClick={toggleTheme}
          >
            <div className="w-6 h-6 mr-3 rounded-full bg-gray-600 flex items-center justify-center">
              <Sun className="w-3 h-3" />
            </div>
            Theme
          </Button>
          <Button
            variant="ghost"
            className={`w-full justify-start ${isDarkMode ? "text-gray-300 hover:bg-gray-800" : "text-gray-700 hover:bg-gray-200"} max-w-full`}
          >
            <div className="w-6 h-6 mr-3 rounded-full bg-pink-600 flex items-center justify-center text-white text-sm font-medium">
              A
            </div>
            Account
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <div className="w-full max-w-4xl">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <h1 className="text-6xl font-light mb-6 tracking-wide">answerly</h1>
            <p
              className={`text-xl ${isDarkMode ? "text-gray-400" : "text-gray-600"} mb-8 max-w-2xl mx-auto leading-relaxed`}
            >
              Where knowledge meets curiosity. Ask anything and get comprehensive answers powered by real-time web
              search and AI.
            </p>
          </div>

          {/* Search Input */}
          <div className="mb-16">
            <form onSubmit={handleSubmit} className="relative">
              <div
                className={`relative ${isDarkMode ? "bg-gray-800 border-gray-700" : "bg-gray-100 border-gray-300"} rounded-lg border focus-within:border-gray-600`}
              >
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Ask anything..."
                  className={`w-full bg-transparent border-0 ${isDarkMode ? "text-white placeholder-gray-400" : "text-black placeholder-gray-500"} text-lg py-4 px-4 pr-24 focus:ring-0`}
                />
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                  <Button
                    type="submit"
                    size="sm"
                    disabled={!query.trim() || isSearching}
                    className="bg-teal-600 hover:bg-teal-700 text-white disabled:opacity-50 px-3 py-4"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </form>
          </div>

          {/* Example Questions */}
          <div className="grid md:grid-cols-2 gap-4 max-w-3xl mx-auto">
            <div className="space-y-3">
              <h3 className={`text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"} mb-3`}>
                Try asking about:
              </h3>
              <button
                onClick={() => setQuery("What are the latest developments in AI?")}
                className={`w-full text-left p-4 rounded-lg border ${isDarkMode ? "border-gray-700 bg-gray-800/50 hover:bg-gray-800 text-gray-300" : "border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700"} transition-colors cursor-pointer`}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                    <Search className="w-4 h-4 text-blue-400" />
                  </div>
                  <span>What are the latest developments in AI?</span>
                </div>
              </button>
              <button
                onClick={() => setQuery("How does climate change affect ocean currents?")}
                className={`w-full text-left p-4 rounded-lg border ${isDarkMode ? "border-gray-700 bg-gray-800/50 hover:bg-gray-800 text-gray-300" : "border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700"} transition-colors cursor-pointer`}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                    <Search className="w-4 h-4 text-green-400" />
                  </div>
                  <span>How does climate change affect ocean currents?</span>
                </div>
              </button>
            </div>
            <div className="space-y-3">
              <h3 className={`text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"} mb-3`}>
                Popular topics:
              </h3>
              <button
                onClick={() => setQuery("What is quantum computing and how does it work?")}
                className={`w-full text-left p-4 rounded-lg border ${isDarkMode ? "border-gray-700 bg-gray-800/50 hover:bg-gray-800 text-gray-300" : "border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700"} transition-colors cursor-pointer`}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                    <Search className="w-4 h-4 text-purple-400" />
                  </div>
                  <span>What is quantum computing and how does it work?</span>
                </div>
              </button>
              <button
                onClick={() => setQuery("Explain the current situation in global markets")}
                className={`w-full text-left p-4 rounded-lg border ${isDarkMode ? "border-gray-700 bg-gray-800/50 hover:bg-gray-800 text-gray-300" : "border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700"} transition-colors cursor-pointer`}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center">
                    <Search className="w-4 h-4 text-orange-400" />
                  </div>
                  <span>Explain the current situation in global markets</span>
                </div>
              </button>
            </div>
          </div>

          {/* Features */}
          <div className="mt-20 grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div
                className={`w-12 h-12 rounded-full ${isDarkMode ? "bg-blue-500/20" : "bg-blue-100"} flex items-center justify-center mx-auto mb-4`}
              >
                <Search className={`w-6 h-6 ${isDarkMode ? "text-blue-400" : "text-blue-600"}`} />
              </div>
              <h3 className={`font-medium mb-2 ${isDarkMode ? "text-white" : "text-black"}`}>Real-time Search</h3>
              <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                Get the most current information from across the web with live search results.
              </p>
            </div>
            <div className="text-center">
              <div
                className={`w-12 h-12 rounded-full ${isDarkMode ? "bg-green-500/20" : "bg-green-100"} flex items-center justify-center mx-auto mb-4`}
              >
                <ArrowRight className={`w-6 h-6 ${isDarkMode ? "text-green-400" : "text-green-600"}`} />
              </div>
              <h3 className={`font-medium mb-2 ${isDarkMode ? "text-white" : "text-black"}`}>AI-Powered Answers</h3>
              <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                Comprehensive responses generated by advanced AI with source citations.
              </p>
            </div>
            <div className="text-center">
              <div
                className={`w-12 h-12 rounded-full ${isDarkMode ? "bg-purple-500/20" : "bg-purple-100"} flex items-center justify-center mx-auto mb-4`}
              >
                <Sun className={`w-6 h-6 ${isDarkMode ? "text-purple-400" : "text-purple-600"}`} />
              </div>
              <h3 className={`font-medium mb-2 ${isDarkMode ? "text-white" : "text-black"}`}>Always Learning</h3>
              <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                Continuously updated knowledge base for accurate and relevant information.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

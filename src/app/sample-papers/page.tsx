'use client'

import { useState } from 'react'
import { FileText, Download, Eye, Sparkles, Filter, Search } from 'lucide-react'

const samplePapers = [
  {
    id: 'flip-flops',
    title: 'Flip-Flops',
    subject: 'Digital Electronics',
    topics: ['Sequential Circuits', 'SR Flip-Flops', 'JK Flip-Flops', 'D Flip-Flops', 'T Flip-Flops', 'State Diagrams', 'Timing Analysis'],
    description: 'Comprehensive assignment covering various types of flip-flops, state diagrams, and timing analysis in digital sequential circuits.',
    assignmentFile: '/sample_papers/FF_assignment_Assignment.pdf',
    solutionFile: '/sample_papers/FF_assignment_Solutions.pdf',
    color: 'indigo',
    difficulty: 'Intermediate',
  },
  {
    id: 'hls',
    title: 'High-Level Synthesis',
    subject: 'Computer Architecture',
    topics: ['VLSI Design', 'HLS Tools', 'RTL Generation', 'Hardware Optimization', 'FPGA', 'Verilog/VHDL'],
    description: 'Advanced assignment on high-level synthesis techniques, RTL generation, and hardware optimization for FPGA implementations.',
    assignmentFile: '/sample_papers/HLS_Assignment_Assignment.pdf',
    solutionFile: '/sample_papers/HLS_Assignment_Solutions.pdf',
    color: 'purple',
    difficulty: 'Advanced',
  },
  {
    id: 'mosfet',
    title: 'MOSFET',
    subject: 'Electronics',
    topics: ['Semiconductor Physics', 'Transistor Operation', 'I-V Characteristics', 'CMOS Design', 'Device Modeling', 'Threshold Voltage'],
    description: 'In-depth study of MOSFET operation, characteristics, and applications in CMOS circuit design.',
    assignmentFile: '/sample_papers/MOSFET_Assignment.pdf',
    solutionFile: '/sample_papers/MOSFET_Solutions.pdf',
    color: 'blue',
    difficulty: 'Intermediate',
  },
  {
    id: 'interrupts',
    title: 'Interrupts',
    subject: 'Embedded Systems',
    topics: ['Interrupt Handling', 'Priority Mechanisms', 'ISR', 'ARM Cortex', 'Real-Time Systems', 'Nested Interrupts'],
    description: 'Detailed assignment on interrupt handling mechanisms, priority management, and real-time system design.',
    assignmentFile: '/sample_papers/interrupt_Assignment.pdf',
    solutionFile: '/sample_papers/interrupt_Solutions.pdf',
    color: 'green',
    difficulty: 'Intermediate',
  },
  {
    id: 'optics',
    title: 'Optics',
    subject: 'Physics',
    topics: ['Wave Optics', 'Interference', 'Diffraction', 'Polarization', 'Optical Instruments', 'Photonics', 'Laser Physics'],
    description: 'Comprehensive physics assignment covering wave optics, interference patterns, diffraction, and optical instrumentation.',
    assignmentFile: '/sample_papers/optics_Assignment.pdf',
    solutionFile: '/sample_papers/optics_Solutions.pdf',
    color: 'amber',
    difficulty: 'Beginner',
  },
]

const subjects = ['All Subjects', 'Digital Electronics', 'Computer Architecture', 'Electronics', 'Embedded Systems', 'Physics']
const difficulties = ['All Levels', 'Beginner', 'Intermediate', 'Advanced']

export default function SamplePapersPage() {
  const [selectedSubject, setSelectedSubject] = useState('All Subjects')
  const [selectedDifficulty, setSelectedDifficulty] = useState('All Levels')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedPaper, setSelectedPaper] = useState<string | null>(null)

  const filteredPapers = samplePapers.filter(paper => {
    const matchesSubject = selectedSubject === 'All Subjects' || paper.subject === selectedSubject
    const matchesDifficulty = selectedDifficulty === 'All Levels' || paper.difficulty === selectedDifficulty
    const matchesSearch = searchQuery === '' ||
      paper.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      paper.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      paper.topics.some(topic => topic.toLowerCase().includes(searchQuery.toLowerCase()))

    return matchesSubject && matchesDifficulty && matchesSearch
  })

  const getColorClasses = (color: string) => {
    const colors = {
      indigo: 'bg-indigo-100 text-indigo-600 border-indigo-200 hover:bg-indigo-200',
      purple: 'bg-purple-100 text-purple-600 border-purple-200 hover:bg-purple-200',
      blue: 'bg-blue-100 text-blue-600 border-blue-200 hover:bg-blue-200',
      green: 'bg-green-100 text-green-600 border-green-200 hover:bg-green-200',
      amber: 'bg-amber-100 text-amber-600 border-amber-200 hover:bg-amber-200',
    }
    return colors[color as keyof typeof colors] || colors.indigo
  }

  const getDifficultyColor = (difficulty: string) => {
    const colors = {
      Beginner: 'text-green-600 bg-green-50 border-green-200',
      Intermediate: 'text-amber-600 bg-amber-50 border-amber-200',
      Advanced: 'text-red-600 bg-red-50 border-red-200',
    }
    return colors[difficulty as keyof typeof colors] || colors.Intermediate
  }

  return (
    <div>
      {/* Header */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-100 text-indigo-600 text-sm font-medium mb-4">
          <Sparkles className="h-4 w-4" />
          AI-Generated Assignments
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
          Sample Papers
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Explore high-quality assignments and solutions generated by Vidya AI across various technical subjects.
          See the quality and depth of our AI-generated content.
        </p>
      </div>

      {/* Filters and Search */}
      <div className="bg-gray-50 rounded-2xl p-6 mb-8 border border-gray-200">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search papers, topics..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Subject Filter */}
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-gray-400" />
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              {subjects.map(subject => (
                <option key={subject} value={subject}>{subject}</option>
              ))}
            </select>
          </div>

          {/* Difficulty Filter */}
          <div>
            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              className="px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              {difficulties.map(difficulty => (
                <option key={difficulty} value={difficulty}>{difficulty}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Active Filters */}
        {(selectedSubject !== 'All Subjects' || selectedDifficulty !== 'All Levels' || searchQuery) && (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="text-sm text-gray-600">Active filters:</span>
            {selectedSubject !== 'All Subjects' && (
              <span className="px-3 py-1 bg-indigo-100 text-indigo-600 rounded-full text-sm flex items-center gap-1">
                {selectedSubject}
                <button onClick={() => setSelectedSubject('All Subjects')} className="hover:text-indigo-800">×</button>
              </span>
            )}
            {selectedDifficulty !== 'All Levels' && (
              <span className="px-3 py-1 bg-purple-100 text-purple-600 rounded-full text-sm flex items-center gap-1">
                {selectedDifficulty}
                <button onClick={() => setSelectedDifficulty('All Levels')} className="hover:text-purple-800">×</button>
              </span>
            )}
            {searchQuery && (
              <span className="px-3 py-1 bg-blue-100 text-blue-600 rounded-full text-sm flex items-center gap-1">
                "{searchQuery}"
                <button onClick={() => setSearchQuery('')} className="hover:text-blue-800">×</button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Results Count */}
      <div className="mb-6">
        <p className="text-gray-600">
          Showing <span className="font-semibold text-gray-900">{filteredPapers.length}</span> {filteredPapers.length === 1 ? 'paper' : 'papers'}
        </p>
      </div>

      {/* Papers Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        {filteredPapers.map((paper) => (
          <div
            key={paper.id}
            className={`bg-white rounded-2xl p-6 border-2 transition-all duration-300 cursor-pointer ${
              selectedPaper === paper.id
                ? 'border-indigo-500 shadow-xl shadow-indigo-500/20'
                : 'border-gray-200 hover:border-gray-300 hover:shadow-lg'
            }`}
            onClick={() => setSelectedPaper(selectedPaper === paper.id ? null : paper.id)}
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`p-3 rounded-xl ${getColorClasses(paper.color)} border transition-colors`}>
                <FileText className="h-6 w-6" />
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getDifficultyColor(paper.difficulty)}`}>
                {paper.difficulty}
              </span>
            </div>

            <h3 className="text-xl font-bold text-gray-900 mb-2">{paper.title}</h3>
            <p className="text-sm text-indigo-600 font-medium mb-3">{paper.subject}</p>
            <p className="text-sm text-gray-600 mb-4 leading-relaxed">{paper.description}</p>

            {/* Topics */}
            <div className="mb-4">
              <div className="flex flex-wrap gap-2">
                {paper.topics.slice(0, 3).map((topic, idx) => (
                  <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                    {topic}
                  </span>
                ))}
                {paper.topics.length > 3 && (
                  <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                    +{paper.topics.length - 3} more
                  </span>
                )}
              </div>
            </div>

            {/* Expanded View */}
            {selectedPaper === paper.id && (
              <div className="mt-4 pt-4 border-t border-gray-200 space-y-3 animate-in fade-in duration-300">
                <div>
                  <p className="text-xs font-semibold text-gray-700 mb-2">All Topics Covered:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {paper.topics.map((topic, idx) => (
                      <span key={idx} className="px-2 py-1 bg-indigo-50 text-indigo-700 rounded text-xs border border-indigo-200">
                        {topic}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 mt-4">
              <a
                href={paper.assignmentFile}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="flex-1 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition flex items-center justify-center gap-2 text-sm font-medium"
              >
                <Eye className="h-4 w-4" />
                View
              </a>
              <a
                href={paper.solutionFile}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="flex-1 px-4 py-2 border-2 border-gray-300 text-gray-900 rounded-lg hover:bg-gray-50 transition flex items-center justify-center gap-2 text-sm font-medium"
              >
                <Download className="h-4 w-4" />
                Solution
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* No Results */}
      {filteredPapers.length === 0 && (
        <div className="text-center py-12">
          <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No papers found</h3>
          <p className="text-gray-600 mb-4">Try adjusting your filters or search query</p>
          <button
            onClick={() => {
              setSelectedSubject('All Subjects')
              setSelectedDifficulty('All Levels')
              setSearchQuery('')
            }}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
          >
            Clear All Filters
          </button>
        </div>
      )}

      {/* CTA Section */}
      <div className="mt-16 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl p-8 sm:p-12 text-center">
        <Sparkles className="h-12 w-12 text-white mx-auto mb-4" />
        <h2 className="text-3xl font-bold text-white mb-4">
          Generate Your Own Assignments
        </h2>
        <p className="text-indigo-100 mb-6 max-w-2xl mx-auto">
          These are just examples! With Vidya AI, you can generate unlimited high-quality assignments
          across any subject, tailored to your course materials and learning objectives.
        </p>
        <a
          href="/login"
          className="inline-flex items-center gap-2 px-8 py-3 bg-white text-indigo-600 rounded-lg hover:bg-gray-100 transition font-semibold"
        >
          Get Started Free
          <Sparkles className="h-4 w-4" />
        </a>
      </div>
    </div>
  )
}

export const samplePapers = [
  {
    id: 'flip-flops',
    title: 'Flip-Flops',
    subject: 'Digital Electronics',
    topics: [
      'Sequential Circuits',
      'SR Flip-Flops',
      'JK Flip-Flops',
      'D Flip-Flops',
      'T Flip-Flops',
      'State Diagrams',
      'Timing Analysis',
    ],
    description:
      'Comprehensive assignment covering various types of flip-flops, state diagrams, and timing analysis in digital sequential circuits.',
    assignmentFile: '/sample_papers/FF_assignment_Assignment.pdf',
    solutionFile: '/sample_papers/FF_assignment_Solutions.pdf',
    color: 'indigo',
    difficulty: 'Intermediate',
  },
  {
    id: 'hls',
    title: 'High-Level Synthesis',
    subject: 'Computer Architecture',
    topics: [
      'VLSI Design',
      'HLS Tools',
      'RTL Generation',
      'Hardware Optimization',
      'FPGA',
      'Verilog/VHDL',
    ],
    description:
      'Advanced assignment on high-level synthesis techniques, RTL generation, and hardware optimization for FPGA implementations.',
    assignmentFile: '/sample_papers/HLS_Assignment_Assignment.pdf',
    solutionFile: '/sample_papers/HLS_Assignment_Solutions.pdf',
    color: 'purple',
    difficulty: 'Advanced',
  },
  {
    id: 'mosfet',
    title: 'MOSFET',
    subject: 'Electronics',
    topics: [
      'Semiconductor Physics',
      'Transistor Operation',
      'I-V Characteristics',
      'CMOS Design',
      'Device Modeling',
      'Threshold Voltage',
    ],
    description:
      'In-depth study of MOSFET operation, characteristics, and applications in CMOS circuit design.',
    assignmentFile: '/sample_papers/MOSFET_Assignment.pdf',
    solutionFile: '/sample_papers/MOSFET_Solutions.pdf',
    color: 'blue',
    difficulty: 'Intermediate',
  },
  {
    id: 'interrupts',
    title: 'Interrupts',
    subject: 'Embedded Systems',
    topics: [
      'Interrupt Handling',
      'Priority Mechanisms',
      'ISR',
      'ARM Cortex',
      'Real-Time Systems',
      'Nested Interrupts',
    ],
    description:
      'Detailed assignment on interrupt handling mechanisms, priority management, and real-time system design.',
    assignmentFile: '/sample_papers/interrupt_Assignment.pdf',
    solutionFile: '/sample_papers/interrupt_Solutions.pdf',
    color: 'green',
    difficulty: 'Intermediate',
  },
  {
    id: 'optics',
    title: 'Optics',
    subject: 'Physics',
    topics: [
      'Wave Optics',
      'Interference',
      'Diffraction',
      'Polarization',
      'Optical Instruments',
      'Photonics',
      'Laser Physics',
    ],
    description:
      'Comprehensive physics assignment covering wave optics, interference patterns, diffraction, and optical instrumentation.',
    assignmentFile: '/sample_papers/optics_Assignment.pdf',
    solutionFile: '/sample_papers/optics_Solutions.pdf',
    color: 'amber',
    difficulty: 'Beginner',
  },
  {
    id: 'gears',
    title: 'Gears and Gear Trains',
    subject: 'Mechanical Engineering',
    topics: [
      'Gear Terminology',
      'Gear Ratios',
      'Spur Gears',
      'Helical Gears',
      'Gear Trains',
      'Power Transmission',
      'Torque Analysis',
    ],
    description:
      'Assignment covering gear types, gear train configurations, velocity ratios, and power transmission analysis in mechanical systems.',
    assignmentFile: '/sample_papers/Gears_and_Gear_Trains_Assignment.pdf',
    solutionFile: '/sample_papers/Gears_and_Gear_Trains_Solutions.pdf',
    color: 'orange',
    difficulty: 'Intermediate',
  },
  {
    id: 'virtual-work-fem',
    title: 'Virtual Work & Finite Element Formulation',
    subject: 'Structural Engineering',
    topics: [
      'Principle of Virtual Work',
      'Finite Element Method',
      'Stiffness Matrix',
      'Weak Formulation',
      'Boundary Conditions',
      'Numerical Methods',
    ],
    description:
      'Advanced assignment on the principle of virtual work and its application to finite element formulation for structural analysis.',
    assignmentFile:
      '/sample_papers/The_Principle_of_Virtual_Work_and_The_Finite_Element_Formulation_Assignment.pdf',
    solutionFile:
      '/sample_papers/The_Principle_of_Virtual_Work_and_The_Finite_Element_Formulation_Solutions.pdf',
    color: 'teal',
    difficulty: 'Advanced',
  },
];

export const subjects = [
  'All Subjects',
  'Digital Electronics',
  'Computer Architecture',
  'Electronics',
  'Embedded Systems',
  'Physics',
  'Mechanical Engineering',
  'Structural Engineering',
];

export const difficulties = ['All Levels', 'Beginner', 'Intermediate', 'Advanced'];

export const paperAccents = {
  indigo: {
    icon: 'border-[#8b5cf6]/20 bg-[#8b5cf6]/12 text-[#b794f4]',
    chip: 'border-[#8b5cf6]/18 bg-[#8b5cf6]/10 text-[#c4b5fd]',
    selected: 'border-[#8b5cf6]/35 shadow-[0_24px_70px_rgba(139,92,246,0.12)]',
  },
  purple: {
    icon: 'border-[#c084fc]/20 bg-[#c084fc]/12 text-[#d8b4fe]',
    chip: 'border-[#c084fc]/18 bg-[#c084fc]/10 text-[#e9d5ff]',
    selected: 'border-[#c084fc]/35 shadow-[0_24px_70px_rgba(192,132,252,0.12)]',
  },
  blue: {
    icon: 'border-[#4bc2ff]/20 bg-[#4bc2ff]/12 text-[#7ed4ff]',
    chip: 'border-[#4bc2ff]/18 bg-[#4bc2ff]/10 text-[#bae6fd]',
    selected: 'border-[#4bc2ff]/35 shadow-[0_24px_70px_rgba(75,194,255,0.12)]',
  },
  green: {
    icon: 'border-[#43ead6]/20 bg-[#43ead6]/12 text-[#7ef0e1]',
    chip: 'border-[#43ead6]/18 bg-[#43ead6]/10 text-[#99f6e4]',
    selected: 'border-[#43ead6]/35 shadow-[0_24px_70px_rgba(67,234,214,0.12)]',
  },
  amber: {
    icon: 'border-[#fbbf24]/20 bg-[#fbbf24]/12 text-[#fcd34d]',
    chip: 'border-[#fbbf24]/18 bg-[#fbbf24]/10 text-[#fde68a]',
    selected: 'border-[#fbbf24]/35 shadow-[0_24px_70px_rgba(251,191,36,0.12)]',
  },
  orange: {
    icon: 'border-[#fb923c]/20 bg-[#fb923c]/12 text-[#fdba74]',
    chip: 'border-[#fb923c]/18 bg-[#fb923c]/10 text-[#fed7aa]',
    selected: 'border-[#fb923c]/35 shadow-[0_24px_70px_rgba(251,146,60,0.12)]',
  },
  teal: {
    icon: 'border-[#2dd4bf]/20 bg-[#2dd4bf]/12 text-[#5eead4]',
    chip: 'border-[#2dd4bf]/18 bg-[#2dd4bf]/10 text-[#99f6e4]',
    selected: 'border-[#2dd4bf]/35 shadow-[0_24px_70px_rgba(45,212,191,0.12)]',
  },
};

export const difficultyColors = {
  Beginner: 'border-[#43ead6]/20 bg-[#43ead6]/10 text-[#7ef0e1]',
  Intermediate: 'border-[#fbbf24]/20 bg-[#fbbf24]/10 text-[#fde68a]',
  Advanced: 'border-[#fb7185]/20 bg-[#fb7185]/10 text-[#fda4af]',
};

export const getPaperAccent = (color) => {
  return paperAccents[color] || paperAccents.indigo;
};

export const getDifficultyColor = (difficulty) => {
  return difficultyColors[difficulty] || difficultyColors.Intermediate;
};

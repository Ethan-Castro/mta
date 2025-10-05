"use client";

import { useState, useEffect, useRef, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { cn } from "@/lib/utils";
import { XIcon, ArrowRightIcon, ArrowLeftIcon, PlayIcon, PauseIcon, UserIcon, BrainIcon, MapIcon } from "lucide-react";

interface TourStep {
  id: string;
  title: string;
  content: string;
  target?: string; // CSS selector
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  route?: string; // Route to navigate to
  action?: () => void;
  skippable?: boolean;
  highlight?: boolean;
  visual?: ReactNode; // Custom visual content
}

// Predefined tour paths for different user types
const TOUR_PATHS = {
  resident: [
    {
      id: 'welcome-resident',
      title: '🚌 Welcome to NYC Transport Data!',
      content: 'Unified MTA and DOT data showing how bus lane cameras and traffic management are making NYC buses faster and more reliable. Let\'s see how it affects your daily commute.',
      position: 'center' as const,
      highlight: true,
      visual: (
        <div className="text-center p-4">
          <div className="text-6xl mb-4">🚌💨</div>
          <p className="text-sm text-muted-foreground">Discover how camera enforcement helps your bus arrive on time</p>
        </div>
      )
    },
    {
      id: 'what-is-ace',
      title: 'What are Bus Lane Cameras?',
      content: 'ACE (Automated Camera Enforcement) uses cameras to catch cars illegally parked in bus lanes. When cars stay out, buses move faster!',
      position: 'center' as const,
      visual: (
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg">
            <span className="text-2xl">🚗</span>
            <span className="text-sm">Car blocks bus lane</span>
            <span className="text-2xl">📷</span>
            <span className="text-sm">Camera catches it</span>
          </div>
          <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
            <span className="text-2xl">🚌</span>
            <span className="text-sm">Bus moves faster</span>
            <span className="text-2xl">😊</span>
            <span className="text-sm">You get there on time</span>
          </div>
        </div>
      )
    },
    {
      id: 'navigate-homepage',
      title: 'Start Here Every Time',
      content: 'The homepage shows quick links to different views. As a resident, you\'ll mostly use "Executive" for simple summaries.',
      route: '/',
      target: '[href="/executive"]',
      position: 'bottom' as const
    },
    {
      id: 'executive-overview',
      title: 'Simple Numbers That Matter',
      content: 'These cards show the most important information: How much faster are buses? Are the cameras working?',
      route: '/executive',
      target: '.insight-card',
      position: 'top' as const
    },
    {
      id: 'ask-questions',
      title: 'Ask Questions in Plain English',
      content: 'The AI assistant can answer questions like "How fast is my bus route?" or "Are buses getting better in my neighborhood?"',
      route: '/chat',
      target: 'textarea',
      position: 'top' as const
    }
  ],
  student: [
    {
      id: 'welcome-student',
      title: '🎓 Hey Students!',
      content: 'See how bus lane cameras are helping CUNY students get to class faster and cheaper than Ubers or cabs.',
      position: 'center' as const,
      highlight: true,
      visual: (
        <div className="text-center p-4">
          <div className="text-6xl mb-4">🎓🚌</div>
          <p className="text-sm text-muted-foreground">Your route to faster, more reliable campus commutes</p>
        </div>
      )
    },
    {
      id: 'student-impact',
      title: 'Why This Matters for Students',
      content: 'Reliable buses mean you\'re not late for class, don\'t miss connections, and save money vs rideshare during surge pricing.',
      position: 'center' as const,
      visual: (
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-green-50 rounded-lg text-center">
            <div className="text-2xl mb-2">⏰</div>
            <div className="text-xs font-medium">Make it to class</div>
          </div>
          <div className="p-3 bg-blue-50 rounded-lg text-center">
            <div className="text-2xl mb-2">💰</div>
            <div className="text-xs font-medium">Save money</div>
          </div>
          <div className="p-3 bg-purple-50 rounded-lg text-center">
            <div className="text-2xl mb-2">🔄</div>
            <div className="text-xs font-medium">Reliable transfers</div>
          </div>
          <div className="p-3 bg-orange-50 rounded-lg text-center">
            <div className="text-2xl mb-2">😌</div>
            <div className="text-xs font-medium">Less stress</div>
          </div>
        </div>
      )
    },
    {
      id: 'student-routes',
      title: 'Your Campus Routes',
      content: 'This page shows which bus routes serve CUNY campuses and how camera enforcement has improved their speed and reliability.',
      route: '/students',
      target: '.route-comparison',
      position: 'right' as const
    },
    {
      id: 'student-map',
      title: 'See Your Commute',
      content: 'The map shows which routes have cameras (blue) and where the worst delays happen (red). Find alternatives if your usual route has problems.',
      route: '/map',
      target: '.mapbox-map',
      position: 'top' as const
    }
  ],
  executive: [
    {
      id: 'welcome-executive',
      title: '📊 Executive Dashboard',
      content: 'Get the key metrics and talking points you need for leadership briefings about ACE enforcement effectiveness.',
      position: 'center' as const,
      highlight: true,
      visual: (
        <div className="text-center p-4">
          <div className="text-6xl mb-4">📊💼</div>
          <p className="text-sm text-muted-foreground">Executive-ready insights and AI-generated briefings</p>
        </div>
      )
    },
    {
      id: 'headline-metrics',
      title: 'Lead with Impact',
      content: 'These top-line metrics tell the story: speed improvements, violation reductions, and passenger benefits. Focus on outcomes, not technical details.',
      route: '/executive',
      target: '.insight-card',
      position: 'top' as const
    },
    {
      id: 'view-modes',
      title: 'Adjust Detail Level',
      content: 'Switch between Simple, Detailed, and Expert modes depending on your audience. Simple mode is best for board presentations.',
      target: '.view-mode-toggle',
      position: 'bottom' as const
    },
    {
      id: 'ai-briefings',
      title: 'AI-Generated Briefings',
      content: 'Use these prompts to generate ready-to-send briefings that focus on business impact rather than technical metrics.',
      route: '/executive',
      target: '.ai-prompts',
      position: 'top' as const
    }
  ]
};

interface OnboardingTourProps {
  userType?: 'resident' | 'student' | 'executive';
  autoStart?: boolean;
  onComplete?: () => void;
  className?: string;
}

export default function OnboardingTour({
  userType = 'resident',
  autoStart = false,
  onComplete,
  className
}: OnboardingTourProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  const steps = TOUR_PATHS[userType] || TOUR_PATHS.resident;
  const step = steps[currentStep];

  // Auto-start logic
  useEffect(() => {
    if (autoStart && !localStorage.getItem('tour-completed')) {
      setIsActive(true);
    }
  }, [autoStart]);

  // Navigation handling
  useEffect(() => {
    if (isActive && step?.route && pathname !== step.route) {
      router.push(step.route);
    }
  }, [isActive, step, pathname, router]);

  // Auto-advance for timed steps
  useEffect(() => {
    if (isActive && isPlaying && step) {
      const timer = setTimeout(() => {
        nextStep();
      }, 8000); // 8 seconds per step

      return () => clearTimeout(timer);
    }
  }, [isActive, isPlaying, currentStep]);

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      completeTour();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const skipStep = () => {
    if (step?.skippable !== false) {
      nextStep();
    }
  };

  const completeTour = () => {
    setIsActive(false);
    localStorage.setItem('tour-completed', 'true');
    localStorage.setItem('tour-type', userType);
    onComplete?.();
  };

  const restartTour = () => {
    setCurrentStep(0);
    setIsActive(true);
    localStorage.removeItem('tour-completed');
  };

  // Get target element position
  const getTargetPosition = () => {
    if (!step?.target) return null;

    const element = document.querySelector(step.target);
    if (!element) return null;

    const rect = element.getBoundingClientRect();
    return {
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height
    };
  };

  const targetPos = getTargetPosition();

  // Calculate tooltip position
  const getTooltipPosition = () => {
    if (!targetPos) {
      return {
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)'
      };
    }

    const buffer = 20;

    switch (step?.position) {
      case 'top':
        return {
          top: targetPos.top - buffer,
          left: targetPos.left + targetPos.width / 2,
          transform: 'translate(-50%, -100%)'
        };
      case 'bottom':
        return {
          top: targetPos.top + targetPos.height + buffer,
          left: targetPos.left + targetPos.width / 2,
          transform: 'translate(-50%, 0)'
        };
      case 'left':
        return {
          top: targetPos.top + targetPos.height / 2,
          left: targetPos.left - buffer,
          transform: 'translate(-100%, -50%)'
        };
      case 'right':
        return {
          top: targetPos.top + targetPos.height / 2,
          left: targetPos.left + targetPos.width + buffer,
          transform: 'translate(0, -50%)'
        };
      default:
        return {
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)'
        };
    }
  };

  if (!isActive) {
    return (
      <button
        onClick={() => setIsActive(true)}
        className={cn(
          "fixed bottom-4 right-4 z-50 bg-primary text-primary-foreground p-3 rounded-full shadow-lg hover:bg-primary/90 transition-all",
          className
        )}
        title="Start tour"
      >
        <PlayIcon className="size-5" />
      </button>
    );
  }

  return (
    <>
      {/* Overlay */}
      <div
        ref={overlayRef}
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
        onClick={(e) => e.target === overlayRef.current && completeTour()}
      >
        {/* Highlight target element */}
        {targetPos && step?.highlight && (
          <div
            className="absolute border-2 border-primary rounded-lg bg-primary/10"
            style={{
              top: targetPos.top - 4,
              left: targetPos.left - 4,
              width: targetPos.width + 8,
              height: targetPos.height + 8,
              pointerEvents: 'none'
            }}
          />
        )}

        {/* Tour tooltip */}
        <div
          className="absolute bg-card border border-border rounded-lg shadow-xl max-w-sm w-80 z-10"
          style={getTooltipPosition()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border/40">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                {userType === 'student' && <UserIcon className="size-4 text-blue-600" />}
                {userType === 'executive' && <BrainIcon className="size-4 text-purple-600" />}
                {userType === 'resident' && <MapIcon className="size-4 text-green-600" />}
                <span className="text-xs font-medium text-muted-foreground capitalize">
                  {userType} Tour
                </span>
              </div>
              <div className="text-xs text-muted-foreground">
                {currentStep + 1} of {steps.length}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="text-muted-foreground hover:text-foreground transition-colors"
                title={isPlaying ? "Pause auto-advance" : "Auto-advance"}
              >
                {isPlaying ? <PauseIcon className="size-4" /> : <PlayIcon className="size-4" />}
              </button>
              <button
                onClick={completeTour}
                className="text-muted-foreground hover:text-foreground transition-colors"
                title="Close tour"
              >
                <XIcon className="size-4" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-4">
            <h3 className="font-semibold text-lg mb-2">{step.title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed mb-4">
              {step.content}
            </p>

            {/* Visual content */}
            {step.visual && (
              <div className="mb-4">
                {step.visual}
              </div>
            )}

            {/* Progress bar */}
            <div className="w-full bg-muted rounded-full h-1.5 mb-4">
              <div
                className="bg-primary h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
              />
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                <button
                  onClick={prevStep}
                  disabled={currentStep === 0}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ArrowLeftIcon className="size-3" />
                  Back
                </button>
                {step.skippable !== false && (
                  <button
                    onClick={skipStep}
                    className="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Skip
                  </button>
                )}
              </div>

              <button
                onClick={nextStep}
                className="flex items-center gap-1 px-4 py-1.5 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
              >
                {currentStep === steps.length - 1 ? 'Finish' : 'Next'}
                <ArrowRightIcon className="size-3" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// Tour starter component for different user types
interface TourStarterProps {
  onSelectUserType?: (type: 'resident' | 'student' | 'executive') => void;
  className?: string;
}

export function TourStarter({ onSelectUserType, className }: TourStarterProps) {
  const [selectedType, setSelectedType] = useState<'resident' | 'student' | 'executive' | null>(null);

  const userTypes = [
    {
      type: 'resident' as const,
      title: 'NYC Resident',
      description: 'I want to understand how this affects my daily commute',
      icon: '🏠',
      color: 'bg-green-50 border-green-200 hover:bg-green-100'
    },
    {
      type: 'student' as const,
      title: 'CUNY Student',
      description: 'I want to see how cameras help me get to campus',
      icon: '🎓',
      color: 'bg-blue-50 border-blue-200 hover:bg-blue-100'
    },
    {
      type: 'executive' as const,
      title: 'Executive/Analyst',
      description: 'I need metrics and briefing materials',
      icon: '💼',
      color: 'bg-purple-50 border-purple-200 hover:bg-purple-100'
    }
  ];

  const handleSelect = (type: 'resident' | 'student' | 'executive') => {
    setSelectedType(type);
    onSelectUserType?.(type);
  };

  return (
    <div className={cn(
      "fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4",
      className
    )}>
      <div className="bg-card border border-border rounded-xl shadow-xl max-w-lg w-full p-6">
        <div className="text-center mb-6">
          <h2 className="text-xl font-bold mb-2">Welcome to NYC Transport Data!</h2>
          <p className="text-muted-foreground text-sm">
            Let's customize your experience. What brings you here today?
          </p>
        </div>

        <div className="space-y-3">
          {userTypes.map((userType) => (
            <button
              key={userType.type}
              onClick={() => handleSelect(userType.type)}
              className={cn(
                "w-full p-4 border rounded-lg text-left transition-all hover:scale-[1.02]",
                userType.color
              )}
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl">{userType.icon}</span>
                <div>
                  <h3 className="font-semibold text-foreground">{userType.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {userType.description}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>

        <div className="mt-6 text-center">
          <button
            onClick={() => onSelectUserType?.('resident')}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Skip tour and explore on my own
          </button>
        </div>
      </div>
    </div>
  );
}
import * as React from "react"

interface TooltipProps {
  children: React.ReactNode
  content: string
  side?: "top" | "bottom" | "left" | "right"
  className?: string
}

function Tooltip({ children, content, side = "top", className = "" }: TooltipProps) {
  const [isVisible, setIsVisible] = React.useState(false)
  const [position, setPosition] = React.useState({ x: 0, y: 0 })
  const triggerRef = React.useRef<HTMLDivElement>(null)

  const handleMouseEnter = () => {
    if (triggerRef.current) {
      // Force tooltip in the center top of screen - THIS VERSION WORKED!
      let x = 10 
      let y = 10 
      
      setPosition({ x, y })
      setIsVisible(true)
    }
  }

  const handleMouseLeave = () => {
    setIsVisible(false)
  }

  return (
    <>
      <div
        ref={triggerRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={`inline-block ${className}`}
      >
        {children}
      </div>
      {isVisible && (
        <div
          style={{
            position: 'fixed',
            left: `${position.x}px`,
            top: `${position.y}px`,
            width: '360px',
            zIndex: 2147483647,
            backgroundColor: '#eff6ff',
            color: '#1e40af',
            padding: '16px',
            borderRadius: '12px',
            fontSize: '14px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.1)',
            pointerEvents: 'none',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            border: '1px solid #bfdbfe',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ fontWeight: 'bold', fontSize: '14px' }}>Short Link Ready</span>
          </div>
          <div style={{ fontSize: '12px', lineHeight: '1.4' }}>
            A short link has been created for this URL. Please copy and paste it in your email.
          </div>
        </div>
      )}
    </>
  )
}

// For compatibility with existing usage
function TooltipProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

function TooltipTrigger({ children, className, ...props }: { children: React.ReactNode; className?: string; [key: string]: any }) {
  return <div className={className} {...props}>{children}</div>
}

function TooltipContent({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider }

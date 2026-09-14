import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/shared/utils';

type TooltipTriggerProps = React.HTMLAttributes<HTMLElement> & React.RefAttributes<HTMLElement>;

interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactElement<TooltipTriggerProps>;
  className?: string;
  delay?: number;
  color?: string;
}

export function Tooltip({ content, children, className, delay = 300, color }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [shouldShow, setShouldShow] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  const handleMouseEnter = (e: React.MouseEvent) => {
    const target = e.currentTarget as HTMLElement;
    const isTruncated = target.scrollWidth > target.clientWidth;
    
    setShouldShow(isTruncated);

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    
    timeoutRef.current = setTimeout(() => {
      setPosition({
        x: e.clientX,
        y: e.clientY
      });
      setIsVisible(true);
    }, delay);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isVisible) {
      setPosition({
        x: e.clientX,
        y: e.clientY
      });
    }
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsVisible(false);
  };

  // Clone the child to inject refs and event handlers
  const trigger = React.cloneElement<TooltipTriggerProps>(children, {
    ref: (node: HTMLElement) => {
      triggerRef.current = node;
      const childRef = children.props.ref;
      if (typeof childRef === 'function') childRef(node);
      else if (childRef) childRef.current = node;
    },
    onMouseEnter: (event) => {
      children.props.onMouseEnter?.(event);
      handleMouseEnter(event);
    },
    onMouseMove: (event) => {
      children.props.onMouseMove?.(event);
      handleMouseMove(event);
    },
    onMouseLeave: (event) => {
      children.props.onMouseLeave?.(event);
      handleMouseLeave();
    },
  });

  return (
    <>
      {trigger}
      <AnimatePresence>
        {isVisible && shouldShow && content && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.1, ease: "easeOut" }}
            style={{
              position: 'fixed',
              left: position.x + 12,
              top: position.y + 12,
              zIndex: 9999,
              pointerEvents: 'none',
              borderColor: color ? color : 'var(--primary)',
            }}
            className={cn(
              "px-3 py-1.5 text-xs font-medium bg-surface/90 backdrop-blur-md text-on-surface rounded-lg shadow-2xl border-l-2 max-w-xs break-words",
              className
            )}
          >
            {content}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

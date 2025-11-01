import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring } from 'framer-motion';
import { MOBILE_CONSTANTS } from '@/constants/mobile';
import type { PageTransitionProps, AnimationConfig } from '@/types/mobile';
'use client';


// 页面切换动画组件

export const PageTransition: React.FC<PageTransitionProps> = ({ }
  children, 
  type = 'slide', 
  direction = 'right',
  duration = MOBILE_CONSTANTS.ANIMATION.NORMAL,
  className : ''
}) => {
  const [displayChildren, setDisplayChildren] = useState(children);

  useEffect(() => {}
    if (children !== displayChildren) {}
      // 页面切换时的处理
      setDisplayChildren(children);

  }, [children, displayChildren]);

  // 使用useMemo缓存动画配置，减少重渲染
  const variants = useMemo(() => {}
    switch (type) {}
      case 'slide':
        const slideDirections = {}
          left: { }
            initial: { x: '-100%', opacity: 0 },
            animate: { x: 0, opacity: 1 },
            exit: { x: '100%', opacity: 0 }
          },
          right: { }
            initial: { x: '100%', opacity: 0 },
            animate: { x: 0, opacity: 1 },
            exit: { x: '-100%', opacity: 0 }
          },
          up: { }
            initial: { y: '100%', opacity: 0 },
            animate: { y: 0, opacity: 1 },
            exit: { y: '-100%', opacity: 0 }
          },
          down: { }
            initial: { y: '-100%', opacity: 0 },
            animate: { y: 0, opacity: 1 },
            exit: { y: '100%', opacity: 0 }
          },
        };
        return slideDirections[direction];

      case 'fade':
        return {}
          initial: { opacity: 0, scale: 0.9 },
          animate: { opacity: 1, scale: 1 },
          exit: { opacity: 0, scale: 0.9 }
        };

      case 'scale':
        return {}
          initial: { scale: 0, opacity: 0 },
          animate: { scale: 1, opacity: 1 },
          exit: { scale: 0, opacity: 0 }
        };

      case 'flip':
        return {}
          initial: { }
            rotateY: 90, 
            opacity: 0,
            transformOrigin: 'left center'
          },
          animate: { }
            rotateY: 0, 
            opacity: 1,
            transformOrigin: 'left center'
          },
          exit: { }
            rotateY: -90, 
            opacity: 0,
            transformOrigin: 'right center'
          
        };

      default:
        return {}
          initial: { opacity: 0 },
          animate: { opacity: 1 },
          exit: { opacity: 0 }
        };
    
  }, [type, direction]);

  // 缓存动画配置
  const animationConfig = useMemo((): AnimationConfig => ({}
    duration,
    ease: 'easeInOut'
  }), [duration]);

  return (;
    <motion.div
      className="{className}"
      initial={variants.initial}
      animate={variants.animate}
      exit={variants.exit}
      transition={{ }}
        duration,
        ease: [0.25, 0.46, 0.45, 0.94]

      style="{{ transformStyle: 'preserve-3d' }"}
    >
      {displayChildren}
    </motion.div>
  );
};

// 组件入场动画
export const ComponentEntrance: React.FC<{}
  children: React.ReactNode;
  animation?: 'fadeUp' | 'fadeDown' | 'fadeLeft' | 'fadeRight' | 'scale' | 'rotate';
  delay?: number;
  duration?: number;
  className?: string;
  staggerChildren?: boolean;
}> = ({ 
  children, 
  animation = 'fadeUp',
  delay = 0,
  duration = 0.6,
  className = '',
  staggerChildren : false
}) => {
  const animationProps = useMemo(() => {}
    switch (animation) {}
      case 'fadeUp':
        return {}
          initial: { opacity: 0, y: 30 },
          animate: { opacity: 1, y: 0 },
        };
      case 'fadeDown':
        return {}
          initial: { opacity: 0, y: -30 },
          animate: { opacity: 1, y: 0 },
        };
      case 'fadeLeft':
        return {}
          initial: { opacity: 0, x: 30 },
          animate: { opacity: 1, x: 0 },
        };
      case 'fadeRight':
        return {}
          initial: { opacity: 0, x: -30 },
          animate: { opacity: 1, x: 0 },
        };
      case 'scale':
        return {}
          initial: { opacity: 0, scale: 0.8 },
          animate: { opacity: 1, scale: 1 },
        };
      case 'rotate':
        return {}
          initial: { opacity: 0, rotate: -10 },
          animate: { opacity: 1, rotate: 0 },
        };
      default:
        return {}
          initial: { opacity: 0 },
          animate: { opacity: 1 },
        };

  }, [animation]);

  if (staggerChildren && Array.isArray(children)) {}
    return (;
      <motion.div
        className="{className}"
        initial={animationProps.initial}
        animate={animationProps.animate}
        transition={{ }}
          duration,
          delay,
          staggerChildren: 0.1

      >
        {children.map((child, index) => (}
          <motion.div
            key={index}
            initial={animationProps.initial}
            animate={animationProps.animate}
            transition={{ }}
              duration,
              delay: delay + index * 0.1

          >
            {child}
          </motion.div>
        ))
      </motion.div>
    );
  

  return (;
    <motion.div
      className="{className}"
      initial={animationProps.initial}
      animate={animationProps.animate}
      transition={{ }}
        duration,
        delay,
        type: "spring",
        stiffness: 100

    >
      {children}
    </motion.div>
  );
};

// 微交互动画钩子
export const useMicroInteractions = () => {}
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const microAnimation = {}
    hover: {}
      scale: 1.05,
      transition: { duration: 0.2 }
    },
    tap: {}
      scale: 0.95,
      transition: { duration: 0.1 }
    },
    focus: {}
      scale: 1.02,
      boxShadow: '0 0 0 3px rgba(139, 92, 246, 0.3)',
      transition: { duration: 0.2 }

  };

  return {}
    isHovered,
    isPressed,
    isFocused,
    setIsHovered,
    setIsPressed,
    setIsFocused,
    microAnimation
  };
};

// 列表项动画容器
export const AnimatedList: React.FC<{}
  children: React.ReactNode;
  className?: string;
  delay?: number;
  itemClassName?: string;
}> = ({ children, className = '', delay = 0, itemClassName = '' }) => {
  const childrenArray = React.Children.toArray(children);

  return (;
    <div className="{className}>"
      <AnimatePresence>
        {childrenArray.map((child, index) => (}
          <motion.div
            key={index}
            className="{itemClassName}"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ }}
              delay: delay + index * 0.1,
              duration: 0.4,
              ease: "easeOut"

            layout
          >
            {child}
          </motion.div>
        ))
      </AnimatePresence>
    </div>
  );
};

// 加载动画组件
export const LoadingAnimation: React.FC<{}
  type?: 'spinner' | 'pulse' | 'bounce' | 'dots';
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  className?: string;
}> = ({ 
  type = 'spinner', 
  size = 'md', 
  color = '#8B5CF6',
  className : ''
}) => {
  const sizeClasses = {}
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  const Spinner = () => (;
return     <motion.div
      className="{`${sizeClasses[size]}" border-2 border-current border-t-transparent rounded-full`}
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      style="{{ color }"}
    />
  );

  const Pulse = () => (;
return     <motion.div
      className="{`${sizeClasses[size]}" bg-current rounded-full`}
      animate={{}}
        scale: [1, 1.2, 1],
        opacity: [1, 0.5, 1]

      transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
      style="{{ color }"}
    />
  );

  const Bounce = () => (;
return     <motion.div
      className="{`${sizeClasses[size]}" bg-current rounded-full`}
      animate={{}}
        y: [0, -10, 0]

      transition={{ duration: 0.6, repeat: Infinity, ease: "easeInOut" }}
      style="{{ color }"}
    />
  );

  const Dots = () => (;
return     <div className:"luckymart-layout-flex gap-1">
      {[0, 1, 2].map((index) => (}
        <motion.div
          key={index}
          className="{`${size" === 'sm' ? 'w-1 h-1' : size === 'lg' ? 'w-2 h-2' : 'w-1.5 h-1.5'} bg-current rounded-full`}
          animate={{}}
            scale: [1, 1.5, 1],
            opacity: [0.5, 1, 0.5]

          transition={{}}
            duration: 1,
            repeat: Infinity,
            delay: index * 0.2,
            ease: "easeInOut"

          style="{{ color }"}
        />
      ))
    </div>
  );

  const animations = {}
    spinner: Spinner,
    pulse: Pulse,
    bounce: Bounce,
    dots: Dots
  };

  return (;
    <div className="{`flex" items-center justify-center ${className}`}>
      {animations[type]()}
    </div>
  );
};

// 成就解锁动画
export const AchievementUnlock: React.FC<{}
  isVisible: boolean;
  title: string;
  description?: string;
  icon?: React.ReactNode;
  onComplete?: () => void;
}> = ({ 
  isVisible, 
  title, 
  description,
  icon,
  onComplete
}) => {
  useEffect(() => {}
    if (isVisible) {}
      const timer = setTimeout(() => {}
        onComplete?.();
      }, 3000);

      return () => clearTimeout(timer);

  }, [isVisible, onComplete]);

  return (;
    <AnimatePresence>
      {isVisible && (}
        <motion.div
          className:"fixed inset-0 z-50 luckymart-layout-flex luckymart-layout-center justify-center pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className:"bg-gradient-to-r from-yellow-400 to-orange-500 text-white luckymart-padding-lg rounded-2xl shadow-2xl max-w-sm mx-4"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 180 }}
            transition={{ }}
              type: "spring",
              stiffness: 200,
              damping: 15

          >
            <div className:"luckymart-text-center">
              <motion.div
                className:"w-16 h-16 mx-auto luckymart-spacing-md bg-white/20 rounded-full luckymart-layout-flex luckymart-layout-center justify-center"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
              >
                {icon || (}
                  <svg className:"luckymart-size-lg luckymart-size-lg" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule:"evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                )
              </motion.div>
              
              <motion.h3
                className:"luckymart-text-lg luckymart-font-bold mb-2"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                成就解锁！
              </motion.h3>
              
              <motion.p
                className:"font-semibold mb-1"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                {title}
              </motion.p>
              
              {description && (}
                <motion.p
                  className:"luckymart-text-sm opacity-90"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  {description}
                </motion.p>
              )
            </div>

            {/* 庆祝粒子效果 */}
            <div className:"absolute inset-0 pointer-events-none">
              {[...Array(8)].map((_, i) => (}
                <motion.div
                  key={i}
                  className:"absolute w-2 h-2 bg-white/60 rounded-full"
                  initial={{ }}
                    scale: 0, 
                    x: '50%', 
                    y: '50%',
                    opacity: 1

                  animate={{ }}
                    scale: [0, 1, 0],
                    x: `${50 + (Math.random() - 0.5) * 200}%`,
                    y: `${50 + (Math.random() - 0.5) * 200}%`,
                    opacity: [1, 1, 0]

                  transition={{ }}
                    duration: 2,
                    delay: 0.5 + i * 0.1,
                    ease: "easeOut"

                />
              ))
            </div>
          </motion.div>
        </motion.div>
      )
    </AnimatePresence>
  );
};

// 手势反馈动画
export const GestureFeedback: React.FC<{}
  children: React.ReactNode;
  type?: 'ripple' | 'highlight' | 'pulse';
  color?: string;
  size?: 'sm' | 'md' | 'lg';
}> = ({ 
  children, 
  type = 'ripple', 
  color = '#8B5CF6',
  size : 'md'
}) => {
  const [ripples, setRipples] = useState<Array<{ id: number; x: number; y: number }>>([]);

  const sizeClasses = {}
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  };

  const handleClick = (e: React.MouseEvent) => {}
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (type === 'ripple') {}
      const newRipple = {}
        id: Date.now(),
        x,
        y
      };
      setRipples(prev => [...prev, newRipple]);
      
      setTimeout(() => {}
        setRipples(prev => prev.filter(r => r.id !== newRipple.id));
      }, 600);

  };

  return (;
    <motion.div
      className:"relative overflow-hidden cursor-pointer"
      onClick={handleClick}
      whileTap={{ scale: 0.95 }}
    >
      {children}
      
      {type :== 'ripple' && ripples.map(ripple => (}
        <motion.div
          key={ripple.id}
          className:"absolute bg-current rounded-full pointer-events-none"
          style={{}}
            left: ripple.x - 32,
            top: ripple.y - 32,
            width: sizeClasses[size],
            height: sizeClasses[size],
            color,
            opacity: 0.3

          initial={{ scale: 0, opacity: 0.3 }}
          animate={{ scale: 2, opacity: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      ))
      
      {type :== 'highlight' && (}
        <motion.div
          className:"absolute inset-0 bg-current pointer-events-none"
          style="{{ color, opacity: 0.1 }"}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1.2, opacity: 0 }}
          transition={{ duration: 0.3 }}
        />
      )
      
      {type :== 'pulse' && (}
        <motion.div
          className:"absolute inset-0 bg-current pointer-events-none rounded-full"
          style="{{ color }"}
          initial={{ scale: 1, opacity: 0.5 }}
          animate={{ scale: 1.5, opacity: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      )
    </motion.div>
  );
};

// 页面级动画容器
export const PageAnimator: React.FC<{}
  children: React.ReactNode;
  pageKey: string;
  className?: string;
}> = ({ children, pageKey, className = '' }) => {
  return (;
    <AnimatePresence mode:"wait">
      <motion.div
        key={pageKey}
        className="{className}"
        initial={{ opacity: 0, x: 100 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -100 }}
        transition={{ }}
          duration: 0.3,
          ease: "easeInOut"

      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};
import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

/* =========================================================
   DATA PILOT — PREMIUM UI SYSTEM
   3D / AI / GLASS / COMMAND CENTER
========================================================= */


/* =========================================================
   AI CORE 3D
========================================================= */

export const AICore3D = ({
  size = 'lg',
  label = 'DATA PILOT AI',
  status = 'AUTONOMOUS ENGINE',
  compact = false,
}) => {
  const particles = useMemo(
    () =>
      Array.from({ length: compact ? 12 : 24 }, (_, index) => ({
        id: index,
        angle: (360 / (compact ? 12 : 24)) * index,
        distance: compact ? 70 + (index % 3) * 12 : 115 + (index % 4) * 18,
        delay: index * 0.12,
        duration: 5 + (index % 5),
        size: index % 3 === 0 ? 4 : 2,
      })),
    [compact]
  );

  const dimensions = {
    sm: {
      wrapper: 'h-40 w-40',
      core: 'h-16 w-16',
      ring: 'h-28 w-28',
      outer: 'h-36 w-36',
    },
    md: {
      wrapper: 'h-56 w-56',
      core: 'h-20 w-20',
      ring: 'h-40 w-40',
      outer: 'h-52 w-52',
    },
    lg: {
      wrapper: 'h-80 w-80',
      core: 'h-28 w-28',
      ring: 'h-56 w-56',
      outer: 'h-72 w-72',
    },
  };

  const d = dimensions[size] || dimensions.lg;

  return (
    <div className={`relative ${d.wrapper} select-none`}>

      {/* Ambient glow */}
      <div
        className="
          absolute
          inset-[20%]
          rounded-full
          bg-[#ff795b]/20
          blur-[45px]
          animate-pulse
        "
      />

      {/* Background sphere */}
      <div
        className="
          absolute
          inset-[14%]
          rounded-full
          border
          border-[#ff795b]/10
          bg-[radial-gradient(circle_at_35%_30%,rgba(255,121,91,.16),transparent_35%),radial-gradient(circle,rgba(255,200,87,.06),transparent_65%)]
        "
      />

      {/* Outer orbit */}
      <motion.div
        className={`absolute left-1/2 top-1/2 ${d.outer} -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#ff795b]/20`}
        animate={{ rotateX: 65, rotateY: -15, rotateZ: 360 }}
        transition={{
          rotateZ: {
            duration: 18,
            repeat: Infinity,
            ease: 'linear',
          },
        }}
        style={{
          transformStyle: 'preserve-3d',
          perspective: 900,
        }}
      />

      {/* Second orbit */}
      <motion.div
        className={`absolute left-1/2 top-1/2 ${d.ring} -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#ffc857]/20`}
        animate={{ rotateX: -60, rotateY: 25, rotateZ: -360 }}
        transition={{
          rotateZ: {
            duration: 13,
            repeat: Infinity,
            ease: 'linear',
          },
        }}
        style={{
          transformStyle: 'preserve-3d',
          perspective: 900,
        }}
      />

      {/* Third orbit */}
      <motion.div
        className="
          absolute
          left-1/2
          top-1/2
          h-[68%]
          w-[108%]
          -translate-x-1/2
          -translate-y-1/2
          rounded-[50%]
          border
          border-[#ff795b]/10
        "
        animate={{ rotateZ: 360 }}
        transition={{
          duration: 22,
          repeat: Infinity,
          ease: 'linear',
        }}
        style={{
          transform: 'rotateX(70deg)',
        }}
      />

      {/* Orbit particles */}
      {particles.map((particle) => {
        const radius = particle.distance;

        return (
          <motion.span
            key={particle.id}
            className="
              absolute
              left-1/2
              top-1/2
              rounded-full
              bg-[#ff795b]
              shadow-[0_0_14px_rgba(255,121,91,.8)]
            "
            style={{
              width: particle.size,
              height: particle.size,
              marginLeft: -particle.size / 2,
              marginTop: -particle.size / 2,
            }}
            animate={{
              x: Math.cos((particle.angle * Math.PI) / 180) * radius,
              y: Math.sin((particle.angle * Math.PI) / 180) * radius,
              opacity: [0.15, 1, 0.25],
              scale: [0.7, 1.5, 0.7],
            }}
            transition={{
              duration: particle.duration,
              delay: particle.delay,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        );
      })}

      {/* Core */}
      <motion.div
        className="
          absolute
          left-1/2
          top-1/2
          -translate-x-1/2
          -translate-y-1/2
        "
        animate={{
          y: [-3, 3, -3],
        }}
        transition={{
          duration: 3.5,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        <div
          className={`
            ${d.core}
            relative
            flex
            items-center
            justify-center
            overflow-hidden
            rounded-[30%]
            border
            border-[#ff795b]/40
            bg-[#0d0d0d]
            shadow-[0_0_50px_rgba(255,121,91,.18),inset_0_0_30px_rgba(255,121,91,.08)]
          `}
        >

          {/* Core scanning light */}
          <motion.div
            className="
              absolute
              left-0
              right-0
              h-[2px]
              bg-gradient-to-r
              from-transparent
              via-[#ff795b]
              to-transparent
              shadow-[0_0_12px_#ff795b]
            "
            animate={{
              top: ['15%', '85%', '15%'],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: 2.8,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />

          {/* AI symbol */}
          <div className="relative z-10 text-center">
            <div
              className="
                text-xl
                font-black
                tracking-[-0.08em]
                text-[#f5f2ec]
              "
            >
              DP
            </div>

            <div
              className="
                mt-0.5
                text-[6px]
                font-bold
                tracking-[0.28em]
                text-[#ff795b]
              "
            >
              AI
            </div>
          </div>

          {/* Rotating inner ring */}
          <motion.div
            className="
              absolute
              inset-2
              rounded-[25%]
              border
              border-dashed
              border-[#ff795b]/20
            "
            animate={{ rotate: 360 }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: 'linear',
            }}
          />
        </div>
      </motion.div>

      {/* Status */}
      {!compact && (
        <div className="absolute bottom-[-14px] left-1/2 -translate-x-1/2 text-center">

          <div className="flex items-center justify-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#63d6a2] opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[#63d6a2]" />
            </span>

            <span className="text-[9px] font-bold tracking-[0.2em] text-[#a29d95]">
              {status}
            </span>
          </div>

          <div className="mt-1 text-[8px] tracking-[0.25em] text-[#57534d]">
            {label}
          </div>

        </div>
      )}

    </div>
  );
};


/* =========================================================
   AI STATUS BAR
========================================================= */

export const AIStatus = ({
  status = 'Autonomous Intelligence Active',
  detail = 'Monitoring dataset intelligence',
}) => (
  <div
    className="
      flex
      items-center
      gap-3
      rounded-xl
      border
      border-white/[0.07]
      bg-white/[0.025]
      px-4
      py-3
      backdrop-blur-xl
    "
  >
    <span className="relative flex h-2.5 w-2.5 shrink-0">
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#63d6a2] opacity-50" />
      <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#63d6a2]" />
    </span>

    <div className="min-w-0">
      <div className="truncate text-xs font-semibold text-[#e8e5df]">
        {status}
      </div>

      <div className="truncate text-[10px] text-[#6f6b64]">
        {detail}
      </div>
    </div>

    <div className="ml-auto flex items-center gap-1">
      {[0, 1, 2, 3].map((item) => (
        <motion.span
          key={item}
          className="h-3 w-[2px] rounded-full bg-[#ff795b]"
          animate={{
            height: [5, 12, 7, 5],
          }}
          transition={{
            duration: 1,
            delay: item * 0.12,
            repeat: Infinity,
          }}
        />
      ))}
    </div>
  </div>
);


/* =========================================================
   CARD
========================================================= */

export const Card = ({
  children,
  className = '',
  hover = false,
  glow = false,
  ...props
}) => (
  <motion.div
    whileHover={
      hover
        ? {
            y: -3,
            rotateX: 1,
            rotateY: -1,
          }
        : undefined
    }
    transition={{
      duration: 0.25,
      ease: 'easeOut',
    }}
    className={`
      dp-card
      group
      relative
      overflow-hidden
      rounded-[16px]
      border
      border-white/[0.07]
      bg-[#101010]/90
      p-5
      backdrop-blur-xl
      ${hover ? 'cursor-default' : ''}
      ${glow ? 'shadow-[0_0_45px_rgba(255,121,91,.06)]' : ''}
      ${className}
    `}
    style={{
      transformStyle: 'preserve-3d',
    }}
    {...props}
  >
    {/* top reflection */}
    <div
      className="
        pointer-events-none
        absolute
        inset-x-0
        top-0
        h-px
        bg-gradient-to-r
        from-transparent
        via-white/[0.12]
        to-transparent
      "
    />

    {/* hover glow */}
    <div
      className="
        pointer-events-none
        absolute
        -right-20
        -top-20
        h-40
        w-40
        rounded-full
        bg-[#ff795b]/0
        blur-3xl
        transition
        duration-500
        group-hover:bg-[#ff795b]/[0.045]
      "
    />

    <div className="relative z-10">
      {children}
    </div>
  </motion.div>
);


/* =========================================================
   3D GLASS PANEL
========================================================= */

export const GlassPanel = ({
  children,
  className = '',
  title = '',
  subtitle = '',
}) => (
  <div
    className={`
      relative
      overflow-hidden
      rounded-2xl
      border
      border-white/[0.08]
      bg-[#0e0e0e]/80
      p-5
      shadow-[0_20px_70px_rgba(0,0,0,.25)]
      backdrop-blur-2xl
      ${className}
    `}
  >

    {/* ambient light */}
    <div
      className="
        pointer-events-none
        absolute
        -right-16
        -top-16
        h-40
        w-40
        rounded-full
        bg-[#ff795b]/[0.05]
        blur-3xl
      "
    />

    {(title || subtitle) && (
      <div className="relative z-10 mb-5">
        {title && (
          <h3 className="text-sm font-semibold text-[#e8e5df]">
            {title}
          </h3>
        )}

        {subtitle && (
          <p className="mt-1 text-[11px] text-[#6f6b64]">
            {subtitle}
          </p>
        )}
      </div>
    )}

    <div className="relative z-10">
      {children}
    </div>
  </div>
);


/* =========================================================
   PAGE
========================================================= */

export const Page = ({
  title,
  sub,
  children,
  action = null,
  eyebrow = 'DATAPILOT AI',
}) => (
  <div className="relative space-y-7">

    {/* Background grid */}
    <div
      className="
        pointer-events-none
        absolute
        inset-0
        -z-10
        opacity-[0.025]
        [background-image:linear-gradient(rgba(255,255,255,.8)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.8)_1px,transparent_1px)]
        [background-size:42px_42px]
      "
    />

    <div
      className="
        flex
        flex-col
        gap-5
        md:flex-row
        md:items-end
        md:justify-between
      "
    >

      <div>

        {eyebrow && (
          <div className="mb-2 flex items-center gap-2">

            <span className="h-1.5 w-1.5 rounded-full bg-[#ff795b] shadow-[0_0_10px_#ff795b]" />

            <span className="text-[9px] font-bold tracking-[0.22em] text-[#77736d]">
              {eyebrow}
            </span>

          </div>
        )}

        <h1
          className="
            text-2xl
            font-semibold
            tracking-[-0.03em]
            text-[#f4f2ed]
            md:text-3xl
          "
        >
          {title}
        </h1>

        {sub && (
          <p
            className="
              mt-2
              max-w-3xl
              text-sm
              leading-6
              text-[#85817a]
            "
          >
            {sub}
          </p>
        )}

      </div>

      {action && (
        <div className="shrink-0">
          {action}
        </div>
      )}

    </div>

    {children}

  </div>
);


/* =========================================================
   BUTTON
========================================================= */

export const Button = ({
  children,
  className = '',
  variant = 'primary',
  loading = false,
  disabled = false,
  type = 'button',
  ...props
}) => {

  const variants = {

    primary: `
      border-[#ff795b]/60
      bg-[#ff795b]
      text-[#160b08]
      shadow-[0_8px_30px_rgba(255,121,91,.15)]
      hover:bg-[#ff876c]
      hover:shadow-[0_10px_35px_rgba(255,121,91,.25)]
    `,

    secondary: `
      border-white/[0.1]
      bg-white/[0.045]
      text-[#e6e2dc]
      hover:bg-white/[0.075]
    `,

    ghost: `
      border-transparent
      bg-transparent
      text-[#a29d95]
      hover:bg-white/[0.045]
      hover:text-[#e8e5df]
    `,

    danger: `
      border-transparent
      bg-[#d95c5c]
      text-white
      hover:bg-[#e76b6b]
    `,

    success: `
      border-transparent
      bg-[#4ebf8a]
      text-[#06150e]
      hover:bg-[#62d19e]
    `,
  };

  return (
    <motion.button
      whileHover={
        !disabled && !loading
          ? {
              y: -1,
              scale: 1.01,
            }
          : undefined
      }
      whileTap={
        !disabled && !loading
          ? {
              scale: 0.98,
            }
          : undefined
      }
      type={type}
      disabled={disabled || loading}
      className={`
        dp-button
        inline-flex
        items-center
        justify-center
        gap-2
        rounded-lg
        border
        px-4
        py-2.5
        text-sm
        font-medium
        transition
        duration-200
        disabled:cursor-not-allowed
        disabled:opacity-40
        ${variants[variant] || variants.primary}
        ${className}
      `}
      {...props}
    >

      {loading && (
        <span
          className="
            h-4
            w-4
            animate-spin
            rounded-full
            border-2
            border-current/25
            border-t-current
          "
        />
      )}

      {children}

    </motion.button>
  );
};


/* =========================================================
   EMPTY
========================================================= */

export const Empty = ({
  text = 'Upload a dataset from Overview to unlock this module.',
  title = 'No dataset loaded',
  action = null,
}) => (
  <Card className="py-16 text-center">

    <div className="flex justify-center">
      <AICore3D size="sm" compact />
    </div>

    <h2 className="mt-8 text-lg font-semibold text-[#e8e5df]">
      {title}
    </h2>

    <p
      className="
        mx-auto
        mt-2
        max-w-md
        text-sm
        leading-6
        text-[#77736d]
      "
    >
      {text}
    </p>

    {action && (
      <div className="mt-6 flex justify-center">
        {action}
      </div>
    )}

  </Card>
);


/* =========================================================
   METRIC
========================================================= */

export const Metric = ({
  label,
  value,
  detail,
  icon = null,
  trend = null,
  className = '',
}) => (
  <Card
    hover
    className={`
      relative
      overflow-hidden
      ${className}
    `}
  >

    <div className="flex items-start justify-between gap-4">

      <div>

        <div
          className="
            text-[10px]
            font-semibold
            uppercase
            tracking-[0.12em]
            text-[#716d66]
          "
        >
          {label}
        </div>

        <div
          className="
            mt-2
            text-2xl
            font-semibold
            tracking-tight
            text-[#f4f1eb]
          "
        >
          {value}
        </div>

        {detail && (
          <div className="mt-1 text-[11px] text-[#6f6b64]">
            {detail}
          </div>
        )}

      </div>

      {icon && (
        <div
          className="
            flex
            h-10
            w-10
            items-center
            justify-center
            rounded-xl
            border
            border-[#ff795b]/10
            bg-[#ff795b]/[0.04]
            text-[#ff795b]
            shadow-[0_0_20px_rgba(255,121,91,.04)]
          "
        >
          {icon}
        </div>
      )}

    </div>

    {trend && (
      <div
        className="
          mt-4
          border-t
          border-white/[0.05]
          pt-3
          text-[11px]
          text-[#77736d]
        "
      >
        {trend}
      </div>
    )}

  </Card>
);


/* =========================================================
   AI METRIC
========================================================= */

export const AIMetric = ({
  label,
  value,
  description,
  progress = null,
}) => (
  <Card
    hover
    glow
    className="relative"
  >

    <div className="flex items-center justify-between">

      <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#716d66]">
        {label}
      </span>

      <span className="h-1.5 w-1.5 rounded-full bg-[#63d6a2] shadow-[0_0_8px_#63d6a2]" />

    </div>

    <div className="mt-3 flex items-end gap-2">

      <span className="text-3xl font-semibold tracking-tight text-[#f4f1eb]">
        {value}
      </span>

    </div>

    {description && (
      <p className="mt-2 text-[11px] leading-5 text-[#6f6b64]">
        {description}
      </p>
    )}

    {progress !== null && (
      <div className="mt-4">
        <Progress value={progress} showValue={false} />
      </div>
    )}

  </Card>
);


/* =========================================================
   FADE
========================================================= */

export const Fade = ({
  children,
  delay = 0,
  duration = 0.3,
  y = 8,
  className = '',
}) => (
  <motion.div
    initial={{
      opacity: 0,
      y,
    }}
    animate={{
      opacity: 1,
      y: 0,
    }}
    transition={{
      duration,
      delay,
      ease: 'easeOut',
    }}
    className={className}
  >
    {children}
  </motion.div>
);


/* =========================================================
   STAGGER CONTAINER
========================================================= */

export const Stagger = ({
  children,
  className = '',
}) => (
  <motion.div
    initial="hidden"
    animate="show"
    variants={{
      hidden: {},
      show: {
        transition: {
          staggerChildren: 0.07,
        },
      },
    }}
    className={className}
  >
    {children}
  </motion.div>
);


/* =========================================================
   STAGGER ITEM
========================================================= */

export const StaggerItem = ({
  children,
  className = '',
}) => (
  <motion.div
    variants={{
      hidden: {
        opacity: 0,
        y: 12,
      },
      show: {
        opacity: 1,
        y: 0,
        transition: {
          duration: 0.35,
          ease: 'easeOut',
        },
      },
    }}
    className={className}
  >
    {children}
  </motion.div>
);


/* =========================================================
   SECTION
========================================================= */

export const Section = ({
  title,
  description,
  children,
  action = null,
  className = '',
}) => (
  <section className={`space-y-4 ${className}`}>

    {(title || description || action) && (
      <div
        className="
          flex
          flex-col
          gap-3
          md:flex-row
          md:items-end
          md:justify-between
        "
      >

        <div>

          {title && (
            <h2 className="text-base font-semibold text-[#e5e1da]">
              {title}
            </h2>
          )}

          {description && (
            <p className="mt-1 text-xs leading-5 text-[#77736d]">
              {description}
            </p>
          )}

        </div>

        {action && (
          <div>
            {action}
          </div>
        )}

      </div>
    )}

    {children}

  </section>
);


/* =========================================================
   BADGE
========================================================= */

export const Badge = ({
  children,
  variant = 'default',
  className = '',
}) => {

  const variants = {

    default:
      'bg-white/[0.04] text-[#aaa59d] border-white/[0.08]',

    primary:
      'bg-[#ff795b]/10 text-[#ffad99] border-[#ff795b]/20',

    success:
      'bg-[#69d6a0]/10 text-[#83e4b1] border-[#69d6a0]/20',

    warning:
      'bg-[#f4c95d]/10 text-[#f6d979] border-[#f4c95d]/20',

    danger:
      'bg-[#ff7272]/10 text-[#ff9696] border-[#ff7272]/20',
  };

  return (
    <span
      className={`
        inline-flex
        items-center
        gap-1.5
        rounded-full
        border
        px-2.5
        py-1
        text-[10px]
        font-semibold
        ${variants[variant] || variants.default}
        ${className}
      `}
    >
      {children}
    </span>
  );
};


/* =========================================================
   PROGRESS
========================================================= */

export const Progress = ({
  value = 0,
  label = '',
  showValue = true,
}) => {

  const safeValue = Math.min(
    100,
    Math.max(
      0,
      Number(value) || 0
    )
  );

  return (
    <div className="space-y-2">

      {(label || showValue) && (
        <div
          className="
            flex
            items-center
            justify-between
            text-[11px]
          "
        >

          {label && (
            <span className="text-[#77736d]">
              {label}
            </span>
          )}

          {showValue && (
            <span className="font-medium text-[#aaa59d]">
              {safeValue.toFixed(0)}%
            </span>
          )}

        </div>
      )}

      <div
        className="
          relative
          h-1.5
          overflow-hidden
          rounded-full
          bg-white/[0.06]
        "
      >

        <motion.div
          initial={{
            width: 0,
          }}
          animate={{
            width: `${safeValue}%`,
          }}
          transition={{
            duration: 0.8,
            ease: 'easeOut',
          }}
          className="
            relative
            h-full
            rounded-full
            bg-gradient-to-r
            from-[#ff795b]
            to-[#ffc857]
            shadow-[0_0_12px_rgba(255,121,91,.3)]
          "
        />

      </div>

    </div>
  );
};


/* =========================================================
   SPINNER
========================================================= */

export const Spinner = ({
  size = 'md',
}) => {

  const sizes = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-9 w-9',
  };

  return (
    <span
      className={`
        inline-block
        animate-spin
        rounded-full
        border-2
        border-[#ff795b]/20
        border-t-[#ff795b]
        ${sizes[size] || sizes.md}
      `}
      aria-label="Loading"
    />
  );
};


/* =========================================================
   LOADING
========================================================= */

export const Loading = ({
  text = 'Analyzing your dataset...',
}) => (
  <Card className="py-12 text-center">

    <div className="flex justify-center">
      <AICore3D size="sm" compact />
    </div>

    <h3 className="mt-8 font-semibold text-[#e8e5df]">
      DataPilot Intelligence Engine
    </h3>

    <p className="mt-2 text-sm text-[#77736d]">
      {text}
    </p>

    <div className="mx-auto mt-5 max-w-xs">
      <Progress value={68} showValue={false} />
    </div>

    <div className="mt-3 text-[9px] font-semibold uppercase tracking-[0.2em] text-[#57534d]">
      Profiling • Reasoning • Analyzing
    </div>

  </Card>
);


/* =========================================================
   ALERT
========================================================= */

export const Alert = ({
  children,
  type = 'info',
}) => {

  const styles = {

    info:
      'bg-[#ff795b]/[0.07] border-[#ff795b]/15 text-[#ffb09e]',

    success:
      'bg-[#69d6a0]/[0.07] border-[#69d6a0]/15 text-[#8ce6b8]',

    warning:
      'bg-[#f4c95d]/[0.07] border-[#f4c95d]/15 text-[#f6db82]',

    error:
      'bg-[#ff7272]/[0.07] border-[#ff7272]/15 text-[#ff9c9c]',
  };

  return (
    <motion.div
      initial={{
        opacity: 0,
        y: 5,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      className={`
        rounded-xl
        border
        px-4
        py-3
        text-sm
        backdrop-blur-xl
        ${styles[type] || styles.info}
      `}
    >
      {children}
    </motion.div>
  );
};


/* =========================================================
   AI PIPELINE
========================================================= */

export const AIPipeline = ({
  active = 2,
}) => {

  const steps = [
    'Ingest',
    'Profile',
    'Quality',
    'EDA',
    'Model',
    'Explain',
  ];

  return (
    <div className="relative">

      <div className="absolute left-0 right-0 top-3 h-px bg-white/[0.07]" />

      <motion.div
        className="
          absolute
          left-0
          top-3
          h-px
          bg-gradient-to-r
          from-[#ff795b]
          to-[#ffc857]
          shadow-[0_0_10px_rgba(255,121,91,.5)]
        "
        initial={{ width: 0 }}
        animate={{
          width: `${Math.min(
            100,
            Math.max(0, (active / (steps.length - 1)) * 100)
          )}%`,
        }}
        transition={{ duration: 0.8 }}
      />

      <div className="relative grid grid-cols-6 gap-2">

        {steps.map((step, index) => {

          const complete = index < active;
          const current = index === active;

          return (
            <div
              key={step}
              className="flex flex-col items-center"
            >

              <motion.div
                animate={
                  current
                    ? {
                        scale: [1, 1.15, 1],
                      }
                    : undefined
                }
                transition={{
                  duration: 1.4,
                  repeat: Infinity,
                }}
                className={`
                  flex
                  h-6
                  w-6
                  items-center
                  justify-center
                  rounded-full
                  border
                  text-[8px]
                  font-bold
                  ${
                    complete || current
                      ? 'border-[#ff795b]/50 bg-[#ff795b]/15 text-[#ffad99]'
                      : 'border-white/[0.08] bg-[#111] text-[#57534d]'
                  }
                `}
              >
                {complete ? '✓' : index + 1}
              </motion.div>

              <span
                className={`
                  mt-2
                  text-[8px]
                  ${
                    current
                      ? 'font-semibold text-[#ffad99]'
                      : 'text-[#625e58]'
                  }
                `}
              >
                {step}
              </span>

            </div>
          );
        })}

      </div>

    </div>
  );
};


/* =========================================================
   EXPORT DEFAULT
========================================================= */

export default {
  AICore3D,
  AIStatus,
  AIPipeline,
  Card,
  GlassPanel,
  Page,
  Button,
  Empty,
  Metric,
  AIMetric,
  Fade,
  Stagger,
  StaggerItem,
  Section,
  Badge,
  Progress,
  Spinner,
  Loading,
  Alert,
};
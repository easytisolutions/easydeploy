"use client";

import { type HTMLMotionProps, type Variants, motion } from "framer-motion";
import type { ReactNode } from "react";

// ─── Reusable animation variants ───────────────────────────────────
export const fadeIn: Variants = {
	hidden: { opacity: 0 },
	visible: { opacity: 1, transition: { duration: 0.3 } },
};

export const fadeInUp: Variants = {
	hidden: { opacity: 0, y: 20 },
	visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

export const fadeInDown: Variants = {
	hidden: { opacity: 0, y: -20 },
	visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

export const scaleIn: Variants = {
	hidden: { opacity: 0, scale: 0.9 },
	visible: {
		opacity: 1,
		scale: 1,
		transition: { duration: 0.3, ease: "easeOut" },
	},
};

export const slideInLeft: Variants = {
	hidden: { opacity: 0, x: -30 },
	visible: { opacity: 1, x: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

export const slideInRight: Variants = {
	hidden: { opacity: 0, x: 30 },
	visible: { opacity: 1, x: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

export const staggerContainer: Variants = {
	hidden: { opacity: 0 },
	visible: {
		opacity: 1,
		transition: { staggerChildren: 0.08, delayChildren: 0.1 },
	},
};

export const staggerItem: Variants = {
	hidden: { opacity: 0, y: 15 },
	visible: {
		opacity: 1,
		y: 0,
		transition: { duration: 0.3, ease: "easeOut" },
	},
};

// ─── Motion wrapper components ─────────────────────────────────────
interface AnimatedProps extends HTMLMotionProps<"div"> {
	children: ReactNode;
	className?: string;
}

export const FadeIn = ({ children, className, ...props }: AnimatedProps) => (
	<motion.div
		initial="hidden"
		animate="visible"
		variants={fadeIn}
		className={className}
		{...props}
	>
		{children}
	</motion.div>
);

export const FadeInUp = ({ children, className, ...props }: AnimatedProps) => (
	<motion.div
		initial="hidden"
		animate="visible"
		variants={fadeInUp}
		className={className}
		{...props}
	>
		{children}
	</motion.div>
);

export const StaggerList = ({
	children,
	className,
	...props
}: AnimatedProps) => (
	<motion.div
		initial="hidden"
		animate="visible"
		variants={staggerContainer}
		className={className}
		{...props}
	>
		{children}
	</motion.div>
);

export const StaggerItem = ({
	children,
	className,
	...props
}: AnimatedProps) => (
	<motion.div variants={staggerItem} className={className} {...props}>
		{children}
	</motion.div>
);

// ─── Page transition wrapper ───────────────────────────────────────
export const PageTransition = ({
	children,
	className,
}: { children: ReactNode; className?: string }) => (
	<motion.div
		initial={{ opacity: 0, y: 10 }}
		animate={{ opacity: 1, y: 0 }}
		exit={{ opacity: 0, y: -10 }}
		transition={{ duration: 0.3, ease: "easeInOut" }}
		className={className}
	>
		{children}
	</motion.div>
);

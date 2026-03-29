"use client";

import { motion } from "framer-motion";

export function DeployRocketAnimation({
	phase = "idle",
}: { phase?: "idle" | "launching" | "deployed" }) {
	return (
		<div className="relative w-24 h-24 flex items-center justify-center">
			{/* Glow ring */}
			{phase === "launching" && (
				<motion.div
					className="absolute inset-0 rounded-full bg-easyti-primary/20"
					animate={{ scale: [1, 1.4, 1], opacity: [0.5, 0, 0.5] }}
					transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY }}
				/>
			)}

			{/* Rocket body */}
			<motion.svg
				viewBox="0 0 64 64"
				className="w-16 h-16"
				animate={
					phase === "idle"
						? { y: [0, -4, 0] }
						: phase === "launching"
							? { y: [0, -60], opacity: [1, 1, 0] }
							: { scale: [0.8, 1], opacity: [0, 1] }
				}
				transition={
					phase === "idle"
						? { duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }
						: { duration: 1.2, ease: "easeIn" }
				}
			>
				{/* Rocket shape */}
				<path
					d="M32 4 C32 4 20 16 20 36 L26 42 L38 42 L44 36 C44 16 32 4 32 4Z"
					className="fill-easyti-primary"
				/>
				{/* Window */}
				<circle cx="32" cy="24" r="4" className="fill-white/90" />
				{/* Fins */}
				<path d="M20 36 L14 46 L22 42Z" className="fill-easyti-primary-dark" />
				<path d="M44 36 L50 46 L42 42Z" className="fill-easyti-primary-dark" />
				{/* Flame */}
				{(phase === "idle" || phase === "launching") && (
					<motion.path
						d="M26 42 L32 56 L38 42Z"
						className="fill-orange-400"
						animate={{ opacity: [1, 0.6, 1], scaleY: [1, 1.3, 1] }}
						transition={{ duration: 0.3, repeat: Number.POSITIVE_INFINITY }}
						style={{ transformOrigin: "center top" }}
					/>
				)}
			</motion.svg>

			{/* Deploy success checkmark */}
			{phase === "deployed" && (
				<motion.div
					className="absolute inset-0 flex items-center justify-center"
					initial={{ scale: 0, opacity: 0 }}
					animate={{ scale: 1, opacity: 1 }}
					transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
				>
					<div className="w-16 h-16 rounded-full bg-easyti-success/20 flex items-center justify-center">
						<svg viewBox="0 0 24 24" className="w-8 h-8">
							<motion.path
								d="M5 13l4 4L19 7"
								fill="none"
								className="stroke-easyti-success"
								strokeWidth={3}
								strokeLinecap="round"
								strokeLinejoin="round"
								initial={{ pathLength: 0 }}
								animate={{ pathLength: 1 }}
								transition={{ delay: 0.7, duration: 0.5 }}
							/>
						</svg>
					</div>
				</motion.div>
			)}
		</div>
	);
}

export function TechScannerAnimation({
	isScanning = false,
}: { isScanning?: boolean }) {
	return (
		<div className="relative w-20 h-20 flex items-center justify-center">
			{/* Outer ring */}
			<motion.div
				className="absolute inset-0 rounded-full border-2 border-easyti-primary/30"
				animate={isScanning ? { scale: [1, 1.1, 1] } : {}}
				transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY }}
			/>

			{/* Scanning sweep */}
			{isScanning && (
				<motion.div
					className="absolute inset-2 rounded-full"
					style={{
						background:
							"conic-gradient(from 0deg, transparent 0%, hsl(var(--easyti-primary) / 0.3) 30%, transparent 60%)",
					}}
					animate={{ rotate: 360 }}
					transition={{
						duration: 1.5,
						repeat: Number.POSITIVE_INFINITY,
						ease: "linear",
					}}
				/>
			)}

			{/* Center dot */}
			<motion.div
				className="w-3 h-3 rounded-full bg-easyti-primary"
				animate={isScanning ? { scale: [1, 1.3, 1] } : {}}
				transition={{ duration: 0.8, repeat: Number.POSITIVE_INFINITY }}
			/>

			{/* Radar blips */}
			{isScanning && (
				<>
					{[0, 1, 2].map((i) => (
						<motion.div
							key={i}
							className="absolute w-2 h-2 rounded-full bg-easyti-primary"
							initial={{ opacity: 0, scale: 0 }}
							animate={{
								opacity: [0, 1, 0],
								scale: [0, 1, 0],
							}}
							transition={{
								duration: 1.5,
								repeat: Number.POSITIVE_INFINITY,
								delay: i * 0.5,
							}}
							style={{
								top: `${20 + i * 15}%`,
								left: `${30 + i * 20}%`,
							}}
						/>
					))}
				</>
			)}
		</div>
	);
}

export function StatusPulse({
	status,
	size = "md",
}: {
	status: "running" | "building" | "error" | "idle";
	size?: "sm" | "md" | "lg";
}) {
	const sizeMap = { sm: "w-2.5 h-2.5", md: "w-3.5 h-3.5", lg: "w-5 h-5" };
	const colorMap = {
		running: "bg-easyti-success",
		building: "bg-easyti-warning",
		error: "bg-easyti-error",
		idle: "bg-muted-foreground/50",
	};

	return (
		<span className={`relative inline-flex ${sizeMap[size]}`}>
			{(status === "running" || status === "building") && (
				<motion.span
					className={`absolute inset-0 rounded-full ${colorMap[status]} opacity-75`}
					animate={{ scale: [1, 1.8], opacity: [0.75, 0] }}
					transition={{
						duration: status === "building" ? 1 : 1.5,
						repeat: Number.POSITIVE_INFINITY,
					}}
				/>
			)}
			<span className={`relative inline-flex rounded-full ${sizeMap[size]} ${colorMap[status]}`} />
		</span>
	);
}

export function BuildProgressAnimation({
	currentStep = 0,
}: { currentStep?: number }) {
	const steps = [
		{ label: "Código", icon: "{ }" },
		{ label: "Build", icon: "⚡" },
		{ label: "Deploy", icon: "📦" },
		{ label: "Live", icon: "🌐" },
	];

	return (
		<div className="flex items-center gap-1 w-full max-w-xs">
			{steps.map((step, i) => (
				<div key={step.label} className="flex items-center flex-1">
					<motion.div
						className={`flex flex-col items-center gap-1 ${i <= currentStep ? "opacity-100" : "opacity-40"}`}
						animate={i === currentStep ? { scale: [1, 1.05, 1] } : {}}
						transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY }}
					>
						<div
							className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
								i < currentStep
									? "bg-easyti-success text-white"
									: i === currentStep
										? "bg-easyti-primary text-white"
										: "bg-muted text-muted-foreground"
							}`}
						>
							{i < currentStep ? "✓" : step.icon}
						</div>
						<span className="text-[10px] text-muted-foreground">
							{step.label}
						</span>
					</motion.div>

					{i < steps.length - 1 && (
						<motion.div
							className={`flex-1 h-0.5 mx-1 rounded ${i < currentStep ? "bg-easyti-success" : "bg-border"}`}
							initial={{ scaleX: 0 }}
							animate={{ scaleX: i < currentStep ? 1 : 0 }}
							transition={{ duration: 0.5, delay: i * 0.3 }}
							style={{ transformOrigin: "left" }}
						/>
					)}
				</div>
			))}
		</div>
	);
}

export function SuccessCheckmark() {
	return (
		<div className="w-16 h-16 flex items-center justify-center">
			<svg viewBox="0 0 52 52" className="w-full h-full">
				{/* Circle */}
				<motion.circle
					cx="26"
					cy="26"
					r="24"
					fill="none"
					className="stroke-easyti-success"
					strokeWidth="2"
					initial={{ pathLength: 0 }}
					animate={{ pathLength: 1 }}
					transition={{ duration: 0.6, ease: "easeOut" }}
				/>
				{/* Checkmark */}
				<motion.path
					d="M14 27l7 7 16-16"
					fill="none"
					className="stroke-easyti-success"
					strokeWidth="3"
					strokeLinecap="round"
					strokeLinejoin="round"
					initial={{ pathLength: 0 }}
					animate={{ pathLength: 1 }}
					transition={{ delay: 0.4, duration: 0.4, ease: "easeOut" }}
				/>
			</svg>
		</div>
	);
}

export function EmptyProjectsIllustration() {
	return (
		<div className="flex flex-col items-center gap-4">
			<motion.svg
				viewBox="0 0 120 100"
				className="w-32 h-28 text-muted-foreground/30"
				initial={{ opacity: 0, y: 10 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.5 }}
			>
				{/* Folder shape */}
				<motion.rect
					x="10"
					y="30"
					width="100"
					height="60"
					rx="6"
					fill="currentColor"
					initial={{ scale: 0.9 }}
					animate={{ scale: 1 }}
					transition={{ duration: 0.4, delay: 0.2 }}
				/>
				<motion.path
					d="M10 30 L10 24 Q10 18 16 18 L45 18 L55 28 L104 28 Q110 28 110 34"
					fill="none"
					stroke="currentColor"
					strokeWidth="2"
					className="opacity-60"
				/>
				{/* Plus icon */}
				<motion.g
					initial={{ scale: 0, opacity: 0 }}
					animate={{ scale: 1, opacity: 0.5 }}
					transition={{ delay: 0.5, type: "spring" }}
				>
					<line
						x1="60"
						y1="50"
						x2="60"
						y2="74"
						stroke="white"
						strokeWidth="3"
						strokeLinecap="round"
					/>
					<line
						x1="48"
						y1="62"
						x2="72"
						y2="62"
						stroke="white"
						strokeWidth="3"
						strokeLinecap="round"
					/>
				</motion.g>
			</motion.svg>
		</div>
	);
}

export function LoadingSkeleton({
	lines = 3,
}: { lines?: number }) {
	return (
		<div className="space-y-3 w-full">
			{Array.from({ length: lines }).map((_, i) => (
				<motion.div
					key={i}
					className="h-4 bg-muted rounded"
					style={{ width: `${80 - i * 15}%` }}
					animate={{ opacity: [0.3, 0.6, 0.3] }}
					transition={{
						duration: 1.5,
						repeat: Number.POSITIVE_INFINITY,
						delay: i * 0.2,
					}}
				/>
			))}
		</div>
	);
}

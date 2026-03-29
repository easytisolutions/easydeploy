import { StatusPulse } from "@/components/atoms/animations/animated-svgs";

const STATUS_LABELS: Record<string, string> = {
	running: "Online",
	done: "Online",
	building: "Building",
	error: "Erro",
	idle: "Idle",
};

const STATUS_MAP: Record<string, "running" | "building" | "error" | "idle"> = {
	running: "running",
	done: "running",
	building: "building",
	error: "error",
	idle: "idle",
};

interface StatusBadgeProps {
	status: string;
	showLabel?: boolean;
	size?: "sm" | "md" | "lg";
}

export function StatusBadge({
	status,
	showLabel = true,
	size = "sm",
}: StatusBadgeProps) {
	const mapped = STATUS_MAP[status] ?? "idle";
	const label = STATUS_LABELS[status] ?? status;

	return (
		<span className="inline-flex items-center gap-1.5">
			<StatusPulse status={mapped} size={size} />
			{showLabel && (
				<span className="text-xs text-muted-foreground capitalize">
					{label}
				</span>
			)}
		</span>
	);
}

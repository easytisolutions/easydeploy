import { cn } from "@/lib/utils";

interface Props {
	className?: string;
	logoUrl?: string;
}

export const Logo = ({ className = "size-14", logoUrl }: Props) => {
	if (logoUrl) {
		return (
			// biome-ignore lint/performance/noImgElement: this is for dynamic logo loading
			<img
				src={logoUrl}
				alt="EasyTI Cloud Logo"
				className={cn(className, "object-contain rounded-sm")}
			/>
		);
	}

	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 100 100"
			className={className}
			aria-label="EasyTI Cloud"
		>
			{/* Cloud shape */}
			<path
				className="fill-easyti-primary stroke-easyti-primary"
				strokeWidth="1"
				d="M75 55c0-11-9-20-20-20a20 20 0 0 0-19.5 15.5A12.5 12.5 0 0 0 37.5 75h37.5A12.5 12.5 0 0 0 75 55Z"
			/>
			{/* Lightning bolt (deploy) */}
			<path
				fill="white"
				d="M56 38 l-10 16 h7 l-4 14 12-18 h-7 z"
			/>
		</svg>
	);
};

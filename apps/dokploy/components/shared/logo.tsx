import { cn } from "@/lib/utils";

interface Props {
	className?: string;
	logoUrl?: string;
}

export const Logo = ({ className = "h-10 w-auto", logoUrl }: Props) => {
	return (
		// biome-ignore lint/performance/noImgElement: this is for dynamic logo loading
		<img
			src={logoUrl || "/easyti-logo.png"}
			alt="EasyTI Cloud"
			className={cn(className, "object-contain")}
		/>
	);
};

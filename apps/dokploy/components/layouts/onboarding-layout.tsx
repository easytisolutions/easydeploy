import Link from "next/link";
import type React from "react";
import { cn } from "@/lib/utils";
import { useWhitelabelingPublic } from "@/utils/hooks/use-whitelabeling";
import { Logo } from "../shared/logo";

interface Props {
	children: React.ReactNode;
}
export const OnboardingLayout = ({ children }: Props) => {
	const { config: whitelabeling } = useWhitelabelingPublic();
	const appName = whitelabeling?.appName || "EasyTI Cloud";
	const appDescription =
		whitelabeling?.appDescription ||
		"Hospedagem Node.js simplificada para desenvolvedores.";
	const logoUrl =
		whitelabeling?.loginLogoUrl || whitelabeling?.logoUrl || undefined;

	return (
		<div className="container relative min-h-svh flex-col items-center justify-center flex lg:max-w-none lg:grid lg:grid-cols-2 lg:px-0 w-full">
			{/* Left panel — gradient brand panel */}
			<div className="relative hidden h-full flex-col p-10 lg:flex overflow-hidden">
				<div className="absolute inset-0 bg-gradient-to-br from-easyti-primary via-easyti-primary-dark to-easyti-bg-dark" />
				{/* Subtle decorative elements */}
				<div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
				<div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full translate-y-1/3 -translate-x-1/3" />

				<Link
					href="/"
					className="relative z-20 flex items-center gap-4"
				>
					<Logo className="h-10 w-auto brightness-0 invert" logoUrl={logoUrl} />
				</Link>
				<div className="relative z-20 mt-auto space-y-4">
					<p className="text-xl font-medium text-white/90 leading-relaxed max-w-md">
						{appDescription}
					</p>
					<div className="flex items-center gap-3 text-white/60 text-sm">
						<span className="inline-flex items-center gap-1.5">
							<span className="w-1.5 h-1.5 rounded-full bg-easyti-success" />
							Deploy em segundos
						</span>
						<span className="inline-flex items-center gap-1.5">
							<span className="w-1.5 h-1.5 rounded-full bg-easyti-success" />
							SSL automático
						</span>
						<span className="inline-flex items-center gap-1.5">
							<span className="w-1.5 h-1.5 rounded-full bg-easyti-success" />
							Monitoramento
						</span>
					</div>
				</div>
			</div>
			{/* Right panel — form */}
			<div className="w-full">
				<div className="flex w-full flex-col justify-center space-y-6 max-w-lg mx-auto px-4 lg:px-0">
					{children}
				</div>
			</div>
		</div>
	);
};

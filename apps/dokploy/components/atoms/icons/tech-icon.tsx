import {
	SiAstro,
	SiBitbucket,
	SiBun,
	SiDjango,
	SiDocker,
	SiExpress,
	SiFastapi,
	SiGit,
	SiGithub,
	SiGitlab,
	SiGo,
	SiLaravel,
	SiNestjs,
	SiNextdotjs,
	SiNodedotjs,
	SiNpm,
	SiPnpm,
	SiPython,
	SiReact,
	SiRubyonrails,
	SiVuedotjs,
	SiYarn,
} from "@icons-pack/react-simple-icons";
import type { ComponentType, SVGProps } from "react";

type IconMap = Record<string, ComponentType<SVGProps<SVGSVGElement>>>;

const TECH_ICONS: IconMap = {
	nextjs: SiNextdotjs,
	react: SiReact,
	vue: SiVuedotjs,
	nuxt: SiVuedotjs, // Nuxt uses Vue icon as fallback
	express: SiExpress,
	node: SiNodedotjs,
	nestjs: SiNestjs,
	python: SiPython,
	fastapi: SiFastapi,
	django: SiDjango,
	laravel: SiLaravel,
	go: SiGo,
	rails: SiRubyonrails,
	astro: SiAstro,
	docker: SiDocker,
	npm: SiNpm,
	yarn: SiYarn,
	pnpm: SiPnpm,
	bun: SiBun,
};

const TECH_COLORS: Record<string, string> = {
	nextjs: "#000000",
	react: "#61DAFB",
	vue: "#4FC08D",
	nuxt: "#00DC82",
	express: "#000000",
	node: "#5FA04E",
	nestjs: "#E0234E",
	python: "#3776AB",
	fastapi: "#009688",
	django: "#092E20",
	laravel: "#FF2D20",
	go: "#00ADD8",
	rails: "#D30001",
	astro: "#BC52EE",
	docker: "#2496ED",
	npm: "#CB3837",
	yarn: "#2C8EBB",
	pnpm: "#F69220",
	bun: "#FBF0DF",
};

interface TechIconProps {
	name: string;
	size?: number;
	className?: string;
	colored?: boolean;
}

export function TechIcon({
	name,
	size = 20,
	className = "",
	colored = true,
}: TechIconProps) {
	const key = name.toLowerCase().replace(/[^a-z]/g, "");
	const Icon = TECH_ICONS[key];
	if (!Icon) return null;

	return (
		<Icon
			width={size}
			height={size}
			className={className}
			color={colored ? TECH_COLORS[key] : "currentColor"}
		/>
	);
}

const PROVIDER_ICONS: IconMap = {
	github: SiGithub,
	gitlab: SiGitlab,
	bitbucket: SiBitbucket,
	git: SiGit,
	docker: SiDocker,
};

const PROVIDER_COLORS: Record<string, string> = {
	github: "#181717",
	gitlab: "#FC6D26",
	bitbucket: "#0052CC",
	git: "#F05032",
	docker: "#2496ED",
};

interface ProviderIconProps {
	provider: string;
	size?: number;
	className?: string;
	colored?: boolean;
}

export function ProviderIcon({
	provider,
	size = 20,
	className = "",
	colored = true,
}: ProviderIconProps) {
	const key = provider.toLowerCase();
	const Icon = PROVIDER_ICONS[key];
	if (!Icon) return null;

	return (
		<Icon
			width={size}
			height={size}
			className={className}
			color={colored ? PROVIDER_COLORS[key] : "currentColor"}
		/>
	);
}

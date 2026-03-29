"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { useRouter } from "next/router";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
	Search,
	GitBranch,
	Globe,
	Lock,
	ChevronRight,
	ArrowLeft,
	Plus,
	ExternalLink,
	Settings2,
	ChevronDown,
	Eye,
	EyeOff,
	FileCode,
} from "lucide-react";
import { api } from "@/utils/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { ProviderIcon, TechIcon } from "@/components/atoms/icons/tech-icon";
import {
	DeployRocketAnimation,
	BuildProgressAnimation,
} from "@/components/atoms/animations/animated-svgs";
import {
	FadeInUp,
	StaggerList,
	StaggerItem,
	staggerItem,
} from "@/components/atoms/animations/motion";

// ─── Types ─────────────────────────────────────────────────────────
type SourceType = "github" | "gitlab" | "bitbucket" | "git" | "docker";
type BuildType = "dockerfile";
type WizardStep = 1 | 2;

interface DeployConfig {
	sourceType?: SourceType;
	// GitHub
	githubId?: string;
	githubRepoOwner?: string;
	githubRepoName?: string;
	githubBranch?: string;
	// GitLab
	gitlabId?: string;
	gitlabRepoOwner?: string;
	gitlabRepoName?: string;
	gitlabRepoId?: number;
	gitlabPathNamespace?: string;
	gitlabBranch?: string;
	// Bitbucket
	bitbucketId?: string;
	bitbucketRepoOwner?: string;
	bitbucketRepoName?: string;
	bitbucketRepoSlug?: string;
	bitbucketBranch?: string;
	// Git URL
	customGitUrl?: string;
	customGitBranch?: string;
	// Docker
	dockerImage?: string;
	dockerUsername?: string;
	dockerPassword?: string;
	// Build config
	projectName?: string;
	appName?: string;
	buildType?: BuildType;
	serverId?: string;
	envVars?: Record<string, string>;
	// Stack detection
	stackType?: string;
	packageManager?: "npm" | "yarn" | "pnpm" | "bun";
	installCommand?: string;
	buildCommand?: string;
	startCommand?: string;
}

// ─── Constants ─────────────────────────────────────────────────────
const PROVIDERS: {
	id: SourceType;
	name: string;
	description: string;
}[] = [
	{ id: "github", name: "GitHub", description: "Importe de um repositório GitHub" },
	{ id: "gitlab", name: "GitLab", description: "Importe de um repositório GitLab" },
	{ id: "bitbucket", name: "Bitbucket", description: "Importe de um repositório Bitbucket" },
	{ id: "git", name: "Git URL", description: "Clone via URL pública ou SSH" },
	{ id: "docker", name: "Docker", description: "Deploy de uma imagem Docker" },
];

const STACKS: {
	id: string;
	name: string;
	iconKey: string;
	category: "node" | "python" | "php" | "go" | "ruby" | "static";
	defaultInstall: string;
	defaultBuild: string;
	defaultStart: string;
}[] = [
	{ id: "nextjs", name: "Next.js", iconKey: "nextjs", category: "node", defaultInstall: "npm ci", defaultBuild: "npm run build", defaultStart: "npm start" },
	{ id: "react", name: "React / Vite", iconKey: "react", category: "node", defaultInstall: "npm ci", defaultBuild: "npm run build", defaultStart: "" },
	{ id: "vue", name: "Vue.js", iconKey: "vue", category: "node", defaultInstall: "npm ci", defaultBuild: "npm run build", defaultStart: "" },
	{ id: "nuxt", name: "Nuxt.js", iconKey: "nuxt", category: "node", defaultInstall: "npm ci", defaultBuild: "npm run build", defaultStart: "node .output/server/index.mjs" },
	{ id: "express", name: "Express / Node", iconKey: "express", category: "node", defaultInstall: "npm ci", defaultBuild: "", defaultStart: "node index.js" },
	{ id: "nestjs", name: "NestJS", iconKey: "nestjs", category: "node", defaultInstall: "npm ci", defaultBuild: "npm run build", defaultStart: "node dist/main" },
	{ id: "python", name: "Python / FastAPI", iconKey: "python", category: "python", defaultInstall: "pip install -r requirements.txt", defaultBuild: "", defaultStart: "uvicorn main:app --host 0.0.0.0 --port 8080" },
	{ id: "django", name: "Django", iconKey: "django", category: "python", defaultInstall: "pip install -r requirements.txt", defaultBuild: "python manage.py collectstatic --noinput", defaultStart: "gunicorn -b 0.0.0.0:8080 wsgi:application" },
	{ id: "laravel", name: "PHP / Laravel", iconKey: "laravel", category: "php", defaultInstall: "composer install --no-dev --optimize-autoloader", defaultBuild: "", defaultStart: "php artisan serve --host=0.0.0.0 --port=8080" },
	{ id: "go", name: "Go", iconKey: "go", category: "go", defaultInstall: "go mod download", defaultBuild: "go build -o app .", defaultStart: "./app" },
	{ id: "rails", name: "Ruby on Rails", iconKey: "rails", category: "ruby", defaultInstall: "bundle install", defaultBuild: "bundle exec rake assets:precompile", defaultStart: "bundle exec rails s -b 0.0.0.0 -p 8080" },
	{ id: "static", name: "HTML Estático", iconKey: "node", category: "static", defaultInstall: "npm ci", defaultBuild: "npm run build", defaultStart: "" },
];

const PM_CMDS: Record<"npm" | "yarn" | "pnpm" | "bun", { install: string; run: string }> = {
	npm: { install: "npm ci", run: "npm run" },
	yarn: { install: "yarn install --frozen-lockfile", run: "yarn" },
	pnpm: { install: "pnpm install --frozen-lockfile", run: "pnpm" },
	bun: { install: "bun install", run: "bun run" },
};

function generateDockerfileContent(
	stackId: string,
	installCmd: string,
	buildCmd: string,
	startCmd: string,
): string {
	const cmd = (s: string) => `CMD ["sh", "-c", "${s}"]`;
	const lines: (string | undefined)[] = [];
	switch (stackId) {
		case "nextjs":
		case "nuxt":
		case "nestjs":
			lines.push(
				"FROM node:20-alpine AS builder", "WORKDIR /app", "COPY package*.json ./",
				installCmd ? `RUN ${installCmd}` : undefined, "COPY . .",
				buildCmd ? `RUN ${buildCmd}` : undefined, "",
				"FROM node:20-alpine", "WORKDIR /app", "COPY --from=builder /app .",
				"EXPOSE 3000", startCmd ? cmd(startCmd) : undefined,
			);
			break;
		case "react":
		case "vue":
		case "static":
			lines.push(
				"FROM node:20-alpine AS builder", "WORKDIR /app", "COPY package*.json ./",
				installCmd ? `RUN ${installCmd}` : undefined, "COPY . .",
				buildCmd ? `RUN ${buildCmd}` : undefined, "",
				"FROM nginx:alpine", "COPY --from=builder /app/dist /usr/share/nginx/html",
				"EXPOSE 80", 'CMD ["nginx", "-g", "daemon off;"]',
			);
			break;
		case "python":
		case "django":
			lines.push(
				"FROM python:3.11-slim", "WORKDIR /app", "COPY requirements.txt .",
				installCmd ? `RUN ${installCmd}` : undefined, "COPY . .",
				buildCmd ? `RUN ${buildCmd}` : undefined,
				"EXPOSE 8080", startCmd ? cmd(startCmd) : undefined,
			);
			break;
		case "laravel":
			lines.push(
				"FROM php:8.2-cli-alpine", "WORKDIR /var/www", "COPY composer.json composer.lock ./",
				"RUN apk add --no-cache curl && curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer",
				installCmd ? `RUN ${installCmd}` : undefined, "COPY . .",
				"EXPOSE 8080", startCmd ? cmd(startCmd) : undefined,
			);
			break;
		case "go":
			lines.push(
				"FROM golang:1.21-alpine AS builder", "WORKDIR /app",
				"COPY go.mod go.sum ./", "RUN go mod download", "COPY . .",
				buildCmd ? `RUN ${buildCmd}` : undefined, "",
				"FROM alpine:latest", "WORKDIR /app",
				"COPY --from=builder /app/app .", "EXPOSE 8080",
				startCmd ? cmd(startCmd) : undefined,
			);
			break;
		case "rails":
			lines.push(
				"FROM ruby:3.2-alpine", "RUN apk add --no-cache build-base nodejs yarn tzdata",
				"WORKDIR /rails", "COPY Gemfile Gemfile.lock ./",
				installCmd ? `RUN ${installCmd}` : undefined, "COPY . .",
				buildCmd ? `RUN ${buildCmd}` : undefined,
				"EXPOSE 8080", startCmd ? cmd(startCmd) : undefined,
			);
			break;
		default:
			lines.push(
				"FROM node:20-alpine", "WORKDIR /app", "COPY . .",
				installCmd ? `RUN ${installCmd}` : undefined,
				buildCmd ? `RUN ${buildCmd}` : undefined,
				"EXPOSE 3000", startCmd ? cmd(startCmd) : undefined,
			);
	}
	return lines.filter((l) => l !== undefined).join("\n");
}

// ─── Stack Detection Rules ────────────────────────────────────────
interface DetectionRule {
	files: string[];
	stackId: string;
	priority: number;
}

const DETECTION_RULES: DetectionRule[] = [
	{ files: ["next.config.js", "next.config.mjs", "next.config.ts"], stackId: "nextjs", priority: 10 },
	{ files: ["nuxt.config.ts", "nuxt.config.js"], stackId: "nuxt", priority: 10 },
	{ files: ["nest-cli.json"], stackId: "nestjs", priority: 10 },
	{ files: ["vue.config.js", "vite.config.ts", "vite.config.js"], stackId: "react", priority: 8 },
	{ files: ["angular.json"], stackId: "react", priority: 9 },
	{ files: ["manage.py", "settings.py"], stackId: "django", priority: 10 },
	{ files: ["artisan", "composer.json"], stackId: "laravel", priority: 9 },
	{ files: ["Gemfile", "config.ru"], stackId: "rails", priority: 8 },
	{ files: ["go.mod"], stackId: "go", priority: 9 },
	{ files: ["requirements.txt", "pyproject.toml", "Pipfile"], stackId: "python", priority: 5 },
	{ files: ["package.json"], stackId: "react", priority: 3 },
	{ files: ["index.html"], stackId: "static", priority: 1 },
];

function detectStackFromFiles(fileNames: string[]): string | null {
	const matches = DETECTION_RULES
		.filter((rule) => rule.files.some((f) => fileNames.includes(f)))
		.sort((a, b) => b.priority - a.priority);
	return matches.length > 0 ? (matches[0] as DetectionRule).stackId : null;
}

// ═══════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════
export function DeployWizard() {
	const router = useRouter();
	const [step, setStep] = useState<WizardStep>(1);
	const [config, setConfig] = useState<DeployConfig>({
		buildType: "dockerfile",
		customGitBranch: "main",
		githubBranch: "main",
		gitlabBranch: "main",
		bitbucketBranch: "main",
	});
	const [isDeploying, setIsDeploying] = useState(false);
	const [deployPhase, setDeployPhase] = useState<"idle" | "launching" | "deployed">("idle");
	const [deployLog, setDeployLog] = useState<string[]>([]);
	const [buildStep, setBuildStep] = useState(0);

	// Stack auto-detection state
	const [isDetecting, setIsDetecting] = useState(false);
	const [detectedStack, setDetectedStack] = useState<string | null>(null);
	const [hasDockerfile, setHasDockerfile] = useState(false);
	const [existingDockerfile, setExistingDockerfile] = useState<string | null>(null);

	const utils = api.useUtils();

	// tRPC mutations
	const createProject = api.project.create.useMutation();
	const createApplication = api.application.create.useMutation();
	const saveGithubProvider = api.application.saveGithubProvider.useMutation();
	const saveGitlabProvider = api.application.saveGitlabProvider.useMutation();
	const saveBitbucketProvider = api.application.saveBitbucketProvider.useMutation();
	const saveGitProvider = api.application.saveGitProvider.useMutation();
	const saveDockerProvider = api.application.saveDockerProvider.useMutation();
	const saveBuildType = api.application.saveBuildType.useMutation();
	const saveEnvironment = api.application.saveEnvironment.useMutation();
	const deployApp = api.application.deploy.useMutation();

	const addLog = (msg: string) => setDeployLog((prev) => [...prev, msg]);

	// ─── Stack auto-detection ──────────────────────────────────────
	const detectStack = useCallback(async () => {
		if (!config.sourceType) return;

		setIsDetecting(true);
		setDetectedStack(null);
		setHasDockerfile(false);
		setExistingDockerfile(null);

		try {
			let files: { name: string; type: string }[] = [];

			if (config.sourceType === "github" && config.githubId && config.githubRepoOwner && config.githubRepoName) {
				files = await utils.client.github.getGithubRepoFiles.query({
					githubId: config.githubId,
					owner: config.githubRepoOwner,
					repo: config.githubRepoName,
					branch: config.githubBranch || "main",
				});
			} else if (config.sourceType === "gitlab" && config.gitlabId && config.gitlabRepoId) {
				files = await utils.client.gitlab.getGitlabRepoFiles.query({
					gitlabId: config.gitlabId,
					repoId: config.gitlabRepoId,
					branch: config.gitlabBranch || "main",
				});
			} else if (config.sourceType === "bitbucket" && config.bitbucketId && config.bitbucketRepoOwner && config.bitbucketRepoSlug) {
				files = await utils.client.bitbucket.getBitbucketRepoFiles.query({
					bitbucketId: config.bitbucketId,
					owner: config.bitbucketRepoOwner,
					repo: config.bitbucketRepoSlug,
					branch: config.bitbucketBranch || "main",
				});
			}

			const fileNames = files.map((f) => f.name);

			// Check for existing Dockerfile
			const dockerfileExists = fileNames.includes("Dockerfile");
			setHasDockerfile(dockerfileExists);

			if (dockerfileExists) {
				if (config.sourceType === "github") {
					const content = await utils.client.github.getGithubFileContent.query({
						githubId: config.githubId!,
						owner: config.githubRepoOwner!,
						repo: config.githubRepoName!,
						branch: config.githubBranch || "main",
						filePath: "Dockerfile",
					});
					setExistingDockerfile(content);
				} else if (config.sourceType === "gitlab") {
					const content = await utils.client.gitlab.getGitlabFileContent.query({
						gitlabId: config.gitlabId!,
						repoId: config.gitlabRepoId!,
						branch: config.gitlabBranch || "main",
						filePath: "Dockerfile",
					});
					setExistingDockerfile(content);
				} else if (config.sourceType === "bitbucket") {
					const content = await utils.client.bitbucket.getBitbucketFileContent.query({
						bitbucketId: config.bitbucketId!,
						owner: config.bitbucketRepoOwner!,
						repo: config.bitbucketRepoSlug!,
						branch: config.bitbucketBranch || "main",
						filePath: "Dockerfile",
					});
					setExistingDockerfile(content);
				}
			}

			// Detect stack
			const detected = detectStackFromFiles(fileNames);
			setDetectedStack(detected);

			if (detected) {
				// Auto-select the stack
				const stack = STACKS.find((s) => s.id === detected);
				if (stack) {
					const pm = config.packageManager ?? "npm";
					const pmCmd = PM_CMDS[pm];
					setConfig((c) => ({
						...c,
						stackType: detected,
						buildType: "dockerfile" as const,
						installCommand: stack.category === "node" ? pmCmd.install : stack.defaultInstall,
						buildCommand: stack.category === "node" && stack.defaultBuild ? stack.defaultBuild.replace("npm run", pmCmd.run) : stack.defaultBuild,
						startCommand: stack.defaultStart,
					}));
					toast.success(`Stack detectada: ${stack.name}`);
				}
			}
		} catch (error) {
			console.error("Stack detection failed:", error);
			// Silent — user can select manually
		} finally {
			setIsDetecting(false);
		}
	}, [config.sourceType, config.githubId, config.githubRepoOwner, config.githubRepoName, config.githubBranch, config.gitlabId, config.gitlabRepoId, config.gitlabBranch, config.bitbucketId, config.bitbucketRepoOwner, config.bitbucketRepoSlug, config.bitbucketBranch, config.packageManager, utils.client]);

	// Trigger detection when moving to step 2
	useEffect(() => {
		if (step === 2 && config.sourceType && config.sourceType !== "docker" && config.sourceType !== "git" && !detectedStack && !isDetecting) {
			detectStack();
		}
	}, [step]); // eslint-disable-line react-hooks/exhaustive-deps

	const repoReady = () => {
		if (!config.sourceType) return false;
		if (config.sourceType === "github") return !!(config.githubId && config.githubRepoName && config.githubBranch);
		if (config.sourceType === "gitlab") return !!(config.gitlabId && config.gitlabRepoName && config.gitlabBranch);
		if (config.sourceType === "bitbucket") return !!(config.bitbucketId && config.bitbucketRepoName && config.bitbucketBranch);
		if (config.sourceType === "git") return !!config.customGitUrl;
		if (config.sourceType === "docker") return !!config.dockerImage;
		return false;
	};

	const handleContinue = () => {
		if (!config.appName) {
			// Auto-generate app name from repo
			const name =
				config.githubRepoName ??
				config.gitlabRepoName ??
				config.bitbucketRepoName ??
				config.customGitUrl?.split("/").pop()?.replace(".git", "") ??
				config.dockerImage?.split("/").pop()?.split(":")[0] ??
				"";
			const cleaned = name
				.toLowerCase()
				.replace(/[^a-z0-9-]/g, "-")
				.replace(/^-+|-+$/g, "")
				.replace(/--+/g, "-");
			setConfig((c) => ({ ...c, appName: cleaned }));
		}
		setStep(2);
	};

	const handleDeploy = async () => {
		if (!config.appName) {
			toast.error("Informe o nome da aplicação");
			return;
		}

		setIsDeploying(true);
		setDeployPhase("launching");
		setDeployLog([]);
		setBuildStep(0);

		try {
			addLog("Criando projeto...");
			setBuildStep(0);
			const projectResult = await createProject.mutateAsync({
				name: config.projectName || config.appName,
				description: "Criado via EasyDeploy",
				env: "",
			});
			const projectId = projectResult.project.projectId;
			const environmentId = projectResult.environment?.environmentId ?? "";
			if (!environmentId) throw new Error("Ambiente do projeto não encontrado");
			addLog("✓ Projeto criado");

			addLog("Criando aplicação...");
			const app = await createApplication.mutateAsync({
				name: config.appName,
				appName: config.appName,
				description: "",
				environmentId,
				...(config.serverId ? { serverId: config.serverId } : {}),
			});
			const applicationId = app.applicationId;
			addLog("✓ Aplicação criada");
			setBuildStep(1);

			addLog("Configurando fonte...");
			if (config.sourceType === "github") {
				await saveGithubProvider.mutateAsync({
					applicationId,
					repository: config.githubRepoName!,
					owner: config.githubRepoOwner!,
					branch: config.githubBranch!,
					buildPath: "/",
					githubId: config.githubId!,
					watchPaths: [],
					triggerType: "push",
					enableSubmodules: false,
				});
			} else if (config.sourceType === "gitlab") {
				await saveGitlabProvider.mutateAsync({
					applicationId,
					gitlabRepository: config.gitlabRepoName!,
					gitlabOwner: config.gitlabRepoOwner!,
					gitlabBranch: config.gitlabBranch!,
					gitlabBuildPath: "/",
					gitlabId: config.gitlabId!,
					gitlabProjectId: config.gitlabRepoId ?? 0,
					gitlabPathNamespace: config.gitlabPathNamespace ?? config.gitlabRepoOwner!,
					watchPaths: [],
					enableSubmodules: false,
				});
			} else if (config.sourceType === "bitbucket") {
				await saveBitbucketProvider.mutateAsync({
					applicationId,
					bitbucketRepository: config.bitbucketRepoName!,
					bitbucketOwner: config.bitbucketRepoOwner!,
					bitbucketBranch: config.bitbucketBranch!,
					bitbucketBuildPath: "/",
					bitbucketId: config.bitbucketId!,
					bitbucketRepositorySlug: config.bitbucketRepoSlug || config.bitbucketRepoName!,
					watchPaths: [],
					enableSubmodules: false,
				});
			} else if (config.sourceType === "git") {
				await saveGitProvider.mutateAsync({
					applicationId,
					customGitUrl: config.customGitUrl!,
					customGitBranch: config.customGitBranch || "main",
					customGitBuildPath: "/",
					watchPaths: [],
					enableSubmodules: false,
					customGitSSHKeyId: null,
				});
			} else if (config.sourceType === "docker") {
				await saveDockerProvider.mutateAsync({
					applicationId,
					dockerImage: config.dockerImage!,
					username: config.dockerUsername || "",
					password: config.dockerPassword || "",
					registryUrl: "",
				});
			}
			addLog("✓ Fonte configurada");
			setBuildStep(2);

			// Environment variables
			const envVars = config.envVars || {};
			const envString = Object.entries(envVars)
				.filter(([k]) => k.trim())
				.map(([k, v]) => `${k}=${v}`)
				.join("\n");
			// Build commands are embedded in the Dockerfile, no need for NIXPACKS_ env vars
			await saveEnvironment.mutateAsync({
				applicationId,
				env: envString,
				buildArgs: "",
				buildSecrets: "",
				createEnvFile: false,
			});

			// Build type — ALWAYS dockerfile
			if (config.sourceType !== "docker") {
				let dockerfileContent: string | null = null;

				if (hasDockerfile && existingDockerfile) {
					// Repo already has Dockerfile — use it (null = use the repo's Dockerfile)
					dockerfileContent = null;
				} else if (config.stackType) {
					// Repo does NOT have Dockerfile — generate from selected stack
					dockerfileContent = generateDockerfileContent(
						config.stackType,
						config.installCommand || "",
						config.buildCommand || "",
						config.startCommand || "",
					);
				}

				await saveBuildType.mutateAsync({
					applicationId,
					buildType: "dockerfile",
					dockerfile: dockerfileContent,
					dockerContextPath: null,
					dockerBuildStage: null,
					herokuVersion: null,
					railpackVersion: null,
					publishDirectory: null,
					isStaticSpa: null,
				});
			}

			// Deploy
			addLog("Iniciando deploy...");
			await deployApp.mutateAsync({ applicationId });
			addLog("✓ Deploy iniciado com sucesso!");
			setBuildStep(3);
			setDeployPhase("deployed");

			toast.success("Deploy iniciado com sucesso!");
			setTimeout(() => {
				router.push(`/dashboard/project/${projectId}/environment/${environmentId}/services/application/${applicationId}`);
			}, 2000);
		} catch (error) {
			const msg = error instanceof Error ? error.message : "Erro ao fazer deploy";
			addLog(`✗ Erro: ${msg}`);
			toast.error(msg);
			setDeployPhase("idle");
		} finally {
			setIsDeploying(false);
		}
	};

	const repoLabel = () => {
		if (config.sourceType === "github") return `${config.githubRepoOwner}/${config.githubRepoName}`;
		if (config.sourceType === "gitlab") return config.gitlabPathNamespace || config.gitlabRepoName || "";
		if (config.sourceType === "bitbucket") return `${config.bitbucketRepoOwner}/${config.bitbucketRepoName}`;
		if (config.sourceType === "git") return config.customGitUrl || "";
		if (config.sourceType === "docker") return config.dockerImage || "";
		return "";
	};

	return (
		<div className="max-w-3xl mx-auto">
			{/* Step indicator */}
			<div className="flex items-center gap-3 mb-8">
				<StepIndicator num={1} active={step === 1} done={step > 1} label="Importar" />
				<div className={`flex-1 h-px ${step > 1 ? "bg-easyti-primary" : "bg-border"}`} />
				<StepIndicator num={2} active={step === 2} done={false} label="Configurar & Deploy" />
			</div>

			<AnimatePresence mode="wait">
				{step === 1 ? (
					<motion.div
						key="step1"
						initial={{ opacity: 0, x: -20 }}
						animate={{ opacity: 1, x: 0 }}
						exit={{ opacity: 0, x: -20 }}
						transition={{ duration: 0.3 }}
					>
						<ImportRepoStep
							config={config}
							setConfig={setConfig}
							onContinue={handleContinue}
							ready={repoReady()}
						/>
					</motion.div>
				) : (
					<motion.div
						key="step2"
						initial={{ opacity: 0, x: 20 }}
						animate={{ opacity: 1, x: 0 }}
						exit={{ opacity: 0, x: 20 }}
						transition={{ duration: 0.3 }}
					>
						<ConfigureDeployStep
							config={config}
							setConfig={setConfig}
							onBack={() => setStep(1)}
							onDeploy={handleDeploy}
							isDeploying={isDeploying}
							deployPhase={deployPhase}
							deployLog={deployLog}
							buildStep={buildStep}
							repoLabel={repoLabel()}
							isDetecting={isDetecting}
							detectedStack={detectedStack}
							hasDockerfile={hasDockerfile}
							existingDockerfile={existingDockerfile}
						/>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
}

// ─── Step Indicator ────────────────────────────────────────────────
function StepIndicator({
	num,
	active,
	done,
	label,
}: {
	num: number;
	active: boolean;
	done: boolean;
	label: string;
}) {
	return (
		<div className="flex items-center gap-2">
			<div
				className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 ${
					done
						? "bg-easyti-primary text-white"
						: active
							? "bg-easyti-primary text-white ring-4 ring-easyti-primary/20"
							: "bg-muted text-muted-foreground border border-border"
				}`}
			>
				{done ? "✓" : num}
			</div>
			<span
				className={`text-sm font-medium hidden sm:block ${active || done ? "text-foreground" : "text-muted-foreground"}`}
			>
				{label}
			</span>
		</div>
	);
}

// ═══════════════════════════════════════════════════════════════════
// STEP 1: Import Repository
// ═══════════════════════════════════════════════════════════════════
function ImportRepoStep({
	config,
	setConfig,
	onContinue,
	ready,
}: {
	config: DeployConfig;
	setConfig: React.Dispatch<React.SetStateAction<DeployConfig>>;
	onContinue: () => void;
	ready: boolean;
}) {
	return (
		<div className="space-y-6">
			{/* Provider cards */}
			<StaggerList className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
				{PROVIDERS.map((p) => (
					<StaggerItem key={p.id}>
						<button
							type="button"
							onClick={() =>
								setConfig((c) => ({
									...c,
									sourceType: p.id,
									githubId: undefined,
									githubRepoOwner: undefined,
									githubRepoName: undefined,
									githubBranch: "main",
									gitlabId: undefined,
									gitlabRepoOwner: undefined,
									gitlabRepoName: undefined,
									gitlabRepoId: undefined,
									gitlabBranch: "main",
									bitbucketId: undefined,
									bitbucketRepoOwner: undefined,
									bitbucketRepoName: undefined,
									bitbucketBranch: "main",
									customGitUrl: undefined,
									customGitBranch: "main",
									dockerImage: undefined,
								}))
							}
							className={`w-full p-4 rounded-xl border-2 transition-all duration-200 flex flex-col items-center gap-2 hover:shadow-md ${
								config.sourceType === p.id
									? "border-easyti-primary bg-easyti-primary/5 shadow-sm"
									: "border-border hover:border-easyti-primary/40"
							}`}
						>
							<ProviderIcon
								provider={p.id}
								size={28}
								colored={config.sourceType === p.id}
								className={config.sourceType !== p.id ? "text-muted-foreground" : ""}
							/>
							<span className="text-sm font-medium">{p.name}</span>
						</button>
					</StaggerItem>
				))}
			</StaggerList>

			{/* Provider-specific config */}
			<AnimatePresence mode="wait">
				{config.sourceType && (
					<FadeInUp key={config.sourceType}>
						<Card className="p-5 space-y-4">
							{config.sourceType === "github" && (
								<GithubRepoSelector config={config} setConfig={setConfig} />
							)}
							{config.sourceType === "gitlab" && (
								<GitlabRepoSelector config={config} setConfig={setConfig} />
							)}
							{config.sourceType === "bitbucket" && (
								<BitbucketRepoSelector config={config} setConfig={setConfig} />
							)}
							{config.sourceType === "git" && (
								<GitUrlInput config={config} setConfig={setConfig} />
							)}
							{config.sourceType === "docker" && (
								<DockerInput config={config} setConfig={setConfig} />
							)}
						</Card>
					</FadeInUp>
				)}
			</AnimatePresence>

			{/* Continue button */}
			<div className="flex justify-end">
				<Button
					onClick={onContinue}
					disabled={!ready}
					size="lg"
					className="bg-easyti-primary hover:bg-easyti-primary-dark text-white gap-2 transition-all"
				>
					Continuar
					<ChevronRight className="w-4 h-4" />
				</Button>
			</div>
		</div>
	);
}

// ─── GitHub Repo Selector ──────────────────────────────────────────
function GithubRepoSelector({
	config,
	setConfig,
}: {
	config: DeployConfig;
	setConfig: React.Dispatch<React.SetStateAction<DeployConfig>>;
}) {
	const [search, setSearch] = useState("");
	const { data: providers, isLoading: loadingProviders } = api.github.githubProviders.useQuery();

	const { data: repositories, isLoading: loadingRepos } = api.github.getGithubRepositories.useQuery(
		{ githubId: config.githubId ?? "" },
		{ enabled: !!config.githubId },
	);

	const { data: branches, isLoading: loadingBranches } = api.github.getGithubBranches.useQuery(
		{
			githubId: config.githubId ?? "",
			owner: config.githubRepoOwner ?? "",
			repo: config.githubRepoName ?? "",
		},
		{ enabled: !!config.githubId && !!config.githubRepoOwner && !!config.githubRepoName },
	);

	const filteredRepos = useMemo(
		() =>
			repositories?.filter((r) =>
				r.full_name.toLowerCase().includes(search.toLowerCase()),
			) ?? [],
		[repositories, search],
	);

	if (loadingProviders) return <LoadingState label="Carregando contas GitHub..." />;
	if (!providers || providers.length === 0) return <NoProviderCTA provider="GitHub" />;

	return (
		<div className="space-y-4">
			{/* Account selector */}
			<div>
				<Label className="text-sm text-muted-foreground">Conta GitHub</Label>
				<Select
					value={config.githubId ?? ""}
					onValueChange={(val) =>
						setConfig((c) => ({
							...c,
							githubId: val,
							githubRepoOwner: undefined,
							githubRepoName: undefined,
							githubBranch: "main",
						}))
					}
				>
					<SelectTrigger className="mt-1">
						<SelectValue placeholder="Selecione a conta" />
					</SelectTrigger>
					<SelectContent>
						{providers.map((p) => (
							<SelectItem key={p.githubId} value={p.githubId}>
								<span className="flex items-center gap-2">
									<ProviderIcon provider="github" size={14} />
									{p.gitProvider.name}
								</span>
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>

			{/* Repo search & list */}
			{config.githubId && (
				<div className="space-y-3">
					<div className="relative">
						<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
						<Input
							placeholder="Buscar repositório..."
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							className="pl-9"
						/>
					</div>

					{loadingRepos ? (
						<LoadingState label="Carregando repositórios..." />
					) : (
						<div className="max-h-64 overflow-y-auto rounded-lg border border-border divide-y divide-border">
							{filteredRepos.length === 0 && (
								<p className="p-4 text-center text-sm text-muted-foreground">
									Nenhum repositório encontrado
								</p>
							)}
							{filteredRepos.map((repo) => (
								<button
									key={repo.full_name}
									type="button"
									onClick={() =>
										setConfig((c) => ({
											...c,
											githubRepoOwner: repo.owner.login,
											githubRepoName: repo.name,
											githubBranch: "main",
										}))
									}
									className={`w-full flex items-center gap-3 p-3 text-left transition-colors hover:bg-accent ${
										config.githubRepoName === repo.name
											? "bg-easyti-primary/5"
											: ""
									}`}
								>
									{repo.private ? (
										<Lock className="w-4 h-4 text-muted-foreground shrink-0" />
									) : (
										<Globe className="w-4 h-4 text-muted-foreground shrink-0" />
									)}
									<div className="flex-1 min-w-0">
										<p className="text-sm font-medium truncate">{repo.full_name}</p>
									</div>
									{config.githubRepoName === repo.name && (
										<div className="w-2 h-2 rounded-full bg-easyti-primary shrink-0" />
									)}
								</button>
							))}
						</div>
					)}

					{/* Branch selector */}
					{config.githubRepoName && (
						<div>
							<Label className="text-sm text-muted-foreground">Branch</Label>
							{loadingBranches ? (
								<LoadingState label="Carregando branches..." />
							) : (
								<Select
									value={config.githubBranch ?? "main"}
									onValueChange={(val) => setConfig((c) => ({ ...c, githubBranch: val }))}
								>
									<SelectTrigger className="mt-1">
										<span className="flex items-center gap-2">
											<GitBranch className="w-3.5 h-3.5" />
											<SelectValue />
										</span>
									</SelectTrigger>
									<SelectContent>
										{(branches as { name: string }[] | undefined)?.map((b) => (
											<SelectItem key={b.name} value={b.name}>
												{b.name}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							)}
						</div>
					)}
				</div>
			)}
		</div>
	);
}

// ─── GitLab Repo Selector ──────────────────────────────────────────
function GitlabRepoSelector({
	config,
	setConfig,
}: {
	config: DeployConfig;
	setConfig: React.Dispatch<React.SetStateAction<DeployConfig>>;
}) {
	const [search, setSearch] = useState("");
	const { data: providers, isLoading: loadingProviders } = api.gitlab.gitlabProviders.useQuery();

	const { data: repositories, isLoading: loadingRepos } = api.gitlab.getGitlabRepositories.useQuery(
		{ gitlabId: config.gitlabId ?? "" },
		{ enabled: !!config.gitlabId },
	);

	const { data: branches, isLoading: loadingBranches } = api.gitlab.getGitlabBranches.useQuery(
		{
			gitlabId: config.gitlabId ?? "",
			id: config.gitlabRepoId,
			owner: config.gitlabRepoOwner ?? "",
			repo: config.gitlabRepoName ?? "",
		},
		{ enabled: !!config.gitlabId && !!config.gitlabRepoId && !!config.gitlabRepoName },
	);

	const filteredRepos = useMemo(
		() => repositories?.filter((r) => r.url.toLowerCase().includes(search.toLowerCase())) ?? [],
		[repositories, search],
	);

	if (loadingProviders) return <LoadingState label="Carregando contas GitLab..." />;
	if (!providers || providers.length === 0) return <NoProviderCTA provider="GitLab" />;

	return (
		<div className="space-y-4">
			<div>
				<Label className="text-sm text-muted-foreground">Conta GitLab</Label>
				<Select
					value={config.gitlabId ?? ""}
					onValueChange={(val) =>
						setConfig((c) => ({
							...c,
							gitlabId: val,
							gitlabRepoOwner: undefined,
							gitlabRepoName: undefined,
							gitlabRepoId: undefined,
							gitlabBranch: "main",
						}))
					}
				>
					<SelectTrigger className="mt-1">
						<SelectValue placeholder="Selecione a conta" />
					</SelectTrigger>
					<SelectContent>
						{providers.map((p) => (
							<SelectItem key={p.gitlabId} value={p.gitlabId}>
								<span className="flex items-center gap-2">
									<ProviderIcon provider="gitlab" size={14} />
									{p.gitProvider.name}
								</span>
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>

			{config.gitlabId && (
				<div className="space-y-3">
					<div className="relative">
						<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
						<Input placeholder="Buscar repositório..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
					</div>

					{loadingRepos ? (
						<LoadingState label="Carregando repositórios..." />
					) : (
						<div className="max-h-64 overflow-y-auto rounded-lg border border-border divide-y divide-border">
							{filteredRepos.length === 0 && (
								<p className="p-4 text-center text-sm text-muted-foreground">Nenhum repositório encontrado</p>
							)}
							{filteredRepos.map((repo) => (
								<button
									key={repo.id}
									type="button"
									onClick={() =>
										setConfig((c) => ({
											...c,
											gitlabRepoId: repo.id,
											gitlabRepoOwner: repo.owner.username,
											gitlabRepoName: repo.name,
											gitlabPathNamespace: repo.url,
											gitlabBranch: "main",
										}))
									}
									className={`w-full flex items-center gap-3 p-3 text-left transition-colors hover:bg-accent ${
										config.gitlabRepoId === repo.id ? "bg-easyti-primary/5" : ""
									}`}
								>
									<Globe className="w-4 h-4 text-muted-foreground shrink-0" />
									<p className="text-sm font-medium truncate flex-1">{repo.url}</p>
									{config.gitlabRepoId === repo.id && <div className="w-2 h-2 rounded-full bg-easyti-primary shrink-0" />}
								</button>
							))}
						</div>
					)}

					{config.gitlabRepoName && (
						<div>
							<Label className="text-sm text-muted-foreground">Branch</Label>
							{loadingBranches ? (
								<LoadingState label="Carregando branches..." />
							) : (
								<Select value={config.gitlabBranch ?? "main"} onValueChange={(val) => setConfig((c) => ({ ...c, gitlabBranch: val }))}>
									<SelectTrigger className="mt-1">
										<span className="flex items-center gap-2">
											<GitBranch className="w-3.5 h-3.5" />
											<SelectValue />
										</span>
									</SelectTrigger>
									<SelectContent>
										{(branches as { name: string }[] | undefined)?.map((b) => (
											<SelectItem key={b.name} value={b.name}>{b.name}</SelectItem>
										))}
									</SelectContent>
								</Select>
							)}
						</div>
					)}
				</div>
			)}
		</div>
	);
}

// ─── Bitbucket Repo Selector ───────────────────────────────────────
function BitbucketRepoSelector({
	config,
	setConfig,
}: {
	config: DeployConfig;
	setConfig: React.Dispatch<React.SetStateAction<DeployConfig>>;
}) {
	const [search, setSearch] = useState("");
	const { data: providers, isLoading: loadingProviders } = api.bitbucket.bitbucketProviders.useQuery();

	const { data: repositories, isLoading: loadingRepos } = api.bitbucket.getBitbucketRepositories.useQuery(
		{ bitbucketId: config.bitbucketId ?? "" },
		{ enabled: !!config.bitbucketId },
	);

	const { data: branches, isLoading: loadingBranches } = api.bitbucket.getBitbucketBranches.useQuery(
		{
			bitbucketId: config.bitbucketId ?? "",
			owner: config.bitbucketRepoOwner ?? "",
			repo: config.bitbucketRepoName ?? "",
		},
		{ enabled: !!config.bitbucketId && !!config.bitbucketRepoOwner && !!config.bitbucketRepoName },
	);

	const filteredRepos = useMemo(
		() => repositories?.filter((r) => `${r.owner.username}/${r.name}`.toLowerCase().includes(search.toLowerCase())) ?? [],
		[repositories, search],
	);

	if (loadingProviders) return <LoadingState label="Carregando contas Bitbucket..." />;
	if (!providers || providers.length === 0) return <NoProviderCTA provider="Bitbucket" />;

	return (
		<div className="space-y-4">
			<div>
				<Label className="text-sm text-muted-foreground">Conta Bitbucket</Label>
				<Select
					value={config.bitbucketId ?? ""}
					onValueChange={(val) =>
						setConfig((c) => ({
							...c,
							bitbucketId: val,
							bitbucketRepoOwner: undefined,
							bitbucketRepoName: undefined,
							bitbucketRepoSlug: undefined,
							bitbucketBranch: "main",
						}))
					}
				>
					<SelectTrigger className="mt-1">
						<SelectValue placeholder="Selecione a conta" />
					</SelectTrigger>
					<SelectContent>
						{providers.map((p) => (
							<SelectItem key={p.bitbucketId} value={p.bitbucketId}>
								<span className="flex items-center gap-2">
									<ProviderIcon provider="bitbucket" size={14} />
									{p.gitProvider.name}
								</span>
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>

			{config.bitbucketId && (
				<div className="space-y-3">
					<div className="relative">
						<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
						<Input placeholder="Buscar repositório..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
					</div>

					{loadingRepos ? (
						<LoadingState label="Carregando repositórios..." />
					) : (
						<div className="max-h-64 overflow-y-auto rounded-lg border border-border divide-y divide-border">
							{filteredRepos.length === 0 && (
								<p className="p-4 text-center text-sm text-muted-foreground">Nenhum repositório encontrado</p>
							)}
							{filteredRepos.map((repo) => (
								<button
									key={repo.name}
									type="button"
									onClick={() =>
										setConfig((c) => ({
											...c,
											bitbucketRepoOwner: repo.owner.username,
											bitbucketRepoName: repo.name,
											bitbucketRepoSlug: repo.slug,
											bitbucketBranch: "main",
										}))
									}
									className={`w-full flex items-center gap-3 p-3 text-left transition-colors hover:bg-accent ${
										config.bitbucketRepoName === repo.name ? "bg-easyti-primary/5" : ""
									}`}
								>
									<Globe className="w-4 h-4 text-muted-foreground shrink-0" />
									<p className="text-sm font-medium truncate flex-1">{repo.owner.username}/{repo.name}</p>
									{config.bitbucketRepoName === repo.name && (
										<div className="w-2 h-2 rounded-full bg-easyti-primary shrink-0" />
									)}
								</button>
							))}
						</div>
					)}

					{config.bitbucketRepoName && (
						<div>
							<Label className="text-sm text-muted-foreground">Branch</Label>
							{loadingBranches ? (
								<LoadingState label="Carregando branches..." />
							) : (
								<Select
									value={config.bitbucketBranch ?? "main"}
									onValueChange={(val) => setConfig((c) => ({ ...c, bitbucketBranch: val }))}
								>
									<SelectTrigger className="mt-1">
										<span className="flex items-center gap-2">
											<GitBranch className="w-3.5 h-3.5" />
											<SelectValue />
										</span>
									</SelectTrigger>
									<SelectContent>
										{(branches as { name: string; commit: { sha: string } }[] | undefined)?.map((b) => (
											<SelectItem key={b.name} value={b.name}>{b.name}</SelectItem>
										))}
									</SelectContent>
								</Select>
							)}
						</div>
					)}
				</div>
			)}
		</div>
	);
}

// ─── Git URL Input ─────────────────────────────────────────────────
function GitUrlInput({
	config,
	setConfig,
}: {
	config: DeployConfig;
	setConfig: React.Dispatch<React.SetStateAction<DeployConfig>>;
}) {
	return (
		<div className="space-y-4">
			<div>
				<Label className="text-sm text-muted-foreground">URL do Repositório</Label>
				<Input
					placeholder="https://github.com/usuario/repositorio.git"
					value={config.customGitUrl ?? ""}
					onChange={(e) => setConfig((c) => ({ ...c, customGitUrl: e.target.value }))}
					className="mt-1 font-mono text-sm"
				/>
			</div>
			<div>
				<Label className="text-sm text-muted-foreground">Branch</Label>
				<div className="relative mt-1">
					<GitBranch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
					<Input
						placeholder="main"
						value={config.customGitBranch ?? "main"}
						onChange={(e) => setConfig((c) => ({ ...c, customGitBranch: e.target.value }))}
						className="pl-9"
					/>
				</div>
			</div>
		</div>
	);
}

// ─── Docker Input ──────────────────────────────────────────────────
function DockerInput({
	config,
	setConfig,
}: {
	config: DeployConfig;
	setConfig: React.Dispatch<React.SetStateAction<DeployConfig>>;
}) {
	const [showAuth, setShowAuth] = useState(false);

	return (
		<div className="space-y-4">
			<div>
				<Label className="text-sm text-muted-foreground">Imagem Docker</Label>
				<Input
					placeholder="nginx:latest ou usuario/imagem:tag"
					value={config.dockerImage ?? ""}
					onChange={(e) => setConfig((c) => ({ ...c, dockerImage: e.target.value }))}
					className="mt-1 font-mono text-sm"
				/>
			</div>
			<button
				type="button"
				onClick={() => setShowAuth(!showAuth)}
				className="text-sm text-easyti-primary hover:underline flex items-center gap-1"
			>
				<ChevronDown className={`w-3.5 h-3.5 transition-transform ${showAuth ? "rotate-180" : ""}`} />
				Registry privado (opcional)
			</button>
			{showAuth && (
				<motion.div
					initial={{ height: 0, opacity: 0 }}
					animate={{ height: "auto", opacity: 1 }}
					exit={{ height: 0, opacity: 0 }}
					className="space-y-3 p-4 bg-muted rounded-lg"
				>
					<div>
						<Label className="text-sm">Usuário</Label>
						<Input
							placeholder="username"
							value={config.dockerUsername ?? ""}
							onChange={(e) => setConfig((c) => ({ ...c, dockerUsername: e.target.value }))}
							className="mt-1"
						/>
					</div>
					<div>
						<Label className="text-sm">Senha / Token</Label>
						<Input
							type="password"
							placeholder="password ou access token"
							value={config.dockerPassword ?? ""}
							onChange={(e) => setConfig((c) => ({ ...c, dockerPassword: e.target.value }))}
							className="mt-1"
						/>
					</div>
				</motion.div>
			)}
		</div>
	);
}

// ═══════════════════════════════════════════════════════════════════
// STEP 2: Configure & Deploy
// ═══════════════════════════════════════════════════════════════════
function ConfigureDeployStep({
	config,
	setConfig,
	onBack,
	onDeploy,
	isDeploying,
	deployPhase,
	deployLog,
	buildStep,
	repoLabel,
	isDetecting,
	detectedStack,
	hasDockerfile,
	existingDockerfile,
}: {
	config: DeployConfig;
	setConfig: React.Dispatch<React.SetStateAction<DeployConfig>>;
	onBack: () => void;
	onDeploy: () => void;
	isDeploying: boolean;
	deployPhase: "idle" | "launching" | "deployed";
	deployLog: string[];
	buildStep: number;
	repoLabel: string;
	isDetecting: boolean;
	detectedStack: string | null;
	hasDockerfile: boolean;
	existingDockerfile: string | null;
}) {
	const { data: servers } = api.server.withSSHKey.useQuery();
	const { data: isCloud } = api.settings.isCloud.useQuery();
	const [showAdvanced, setShowAdvanced] = useState(false);
	const [showDockerfile, setShowDockerfile] = useState(false);
	const [showEnv, setShowEnv] = useState(false);

	const selectedStack = STACKS.find((s) => s.id === config.stackType);
	const isNodeStack = selectedStack?.category === "node";

	const handleStackSelect = (stackId: string) => {
		const stack = STACKS.find((s) => s.id === stackId);
		if (!stack) return;
		const pm = config.packageManager ?? "npm";
		const pmCmd = PM_CMDS[pm];
		setConfig((c) => ({
			...c,
			stackType: stackId,
			buildType: "dockerfile",
			installCommand: stack.category === "node" ? pmCmd.install : stack.defaultInstall,
			buildCommand: stack.category === "node" && stack.defaultBuild ? stack.defaultBuild.replace("npm run", pmCmd.run) : stack.defaultBuild,
			startCommand: stack.defaultStart,
		}));
	};

	const handlePMChange = (pm: "npm" | "yarn" | "pnpm" | "bun") => {
		const pmCmd = PM_CMDS[pm];
		setConfig((c) => ({
			...c,
			packageManager: pm,
			installCommand: pmCmd.install,
			buildCommand: c.buildCommand?.replace(/^(npm run|yarn|pnpm|bun run)/, pmCmd.run) ?? "",
		}));
	};

	return (
		<div className="space-y-6">
			{/* Repo context bar */}
			<Card className="p-4 flex items-center gap-3 bg-muted/50">
				<ProviderIcon provider={config.sourceType ?? "git"} size={20} />
				<div className="flex-1 min-w-0">
					<p className="text-sm font-medium truncate">{repoLabel}</p>
					{config.sourceType !== "docker" && (
						<p className="text-xs text-muted-foreground flex items-center gap-1">
							<GitBranch className="w-3 h-3" />
							{config.githubBranch ?? config.gitlabBranch ?? config.bitbucketBranch ?? config.customGitBranch ?? "main"}
						</p>
					)}
				</div>
				<Button variant="ghost" size="sm" onClick={onBack} disabled={isDeploying}>
					Alterar
				</Button>
			</Card>

			{/* App name */}
			<div className="space-y-2">
				<Label>Nome da Aplicação</Label>
				<Input
					placeholder="minha-app"
					value={config.appName ?? ""}
					onChange={(e) =>
						setConfig((c) => ({
							...c,
							appName: e.target.value
								.toLowerCase()
								.replace(/[^a-z0-9-]/g, "-")
								.replace(/^-+|-+$/g, "")
								.replace(/--+/g, "-"),
						}))
					}
				/>
			</div>

			{/* Stack selection (only for non-docker) */}
			{config.sourceType !== "docker" && (
				<div className="space-y-3">
					{/* Detection feedback */}
					{isDetecting && (
						<div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
							<div className="w-6 h-6">
								<motion.div
									animate={{ rotate: 360 }}
									transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
									className="w-6 h-6 border-2 border-easyti-primary/30 border-t-easyti-primary rounded-full"
								/>
							</div>
							<span className="text-sm text-muted-foreground">Analisando repositório...</span>
						</div>
					)}

					{detectedStack && !isDetecting && (
						<div className="flex items-center gap-2 p-3 bg-easyti-primary/10 border border-easyti-primary/20 rounded-lg">
							<TechIcon name={STACKS.find((s) => s.id === detectedStack)?.iconKey || "node"} size={20} />
							<span className="text-sm">
								Stack detectada: <strong>{STACKS.find((s) => s.id === detectedStack)?.name}</strong>
							</span>
							{hasDockerfile && (
								<Badge variant="outline" className="ml-auto text-green-600 border-green-600">
									Dockerfile encontrado
								</Badge>
							)}
						</div>
					)}

					<Label>Framework / Stack</Label>
					<div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
						{STACKS.map((stack) => (
							<button
								key={stack.id}
								type="button"
								onClick={() => handleStackSelect(stack.id)}
								className={`p-3 rounded-xl border-2 flex flex-col items-center gap-1.5 transition-all duration-200 ${
									config.stackType === stack.id
										? "border-easyti-primary bg-easyti-primary/5"
										: "border-border hover:border-easyti-primary/40"
								}`}
							>
								<TechIcon name={stack.iconKey} size={22} />
								<span className="text-[11px] font-medium leading-tight text-center">
									{stack.name}
								</span>
							</button>
						))}
					</div>

					{/* Package manager (Node stacks) */}
					{isNodeStack && (
						<div className="flex gap-2">
							{(["npm", "yarn", "pnpm", "bun"] as const).map((pm) => (
								<button
									key={pm}
									type="button"
									onClick={() => handlePMChange(pm)}
									className={`flex items-center gap-1.5 py-1.5 px-3 rounded-lg border transition-all text-sm ${
										(config.packageManager ?? "npm") === pm
											? "border-easyti-primary bg-easyti-primary/10 text-easyti-primary"
											: "border-border hover:border-easyti-primary/40"
									}`}
								>
									<TechIcon name={pm} size={14} />
									{pm}
								</button>
							))}
						</div>
					)}

					{/* Build commands (collapsible) */}
					{config.stackType && (
						<div className="space-y-2">
							<button
								type="button"
								onClick={() => setShowAdvanced(!showAdvanced)}
								className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
							>
								<Settings2 className="w-4 h-4" />
								<span>Configurações avançadas</span>
								<ChevronDown className={`w-3.5 h-3.5 transition-transform ${showAdvanced ? "rotate-180" : ""}`} />
							</button>

							<AnimatePresence>
								{showAdvanced && (
									<motion.div
										initial={{ height: 0, opacity: 0 }}
										animate={{ height: "auto", opacity: 1 }}
										exit={{ height: 0, opacity: 0 }}
										className="space-y-3 p-4 bg-muted rounded-lg overflow-hidden"
									>
										<div>
											<Label className="text-xs text-muted-foreground">Instalar dependências</Label>
											<Input
												value={config.installCommand ?? ""}
												onChange={(e) => setConfig((c) => ({ ...c, installCommand: e.target.value }))}
												className="mt-1 font-mono text-sm h-8"
												placeholder="npm ci"
											/>
										</div>
										<div>
											<Label className="text-xs text-muted-foreground">Build</Label>
											<Input
												value={config.buildCommand ?? ""}
												onChange={(e) => setConfig((c) => ({ ...c, buildCommand: e.target.value }))}
												className="mt-1 font-mono text-sm h-8"
												placeholder="npm run build"
											/>
										</div>
										<div>
											<Label className="text-xs text-muted-foreground">Start</Label>
											<Input
												value={config.startCommand ?? ""}
												onChange={(e) => setConfig((c) => ({ ...c, startCommand: e.target.value }))}
												className="mt-1 font-mono text-sm h-8"
												placeholder="npm start"
											/>
										</div>

										{/* Dockerfile preview */}
										<button
											type="button"
											onClick={() => setShowDockerfile(!showDockerfile)}
											className="text-xs text-easyti-primary hover:underline flex items-center gap-1"
										>
											<FileCode className="w-3.5 h-3.5" />
											{showDockerfile
												? "▲ Ocultar Dockerfile"
												: hasDockerfile
													? "▼ Ver Dockerfile do repositório"
													: "▼ Ver Dockerfile (auto-gerado)"}
										</button>
										{showDockerfile && (
											<div className="mt-2 space-y-2">
												<pre className="p-3 bg-black/80 rounded text-xs font-mono text-green-400 overflow-x-auto whitespace-pre max-h-48 overflow-y-auto">
													{hasDockerfile && existingDockerfile
														? existingDockerfile
														: generateDockerfileContent(
																config.stackType!,
																config.installCommand ?? "",
																config.buildCommand ?? "",
																config.startCommand ?? "",
															)}
												</pre>
												{!hasDockerfile && (
													<p className="text-xs text-muted-foreground">
														Este Dockerfile será gerado automaticamente para o build.
														Você pode alterá-lo depois nas configurações da aplicação.
													</p>
												)}
											</div>
										)}
									</motion.div>
								)}
							</AnimatePresence>
						</div>
					)}
				</div>
			)}

			{/* Optional: project name, server, env vars */}
			<div className="space-y-3">
				<div>
					<Label className="text-sm text-muted-foreground">Nome do Projeto (opcional)</Label>
					<Input
						placeholder="Meu Projeto"
						value={config.projectName ?? ""}
						onChange={(e) => setConfig((c) => ({ ...c, projectName: e.target.value }))}
						className="mt-1"
					/>
				</div>

				{servers && servers.length > 0 && (
					<div>
						<Label className="text-sm text-muted-foreground">
							{isCloud ? "Servidor *" : "Servidor (opcional)"}
						</Label>
						<Select
							value={config.serverId ?? (isCloud ? "" : "dokploy")}
							onValueChange={(val) => setConfig((c) => ({ ...c, serverId: val === "dokploy" ? undefined : val }))}
						>
							<SelectTrigger className="mt-1">
								<SelectValue placeholder="Selecione o servidor" />
							</SelectTrigger>
							<SelectContent>
								{!isCloud && <SelectItem value="dokploy">Servidor padrão (EasyDeploy)</SelectItem>}
								{servers.map((s) => (
									<SelectItem key={s.serverId} value={s.serverId}>
										{s.name} — {s.ipAddress}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
				)}

				{/* Environment variables */}
				<button
					type="button"
					onClick={() => setShowEnv(!showEnv)}
					className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
				>
					<Plus className="w-4 h-4" />
					<span>Variáveis de ambiente</span>
					<ChevronDown className={`w-3.5 h-3.5 transition-transform ${showEnv ? "rotate-180" : ""}`} />
				</button>

				<AnimatePresence>
					{showEnv && (
						<motion.div
							initial={{ height: 0, opacity: 0 }}
							animate={{ height: "auto", opacity: 1 }}
							exit={{ height: 0, opacity: 0 }}
							className="overflow-hidden"
						>
							<EnvVarsEditor config={config} setConfig={setConfig} />
						</motion.div>
					)}
				</AnimatePresence>
			</div>

			{/* Deploy section */}
			<div className="pt-4 border-t border-border">
				{/* Build progress when deploying */}
				{isDeploying && (
					<FadeInUp className="mb-6">
						<div className="flex flex-col items-center gap-4">
							<DeployRocketAnimation phase={deployPhase} />
							<BuildProgressAnimation currentStep={buildStep} />
						</div>
					</FadeInUp>
				)}

				{/* Deploy log */}
				{deployLog.length > 0 && (
					<motion.div
						initial={{ height: 0 }}
						animate={{ height: "auto" }}
						className="mb-4 bg-black/80 rounded-lg p-4 font-mono text-xs space-y-1 max-h-48 overflow-y-auto"
					>
						{deployLog.map((line, i) => (
							<div
								key={i}
								className={
									line.startsWith("✗")
										? "text-red-400"
										: line.startsWith("✓")
											? "text-green-400"
											: "text-gray-300"
								}
							>
								{line}
							</div>
						))}
						{isDeploying && <div className="text-yellow-400 animate-pulse">...</div>}
					</motion.div>
				)}

				{/* Action buttons */}
				<div className="flex justify-between items-center">
					<Button variant="outline" onClick={onBack} disabled={isDeploying}>
						<ArrowLeft className="w-4 h-4 mr-2" />
						Voltar
					</Button>

					<Button
						onClick={onDeploy}
						disabled={isDeploying || !config.appName}
						size="lg"
						className="bg-easyti-primary hover:bg-easyti-primary-dark text-white gap-2 min-w-[180px]"
					>
						{isDeploying ? (
							<>
								<motion.div
									animate={{ rotate: 360 }}
									transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
									className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
								/>
								Fazendo Deploy...
							</>
						) : (
							<>
								🚀 Fazer Deploy
							</>
						)}
					</Button>
				</div>
			</div>
		</div>
	);
}

// ─── EnvVarsEditor ─────────────────────────────────────────────────
function EnvVarsEditor({
	config,
	setConfig,
}: {
	config: DeployConfig;
	setConfig: React.Dispatch<React.SetStateAction<DeployConfig>>;
}) {
	const [pairs, setPairs] = useState<{ key: string; value: string }[]>(() => {
		const vars = config.envVars ?? {};
		const p = Object.entries(vars).map(([key, value]) => ({ key, value }));
		return p.length > 0 ? p : [{ key: "", value: "" }];
	});

	const sync = (updated: { key: string; value: string }[]) => {
		const envVars = updated.reduce(
			(acc, pair) => {
				if (pair.key.trim()) acc[pair.key] = pair.value;
				return acc;
			},
			{} as Record<string, string>,
		);
		setConfig((c) => ({ ...c, envVars }));
	};

	const updatePair = (index: number, field: "key" | "value", value: string) => {
		const updated = [...pairs];
		const current = updated[index];
		if (current) {
			updated[index] = { ...current, [field]: value };
			setPairs(updated);
			sync(updated);
		}
	};

	const addPair = () => {
		const updated = [...pairs, { key: "", value: "" }];
		setPairs(updated);
	};

	const removePair = (index: number) => {
		const updated = pairs.filter((_, i) => i !== index);
		const next = updated.length > 0 ? updated : [{ key: "", value: "" }];
		setPairs(next);
		sync(next);
	};

	const isSensitive = (key: string) => /SECRET|PASSWORD|TOKEN|KEY|PASS/i.test(key);

	return (
		<div className="space-y-3 p-4 bg-muted rounded-lg">
			{pairs.map((pair, index) => (
				<div key={index} className="flex gap-2">
					<Input
						placeholder="CHAVE"
						value={pair.key}
						onChange={(e) => updatePair(index, "key", e.target.value.toUpperCase())}
						className="font-mono text-sm"
					/>
					<Input
						placeholder="valor"
						value={pair.value}
						type={isSensitive(pair.key) ? "password" : "text"}
						onChange={(e) => updatePair(index, "value", e.target.value)}
						className="font-mono text-sm"
					/>
					{pairs.length > 1 && (
						<Button variant="ghost" size="icon" type="button" onClick={() => removePair(index)} className="text-destructive hover:bg-destructive/10 shrink-0">
							✕
						</Button>
					)}
				</div>
			))}
			<Button variant="outline" type="button" onClick={addPair} className="w-full border-dashed" size="sm">
				<Plus className="w-3.5 h-3.5 mr-1" />
				Adicionar Variável
			</Button>
		</div>
	);
}

// ─── Shared small components ───────────────────────────────────────
function LoadingState({ label }: { label: string }) {
	return (
		<div className="flex items-center gap-2 py-3">
			<motion.div
				animate={{ rotate: 360 }}
				transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
				className="w-4 h-4 border-2 border-easyti-primary/30 border-t-easyti-primary rounded-full"
			/>
			<span className="text-sm text-muted-foreground">{label}</span>
		</div>
	);
}

function NoProviderCTA({ provider }: { provider: string }) {
	return (
		<div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
			<p className="text-sm text-yellow-500 mb-2">
				Nenhuma conta {provider} conectada.
			</p>
			<Button variant="outline" size="sm" asChild>
				<a href="/dashboard/settings/git-providers" className="gap-2">
					<ExternalLink className="w-3.5 h-3.5" />
					Conectar {provider}
				</a>
			</Button>
		</div>
	);
}

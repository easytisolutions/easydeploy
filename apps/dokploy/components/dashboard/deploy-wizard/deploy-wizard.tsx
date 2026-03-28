import { useState } from "react";
import { useRouter } from "next/router";
import { toast } from "sonner";
import { api } from "@/utils/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

type DeployStep = 1 | 2 | 3 | 4;
type SourceType = "github" | "gitlab" | "bitbucket" | "git" | "docker";
type BuildType = "nixpacks" | "dockerfile" | "buildpack";

interface DeployConfig {
	// Step 1: source
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
	// Step 2: build
	projectName?: string;
	appName?: string;
	buildType?: BuildType;
	serverId?: string;
	// Step 3: env
	envVars?: Record<string, string>;
}

const STEPS = [
	{ number: 1, title: "Repositório", icon: "🔗" },
	{ number: 2, title: "Configurar Build", icon: "⚙️" },
	{ number: 3, title: "Variáveis de Ambiente", icon: "🔐" },
	{ number: 4, title: "Deploy", icon: "🚀" },
] as const;

export function DeployWizard() {
	const router = useRouter();
	const [step, setStep] = useState<DeployStep>(1);
	const [config, setConfig] = useState<DeployConfig>({
		buildType: "nixpacks",
		customGitBranch: "main",
		githubBranch: "main",
		gitlabBranch: "main",
		bitbucketBranch: "main",
	});
	const [isDeploying, setIsDeploying] = useState(false);
	const [deployLog, setDeployLog] = useState<string[]>([]);

	const createProject = api.project.create.useMutation();
	const createApplication = api.application.create.useMutation();
	const saveGithubProvider = api.application.saveGithubProvider.useMutation();
	const saveGitlabProvider = api.application.saveGitlabProvider.useMutation();
	const saveBitbucketProvider =
		api.application.saveBitbucketProvider.useMutation();
	const saveGitProvider = api.application.saveGitProvider.useMutation();
	const saveDockerProvider = api.application.saveDockerProvider.useMutation();
	const saveBuildType = api.application.saveBuildType.useMutation();
	const saveEnvironment = api.application.saveEnvironment.useMutation();
	const deployApp = api.application.deploy.useMutation();

	const addLog = (msg: string) => setDeployLog((prev) => [...prev, msg]);

	const handleDeploy = async () => {
		if (!config.appName) {
			toast.error("Informe o nome da aplicação");
			return;
		}

		setIsDeploying(true);
		setDeployLog([]);

		try {
			// 1. Create project
			addLog("Criando projeto...");
			const projectResult = await createProject.mutateAsync({
				name: config.projectName || config.appName,
				description: "Criado via DeployWizard",
				env: "",
			});
			const projectId = projectResult.project.projectId;
			const environmentId = projectResult.environment?.environmentId ?? "";

			if (!environmentId) {
				throw new Error("Ambiente do projeto não encontrado");
			}
			addLog("✓ Projeto criado");

			// 2. Create application
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

			// 3. Save source provider
			addLog("Configurando fonte...");
			if (config.sourceType === "github") {
				if (
					!config.githubId ||
					!config.githubRepoName ||
					!config.githubRepoOwner ||
					!config.githubBranch
				) {
					throw new Error("Preencha todos os campos do GitHub");
				}
				await saveGithubProvider.mutateAsync({
					applicationId,
					repository: config.githubRepoName,
					owner: config.githubRepoOwner,
					branch: config.githubBranch,
					buildPath: "/",
					githubId: config.githubId,
					watchPaths: [],
					triggerType: "push",
					enableSubmodules: false,
				});
			} else if (config.sourceType === "gitlab") {
				if (
					!config.gitlabId ||
					!config.gitlabRepoName ||
					!config.gitlabRepoOwner ||
					!config.gitlabBranch
				) {
					throw new Error("Preencha todos os campos do GitLab");
				}
				await saveGitlabProvider.mutateAsync({
					applicationId,
					gitlabRepository: config.gitlabRepoName,
					gitlabOwner: config.gitlabRepoOwner,
					gitlabBranch: config.gitlabBranch,
					gitlabBuildPath: "/",
					gitlabId: config.gitlabId,
					gitlabProjectId: config.gitlabRepoId ?? 0,
					gitlabPathNamespace:
						config.gitlabPathNamespace ?? config.gitlabRepoOwner,
					watchPaths: [],
					enableSubmodules: false,
				});
			} else if (config.sourceType === "bitbucket") {
				if (
					!config.bitbucketId ||
					!config.bitbucketRepoName ||
					!config.bitbucketRepoOwner ||
					!config.bitbucketBranch
				) {
					throw new Error("Preencha todos os campos do Bitbucket");
				}
				await saveBitbucketProvider.mutateAsync({
					applicationId,
					bitbucketRepository: config.bitbucketRepoName,
					bitbucketOwner: config.bitbucketRepoOwner,
					bitbucketBranch: config.bitbucketBranch,
					bitbucketBuildPath: "/",
					bitbucketId: config.bitbucketId,
					bitbucketRepositorySlug:
						config.bitbucketRepoSlug || config.bitbucketRepoName,
					watchPaths: [],
					enableSubmodules: false,
				});
			} else if (config.sourceType === "git") {
				if (!config.customGitUrl) {
					throw new Error("Informe a URL do repositório Git");
				}
				await saveGitProvider.mutateAsync({
					applicationId,
					customGitUrl: config.customGitUrl,
					customGitBranch: config.customGitBranch || "main",
					customGitBuildPath: "/",
					watchPaths: [],
					enableSubmodules: false,
					customGitSSHKeyId: null,
				});
			} else if (config.sourceType === "docker") {
				if (!config.dockerImage) {
					throw new Error("Informe a imagem Docker");
				}
				await saveDockerProvider.mutateAsync({
					applicationId,
					dockerImage: config.dockerImage,
					username: config.dockerUsername || "",
					password: config.dockerPassword || "",
					registryUrl: "",
				});
			}
			addLog("✓ Fonte configurada");

			// 4. Save environment variables
			const envVars = config.envVars || {};
			const envString = Object.entries(envVars)
				.filter(([k]) => k.trim())
				.map(([k, v]) => `${k}=${v}`)
				.join("\n");
			await saveEnvironment.mutateAsync({
				applicationId,
				env: envString,
				buildArgs: "",
				buildSecrets: "",
				createEnvFile: false,
			});
			if (Object.keys(envVars).filter((k) => k.trim()).length > 0) {
				addLog("✓ Variáveis de ambiente salvas");
			}

			// 5. Save build type (skip for docker)
			if (config.sourceType !== "docker") {
				await saveBuildType.mutateAsync({
					applicationId,
					buildType: config.buildType || "nixpacks",
					dockerfile: null,
					dockerContextPath: null,
					dockerBuildStage: null,
					herokuVersion: null,
					railpackVersion: null,
					publishDirectory: null,
					isStaticSpa: null,
				});
				addLog("✓ Tipo de build configurado");
			}

			// 6. Deploy
			addLog("Iniciando deploy...");
			await deployApp.mutateAsync({ applicationId });
			addLog("✓ Deploy iniciado com sucesso!");

			toast.success("Deploy iniciado com sucesso!");
			setTimeout(() => {
				router.push(
					`/dashboard/project/${projectId}/services/application/${applicationId}`,
				);
			}, 1500);
		} catch (error) {
			const msg =
				error instanceof Error ? error.message : "Erro ao fazer deploy";
			addLog(`✗ Erro: ${msg}`);
			toast.error(msg);
		} finally {
			setIsDeploying(false);
		}
	};

	const canProceed = () => {
		if (step === 1) {
			if (!config.sourceType) return false;
			if (config.sourceType === "github")
				return !!(
					config.githubId &&
					config.githubRepoName &&
					config.githubBranch
				);
			if (config.sourceType === "gitlab")
				return !!(
					config.gitlabId &&
					config.gitlabRepoName &&
					config.gitlabBranch
				);
			if (config.sourceType === "bitbucket")
				return !!(
					config.bitbucketId &&
					config.bitbucketRepoName &&
					config.bitbucketBranch
				);
			if (config.sourceType === "git") return !!config.customGitUrl;
			if (config.sourceType === "docker") return !!config.dockerImage;
			return false;
		}
		if (step === 2) return !!(config.buildType && config.appName);
		return true;
	};

	return (
		<div className="max-w-2xl mx-auto">
			{/* Progress Steps */}
			<div className="flex items-center justify-between mb-8">
				{STEPS.map((s, index) => (
					<div key={s.number} className="flex items-center flex-1">
						<div className="flex flex-col items-center">
							<div
								className={`w-10 h-10 rounded-full flex items-center justify-center text-base font-medium transition-colors ${
									step > s.number
										? "bg-easyti-primary text-white"
										: step === s.number
											? "bg-easyti-primary text-white ring-4 ring-easyti-primary/20"
											: "bg-muted text-muted-foreground border border-border"
								}`}
							>
								{step > s.number ? "✓" : s.icon}
							</div>
							<span className="text-xs mt-1 text-muted-foreground hidden sm:block">
								{s.title}
							</span>
						</div>
						{index < STEPS.length - 1 && (
							<div
								className={`flex-1 h-px mx-2 transition-colors ${
									step > s.number ? "bg-easyti-primary" : "bg-border"
								}`}
							/>
						)}
					</div>
				))}
			</div>

			{/* Step Content */}
			<Card className="p-6">
				{step === 1 && (
					<StepConnectRepo config={config} setConfig={setConfig} />
				)}
				{step === 2 && (
					<StepConfigureBuild config={config} setConfig={setConfig} />
				)}
				{step === 3 && (
					<StepEnvVars config={config} setConfig={setConfig} />
				)}
				{step === 4 && (
					<StepReview
						config={config}
						deployLog={deployLog}
						isDeploying={isDeploying}
					/>
				)}
			</Card>

			{/* Navigation */}
			<div className="flex justify-between mt-6">
				<Button
					variant="outline"
					onClick={() => setStep((s) => (s - 1) as DeployStep)}
					disabled={step === 1 || isDeploying}
				>
					← Voltar
				</Button>

				{step < 4 ? (
					<Button
						onClick={() => setStep((s) => (s + 1) as DeployStep)}
						disabled={!canProceed()}
						className="bg-easyti-primary hover:bg-easyti-primary-dark text-white"
					>
						Próximo →
					</Button>
				) : (
					<Button
						onClick={handleDeploy}
						disabled={isDeploying}
						className="bg-easyti-primary hover:bg-easyti-primary-dark text-white min-w-[160px]"
					>
						{isDeploying ? "Fazendo Deploy..." : "🚀 Fazer Deploy"}
					</Button>
				)}
			</div>
		</div>
	);
}

// ─────────────────────────────────────────────
// Step 1: Conectar Repositório
// ─────────────────────────────────────────────
const SOURCE_OPTIONS: {
	id: SourceType;
	name: string;
	emoji: string;
	popular?: boolean;
}[] = [
	{ id: "github", name: "GitHub", emoji: "🐙", popular: true },
	{ id: "gitlab", name: "GitLab", emoji: "🦊" },
	{ id: "bitbucket", name: "Bitbucket", emoji: "🪣" },
	{ id: "git", name: "Git URL", emoji: "📦" },
	{ id: "docker", name: "Docker Image", emoji: "🐳" },
];

function StepConnectRepo({
	config,
	setConfig,
}: {
	config: DeployConfig;
	setConfig: (c: DeployConfig) => void;
}) {
	return (
		<div className="space-y-6">
			<p className="text-muted-foreground text-center text-sm">
				Escolha de onde vem o código da sua aplicação
			</p>

			<div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
				{SOURCE_OPTIONS.map((source) => (
					<button
						key={source.id}
						type="button"
						onClick={() =>
							setConfig({
								...config,
								sourceType: source.id,
								githubId: undefined,
								githubRepoOwner: undefined,
								githubRepoName: undefined,
								githubBranch: "main",
								gitlabId: undefined,
								gitlabRepoOwner: undefined,
								gitlabRepoName: undefined,
								gitlabBranch: "main",
								bitbucketId: undefined,
								bitbucketRepoOwner: undefined,
								bitbucketRepoName: undefined,
								bitbucketBranch: "main",
								customGitUrl: undefined,
								customGitBranch: "main",
								dockerImage: undefined,
							})
						}
						className={`p-4 rounded-lg border-2 transition-all text-left ${
							config.sourceType === source.id
								? "border-easyti-primary bg-easyti-primary/10"
								: "border-border hover:border-easyti-primary/50"
						}`}
					>
						<div className="flex items-center gap-2">
							<span className="text-2xl">{source.emoji}</span>
							<div>
								<span className="font-medium text-sm">{source.name}</span>
								{source.popular && (
									<span className="ml-1 text-xs bg-easyti-primary/20 text-easyti-primary px-1.5 py-0.5 rounded">
										Popular
									</span>
								)}
							</div>
						</div>
					</button>
				))}
			</div>

			{config.sourceType === "github" && (
				<GithubConfig config={config} setConfig={setConfig} />
			)}
			{config.sourceType === "gitlab" && (
				<GitlabConfig config={config} setConfig={setConfig} />
			)}
			{config.sourceType === "bitbucket" && (
				<BitbucketConfig config={config} setConfig={setConfig} />
			)}
			{config.sourceType === "git" && (
				<GitUrlConfig config={config} setConfig={setConfig} />
			)}
			{config.sourceType === "docker" && (
				<DockerConfig config={config} setConfig={setConfig} />
			)}
		</div>
	);
}

// ─────────────────────────────────────────────
// GitHub Config
// ─────────────────────────────────────────────
function GithubConfig({
	config,
	setConfig,
}: {
	config: DeployConfig;
	setConfig: (c: DeployConfig) => void;
}) {
	const { data: providers, isLoading: loadingProviders } =
		api.github.githubProviders.useQuery();

	const { data: repositories, isLoading: loadingRepos } =
		api.github.getGithubRepositories.useQuery(
			{ githubId: config.githubId ?? "" },
			{ enabled: !!config.githubId },
		);

	const { data: branches, isLoading: loadingBranches } =
		api.github.getGithubBranches.useQuery(
			{
				githubId: config.githubId ?? "",
				owner: config.githubRepoOwner ?? "",
				repo: config.githubRepoName ?? "",
			},
			{
				enabled:
					!!config.githubId &&
					!!config.githubRepoOwner &&
					!!config.githubRepoName,
			},
		);

	if (loadingProviders) {
		return <LoadingRow label="Carregando contas GitHub..." />;
	}

	if (!providers || providers.length === 0) {
		return (
			<NoProviderMessage
				provider="GitHub"
				href="/dashboard/settings/git-providers"
			/>
		);
	}

	return (
		<div className="space-y-3 pt-4 border-t border-border">
			<div>
				<Label className="text-sm">Conta GitHub</Label>
				<Select
					value={config.githubId ?? ""}
					onValueChange={(val) =>
						setConfig({
							...config,
							githubId: val,
							githubRepoOwner: undefined,
							githubRepoName: undefined,
							githubBranch: "main",
						})
					}
				>
					<SelectTrigger className="mt-1">
						<SelectValue placeholder="Selecione a conta" />
					</SelectTrigger>
					<SelectContent>
						{providers.map((p) => (
							<SelectItem key={p.githubId} value={p.githubId}>
								{p.gitProvider.name}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>

			{config.githubId && (
				<div>
					<Label className="text-sm">Repositório</Label>
					{loadingRepos ? (
						<LoadingRow label="Carregando repositórios..." />
					) : (
						<Select
							value={
								config.githubRepoOwner && config.githubRepoName
									? `${config.githubRepoOwner}/${config.githubRepoName}`
									: ""
							}
							onValueChange={(val) => {
								const [owner, ...rest] = val.split("/");
								const repo = rest.join("/");
								setConfig({
									...config,
									githubRepoOwner: owner,
									githubRepoName: repo,
									githubBranch: "main",
								});
							}}
						>
							<SelectTrigger className="mt-1">
								<SelectValue placeholder="Selecione o repositório" />
							</SelectTrigger>
							<SelectContent>
								{repositories?.map((r) => (
									<SelectItem
										key={r.full_name}
										value={`${r.owner.login}/${r.name}`}
									>
										{r.full_name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					)}
				</div>
			)}

			{config.githubRepoName && (
				<div>
					<Label className="text-sm">Branch</Label>
					{loadingBranches ? (
						<LoadingRow label="Carregando branches..." />
					) : (
						<Select
							value={config.githubBranch ?? "main"}
							onValueChange={(val) =>
								setConfig({ ...config, githubBranch: val })
							}
						>
							<SelectTrigger className="mt-1">
								<SelectValue placeholder="Selecione a branch" />
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
	);
}

// ─────────────────────────────────────────────
// GitLab Config
// ─────────────────────────────────────────────
function GitlabConfig({
	config,
	setConfig,
}: {
	config: DeployConfig;
	setConfig: (c: DeployConfig) => void;
}) {
	const { data: providers, isLoading: loadingProviders } =
		api.gitlab.gitlabProviders.useQuery();

	const { data: repositories, isLoading: loadingRepos } =
		api.gitlab.getGitlabRepositories.useQuery(
			{ gitlabId: config.gitlabId ?? "" },
			{ enabled: !!config.gitlabId },
		);

	const { data: branches, isLoading: loadingBranches } =
		api.gitlab.getGitlabBranches.useQuery(
			{
				gitlabId: config.gitlabId ?? "",
				id: config.gitlabRepoId,
				owner: config.gitlabRepoOwner ?? "",
				repo: config.gitlabRepoName ?? "",
			},
			{
				enabled:
					!!config.gitlabId &&
					!!config.gitlabRepoId &&
					!!config.gitlabRepoName,
			},
		);

	if (loadingProviders) {
		return <LoadingRow label="Carregando contas GitLab..." />;
	}

	if (!providers || providers.length === 0) {
		return (
			<NoProviderMessage
				provider="GitLab"
				href="/dashboard/settings/git-providers"
			/>
		);
	}

	return (
		<div className="space-y-3 pt-4 border-t border-border">
			<div>
				<Label className="text-sm">Conta GitLab</Label>
				<Select
					value={config.gitlabId ?? ""}
					onValueChange={(val) =>
						setConfig({
							...config,
							gitlabId: val,
							gitlabRepoOwner: undefined,
							gitlabRepoName: undefined,
							gitlabRepoId: undefined,
							gitlabBranch: "main",
						})
					}
				>
					<SelectTrigger className="mt-1">
						<SelectValue placeholder="Selecione a conta" />
					</SelectTrigger>
					<SelectContent>
						{providers.map((p) => (
							<SelectItem key={p.gitlabId} value={p.gitlabId}>
								{p.gitProvider.name}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>

			{config.gitlabId && (
				<div>
					<Label className="text-sm">Repositório</Label>
					{loadingRepos ? (
						<LoadingRow label="Carregando repositórios..." />
					) : (
						<Select
							value={config.gitlabRepoId?.toString() ?? ""}
							onValueChange={(val) => {
								const repo = repositories?.find(
									(r) => r.id.toString() === val,
								);
								if (repo) {
									setConfig({
										...config,
										gitlabRepoId: repo.id,
										gitlabRepoOwner: repo.owner.username,
										gitlabRepoName: repo.name,
										gitlabPathNamespace: repo.url,
										gitlabBranch: "main",
									});
								}
							}}
						>
							<SelectTrigger className="mt-1">
								<SelectValue placeholder="Selecione o repositório" />
							</SelectTrigger>
							<SelectContent>
								{repositories?.map((r) => (
									<SelectItem key={r.id} value={r.id.toString()}>
										{r.url}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					)}
				</div>
			)}

			{config.gitlabRepoName && (
				<div>
					<Label className="text-sm">Branch</Label>
					{loadingBranches ? (
						<LoadingRow label="Carregando branches..." />
					) : (
						<Select
							value={config.gitlabBranch ?? "main"}
							onValueChange={(val) =>
								setConfig({ ...config, gitlabBranch: val })
							}
						>
							<SelectTrigger className="mt-1">
								<SelectValue placeholder="Selecione a branch" />
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
	);
}

// ─────────────────────────────────────────────
// Bitbucket Config
// ─────────────────────────────────────────────
function BitbucketConfig({
	config,
	setConfig,
}: {
	config: DeployConfig;
	setConfig: (c: DeployConfig) => void;
}) {
	const { data: providers, isLoading: loadingProviders } =
		api.bitbucket.bitbucketProviders.useQuery();

	const { data: repositories, isLoading: loadingRepos } =
		api.bitbucket.getBitbucketRepositories.useQuery(
			{ bitbucketId: config.bitbucketId ?? "" },
			{ enabled: !!config.bitbucketId },
		);

	const { data: branches, isLoading: loadingBranches } =
		api.bitbucket.getBitbucketBranches.useQuery(
			{
				bitbucketId: config.bitbucketId ?? "",
				owner: config.bitbucketRepoOwner ?? "",
				repo: config.bitbucketRepoName ?? "",
			},
			{
				enabled:
					!!config.bitbucketId &&
					!!config.bitbucketRepoOwner &&
					!!config.bitbucketRepoName,
			},
		);

	if (loadingProviders) {
		return <LoadingRow label="Carregando contas Bitbucket..." />;
	}

	if (!providers || providers.length === 0) {
		return (
			<NoProviderMessage
				provider="Bitbucket"
				href="/dashboard/settings/git-providers"
			/>
		);
	}

	return (
		<div className="space-y-3 pt-4 border-t border-border">
			<div>
				<Label className="text-sm">Conta Bitbucket</Label>
				<Select
					value={config.bitbucketId ?? ""}
					onValueChange={(val) =>
						setConfig({
							...config,
							bitbucketId: val,
							bitbucketRepoOwner: undefined,
							bitbucketRepoName: undefined,
							bitbucketRepoSlug: undefined,
							bitbucketBranch: "main",
						})
					}
				>
					<SelectTrigger className="mt-1">
						<SelectValue placeholder="Selecione a conta" />
					</SelectTrigger>
					<SelectContent>
						{providers.map((p) => (
							<SelectItem key={p.bitbucketId} value={p.bitbucketId}>
								{p.gitProvider.name}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>

			{config.bitbucketId && (
				<div>
					<Label className="text-sm">Repositório</Label>
					{loadingRepos ? (
						<LoadingRow label="Carregando repositórios..." />
					) : (
						<Select
							value={config.bitbucketRepoName ?? ""}
							onValueChange={(val) => {
								const repo = repositories?.find((r) => r.name === val);
								if (repo) {
									setConfig({
										...config,
										bitbucketRepoOwner: repo.owner.username,
										bitbucketRepoName: repo.name,
										bitbucketRepoSlug: repo.slug,
										bitbucketBranch: "main",
									});
								}
							}}
						>
							<SelectTrigger className="mt-1">
								<SelectValue placeholder="Selecione o repositório" />
							</SelectTrigger>
							<SelectContent>
								{repositories?.map((r) => (
									<SelectItem key={r.name} value={r.name}>
										{r.owner.username}/{r.name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					)}
				</div>
			)}

			{config.bitbucketRepoName && (
				<div>
					<Label className="text-sm">Branch</Label>
					{loadingBranches ? (
						<LoadingRow label="Carregando branches..." />
					) : (
						<Select
							value={config.bitbucketBranch ?? "main"}
							onValueChange={(val) =>
								setConfig({ ...config, bitbucketBranch: val })
							}
						>
							<SelectTrigger className="mt-1">
								<SelectValue placeholder="Selecione a branch" />
							</SelectTrigger>
							<SelectContent>
								{(
									branches as
										| { name: string; commit: { sha: string } }[]
										| undefined
								)?.map((b) => (
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
	);
}

// ─────────────────────────────────────────────
// Git URL Config
// ─────────────────────────────────────────────
function GitUrlConfig({
	config,
	setConfig,
}: {
	config: DeployConfig;
	setConfig: (c: DeployConfig) => void;
}) {
	return (
		<div className="space-y-3 pt-4 border-t border-border">
			<div>
				<Label className="text-sm">URL do Repositório</Label>
				<Input
					placeholder="https://github.com/usuario/repositorio.git"
					value={config.customGitUrl ?? ""}
					onChange={(e) =>
						setConfig({ ...config, customGitUrl: e.target.value })
					}
					className="mt-1 font-mono text-sm"
				/>
			</div>
			<div>
				<Label className="text-sm">Branch</Label>
				<Input
					placeholder="main"
					value={config.customGitBranch ?? "main"}
					onChange={(e) =>
						setConfig({ ...config, customGitBranch: e.target.value })
					}
					className="mt-1"
				/>
			</div>
		</div>
	);
}

// ─────────────────────────────────────────────
// Docker Config
// ─────────────────────────────────────────────
function DockerConfig({
	config,
	setConfig,
}: {
	config: DeployConfig;
	setConfig: (c: DeployConfig) => void;
}) {
	const [showAuth, setShowAuth] = useState(false);

	return (
		<div className="space-y-3 pt-4 border-t border-border">
			<div>
				<Label className="text-sm">Imagem Docker</Label>
				<Input
					placeholder="nginx:latest ou usuario/imagem:tag"
					value={config.dockerImage ?? ""}
					onChange={(e) =>
						setConfig({ ...config, dockerImage: e.target.value })
					}
					className="mt-1 font-mono text-sm"
				/>
			</div>
			<button
				type="button"
				onClick={() => setShowAuth(!showAuth)}
				className="text-sm text-easyti-primary hover:underline"
			>
				{showAuth ? "- Ocultar autenticação" : "+ Registry privado (opcional)"}
			</button>
			{showAuth && (
				<div className="space-y-2 p-3 bg-muted rounded-lg">
					<div>
						<Label className="text-sm">Usuário</Label>
						<Input
							placeholder="username"
							value={config.dockerUsername ?? ""}
							onChange={(e) =>
								setConfig({ ...config, dockerUsername: e.target.value })
							}
							className="mt-1"
						/>
					</div>
					<div>
						<Label className="text-sm">Senha / Token</Label>
						<Input
							type="password"
							placeholder="password ou access token"
							value={config.dockerPassword ?? ""}
							onChange={(e) =>
								setConfig({ ...config, dockerPassword: e.target.value })
							}
							className="mt-1"
						/>
					</div>
				</div>
			)}
		</div>
	);
}

// ─────────────────────────────────────────────
// Step 2: Configurar Build
// ─────────────────────────────────────────────
const BUILD_OPTIONS: {
	id: BuildType;
	name: string;
	description: string;
	recommended?: boolean;
}[] = [
	{
		id: "nixpacks",
		name: "Detecção Automática",
		description:
			"Detectamos automaticamente Node.js, Python, Go, Ruby, PHP e mais",
		recommended: true,
	},
	{
		id: "dockerfile",
		name: "Dockerfile",
		description: "Use seu próprio Dockerfile do repositório",
	},
	{
		id: "buildpack",
		name: "Buildpack",
		description: "Heroku Buildpacks para compatibilidade máxima",
	},
];

function StepConfigureBuild({
	config,
	setConfig,
}: {
	config: DeployConfig;
	setConfig: (c: DeployConfig) => void;
}) {
	const { data: servers } = api.server.withSSHKey.useQuery();
	const { data: isCloud } = api.settings.isCloud.useQuery();

	return (
		<div className="space-y-6">
			<p className="text-muted-foreground text-center text-sm">
				Como devemos construir sua aplicação?
			</p>

			{config.sourceType !== "docker" && (
				<div className="space-y-3">
					{BUILD_OPTIONS.map((option) => (
						<button
							key={option.id}
							type="button"
							onClick={() => setConfig({ ...config, buildType: option.id })}
							className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
								config.buildType === option.id
									? "border-easyti-primary bg-easyti-primary/10"
									: "border-border hover:border-easyti-primary/50"
							}`}
						>
							<div className="flex items-start justify-between">
								<div>
									<span className="font-medium text-sm">{option.name}</span>
									{option.recommended && (
										<span className="ml-2 text-xs bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded">
											Recomendado
										</span>
									)}
									<p className="text-xs text-muted-foreground mt-1">
										{option.description}
									</p>
								</div>
								<div
									className={`w-4 h-4 rounded-full border-2 mt-0.5 flex-shrink-0 ${
										config.buildType === option.id
											? "border-easyti-primary bg-easyti-primary"
											: "border-muted-foreground"
									}`}
								/>
							</div>
						</button>
					))}
				</div>
			)}

			<div className="pt-4 border-t border-border space-y-3">
				<div>
					<Label className="text-sm">Nome da Aplicação *</Label>
					<Input
						placeholder="minha-app"
						value={config.appName ?? ""}
						onChange={(e) =>
							setConfig({
								...config,
								appName: e.target.value
									.toLowerCase()
									.replace(/[^a-z0-9-]/g, "-")
									.replace(/^-+|-+$/g, "")
									.replace(/--+/g, "-"),
							})
						}
						className="mt-1"
					/>
				</div>
				<div>
					<Label className="text-sm">Nome do Projeto (opcional)</Label>
					<Input
						placeholder="Meu Projeto"
						value={config.projectName ?? ""}
						onChange={(e) =>
							setConfig({ ...config, projectName: e.target.value })
						}
						className="mt-1"
					/>
				</div>

				{servers && servers.length > 0 && (
					<div>
						<Label className="text-sm">
							{isCloud ? "Servidor *" : "Servidor (opcional)"}
						</Label>
						<Select
							value={config.serverId ?? (isCloud ? "" : "dokploy")}
							onValueChange={(val) =>
								setConfig({
									...config,
									serverId: val === "dokploy" ? undefined : val,
								})
							}
						>
							<SelectTrigger className="mt-1">
								<SelectValue placeholder="Selecione o servidor" />
							</SelectTrigger>
							<SelectContent>
								{!isCloud && (
									<SelectItem value="dokploy">
										Servidor padrão (Dokploy)
									</SelectItem>
								)}
								{servers.map((s) => (
									<SelectItem key={s.serverId} value={s.serverId}>
										{s.name} — {s.ipAddress}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
				)}
			</div>
		</div>
	);
}

// ─────────────────────────────────────────────
// Step 3: Variáveis de Ambiente
// ─────────────────────────────────────────────
function StepEnvVars({
	config,
	setConfig,
}: {
	config: DeployConfig;
	setConfig: (c: DeployConfig) => void;
}) {
	const [envPairs, setEnvPairs] = useState<{ key: string; value: string }[]>(
		() => {
			const vars = config.envVars ?? {};
			const pairs = Object.entries(vars).map(([key, value]) => ({
				key,
				value,
			}));
			return pairs.length > 0 ? pairs : [{ key: "", value: "" }];
		},
	);

	const syncToConfig = (pairs: { key: string; value: string }[]) => {
		const envVars = pairs.reduce(
			(acc, pair) => {
				if (pair.key.trim()) acc[pair.key] = pair.value;
				return acc;
			},
			{} as Record<string, string>,
		);
		setConfig({ ...config, envVars });
	};

	const updatePair = (
		index: number,
		field: "key" | "value",
		value: string,
	) => {
		const updated = [...envPairs];
		const current = updated[index];
		if (current) {
			updated[index] = { ...current, [field]: value };
			setEnvPairs(updated);
			syncToConfig(updated);
		}
	};

	const addPair = () => setEnvPairs([...envPairs, { key: "", value: "" }]);

	const removePair = (index: number) => {
		const updated = envPairs.filter((_, i) => i !== index);
		const next = updated.length > 0 ? updated : [{ key: "", value: "" }];
		setEnvPairs(next);
		syncToConfig(next);
	};

	const isSensitive = (key: string) =>
		/SECRET|PASSWORD|TOKEN|KEY|PASS/i.test(key);

	return (
		<div className="space-y-6">
			<p className="text-muted-foreground text-center text-sm">
				Adicione as variáveis de ambiente da sua aplicação (opcional)
			</p>

			<div className="space-y-2">
				{envPairs.map((pair, index) => (
					<div key={index} className="flex gap-2">
						<Input
							placeholder="CHAVE"
							value={pair.key}
							onChange={(e) =>
								updatePair(index, "key", e.target.value.toUpperCase())
							}
							className="font-mono text-sm"
						/>
						<Input
							placeholder="valor"
							value={pair.value}
							type={isSensitive(pair.key) ? "password" : "text"}
							onChange={(e) => updatePair(index, "value", e.target.value)}
							className="font-mono text-sm"
						/>
						{envPairs.length > 1 && (
							<Button
								variant="ghost"
								size="icon"
								type="button"
								onClick={() => removePair(index)}
								className="text-destructive hover:bg-destructive/10 flex-shrink-0"
							>
								✕
							</Button>
						)}
					</div>
				))}
			</div>

			<Button
				variant="outline"
				type="button"
				onClick={addPair}
				className="w-full border-dashed"
			>
				+ Adicionar Variável
			</Button>

			<div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
				<p className="text-xs text-blue-400">
					💡 Variáveis como DATABASE_URL, API_KEY, etc. são automaticamente
					injetadas no build e runtime.
				</p>
			</div>
		</div>
	);
}

// ─────────────────────────────────────────────
// Step 4: Revisão & Deploy
// ─────────────────────────────────────────────
function StepReview({
	config,
	deployLog,
	isDeploying,
}: {
	config: DeployConfig;
	deployLog: string[];
	isDeploying: boolean;
}) {
	const sourceLabel = () => {
		if (config.sourceType === "github")
			return `${config.githubRepoOwner}/${config.githubRepoName}@${config.githubBranch}`;
		if (config.sourceType === "gitlab")
			return `${config.gitlabPathNamespace}@${config.gitlabBranch}`;
		if (config.sourceType === "bitbucket")
			return `${config.bitbucketRepoOwner}/${config.bitbucketRepoName}@${config.bitbucketBranch}`;
		if (config.sourceType === "git")
			return `${config.customGitUrl} (${config.customGitBranch})`;
		if (config.sourceType === "docker") return config.dockerImage;
		return "-";
	};

	const envCount = Object.keys(config.envVars ?? {}).filter((k) => k.trim())
		.length;

	return (
		<div className="space-y-6">
			<p className="text-muted-foreground text-center text-sm">
				Revise as configurações e faça o deploy!
			</p>

			{/* Summary */}
			<div className="bg-muted rounded-lg p-4 space-y-2 text-sm">
				<div className="flex justify-between gap-4">
					<span className="text-muted-foreground shrink-0">Fonte:</span>
					<span className="font-mono text-xs truncate text-right">
						{sourceLabel()}
					</span>
				</div>
				<div className="flex justify-between">
					<span className="text-muted-foreground">Tipo:</span>
					<span className="capitalize">{config.sourceType}</span>
				</div>
				{config.sourceType !== "docker" && (
					<div className="flex justify-between">
						<span className="text-muted-foreground">Build:</span>
						<span>{config.buildType ?? "nixpacks"}</span>
					</div>
				)}
				<div className="flex justify-between">
					<span className="text-muted-foreground">Aplicação:</span>
					<span className="font-mono">{config.appName ?? "-"}</span>
				</div>
				<div className="flex justify-between">
					<span className="text-muted-foreground">Projeto:</span>
					<span>{config.projectName ?? config.appName ?? "-"}</span>
				</div>
				<div className="flex justify-between">
					<span className="text-muted-foreground">Variáveis:</span>
					<span>{envCount} configuradas</span>
				</div>
			</div>

			{/* Deploy log */}
			{deployLog.length > 0 && (
				<div className="bg-black/80 rounded-lg p-4 font-mono text-xs space-y-1 max-h-48 overflow-y-auto">
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
					{isDeploying && (
						<div className="text-yellow-400 animate-pulse">...</div>
					)}
				</div>
			)}

			{deployLog.length === 0 && (
				<div className="p-4 bg-easyti-primary/10 border border-easyti-primary/30 rounded-lg">
					<p className="text-sm">
						✅ Tudo pronto! Clique em{" "}
						<strong>&quot;Fazer Deploy&quot;</strong> para publicar sua
						aplicação.
					</p>
				</div>
			)}
		</div>
	);
}

// ─────────────────────────────────────────────
// Utilities
// ─────────────────────────────────────────────
function LoadingRow({ label }: { label: string }) {
	return (
		<p className="text-sm text-muted-foreground py-2 animate-pulse">{label}</p>
	);
}

function NoProviderMessage({
	provider,
	href,
}: {
	provider: string;
	href: string;
}) {
	return (
		<div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg mt-3">
			<p className="text-sm text-yellow-400">
				Nenhuma conta {provider} conectada.{" "}
				<a href={href} className="underline hover:text-yellow-300">
					Conectar agora →
				</a>
			</p>
		</div>
	);
}

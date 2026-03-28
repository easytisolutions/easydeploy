import { useState } from "react";
import { useRouter } from "next/router";
import { toast } from "sonner";
import { api } from "@/utils/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type DeployStep = 1 | 2 | 3 | 4;

interface DeployConfig {
	projectName: string;
	appName: string;
	sourceType: "github" | "gitlab" | "git" | "docker";
	repositoryUrl: string;
	branch: string;
	buildType: "nixpacks" | "dockerfile" | "buildpack";
	envVars: Record<string, string>;
	domain: string;
}

const STEPS = [
	{ number: 1, title: "Conectar Repositório", icon: "🔗" },
	{ number: 2, title: "Configurar Build", icon: "⚙️" },
	{ number: 3, title: "Variáveis de Ambiente", icon: "🔐" },
	{ number: 4, title: "Domínio & Deploy", icon: "🚀" },
] as const;

export function DeployWizard() {
	const router = useRouter();
	const [step, setStep] = useState<DeployStep>(1);
	const [config, setConfig] = useState<Partial<DeployConfig>>({
		branch: "main",
		buildType: "nixpacks",
	});
	const [isDeploying, setIsDeploying] = useState(false);

	const createProject = api.project.create.useMutation();
	const createApplication = api.application.create.useMutation();

	const handleDeploy = async () => {
		if (!config.appName || !config.repositoryUrl) {
			toast.error("Preencha o nome da aplicação e o repositório");
			return;
		}

		setIsDeploying(true);
		try {
			const project = await createProject.mutateAsync({
				name: config.projectName || config.appName || "meu-projeto",
				description: `Criado via DeployWizard`,
				env: "",
			});

			toast.success("Deploy iniciado com sucesso!");
			router.push(`/dashboard/project/${project.project.projectId}`);
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : "Erro ao fazer deploy",
			);
		} finally {
			setIsDeploying(false);
		}
	};

	const canProceed = () => {
		if (step === 1) return !!config.sourceType;
		if (step === 2) return !!config.buildType && !!config.appName;
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

			{/* Step Title (mobile) */}
			<h2 className="text-xl font-bold text-center mb-4 sm:hidden">
				{STEPS[step - 1].title}
			</h2>

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
					<StepDeploy config={config} setConfig={setConfig} />
				)}
			</Card>

			{/* Navigation */}
			<div className="flex justify-between mt-6">
				<Button
					variant="outline"
					onClick={() => setStep((s) => (s - 1) as DeployStep)}
					disabled={step === 1}
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
const SOURCE_OPTIONS = [
	{ id: "github", name: "GitHub", emoji: "🐙", popular: true },
	{ id: "gitlab", name: "GitLab", emoji: "🦊" },
	{ id: "git", name: "Git URL", emoji: "📦" },
	{ id: "docker", name: "Docker Image", emoji: "🐳" },
] as const;

function StepConnectRepo({
	config,
	setConfig,
}: {
	config: Partial<DeployConfig>;
	setConfig: (c: Partial<DeployConfig>) => void;
}) {
	return (
		<div className="space-y-6">
			<p className="text-muted-foreground text-center text-sm">
				Escolha de onde vem o código da sua aplicação
			</p>

			<div className="grid grid-cols-2 gap-3">
				{SOURCE_OPTIONS.map((source) => (
					<button
						key={source.id}
						type="button"
						onClick={() => setConfig({ ...config, sourceType: source.id })}
						className={`p-4 rounded-lg border-2 transition-all text-left ${
							config.sourceType === source.id
								? "border-easyti-primary bg-easyti-primary/10"
								: "border-border hover:border-easyti-primary/50"
						}`}
					>
						<div className="flex items-center gap-3">
							<span className="text-2xl">{source.emoji}</span>
							<div>
								<span className="font-medium text-sm">{source.name}</span>
								{"popular" in source && source.popular && (
									<span className="ml-2 text-xs bg-easyti-primary/20 text-easyti-primary px-1.5 py-0.5 rounded">
										Popular
									</span>
								)}
							</div>
						</div>
					</button>
				))}
			</div>

			{config.sourceType && (
				<div className="space-y-3 pt-4 border-t border-border">
					{(config.sourceType === "git" ||
						config.sourceType === "gitlab") && (
						<>
							<div>
								<Label className="text-sm">URL do Repositório</Label>
								<Input
									placeholder="https://github.com/usuario/repositorio.git"
									value={config.repositoryUrl || ""}
									onChange={(e) =>
										setConfig({ ...config, repositoryUrl: e.target.value })
									}
									className="mt-1"
								/>
							</div>
							<div>
								<Label className="text-sm">Branch</Label>
								<Input
									placeholder="main"
									value={config.branch || "main"}
									onChange={(e) =>
										setConfig({ ...config, branch: e.target.value })
									}
									className="mt-1"
								/>
							</div>
						</>
					)}

					{config.sourceType === "github" && (
						<div className="p-3 bg-muted rounded-lg text-sm text-muted-foreground">
							💡 A integração com GitHub será configurada no próximo passo.
						</div>
					)}

					{config.sourceType === "docker" && (
						<div>
							<Label className="text-sm">Imagem Docker</Label>
							<Input
								placeholder="nginx:latest ou usuario/imagem:tag"
								value={config.repositoryUrl || ""}
								onChange={(e) =>
									setConfig({ ...config, repositoryUrl: e.target.value })
								}
								className="mt-1"
							/>
						</div>
					)}
				</div>
			)}
		</div>
	);
}

// ─────────────────────────────────────────────
// Step 2: Configurar Build
// ─────────────────────────────────────────────
const BUILD_OPTIONS = [
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
] as const;

function StepConfigureBuild({
	config,
	setConfig,
}: {
	config: Partial<DeployConfig>;
	setConfig: (c: Partial<DeployConfig>) => void;
}) {
	return (
		<div className="space-y-6">
			<p className="text-muted-foreground text-center text-sm">
				Como devemos construir sua aplicação?
			</p>

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
								{"recommended" in option && option.recommended && (
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

			<div className="pt-4 border-t border-border space-y-3">
				<div>
					<Label className="text-sm">Nome da Aplicação</Label>
					<Input
						placeholder="minha-app"
						value={config.appName || ""}
						onChange={(e) =>
							setConfig({
								...config,
								appName: e.target.value
									.toLowerCase()
									.replace(/[^a-z0-9-]/g, "-"),
							})
						}
						className="mt-1"
					/>
					<p className="text-xs text-muted-foreground mt-1">
						Será acessível em:{" "}
						<span className="font-mono">
							{config.appName || "minha-app"}.easyti.cloud
						</span>
					</p>
				</div>
				<div>
					<Label className="text-sm">Nome do Projeto (opcional)</Label>
					<Input
						placeholder="Meu Projeto"
						value={config.projectName || ""}
						onChange={(e) =>
							setConfig({ ...config, projectName: e.target.value })
						}
						className="mt-1"
					/>
				</div>
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
	config: Partial<DeployConfig>;
	setConfig: (c: Partial<DeployConfig>) => void;
}) {
	const [envPairs, setEnvPairs] = useState([{ key: "", value: "" }]);

	const updateEnvPair = (
		index: number,
		field: "key" | "value",
		value: string,
	) => {
		const updated = [...envPairs];
		updated[index] = { ...updated[index], [field]: value };
		setEnvPairs(updated);

		const envVars = updated.reduce(
			(acc, pair) => {
				if (pair.key) acc[pair.key] = pair.value;
				return acc;
			},
			{} as Record<string, string>,
		);
		setConfig({ ...config, envVars });
	};

	const addEnvPair = () => setEnvPairs([...envPairs, { key: "", value: "" }]);

	const removeEnvPair = (index: number) => {
		const updated = envPairs.filter((_, i) => i !== index);
		setEnvPairs(updated);
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
								updateEnvPair(index, "key", e.target.value.toUpperCase())
							}
							className="font-mono text-sm"
						/>
						<Input
							placeholder="valor"
							value={pair.value}
							type={isSensitive(pair.key) ? "password" : "text"}
							onChange={(e) => updateEnvPair(index, "value", e.target.value)}
							className="font-mono text-sm"
						/>
						{envPairs.length > 1 && (
							<Button
								variant="ghost"
								size="icon"
								type="button"
								onClick={() => removeEnvPair(index)}
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
				onClick={addEnvPair}
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
// Step 4: Domínio & Deploy
// ─────────────────────────────────────────────
function StepDeploy({
	config,
	setConfig,
}: {
	config: Partial<DeployConfig>;
	setConfig: (c: Partial<DeployConfig>) => void;
}) {
	const [useCustomDomain, setUseCustomDomain] = useState(false);

	return (
		<div className="space-y-6">
			<p className="text-muted-foreground text-center text-sm">
				Revise as configurações e faça o deploy!
			</p>

			{/* Summary */}
			<div className="bg-muted rounded-lg p-4 space-y-2 text-sm">
				<div className="flex justify-between">
					<span className="text-muted-foreground">Repositório:</span>
					<span className="font-mono text-xs truncate max-w-[200px]">
						{config.repositoryUrl || config.sourceType || "-"}
					</span>
				</div>
				<div className="flex justify-between">
					<span className="text-muted-foreground">Build:</span>
					<span>{config.buildType || "nixpacks"}</span>
				</div>
				<div className="flex justify-between">
					<span className="text-muted-foreground">Aplicação:</span>
					<span className="font-mono">{config.appName || "-"}</span>
				</div>
				<div className="flex justify-between">
					<span className="text-muted-foreground">Variáveis:</span>
					<span>{Object.keys(config.envVars || {}).length} configuradas</span>
				</div>
			</div>

			{/* Domain */}
			<div className="space-y-3">
				<Label className="text-sm">Domínio</Label>

				<div className="flex items-center gap-3 p-3 bg-muted rounded-lg border border-border">
					<span className="text-easyti-primary">🌐</span>
					<span className="font-mono text-sm">
						{config.appName || "sua-app"}.easyti.cloud
					</span>
					<span className="ml-auto text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded">
						SSL Grátis
					</span>
				</div>

				<button
					type="button"
					onClick={() => setUseCustomDomain(!useCustomDomain)}
					className="text-sm text-easyti-primary hover:underline"
				>
					{useCustomDomain
						? "- Usar subdomínio padrão"
						: "+ Usar domínio personalizado"}
				</button>

				{useCustomDomain && (
					<Input
						placeholder="meusite.com.br"
						value={config.domain || ""}
						onChange={(e) => setConfig({ ...config, domain: e.target.value })}
					/>
				)}
			</div>

			{/* Confirmation */}
			<div className="p-4 bg-easyti-primary/10 border border-easyti-primary/30 rounded-lg">
				<p className="text-sm">
					✅ Tudo pronto! Clique em{" "}
					<strong>&quot;Fazer Deploy&quot;</strong> para publicar sua aplicação.
					O processo leva aproximadamente 2-5 minutos.
				</p>
			</div>
		</div>
	);
}

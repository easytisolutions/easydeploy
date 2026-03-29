"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
	Folder,
	Rocket,
	Server,
	GitCommitHorizontal,
	ArrowRight,
	Clock,
} from "lucide-react";
import { api } from "@/utils/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
	FadeInUp,
	StaggerList,
	StaggerItem,
} from "@/components/atoms/animations/motion";
import { StatusBadge } from "@/components/atoms/badges/status-badge";

// ─── Types ─────────────────────────────────────────────────────────
interface DeploymentRow {
	deploymentId: string;
	title?: string | null;
	status?: string | null;
	createdAt: string | Date;
	application?: {
		applicationId: string;
		name: string;
		environment?: {
			environmentId: string;
			project?: { projectId: string };
		} | null;
	} | null;
	compose?: {
		composeId: string;
		name: string;
		environment?: {
			environmentId: string;
			project?: { projectId: string };
		} | null;
	} | null;
}

function getServiceInfo(d: DeploymentRow) {
	const app = d.application;
	const comp = d.compose;
	if (app?.environment?.project && app.environment) {
		return {
			type: "Application" as const,
			name: app.name,
			href: `/dashboard/project/${app.environment.project.projectId}/environment/${app.environment.environmentId}/services/application/${app.applicationId}`,
		};
	}
	if (comp?.environment?.project && comp.environment) {
		return {
			type: "Compose" as const,
			name: comp.name,
			href: `/dashboard/project/${comp.environment.project.projectId}/environment/${comp.environment.environmentId}/services/compose/${comp.composeId}`,
		};
	}
	return null;
}

function timeAgo(date: string | Date): string {
	const now = new Date();
	const d = new Date(date);
	const diffMs = now.getTime() - d.getTime();
	const diffMin = Math.floor(diffMs / 60000);
	if (diffMin < 1) return "agora";
	if (diffMin < 60) return `${diffMin}min atrás`;
	const diffH = Math.floor(diffMin / 60);
	if (diffH < 24) return `${diffH}h atrás`;
	const diffD = Math.floor(diffH / 24);
	return `${diffD}d atrás`;
}

function isToday(date: string | Date): boolean {
	const d = new Date(date);
	const now = new Date();
	return (
		d.getFullYear() === now.getFullYear() &&
		d.getMonth() === now.getMonth() &&
		d.getDate() === now.getDate()
	);
}

// ═══════════════════════════════════════════════════════════════════
export function DashboardHomeV2() {
	const { data: projects, isLoading: projectsLoading } =
		api.project.all.useQuery();
	const { data: deployments, isLoading: deploymentsLoading } =
		api.deployment.allCentralized.useQuery(undefined, {
			refetchInterval: 5000,
		});
	const { data: servers } = api.server.withSSHKey.useQuery();

	const stats = useMemo(() => {
		const totalProjects = projects?.length ?? 0;
		const deploysToday = deployments?.filter((d: DeploymentRow) => isToday(d.createdAt)).length ?? 0;
		const activeApps = deployments?.filter((d: DeploymentRow) => d.status === "running").length ?? 0;
		const totalServers = servers?.length ?? 0;
		return { totalProjects, deploysToday, activeApps, totalServers };
	}, [projects, deployments, servers]);

	const recentDeploys = useMemo(
		() => (deployments ?? []).slice(0, 5),
		[deployments],
	);

	const recentProjects = useMemo(
		() => (projects ?? []).slice(0, 6),
		[projects],
	);

	const today = new Date().toLocaleDateString("pt-BR", {
		weekday: "long",
		year: "numeric",
		month: "long",
		day: "numeric",
	});

	if (projectsLoading || deploymentsLoading) return null;

	return (
		<div className="space-y-6 mb-8">
			{/* Welcome Header */}
			<FadeInUp>
				<div className="flex items-center justify-between">
					<div>
						<h1 className="text-2xl font-bold">Bem-vindo ao EasyDeploy</h1>
						<p className="text-sm text-muted-foreground capitalize">{today}</p>
					</div>
					<Button
						asChild
						className="bg-easyti-primary hover:bg-easyti-primary-dark text-white gap-2"
					>
						<Link href="/dashboard/deploy">
							<Rocket className="w-4 h-4" />
							Novo Deploy
						</Link>
					</Button>
				</div>
			</FadeInUp>

			{/* Metrics Cards */}
			<div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
				{[
					{
						label: "Projetos",
						value: stats.totalProjects,
						icon: Folder,
						color: "border-easyti-primary",
					},
					{
						label: "Apps Ativas",
						value: stats.activeApps,
						icon: Rocket,
						color: "border-easyti-success",
					},
					{
						label: "Deploys Hoje",
						value: stats.deploysToday,
						icon: GitCommitHorizontal,
						color: "border-easyti-info",
					},
					{
						label: "Servidores",
						value: stats.totalServers,
						icon: Server,
						color: "border-easyti-warning",
					},
				].map((card, i) => (
					<FadeInUp key={card.label} transition={{ delay: i * 0.1 }}>
						<Card
							className={`p-4 border-l-4 ${card.color} flex items-center gap-3`}
						>
							<div className="p-2 rounded-lg bg-muted">
								<card.icon className="w-5 h-5 text-muted-foreground" />
							</div>
							<div>
								<p className="text-2xl font-bold">{card.value}</p>
								<p className="text-xs text-muted-foreground">{card.label}</p>
							</div>
						</Card>
					</FadeInUp>
				))}
			</div>

			{/* Two column: Recent Deploys + Quick Actions */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
				{/* Recent Deploys */}
				<FadeInUp transition={{ delay: 0.2 }}>
					<Card className="p-4">
						<div className="flex items-center justify-between mb-3">
							<h3 className="text-sm font-semibold flex items-center gap-2">
								<Clock className="w-4 h-4 text-muted-foreground" />
								Deploys Recentes
							</h3>
							<Button variant="ghost" size="sm" asChild>
								<Link
									href="/dashboard/deployments"
									className="text-xs text-muted-foreground"
								>
									Ver todos
									<ArrowRight className="w-3 h-3 ml-1" />
								</Link>
							</Button>
						</div>
						{recentDeploys.length === 0 ? (
							<p className="text-sm text-muted-foreground py-4 text-center">
								Nenhum deploy recente
							</p>
						) : (
							<StaggerList className="space-y-2">
								{recentDeploys.map((deploy: DeploymentRow) => {
									const info = getServiceInfo(deploy);
									return (
										<StaggerItem key={deploy.deploymentId}>
											<Link
												href={info?.href ?? "#"}
												className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors"
											>
												<div className="flex items-center gap-2 min-w-0">
													<StatusBadge status={deploy.status ?? "idle"} />
													<span className="text-sm truncate">
														{info?.name ?? deploy.title ?? "Deploy"}
													</span>
												</div>
												<span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
													{timeAgo(deploy.createdAt)}
												</span>
											</Link>
										</StaggerItem>
									);
								})}
							</StaggerList>
						)}
					</Card>
				</FadeInUp>

				{/* Quick Actions */}
				<FadeInUp transition={{ delay: 0.3 }}>
					<Card className="p-4">
						<h3 className="text-sm font-semibold mb-3">Acesso Rápido</h3>
						<div className="grid grid-cols-1 gap-2">
							{[
								{
									label: "Importar Repositório",
									desc: "Deploy de um repo Git ou imagem Docker",
									href: "/dashboard/deploy",
									icon: Rocket,
								},
								{
									label: "Ver Projetos",
									desc: "Gerenciar todos os seus projetos",
									href: "/dashboard/projects",
									icon: Folder,
								},
								{
									label: "Histórico",
									desc: "Acompanhar deploys e status",
									href: "/dashboard/deployments",
									icon: Clock,
								},
							].map((action) => (
								<Link
									key={action.href}
									href={action.href}
									className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 hover:-translate-y-0.5 hover:shadow-sm transition-all"
								>
									<div className="p-2 rounded-lg bg-easyti-primary/10">
										<action.icon className="w-4 h-4 text-easyti-primary" />
									</div>
									<div>
										<p className="text-sm font-medium">{action.label}</p>
										<p className="text-xs text-muted-foreground">
											{action.desc}
										</p>
									</div>
								</Link>
							))}
						</div>
					</Card>
				</FadeInUp>
			</div>
		</div>
	);
}

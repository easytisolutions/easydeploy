import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import {
	Ban,
	CheckCircle2,
	Hammer,
	RefreshCcw,
	Rocket,
	Terminal,
} from "lucide-react";
import { useRouter } from "next/router";
import { toast } from "sonner";
import { ShowBuildChooseForm } from "@/components/dashboard/application/build/show";
import { ShowProviderForm } from "@/components/dashboard/application/general/generic/show";
import { DialogAction } from "@/components/shared/dialog-action";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { api } from "@/utils/api";
import { DockerTerminalModal } from "../../settings/web-server/docker-terminal-modal";

interface Props {
	applicationId: string;
}

export const ShowGeneralApplication = ({ applicationId }: Props) => {
	const router = useRouter();
	const { data: permissions } = api.user.getPermissions.useQuery();
	const canDeploy = permissions?.deployment.create ?? false;
	const canUpdateService = permissions?.service.create ?? false;
	const { data, refetch } = api.application.one.useQuery(
		{
			applicationId,
		},
		{ enabled: !!applicationId },
	);
	const { mutateAsync: update } = api.application.update.useMutation();
	const { mutateAsync: start, isPending: isIniciaring } =
		api.application.start.useMutation();
	const { mutateAsync: stop, isPending: isPararping } =
		api.application.stop.useMutation();

	const { mutateAsync: deploy } = api.application.deploy.useMutation();

	const { mutateAsync: reload, isPending: isRecarregaring } =
		api.application.reload.useMutation();

	const { mutateAsync: redeploy } = api.application.redeploy.useMutation();

	return (
		<>
			<Card className="bg-easyti-primary/5">
				<CardHeader>
					<CardTitle className="text-xl">Configurações de Deploy</CardTitle>
				</CardHeader>
				<CardContent className="flex flex-row gap-4 flex-wrap">
					<TooltipProvider delayDuration={0} disableHoverableContent={false}>
						{canDeploy && (
							<DialogAction
								title="Fazer Deploy"
								description="Tem certeza que deseja fazer o deploy desta aplicação?"
								type="default"
								onClick={async () => {
									await deploy({
										applicationId: applicationId,
									})
										.then(() => {
											toast.success("Deploy realizado com sucesso");
											refetch();
											router.push(
												`/dashboard/project/${data?.environment.projectId}/environment/${data?.environmentId}/services/application/${applicationId}?tab=deployments`,
											);
										})
										.catch(() => {
											toast.error("Erro ao fazer deploy");
										});
								}}
							>
								<Button
									variant="default"
									isLoading={data?.applicationStatus === "running"}
									className="flex items-center gap-1.5 group focus-visible:ring-2 focus-visible:ring-offset-2"
								>
									<Tooltip>
										<TooltipTrigger asChild>
											<div className="flex items-center">
												<Rocket className="size-4 mr-1" />
												Deploy
											</div>
										</TooltipTrigger>
										<TooltipPrimitive.Portal>
											<TooltipContent sideOffset={5} className="z-[60]">
												<p>
													Downloads the source code and performs a complete
													build
												</p>
											</TooltipContent>
										</TooltipPrimitive.Portal>
									</Tooltip>
								</Button>
							</DialogAction>
						)}
						{canDeploy && (
							<DialogAction
								title="Recarregar Aplicação"
								description="Tem certeza que deseja recarregar esta aplicação?"
								type="default"
								onClick={async () => {
									await reload({
										applicationId: applicationId,
										appName: data?.appName || "",
									})
										.then(() => {
											toast.success("Aplicação recarregada com sucesso");
											refetch();
										})
										.catch(() => {
											toast.error("Erro ao recarregar aplicação");
										});
								}}
							>
								<Button
									variant="secondary"
									isLoading={isRecarregaring}
									className="flex items-center gap-1.5 group focus-visible:ring-2 focus-visible:ring-offset-2"
								>
									<Tooltip>
										<TooltipTrigger asChild>
											<div className="flex items-center">
												<RefreshCcw className="size-4 mr-1" />
												Recarregar
											</div>
										</TooltipTrigger>
										<TooltipPrimitive.Portal>
											<TooltipContent sideOffset={5} className="z-[60]">
												<p>Recarregar the application without rebuilding it</p>
											</TooltipContent>
										</TooltipPrimitive.Portal>
									</Tooltip>
								</Button>
							</DialogAction>
						)}
						{canDeploy && (
							<DialogAction
								title="Refazer Build"
								description="Tem certeza de que deseja refazer o build desta aplicação?"
								type="default"
								onClick={async () => {
									await redeploy({
										applicationId: applicationId,
									})
										.then(() => {
											toast.success("Build refeito com sucesso");
											refetch();
										})
										.catch(() => {
											toast.error("Erro ao refazer build da aplicação");
										});
								}}
							>
								<Button
									variant="secondary"
									isLoading={data?.applicationStatus === "running"}
									className="flex items-center gap-1.5 group focus-visible:ring-2 focus-visible:ring-offset-2"
								>
									<Tooltip>
										<TooltipTrigger asChild>
											<div className="flex items-center">
												<Hammer className="size-4 mr-1" />
												Rebuild
											</div>
										</TooltipTrigger>
										<TooltipPrimitive.Portal>
											<TooltipContent sideOffset={5} className="z-[60]">
												<p>
													Only rebuilds the application without downloading new
													code
												</p>
											</TooltipContent>
										</TooltipPrimitive.Portal>
									</Tooltip>
								</Button>
							</DialogAction>
						)}

						{canDeploy && data?.applicationStatus === "idle" ? (
							<DialogAction
								title="Iniciar Aplicação"
								description="Tem certeza que deseja iniciar esta aplicação?"
								type="default"
								onClick={async () => {
									await start({
										applicationId: applicationId,
									})
										.then(() => {
											toast.success("Aplicação iniciada com sucesso");
											refetch();
										})
										.catch(() => {
											toast.error("Erro ao iniciar aplicação");
										});
								}}
							>
								<Button
									variant="secondary"
									isLoading={isIniciaring}
									className="flex items-center gap-1.5 group focus-visible:ring-2 focus-visible:ring-offset-2"
								>
									<Tooltip>
										<TooltipTrigger asChild>
											<div className="flex items-center">
												<CheckCircle2 className="size-4 mr-1" />
												Iniciar
											</div>
										</TooltipTrigger>
										<TooltipPrimitive.Portal>
											<TooltipContent sideOffset={5} className="z-[60]">
												<p>
													Iniciar the application (requires a previous successful
													build)
												</p>
											</TooltipContent>
										</TooltipPrimitive.Portal>
									</Tooltip>
								</Button>
							</DialogAction>
						) : canDeploy ? (
							<DialogAction
								title="Parar Aplicação"
								description="Tem certeza que deseja parar esta aplicação?"
								onClick={async () => {
									await stop({
										applicationId: applicationId,
									})
										.then(() => {
											toast.success("Aplicação parada com sucesso");
											refetch();
										})
										.catch(() => {
											toast.error("Erro ao parar aplicação");
										});
								}}
							>
								<Button
									variant="destructive"
									isLoading={isPararping}
									className="flex items-center gap-1.5 group focus-visible:ring-2 focus-visible:ring-offset-2"
								>
									<Tooltip>
										<TooltipTrigger asChild>
											<div className="flex items-center">
												<Ban className="size-4 mr-1" />
												Parar
											</div>
										</TooltipTrigger>
										<TooltipPrimitive.Portal>
											<TooltipContent sideOffset={5} className="z-[60]">
												<p>Parar the currently running application</p>
											</TooltipContent>
										</TooltipPrimitive.Portal>
									</Tooltip>
								</Button>
							</DialogAction>
						) : null}
					</TooltipProvider>
					<DockerTerminalModal
						appName={data?.appName || ""}
						serverId={data?.serverId || ""}
					>
						<Button
							variant="outline"
							className="flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-offset-2"
						>
							<Terminal className="size-4 mr-1" />
							Abrir Terminal
						</Button>
					</DockerTerminalModal>
					{canUpdateService && (
						<div className="flex flex-row items-center gap-2 rounded-md px-4 py-2 border">
							<span className="text-sm font-medium">Autodeploy</span>
							<Switch
								aria-label="Toggle autodeploy"
								checked={data?.autoDeploy || false}
								onCheckedChange={async (enabled) => {
									await update({
										applicationId,
										autoDeploy: enabled,
									})
										.then(async () => {
											toast.success("Autodeploy Atualizado");
											await refetch();
										})
										.catch(() => {
											toast.error("Erro ao atualizar Autodeploy");
										});
								}}
								className="flex flex-row gap-2 items-center data-[state=checked]:bg-easyti-primary"
							/>
						</div>
					)}

					{canUpdateService && (
						<div className="flex flex-row items-center gap-2 rounded-md px-4 py-2 border">
							<span className="text-sm font-medium">Limpar Cache</span>
							<Switch
								aria-label="Toggle clean cache"
								checked={data?.cleanCache || false}
								onCheckedChange={async (enabled) => {
									await update({
										applicationId,
										cleanCache: enabled,
									})
										.then(async () => {
											toast.success("Limpar Cache Updated");
											await refetch();
										})
										.catch(() => {
											toast.error("Error updating Limpar Cache");
										});
								}}
								className="flex flex-row gap-2 items-center data-[state=checked]:bg-easyti-primary"
							/>
						</div>
					)}
				</CardContent>
			</Card>
			 <ShowProviderForm applicationId={applicationId} />
			{/*  {/* <ShowBuildChooseForm applicationId={applicationId} /> */} \n{/* Builder type hidden as per EasyTi requirements */} */} \n{/* Builder type hidden as per EasyTi requirements */}
		</>
	);
};

import { validateRequest } from "@dokploy/server/lib/auth";
import type { GetServerSidePropsContext } from "next";
import type { ReactElement } from "react";
import { DeployWizard } from "@/components/features/deploy/components/deploy-wizard-v2";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { PageTransition } from "@/components/atoms/animations/motion";

const DeployPage = () => {
	return (
		<PageTransition>
			<div className="min-h-screen py-10">
				<div className="container mx-auto px-4">
					<div className="text-center mb-10">
						<h1 className="text-3xl font-bold tracking-tight">
							Novo Deploy
						</h1>
						<p className="text-muted-foreground mt-2">
							Importe um repositório e publique em minutos
						</p>
					</div>
					<DeployWizard />
				</div>
			</div>
		</PageTransition>
	);
};

DeployPage.getLayout = (page: ReactElement) => {
	return <DashboardLayout>{page}</DashboardLayout>;
};

export default DeployPage;

export async function getServerSideProps(ctx: GetServerSidePropsContext) {
	const { user, session } = await validateRequest(ctx.req);
	if (!user) {
		return {
			redirect: {
				permanent: false,
				destination: "/",
			},
		};
	}
	return {
		props: {},
	};
}

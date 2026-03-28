import { validateRequest } from "@dokploy/server/lib/auth";
import type { GetServerSidePropsContext } from "next";
import type { ReactElement } from "react";
import { DeployWizard } from "@/components/dashboard/deploy-wizard/deploy-wizard";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";

const DeployPage = () => {
	return (
		<div className="min-h-screen py-12">
			<div className="container mx-auto px-4">
				<div className="text-center mb-8">
					<h1 className="text-3xl font-bold">Novo Deploy</h1>
					<p className="text-muted-foreground mt-2">
						Publique sua aplicação em minutos
					</p>
				</div>
				<DeployWizard />
			</div>
		</div>
	);
};

DeployPage.getLayout = (page: ReactElement) => {
	return <DashboardLayout>{page}</DashboardLayout>;
};

export default DeployPage;

export async function getServerSideProps(ctx: GetServerSidePropsContext) {
	const { user, session } = await validateRequest(ctx.req, ctx.res);
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

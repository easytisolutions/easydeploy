import { api } from "@/utils/api";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import Link from "next/link";

export function QuotaDisplay() {
	const { data: quota } = api.organization.getQuota.useQuery();

	if (!quota) return null;

	const items = [
		{
			label: "Projetos",
			current: quota.currentProjects,
			max: quota.maxProjects,
			icon: "📁",
		},
		{
			label: "Serviços",
			current: quota.currentServices,
			max: quota.maxServices,
			icon: "🚀",
		},
		{
			label: "Bancos de Dados",
			current: quota.currentDatabases,
			max: quota.maxDatabases,
			icon: "🗄️",
		},
	];

	return (
		<Card className="p-4 bg-easyti-card-dark border-easyti-secondary/20">
			<h3 className="text-sm font-semibold mb-3 text-easyti-text-primary">
				Plano {quota.planName}
			</h3>
			<div className="space-y-3">
				{items.map((item) => {
					const percentage =
						item.max === -1 ? 0 : (item.current / item.max) * 100;
					const isNearLimit = percentage >= 80;
					const isAtLimit = percentage >= 100;

					return (
						<div key={item.label}>
							<div className="flex justify-between text-xs mb-1">
								<span className="text-easyti-text-secondary">
									{item.icon} {item.label}
								</span>
								<span
									className={`font-medium ${
										isAtLimit
											? "text-easyti-error"
											: isNearLimit
												? "text-easyti-warning"
												: "text-easyti-text-primary"
									}`}
								>
									{item.current} / {item.max === -1 ? "∞" : item.max}
								</span>
							</div>
							<Progress
								value={Math.min(percentage, 100)}
								className={`h-1.5 ${
									isAtLimit
										? "bg-easyti-error/20"
										: isNearLimit
											? "bg-easyti-warning/20"
											: "bg-easyti-primary/20"
								}`}
							/>
						</div>
					);
				})}
			</div>
			{quota.plan !== "enterprise" && (
				<Link
					href="/dashboard/settings/billing"
					className="mt-3 w-full py-1.5 px-3 bg-easyti-primary hover:bg-easyti-primary-dark text-white rounded-md text-xs font-medium transition-colors text-center block"
				>
					Fazer Upgrade
				</Link>
			)}
		</Card>
	);
}

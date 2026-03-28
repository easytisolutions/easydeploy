import { TRPCError } from "@trpc/server";
import { eq, sql } from "drizzle-orm";
import { db } from "../db";
import { organization } from "../db/schema/account";
import { PLANS } from "../config/plans";
import type { PlanType } from "../config/plans";

type QuotaResource = "project" | "service" | "database";

const RESOURCE_FIELD_MAP = {
	project: {
		max: "maxProjects" as const,
		current: "currentProjects" as const,
		label: "projetos",
	},
	service: {
		max: "maxServices" as const,
		current: "currentServices" as const,
		label: "serviços",
	},
	database: {
		max: "maxDatabases" as const,
		current: "currentDatabases" as const,
		label: "bancos de dados",
	},
};

export async function checkQuota(
	organizationId: string,
	resourceType: QuotaResource,
) {
	const org = await db.query.organization.findFirst({
		where: eq(organization.id, organizationId),
	});

	if (!org) {
		throw new TRPCError({
			code: "NOT_FOUND",
			message: "Organização não encontrada",
		});
	}

	const planKey = (org.plan ?? "free") as PlanType;
	const plan = PLANS[planKey] ?? PLANS.free;
	const fields = RESOURCE_FIELD_MAP[resourceType];

	const maxFromOrg = org[fields.max] as number;
	const currentFromOrg = org[fields.current] as number;

	// org-level override takes precedence over plan default
	const maxAllowed =
		maxFromOrg !== plan[fields.max] ? maxFromOrg : plan[fields.max];

	// -1 means unlimited
	if (maxAllowed !== -1 && currentFromOrg >= maxAllowed) {
		throw new TRPCError({
			code: "FORBIDDEN",
			message: `Limite de ${fields.label} atingido (${currentFromOrg}/${maxAllowed}). Faça upgrade do seu plano para continuar.`,
		});
	}

	return {
		allowed: true,
		current: currentFromOrg,
		max: maxAllowed,
		remaining: maxAllowed === -1 ? Number.POSITIVE_INFINITY : maxAllowed - currentFromOrg,
	};
}

export async function incrementQuota(
	organizationId: string,
	resourceType: QuotaResource,
) {
	const fields = RESOURCE_FIELD_MAP[resourceType];

	await db
		.update(organization)
		.set({
			[fields.current]: sql`GREATEST(${organization[fields.current]} + 1, 0)`,
		})
		.where(eq(organization.id, organizationId));
}

export async function decrementQuota(
	organizationId: string,
	resourceType: QuotaResource,
) {
	const fields = RESOURCE_FIELD_MAP[resourceType];

	await db
		.update(organization)
		.set({
			[fields.current]: sql`GREATEST(${organization[fields.current]} - 1, 0)`,
		})
		.where(eq(organization.id, organizationId));
}

export async function getOrganizationQuota(organizationId: string) {
	const org = await db.query.organization.findFirst({
		where: eq(organization.id, organizationId),
	});

	if (!org) {
		throw new TRPCError({
			code: "NOT_FOUND",
			message: "Organização não encontrada",
		});
	}

	const planKey = (org.plan ?? "free") as PlanType;
	const plan = PLANS[planKey] ?? PLANS.free;

	return {
		plan: org.plan ?? "free",
		planName: plan.name,
		planExpiresAt: org.planExpiresAt,
		maxProjects: org.maxProjects,
		maxServices: org.maxServices,
		maxDatabases: org.maxDatabases,
		currentProjects: org.currentProjects,
		currentServices: org.currentServices,
		currentDatabases: org.currentDatabases,
		features: plan.features,
	};
}

import {
	findGithubById,
	getGithubBranches,
	getGithubFileContent,
	getGithubRepoFiles,
	getGithubRepositories,
	haveGithubRequirements,
	updateGithub,
	updateGitProvider,
} from "@dokploy/server";
import { db } from "@dokploy/server/db";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
	createTRPCRouter,
	protectedProcedure,
	withPermission,
} from "@/server/api/trpc";
import { audit } from "@/server/api/utils/audit";
import {
	apiFindGithubBranches,
	apiFindOneGithub,
	apiUpdateGithub,
} from "@/server/db/schema";

export const githubRouter = createTRPCRouter({
	one: protectedProcedure.input(apiFindOneGithub).query(async ({ input }) => {
		return await findGithubById(input.githubId);
	}),
	getGithubRepositories: protectedProcedure
		.input(apiFindOneGithub)
		.query(async ({ input }) => {
			return await getGithubRepositories(input.githubId);
		}),
	getGithubBranches: protectedProcedure
		.input(apiFindGithubBranches)
		.query(async ({ input }) => {
			return await getGithubBranches(input);
		}),
	getGithubRepoFiles: protectedProcedure
		.input(
			z.object({
				githubId: z.string(),
				owner: z.string(),
				repo: z.string(),
				branch: z.string(),
				path: z.string().optional(),
			}),
		)
		.query(async ({ input }) => {
			return await getGithubRepoFiles(
				input.githubId,
				input.owner,
				input.repo,
				input.branch,
				input.path,
			);
		}),
	getGithubFileContent: protectedProcedure
		.input(
			z.object({
				githubId: z.string(),
				owner: z.string(),
				repo: z.string(),
				branch: z.string(),
				filePath: z.string(),
			}),
		)
		.query(async ({ input }) => {
			return await getGithubFileContent(
				input.githubId,
				input.owner,
				input.repo,
				input.branch,
				input.filePath,
			);
		}),
	githubProviders: protectedProcedure.query(async ({ ctx }) => {
		let result = await db.query.github.findMany({
			with: {
				gitProvider: true,
			},
		});

		result = result.filter(
			(provider) =>
				provider.gitProvider.organizationId ===
					ctx.session.activeOrganizationId &&
				provider.gitProvider.userId === ctx.session.userId,
		);

		const filtered = result
			.filter((provider) => haveGithubRequirements(provider))
			.map((provider) => {
				return {
					githubId: provider.githubId,
					gitProvider: {
						...provider.gitProvider,
					},
				};
			});

		return filtered;
	}),

	testConnection: protectedProcedure
		.input(apiFindOneGithub)
		.mutation(async ({ input }) => {
			try {
				const result = await getGithubRepositories(input.githubId);
				return `Found ${result.length} repositories`;
			} catch (err) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: err instanceof Error ? err?.message : `Error: ${err}`,
				});
			}
		}),
	update: withPermission("gitProviders", "create")
		.input(apiUpdateGithub)
		.mutation(async ({ input, ctx }) => {
			await updateGitProvider(input.gitProviderId, {
				name: input.name,
				organizationId: ctx.session.activeOrganizationId,
			});

			await updateGithub(input.githubId, {
				...input,
			});

			await audit(ctx, {
				action: "update",
				resourceType: "gitProvider",
				resourceId: input.gitProviderId,
				resourceName: input.name,
			});
		}),
});

export const PLANS = {
	free: {
		name: "Free",
		price: null,
		maxProjects: 1,
		maxServices: 3,
		maxDatabases: 1,
		maxStorageGb: 1,
		maxBandwidthGb: 10,
		features: {
			customDomains: false,
			ssl: true,
			backup: false,
			support: "community",
		},
	},
	starter: {
		name: "Starter",
		price: 29.9,
		maxProjects: 3,
		maxServices: 10,
		maxDatabases: 3,
		maxStorageGb: 10,
		maxBandwidthGb: 100,
		features: {
			customDomains: true,
			ssl: true,
			backup: true,
			support: "email",
		},
	},
	pro: {
		name: "Pro",
		price: 79.9,
		maxProjects: 10,
		maxServices: 50,
		maxDatabases: 10,
		maxStorageGb: 50,
		maxBandwidthGb: 500,
		features: {
			customDomains: true,
			ssl: true,
			backup: true,
			support: "priority",
		},
	},
	enterprise: {
		name: "Enterprise",
		price: null,
		maxProjects: -1,
		maxServices: -1,
		maxDatabases: -1,
		maxStorageGb: -1,
		maxBandwidthGb: -1,
		features: {
			customDomains: true,
			ssl: true,
			backup: true,
			support: "dedicated",
		},
	},
} as const;

export type PlanType = keyof typeof PLANS;

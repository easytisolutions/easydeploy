import { IS_CLOUD, isAdminPresent, validateRequest } from "@dokploy/server";
import { standardSchemaResolver as zodResolver } from "@hookform/resolvers/standard-schema";
import { AlertTriangle } from "lucide-react";
import type { GetServerSidePropsContext } from "next";
import Link from "next/link";
import { useRouter } from "next/router";
import { type ReactElement, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { OnboardingLayout } from "@/components/layouts/onboarding-layout";
import { SignInWithGithub } from "@/components/proprietary/auth/sign-in-with-github";
import { SignInWithGoogle } from "@/components/proprietary/auth/sign-in-with-google";
import { AlertBlock } from "@/components/shared/alert-block";
import { Logo } from "@/components/shared/logo";
import { Button } from "@/components/ui/button";
import { CardContent, CardDescription, CardTitle } from "@/components/ui/card";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";
import { useWhitelabelingPublic } from "@/utils/hooks/use-whitelabeling";

const registerSchema = z
	.object({
		name: z.string().min(1, {
			message: "First name is required",
		}),
		lastName: z.string().min(1, {
			message: "Last name is required",
		}),
		email: z
			.string()
			.min(1, {
				message: "Email is required",
			})
			.email({
				message: "Email must be a valid email",
			}),
		password: z
			.string()
			.min(1, {
				message: "Password is required",
			})
			.refine((password) => password === "" || password.length >= 8, {
				message: "Password must be at least 8 characters",
			}),
		confirmPassword: z
			.string()
			.min(1, {
				message: "Password is required",
			})
			.refine(
				(confirmPassword) =>
					confirmPassword === "" || confirmPassword.length >= 8,
				{
					message: "Password must be at least 8 characters",
				},
			),
	})
	.refine((data) => data.password === data.confirmPassword, {
		message: "Passwords do not match",
		path: ["confirmPassword"],
	});

type Register = z.infer<typeof registerSchema>;

interface Props {
	hasAdmin: boolean;
	isCloud: boolean;
}

const Register = ({ isCloud }: Props) => {
	const router = useRouter();
	const { config: whitelabeling } = useWhitelabelingPublic();
	const [isError, setIsError] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [data, setData] = useState<any>(null);

	const form = useForm<Register>({
		defaultValues: {
			name: "",
			lastName: "",
			email: "",
			password: "",
			confirmPassword: "",
		},
		resolver: zodResolver(registerSchema),
	});

	useEffect(() => {
		form.reset();
	}, [form, form.reset, form.formState.isSubmitSuccessful]);

	const onSubmit = async (values: Register) => {
		const { data, error } = await authClient.signUp.email({
			email: values.email,
			password: values.password,
			name: values.name,
			lastName: values.lastName,
		});

		if (error) {
			setIsError(true);
			setError(error.message || "An error occurred");
		} else {
			toast.success("User registered successfully", {
				duration: 2000,
			});
			if (!isCloud) {
				router.push("/");
			} else {
				setData(data);
			}
		}
	};
	return (
		<div className="">
			<div className="flex  w-full items-center justify-center ">
				<div className="flex flex-col items-center gap-4 w-full">
					<div className="flex justify-center lg:hidden mb-2">
						<Logo
							className="h-12 w-auto"
							logoUrl={
								whitelabeling?.loginLogoUrl ||
								whitelabeling?.logoUrl ||
								undefined
							}
						/>
					</div>
					<CardTitle className="text-2xl font-bold">
						{isCloud ? "Criar conta" : "Configurar servidor"}
					</CardTitle>
					<CardDescription>
						{isCloud
							? "Preencha seus dados para criar sua conta"
							: "Configure o administrador do servidor"}
					</CardDescription>
					<div className="mx-auto w-full max-w-lg bg-transparent">
						{isError && (
							<div className="my-2 flex flex-row items-center gap-2 rounded-lg bg-red-50 p-2 dark:bg-red-950">
								<AlertTriangle className="text-red-600 dark:text-red-400" />
								<span className="text-sm text-red-600 dark:text-red-400">
									{error}
								</span>
							</div>
						)}
						{isCloud && data && (
							<AlertBlock type="success" className="my-2">
								<span>
									Conta criada com sucesso! Verifique sua caixa de entrada ou pasta de spam para confirmar.
								</span>
							</AlertBlock>
						)}
						<CardContent className="p-0">
							{isCloud && (
								<div className="flex flex-col">
									<SignInWithGithub />
									<SignInWithGoogle />
								</div>
							)}
							{isCloud && (
								<div className="relative my-4">
									<div className="absolute inset-0 flex items-center">
										<span className="w-full border-t" />
									</div>
									<div className="relative flex justify-center text-xs uppercase">
										<span className="bg-background px-2 text-muted-foreground">ou cadastre com email</span>
									</div>
								</div>
							)}
							<Form {...form}>
								<form
									onSubmit={form.handleSubmit(onSubmit)}
									className="grid gap-4"
								>
									<div className="space-y-4">
										<FormField
											control={form.control}
											name="name"
											render={({ field }) => (
												<FormItem>
													<FormLabel>Nome</FormLabel>
													<FormControl>
														<Input placeholder="João" {...field} />
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>
										<FormField
											control={form.control}
											name="lastName"
											render={({ field }) => (
												<FormItem>
													<FormLabel>Sobrenome</FormLabel>
													<FormControl>
														<Input placeholder="Silva" {...field} />
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>
										<FormField
											control={form.control}
											name="email"
											render={({ field }) => (
												<FormItem>
													<FormLabel>Email</FormLabel>
													<FormControl>
														<Input placeholder="seu@email.com" {...field} />
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>
										<FormField
											control={form.control}
											name="password"
											render={({ field }) => (
												<FormItem>
													<FormLabel>Senha</FormLabel>
													<FormControl>
														<Input
															type="password"
															placeholder="Mínimo 8 caracteres"
															{...field}
														/>
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>

										<FormField
											control={form.control}
											name="confirmPassword"
											render={({ field }) => (
												<FormItem>
													<FormLabel>Confirmar Senha</FormLabel>
													<FormControl>
														<Input
															type="password"
															placeholder="Repita a senha"
															{...field}
														/>
													</FormControl>
													<FormMessage />
												</FormItem>
											)}
										/>

										<Button
											type="submit"
											isLoading={form.formState.isSubmitting}
											className="w-full bg-easyti-primary hover:bg-easyti-primary-dark text-white"
										>
											Cadastrar
										</Button>
									</div>
								</form>
							</Form>
							<div className="flex flex-row justify-between flex-wrap">
								{isCloud && (
									<div className="mt-4 text-center text-sm flex gap-2 text-muted-foreground">
										Já tem uma conta?
										<Link className="underline text-easyti-primary" href="/">
											Entrar
										</Link>
									</div>
								)}

								<div className="mt-4 text-center text-sm flex flex-row justify-center gap-2 text-muted-foreground">
									Precisa de ajuda?
									<Link
										className="underline"
										href="https://easyti.cloud"
										target="_blank"
									>
										Fale conosco
									</Link>
								</div>
							</div>
						</CardContent>
					</div>
				</div>
			</div>
		</div>
	);
};

export default Register;

Register.getLayout = (page: ReactElement) => {
	return <OnboardingLayout>{page}</OnboardingLayout>;
};
export async function getServerSideProps(context: GetServerSidePropsContext) {
	if (IS_CLOUD) {
		const { user } = await validateRequest(context.req);

		if (user) {
			return {
				redirect: {
					permanent: true,
					destination: "/dashboard/projects",
				},
			};
		}
		return {
			props: {
				isCloud: true,
			},
		};
	}
	const hasAdmin = await isAdminPresent();

	if (hasAdmin) {
		return {
			redirect: {
				permanent: false,
				destination: "/",
			},
		};
	}
	return {
		props: {
			isCloud: false,
		},
	};
}

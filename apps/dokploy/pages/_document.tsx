import { Head, Html, Main, NextScript } from "next/document";

export default function Document() {
	return (
		<Html lang="pt-BR" className="font-sans">
			<Head>
				<link rel="icon" href="/icon.svg" />
				<meta name="application-name" content="EasyTI Cloud" />
				<meta name="description" content="Hospedagem Node.js simplificada para desenvolvedores" />
			</Head>
			<body className="flex h-full w-full flex-col font-sans">
				<Main />
				<NextScript />
			</body>
		</Html>
	);
}

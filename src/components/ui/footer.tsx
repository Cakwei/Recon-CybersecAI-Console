export function Footer() {
	return (
		<footer className="border-t border-border py-8 text-xs text-(--text-secondary)">
			<div className="mx-auto max-w-4xl px-6 space-y-6">
				{/* Main Footer Row: Notice & Links */}
				<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
					<p className="max-w-md">
						Built for personal project showcase. Data is pulled from public
						APIs, nothing is scanned actively.
					</p>

					<nav className="flex flex-wrap gap-x-4 gap-y-2">
						<a
							href="/privacy"
							className="hover:underline hover:text-(--text-primary) transition-colors"
						>
							Privacy Policy
						</a>
						<a
							href="/terms"
							className="hover:underline hover:text-(--text-primary) transition-colors"
						>
							Terms of Service
						</a>
						<a
							href="https://github.com"
							target="_blank"
							rel="noopener noreferrer"
							className="hover:underline hover:text-(--text-primary) transition-colors"
						>
							GitHub
						</a>
					</nav>
				</div>

				{/* Bottom Row: Attribution & Copyright */}
				<div className="border-t border-border/50 pt-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between text-muted-foreground">
					<p>
						Built by{" "}
						<span className="font-medium text-(--text-primary)">Charlee</span>{" "}
						w/ TanStack Start. Hosted on Oracle Cloud.
					</p>
				</div>
			</div>
		</footer>
	);
}

import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { logger } from "#/lib/logger.ts";
import { Button } from "./button";

export function Header() {
	const navigate = useNavigate();
	const location = useLocation();

	return (
		<header className="border-b border-border">
			<div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-5">
				<Button
					onClick={() => {
						navigate({ to: "/" });
						logger.info("[headers.tsx] Navigated to homepage");
					}}
					className="bg-(--bg) hover:bg-(--bg-secondary)/80 font-mono text-xs text-(--text)"
				>
					Recon Console
				</Button>
				<div className="flex items-center gap-3">
					<Link to="/docs" className="text-xs">
						<Button
							className={`text-xs hover:text-(--link)/80 bg-transparent ${
								location.pathname === "/docs"
									? "text-(--link) font-semibold"
									: "text-(--text-secondary)"
							}`}
						>
							API Docs
						</Button>
					</Link>
					{location.pathname !== "/dashboard" && (
						<Link to="/dashboard" className="text-xs">
							<Button className="hover:text-(--text)/80 text-(--text) bg-(--link) hover:bg-(--link)/80 text-xs">
								Dashboard
							</Button>
						</Link>
					)}
				</div>
			</div>
		</header>
	);
}

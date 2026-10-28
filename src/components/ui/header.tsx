import {
	Link,
	useLocation,
	useNavigate,
	useRouter,
} from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { logger } from "#/lib/logger.ts";
import { Button } from "./button";

export function Header() {
	const navigate = useNavigate();
	const router = useRouter();
	const location = useLocation();

	const isHome = location.pathname === "/";

	const handleGoBack = () => {
		if (typeof window !== "undefined" && window.history.length > 1) {
			router.history.back();
		} else {
			navigate({ to: "/dashboard" });
		}
		logger.info("[header.tsx] Navigated back");
	};

	return (
		<header className="border-border border-b">
			<div className="border-b">
				<div className="mx-auto flex items-center justify-between px-10 py-5">
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
			</div>
			{!isHome && (
				<div className="sticky top-0 z-30 border-b border-(--border) bg-(--bg)/80 mx-auto px-10 py-2.5 backdrop-blur-sm">
					<Button
						type="button"
						onClick={handleGoBack}
						className="inline-flex items-center gap-1.5 rounded-lg border border-(--border) bg-(--link) px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-(--link)/80 focus:outline-none focus:ring-1 focus:ring-(--link)"
					>
						<ArrowLeft className="h-3.5 w-3.5" />
						Go Back
					</Button>
				</div>
			)}
		</header>
	);
}

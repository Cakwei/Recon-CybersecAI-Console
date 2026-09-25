import { Link } from "@tanstack/react-router";
import { Button } from "./button";

export function Header() {
	return (
		<header className="border-b border-border">
			<div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-5">
				<span className="font-mono text-sm text-(--text)">recon console</span>
				<Button className="hover:text-(--text)/80 text-(--text) bg-(--link) hover:bg-(--link)/80">
					<Link to="/dashboard" className="text-sm">
						Dashboard
					</Link>
				</Button>
			</div>
		</header>
	);
}

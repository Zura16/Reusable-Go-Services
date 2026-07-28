"use client";
import * as React from "react";

import {
	motion,
	useMotionTemplate,
	useScroll,
	useTransform,
} from "framer-motion";
import PillNav from "./PillNav";

interface iISmoothScrollHeroProps {
	scrollHeight?: number;
	desktopImage?: string;
	mobileImage?: string;
	initialClipPercentage?: number;
	finalClipPercentage?: number;
}

interface iISmoothScrollHeroBackgroundProps extends iISmoothScrollHeroProps {
	scrollHeight: number;
	desktopImage: string;
	mobileImage: string;
	initialClipPercentage: number;
	finalClipPercentage: number;
}

const SmoothScrollHeroBackground: React.FC<
	iISmoothScrollHeroBackgroundProps
> = ({
	scrollHeight,
	desktopImage,
	mobileImage,
	initialClipPercentage,
	finalClipPercentage,
}) => {
	const { scrollY } = useScroll();

	const clipStart = useTransform(
		scrollY,
		[0, scrollHeight],
		[initialClipPercentage, 0],
	);
	const clipEnd = useTransform(
		scrollY,
		[0, scrollHeight],
		[finalClipPercentage, 100],
	);

	const clipPath = useMotionTemplate`polygon(${clipStart}% ${clipStart}%, ${clipEnd}% ${clipStart}%, ${clipEnd}% ${clipEnd}%, ${clipStart}% ${clipEnd}%)`;

	const backgroundSize = useTransform(
		scrollY,
		[0, scrollHeight],
		["170%", "100%"],
	);

	const scrollToPlayground = (e: React.MouseEvent) => {
		e.preventDefault();
		const el = document.getElementById("playground");
		if (el) el.scrollIntoView({ behavior: "smooth" });
	};

	const heroNavItems = [
		{ label: "Explore Live Playground", href: "#playground", onClick: scrollToPlayground },
		{ label: "View GitHub Repo", href: "https://github.com/Zura16/Reusable-Go-Services" },
	];

	return (
		<motion.div
			className="sticky top-0 h-screen w-full bg-black overflow-hidden shadow-2xl"
			style={{
				clipPath,
				willChange: "transform, opacity",
			}}
		>
			{/* Mobile background */}
			<motion.div
				className="absolute inset-0 md:hidden opacity-100"
				style={{
					backgroundImage: `url(${mobileImage})`,
					backgroundSize,
					backgroundPosition: "center",
					backgroundRepeat: "no-repeat",
				}}
			/>
			{/* Desktop background */}
			<motion.div
				className="absolute inset-0 hidden md:block opacity-100"
				style={{
					backgroundImage: `url(${desktopImage})`,
					backgroundSize,
					backgroundPosition: "center",
					backgroundRepeat: "no-repeat",
				}}
			/>

			{/* Overlay text / Hero content with lighter overlay */}
			<div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-black/40 via-black/25 to-black/50 p-6 text-center z-10">

				<span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-widest text-slate-300 bg-white/10 border border-white/20 backdrop-blur-md mb-6 shadow-lg">
					Go Service Foundation
				</span>
				<h1 className="text-4xl md:text-7xl font-extrabold tracking-tight text-white mb-6 max-w-4xl drop-shadow-2xl">
					Observable, Secure & Production-Ready Go Microservices
				</h1>
				<p className="text-lg md:text-xl text-slate-300 max-w-2xl font-light mb-8 leading-relaxed drop-shadow-md">
					Typed config, gRPC ProfileService, Auth validator, OpenTelemetry tracing, Prometheus metrics, and context-aware HTTP retries.
				</p>

				<div className="flex justify-center">
					<PillNav
						items={heroNavItems}
						ease="power3.easeOut"
						baseColor="#000000"
						pillColor="#ffffff"
						hoveredPillTextColor="#ffffff"
						pillTextColor="#000000"
					/>
				</div>
			</div>
		</motion.div>
	);
};

const SmoothScrollHero: React.FC<iISmoothScrollHeroProps> = ({
	scrollHeight = 1400,
	desktopImage = "https://images.unsplash.com/photo-1511884642898-4c92249e20b6",
	mobileImage = "https://images.unsplash.com/photo-1511207538754-e8555f2bc187?q=80&w=2412&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
	initialClipPercentage = 25,
	finalClipPercentage = 75,
}) => {
	return (
		<div
			style={{ height: `calc(${scrollHeight}px + 100vh)` }}
			className="relative w-full"
		>
			<SmoothScrollHeroBackground
				scrollHeight={scrollHeight}
				desktopImage={desktopImage}
				mobileImage={mobileImage}
				initialClipPercentage={initialClipPercentage}
				finalClipPercentage={finalClipPercentage}
			/>
		</div>
	);
};

export default SmoothScrollHero;

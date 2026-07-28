"use client";
import * as React from "react";

import {
	motion,
	useMotionTemplate,
	useScroll,
	useTransform,
} from "framer-motion";

interface iISmoothScrollHeroProps {
	/**
	 * Height of the scroll section in pixels
	 * @default 1500
	 */
	scrollHeight?: number;
	/**
	 * Background image URL for desktop view
	 * @default "https://images.unsplash.com/photo-1511884642898-4c92249e20b6"
	 */
	desktopImage?: string;
	/**
	 * Background image URL for mobile view
	 * @default "https://images.unsplash.com/photo-1511207538754-e8555f2bc187?q=80&w=2412&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
	 */
	mobileImage?: string;
	/**
	 * Initial clip path percentage
	 * @default 25
	 */
	initialClipPercentage?: number;
	/**
	 * Final clip path percentage
	 * @default 75
	 */
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
		[0, scrollHeight + 500],
		["170%", "100%"],
	);

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
				className="absolute inset-0 md:hidden opacity-90"
				style={{
					backgroundImage: `url(${mobileImage})`,
					backgroundSize,
					backgroundPosition: "center",
					backgroundRepeat: "no-repeat",
				}}
			/>
			{/* Desktop background */}
			<motion.div
				className="absolute inset-0 hidden md:block opacity-90"
				style={{
					backgroundImage: `url(${desktopImage})`,
					backgroundSize,
					backgroundPosition: "center",
					backgroundRepeat: "no-repeat",
				}}
			/>

			{/* Overlay text / Hero content */}
			<div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent p-6 text-center z-10">
				<span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-widest text-indigo-400 bg-indigo-500/10 border border-indigo-500/30 backdrop-blur-md mb-6">
					⚡ Go Service Foundation
				</span>
				<h1 className="text-4xl md:text-7xl font-extrabold tracking-tight text-white mb-6 max-w-4xl drop-shadow-lg">
					Observable, Secure & Production-Ready Go Microservices
				</h1>
				<p className="text-lg md:text-xl text-slate-300 max-w-2xl font-light mb-8 leading-relaxed">
					Typed config, gRPC ProfileService, Auth validator, OpenTelemetry tracing, Prometheus metrics, and context-aware HTTP retries.
				</p>

				<div className="flex flex-wrap items-center justify-center gap-4">
					<a
						href="#playground"
						className="px-8 py-3.5 rounded-xl font-semibold text-white bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:to-pink-600 shadow-lg shadow-indigo-500/25 transition-all duration-200 transform hover:-translate-y-0.5"
					>
						Explore Live Playground
					</a>
					<a
						href="https://github.com/Zura16/Reusable-Go-Services"
						target="_blank"
						rel="noreferrer"
						className="px-8 py-3.5 rounded-xl font-semibold text-slate-200 bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-md transition-all duration-200"
					>
						View GitHub Repo
					</a>
				</div>
			</div>
		</motion.div>
	);
};

/**
 * A smooth scroll hero component with parallax background effect
 * @param props - Component props
 * @returns React component
 */
const SmoothScrollHero: React.FC<iISmoothScrollHeroProps> = ({
	scrollHeight = 1500,
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
